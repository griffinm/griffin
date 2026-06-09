import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { PrismaService } from '../prisma/prisma.service';
import { TasksService } from '../tasks/tasks.service';
import { NoteService } from '../notes/notes.service';
import { NotebookService } from '../notebooks/notebook.service';
import { SearchService } from '../search/search.service';
import { GoogleService, GmailNotConnectedError } from '../auth/google.service';
import { ChatOpenAI } from '@langchain/openai';
import { DynamicStructuredTool } from '@langchain/core/tools';
import { z } from 'zod';
import { HumanMessage, AIMessage, SystemMessage, ToolMessage } from '@langchain/core/messages';
import { ConversationItemRole, ConversationStatus } from '@prisma/client';
import { LLM_QUEUE } from '../queue/queue.module';
import { LlmMessageJobData } from './llm.processor';
import { parse } from 'node-html-parser';

// Configuration constants
const MAX_TOOL_ITERATIONS = 5;
const MAX_HISTORY_MESSAGES = 50;
const MAX_EMAIL_BODY_CHARS = 8000; // cap email body length sent to the LLM
const MAX_ATTACHED_NOTE_CHARS = 6000; // cap each attached note's text in context

/**
 * Convert a note's TipTap HTML into readable plain text for LLM context,
 * truncated to a sane length. `structuredText` preserves block-level line
 * breaks so lists/paragraphs stay legible.
 */
function noteHtmlToText(
  html: string | null | undefined,
  maxChars = MAX_ATTACHED_NOTE_CHARS,
): string {
  if (!html) return '';
  const text = parse(html).structuredText.replace(/\n{3,}/g, '\n\n').trim();
  return text.length > maxChars ? `${text.slice(0, maxChars)}…` : text;
}

// --- Gmail helpers ---

type GmailHeader = { name?: string | null; value?: string | null };

function getHeader(headers: GmailHeader[] | undefined, name: string): string {
  return (
    headers?.find((h) => h.name?.toLowerCase() === name.toLowerCase())?.value ??
    ''
  );
}

function decodeBase64Url(data: string): string {
  return Buffer.from(data, 'base64url').toString('utf8');
}

/**
 * Extract a readable plain-text body from a Gmail message payload. Prefers a
 * text/plain part, falls back to a tag-stripped text/html part, then to the
 * top-level body.
 */
function extractEmailBody(payload: any): string {
  if (!payload) return '';

  const findPart = (part: any, mimeType: string): string | null => {
    if (!part) return null;
    if (part.mimeType === mimeType && part.body?.data) {
      return decodeBase64Url(part.body.data);
    }
    if (Array.isArray(part.parts)) {
      for (const child of part.parts) {
        const found = findPart(child, mimeType);
        if (found) return found;
      }
    }
    return null;
  };

  const plain = findPart(payload, 'text/plain');
  if (plain) return plain;

  const html = findPart(payload, 'text/html');
  if (html) {
    return html
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  if (payload.body?.data) return decodeBase64Url(payload.body.data);
  return '';
}

@Injectable()
export class LlmService {
  private readonly logger = new Logger(LlmService.name);
  private chatModel: ChatOpenAI;

  constructor(
    private prisma: PrismaService,
    private tasksService: TasksService,
    private noteService: NoteService,
    private notebookService: NotebookService,
    private searchService: SearchService,
    private googleService: GoogleService,
    private configService: ConfigService,
    @InjectQueue(LLM_QUEUE) private llmQueue: Queue<LlmMessageJobData>,
  ) {
    // Initialize ChatOpenAI with API key from config
    const apiKey = this.configService.get<string>('OPENAI_API_KEY');
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY is not configured');
    }

    // Configurable model settings with defaults.
    // gpt-5.5 is a reasoning model: it rejects a custom temperature and routes
    // through the Responses API, so reasoning effort is set instead of temperature.
    const modelName = this.configService.get<string>('LLM_MODEL') || 'gpt-5.5';
    const reasoningEffort = this.configService.get<string>('LLM_REASONING_EFFORT') || 'medium';

    this.chatModel = new ChatOpenAI({
      openAIApiKey: apiKey,
      modelName,
      reasoning: { effort: reasoningEffort as 'low' | 'medium' | 'high' },
      useResponsesApi: true,
    });
  }

  /**
   * Get the system prompt for the assistant
   */
  private getSystemPrompt(): SystemMessage {
    const today = new Date().toISOString().split('T')[0];
    return new SystemMessage(
      `You are a helpful assistant for Griffin, a personal notes and task management application.

You can help users:
- Create, search, update, and manage their tasks
- Create, search, edit, and organize notes — including moving notes between notebooks and pinning them
- View their notebooks and create new ones
- Look up information on the internet
- Search and read their Gmail (read-only) with search_gmail and get_email

Today's date is ${today}.

Be concise and helpful. When creating tasks, infer reasonable due dates and priorities from context if not specified.
When searching for tasks or notes, use the search tools to find relevant items before making changes.
When the user refers to a notebook by name, call list_notebooks to resolve its ID before creating a note in it or moving a note to it.
When the user asks about their email, use search_gmail with Gmail search operators (e.g. from:, subject:, newer_than:, has:attachment) to find messages, then call get_email to read a specific message's full body when you need its contents. If Gmail is not connected, tell the user to connect it in Settings → Integrations rather than guessing.
When editing part of a note's content, first call get_note to read the current content, then submit the full revised content (content is replaced, not appended).
When the user attaches notes to a message, their current content is included inline beneath that message, delimited by "--- Attached note: ... ---" markers. Treat that as authoritative context the user wants you to use; you do not need to call get_note for notes that are already attached.

IMPORTANT: When you use tools that return visual results (like searching notes or tasks), the user will see the results displayed as cards in the UI. Do NOT repeat or list the same information in your text response. Instead, just provide a brief summary like "Here are your notes" or "I found 3 matching tasks" without listing titles, IDs, or details that are already shown in the cards.`
    );
  }

  /**
   * Create a new conversation
   */
  async createConversation(userId: string, title?: string, initialMessage?: string) {
    const conversation = await this.prisma.conversation.create({
      data: {
        userId,
        title: title || null,
      },
    });

    // If there's an initial message, send it
    if (initialMessage) {
      await this.sendMessage(conversation.id, userId, initialMessage);
    }

    return conversation;
  }

  /**
   * Get a conversation by ID
   */
  async getConversation(conversationId: string, userId: string) {
    const conversation = await this.prisma.conversation.findFirst({
      where: {
        id: conversationId,
        userId,
      },
      include: {
        conversationItems: {
          orderBy: {
            createdAt: 'asc',
          },
        },
      },
    });

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    return conversation;
  }

  /**
   * List all conversations for a user
   */
  async listConversations(userId: string, page = 1, resultsPerPage = 20) {
    const conversations = await this.prisma.conversation.findMany({
      where: {
        userId,
        deletedAt: null,
      },
      orderBy: {
        updatedAt: 'desc',
      },
      take: resultsPerPage,
      skip: (page - 1) * resultsPerPage,
      include: {
        conversationItems: {
          orderBy: {
            createdAt: 'asc',
          },
          take: 1, // Just get the first message for preview
        },
      },
    });

    const totalRecords = await this.prisma.conversation.count({
      where: {
        userId,
        deletedAt: null,
      },
    });

    return {
      data: conversations,
      page,
      resultsPerPage,
      totalRecords,
      totalPages: Math.ceil(totalRecords / resultsPerPage),
    };
  }

  /**
   * Rename a conversation
   */
  async updateConversation(
    conversationId: string,
    userId: string,
    title: string,
  ) {
    const conversation = await this.prisma.conversation.findFirst({
      where: {
        id: conversationId,
        userId,
      },
    });

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    return this.prisma.conversation.update({
      where: { id: conversationId },
      data: { title },
    });
  }

  /**
   * Delete a conversation
   */
  async deleteConversation(conversationId: string, userId: string) {
    const conversation = await this.prisma.conversation.findFirst({
      where: {
        id: conversationId,
        userId,
      },
    });

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    await this.prisma.conversation.update({
      where: { id: conversationId },
      data: { deletedAt: new Date() },
    });

    return conversation;
  }

  /**
   * Send a message to a conversation - queues for async processing
   * Returns immediately with the user message
   */
  async sendMessage(
    conversationId: string,
    userId: string,
    content: string,
    attachedNoteIds?: string[],
  ) {
    // Verify conversation exists and belongs to user
    await this.getConversation(conversationId, userId);

    // Resolve any attached notes (ownership-checked) so we can store compact
    // refs on the message — these drive the chips in the UI and let the
    // processor re-read the notes' content into context each turn.
    const attachedNotes = await this.resolveAttachedNotes(attachedNoteIds, userId);
    const componentData =
      attachedNotes.length > 0
        ? {
            type: 'attached-notes',
            data: attachedNotes.map((n) => ({
              id: n.id,
              title: n.title,
              notebookId: n.notebookId,
            })),
          }
        : null;

    // Save user message
    const userMessage = await this.prisma.conversationItem.create({
      data: {
        conversationId,
        role: ConversationItemRole.USER,
        content,
        componentData: componentData
          ? JSON.parse(JSON.stringify(componentData))
          : null,
      },
    });

    // Update conversation status to PROCESSING
    await this.prisma.conversation.update({
      where: { id: conversationId },
      data: {
        status: ConversationStatus.PROCESSING,
        errorMessage: null,
        updatedAt: new Date(),
      },
    });

    // Queue the job for async processing
    await this.llmQueue.add('process-message', {
      conversationId,
      userId,
      content,
      userMessageId: userMessage.id,
    });

    return {
      userMessage,
      status: 'processing',
    };
  }

  /**
   * Resolve attached note IDs to owned notes, deduped and order-preserving.
   * IDs that don't resolve (deleted or not the user's) are silently dropped.
   */
  private async resolveAttachedNotes(
    noteIds: string[] | undefined,
    userId: string,
  ) {
    if (!noteIds || noteIds.length === 0) return [];
    const uniqueIds = [...new Set(noteIds)];
    const notes = await Promise.all(
      uniqueIds.map((id) => this.noteService.findOneForUser(id, userId)),
    );
    return notes.filter((n): n is NonNullable<typeof n> => !!n);
  }

  /**
   * Build a context suffix containing the current content of the given notes,
   * re-read fresh from the DB so the AI always sees the latest version.
   * Returns '' when there is nothing to attach.
   */
  private async buildAttachedNotesContext(
    noteIds: string[],
    userId: string,
  ): Promise<string> {
    const notes = await this.resolveAttachedNotes(noteIds, userId);
    const blocks = notes.map((n) => {
      const text = noteHtmlToText(n.content);
      return `--- Attached note: "${n.title || 'Untitled'}" ---\n${text || '(empty note)'}`;
    });
    if (blocks.length === 0) return '';
    return `\n\n[The user attached the following note(s) for context]\n\n${blocks.join('\n\n')}`;
  }

  /**
   * Process message asynchronously (called by processor)
   * This contains the core LLM logic
   */
  async processMessageAsync(
    conversationId: string,
    userId: string,
    content: string,
  ) {
    // Get conversation with history
    const conversation = await this.getConversation(conversationId, userId);

    // Get conversation history (limited to prevent context overflow)
    const fullHistory = conversation.conversationItems || [];
    const history = fullHistory.slice(-MAX_HISTORY_MESSAGES);

    // Build messages array with system prompt first
    const messages: (SystemMessage | HumanMessage | AIMessage | ToolMessage)[] = [
      this.getSystemPrompt(),
    ];

    // Convert history to LangChain messages
    for (const item of history) {
      switch (item.role) {
        case ConversationItemRole.USER: {
          // Fold any notes the user attached to this turn into its context.
          const attached = item.componentData as
            | { type?: string; data?: Array<{ id: string }> }
            | null;
          const attachedNoteIds =
            attached?.type === 'attached-notes' && Array.isArray(attached.data)
              ? attached.data.map((n) => n.id)
              : [];
          const noteContext = await this.buildAttachedNotesContext(
            attachedNoteIds,
            userId,
          );
          messages.push(
            new HumanMessage(
              noteContext ? `${item.content}${noteContext}` : item.content,
            ),
          );
          break;
        }
        case ConversationItemRole.ASSISTANT:
          // If the assistant message has tool_calls, include them in the AIMessage
          if (item.toolCalls) {
            messages.push(new AIMessage({
              content: item.content,
              tool_calls: item.toolCalls as any,
            }));
          } else {
            messages.push(new AIMessage(item.content));
          }
          break;
        case ConversationItemRole.SYSTEM:
          messages.push(new SystemMessage(item.content));
          break;
        case ConversationItemRole.TOOL:
          messages.push(new ToolMessage({
            content: item.content,
            tool_call_id: item.toolCallId || '',
          }));
          break;
      }
    }

    // Get tools
    const tools = this.getTools(userId);

    // Bind tools to the model. The function tools above are executed client-side
    // by the loop below; OpenAI's built-in web search runs server-side via the
    // Responses API and never surfaces as a client-executed tool call.
    const modelWithTools = this.chatModel.bindTools([
      ...tools,
      { type: 'web_search' } as any,
    ]);

    // Track iterations
    let iterations = 0;

    // Get initial AI response
    let aiResponse = await modelWithTools.invoke(messages);
    this.logger.debug(`AI Response: ${JSON.stringify(aiResponse)}`);

    // Multi-round tool execution loop
    while (aiResponse.tool_calls && aiResponse.tool_calls.length > 0 && iterations < MAX_TOOL_ITERATIONS) {
      iterations++;
      this.logger.debug(`Tool iteration ${iterations}/${MAX_TOOL_ITERATIONS}`);

      // Save AI message with tool calls. Use `.text` so Responses API content
      // (an array of content blocks) is flattened to plain text rather than JSON.
      const aiMessageContent = aiResponse.text || 'Using tools...';
      await this.prisma.conversationItem.create({
        data: {
          conversationId,
          role: ConversationItemRole.ASSISTANT,
          content: aiMessageContent,
          toolCalls: JSON.parse(JSON.stringify(aiResponse.tool_calls)),
        },
      });

      // Add AI response to messages (once, before tool results)
      messages.push(aiResponse);

      // Execute all tool calls in parallel
      const toolPromises = aiResponse.tool_calls.map(async (toolCall) => {
        const tool = tools.find((t) => t.name === toolCall.name);
        if (!tool) {
          return { toolCall, result: { error: `Tool ${toolCall.name} not found` }, error: true };
        }

        try {
          this.logger.debug(`Executing tool: ${toolCall.name} with args: ${JSON.stringify(toolCall.args)}`);
          const toolResult = await (tool as any).invoke(toolCall);
          this.logger.debug(`Tool result type: ${typeof toolResult}`);
          this.logger.debug(`Tool result keys: ${toolResult ? Object.keys(toolResult) : 'null'}`);
          this.logger.debug(`Tool result: ${JSON.stringify(toolResult)}`);

          // Extract the actual result - LangChain may wrap it in different ways
          let actualResult = toolResult;

          // If it's a string (some tools return stringified JSON), try to parse it
          if (typeof toolResult === 'string') {
            try {
              actualResult = JSON.parse(toolResult);
            } catch {
              actualResult = { message: toolResult };
            }
          }
          // If it has a 'content' property (LangChain wrapper), extract it
          else if (toolResult && typeof toolResult === 'object' && 'content' in toolResult && typeof toolResult.content === 'string') {
            try {
              actualResult = JSON.parse(toolResult.content);
            } catch {
              actualResult = { message: toolResult.content };
            }
          }

          this.logger.debug(`Actual result componentData: ${actualResult?.componentData ? 'present' : 'missing'}`);
          return { toolCall, result: actualResult, error: false };
        } catch (error) {
          this.logger.error(`Error executing tool ${toolCall.name}: ${error.message}`);
          return { toolCall, result: { error: error.message }, error: true };
        }
      });

      const toolResults = await Promise.all(toolPromises);

      // Process all tool results
      for (const { toolCall, result, error } of toolResults) {
        const componentData = !error && result.componentData ? result.componentData : null;

        // Save tool result to database
        await this.prisma.conversationItem.create({
          data: {
            conversationId,
            role: ConversationItemRole.TOOL,
            content: JSON.stringify(result),
            toolCallId: toolCall.id,
            toolName: toolCall.name,
            componentData: componentData ? JSON.parse(JSON.stringify(componentData)) : null,
          },
        });

        // Add tool result to messages
        messages.push(new ToolMessage({
          content: JSON.stringify(result),
          tool_call_id: toolCall.id || '',
        }));
      }

      // Get next AI response (may request more tools or provide final answer)
      aiResponse = await modelWithTools.invoke(messages);
      this.logger.debug(`AI Response (iteration ${iterations}): ${JSON.stringify(aiResponse)}`);
    }

    // Save final AI response. `.text` flattens Responses API content blocks
    // (e.g. [{ type: 'text', text: '...' }]) into a plain string.
    const finalContent = aiResponse.text;

    await this.prisma.conversationItem.create({
      data: {
        conversationId,
        role: ConversationItemRole.ASSISTANT,
        content: finalContent,
      },
    });

    // Update conversation timestamp
    await this.prisma.conversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() },
    });
  }

  /**
   * Poll for new messages since a given timestamp
   */
  async pollMessages(conversationId: string, userId: string, since: Date) {
    // Verify conversation belongs to user
    const conversation = await this.prisma.conversation.findFirst({
      where: {
        id: conversationId,
        userId,
      },
      select: {
        status: true,
        errorMessage: true,
        title: true,
      },
    });

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    // Get new messages since timestamp
    const newMessages = await this.prisma.conversationItem.findMany({
      where: {
        conversationId,
        createdAt: {
          gt: since,
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    const isComplete = conversation.status === ConversationStatus.IDLE ||
                       conversation.status === ConversationStatus.ERROR;

    return {
      messages: newMessages,
      status: conversation.status,
      isComplete,
      errorMessage: conversation.errorMessage,
      title: conversation.title,
    };
  }

  /**
   * Get conversation status only (lightweight)
   */
  async getConversationStatus(conversationId: string, userId: string) {
    const conversation = await this.prisma.conversation.findFirst({
      where: {
        id: conversationId,
        userId,
      },
      select: {
        status: true,
        errorMessage: true,
      },
    });

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    return conversation;
  }

  /**
   * Generate a brief title for a conversation based on message content
   */
  private async generateConversationTitle(content: string): Promise<string> {
    // Reuse the same chat model as the rest of the assistant (LLM_MODEL) so
    // titling stays consistent with the conversation it summarizes.
    const response = await this.chatModel.invoke([
      new SystemMessage(
        "Generate a brief, descriptive title (3-8 words) for a conversation based on the user's first message. Respond with only the title, no quotes or trailing punctuation.",
      ),
      new HumanMessage(content),
    ]);

    const responseContent = response.content;
    const title =
      typeof responseContent === 'string'
        ? responseContent
        : responseContent
            .map((part) => ('text' in part ? part.text : ''))
            .join('');

    return title.trim() || 'New Conversation';
  }

  /**
   * Generate and update conversation title if it doesn't exist
   */
  async generateAndUpdateTitle(conversationId: string, messageContent: string): Promise<string | null> {
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
      select: { title: true },
    });

    // Skip if title already exists
    if (conversation?.title) {
      return conversation.title;
    }

    const title = await this.generateConversationTitle(messageContent);

    await this.prisma.conversation.update({
      where: { id: conversationId },
      data: { title },
    });

    return title;
  }

  /**
   * Get available tools for the LLM
   */
  private getTools(userId: string) {
    const createTaskTool = new DynamicStructuredTool({
      name: 'create_task',
      description: 'Create a new task for the user. Use this when the user asks you to create a task, add a todo, or remember to do something.',
      schema: z.object({
        title: z.string().describe('The title of the task'),
        description: z.string().optional().describe('A detailed description of the task'),
        dueDate: z.string().optional().describe('The due date for the task in ISO 8601 format (e.g., 2024-12-31T23:59:59Z)'),
        priority: z.enum(['LOW', 'MEDIUM', 'HIGH']).optional().describe('The priority level of the task'),
      }),
      func: async ({ title, description, dueDate, priority }) => {
        this.logger.debug(`Creating task: ${title}`);
        try {
          const task = await this.tasksService.create(userId, {
            title,
            description: description || null,
            dueDate: dueDate ? new Date(dueDate) : null,
            priority: priority || 'MEDIUM',
            status: 'TODO',
            noteId: null,
          });

          return {
            success: true,
            message: `Task "${title}" has been created successfully.`,
            componentData: {
              type: 'task',
              data: {
                id: task.id,
                title: task.title,
                description: task.description,
                dueDate: task.dueDate,
                priority: task.priority,
                status: task.status,
              },
            },
          };
        } catch (error) {
          this.logger.error(`Error creating task: ${error.message}`);
          return {
            success: false,
            error: error.message,
            message: `Failed to create task: ${error.message}`,
          };
        }
      },
    });

    const searchTasksTool = new DynamicStructuredTool({
      name: 'search_tasks',
      description: 'Search and filter tasks. Use this to find tasks by status, due date, priority, or text search. Perfect for queries like "show me tasks due today", "what are my high priority tasks", etc.',
      schema: z.object({
        search: z.string().optional().describe('Search term to look for in task title or description'),
        status: z.enum(['TODO', 'IN_PROGRESS', 'COMPLETED']).optional().describe('Filter tasks by status'),
        dueBefore: z.string().optional().describe('Find tasks due before this date (ISO 8601 format, e.g., 2024-12-31T23:59:59Z)'),
        dueAfter: z.string().optional().describe('Find tasks due after this date (ISO 8601 format)'),
        priority: z.enum(['LOW', 'MEDIUM', 'HIGH']).optional().describe('Filter tasks by priority level'),
        limit: z.number().optional().describe('Maximum number of results to return (default: 10)'),
      }),
      func: async ({ search, status, dueBefore, dueAfter, priority, limit }) => {
        this.logger.debug(`Searching tasks with filters: ${JSON.stringify({ search, status, dueBefore, dueAfter, priority, limit })}`);
        try {
          const filter: any = {
            search,
            status,
            priority,
            resultsPerPage: limit || 10,
          };

          if (dueBefore) {
            filter.endDate = dueBefore;
          }
          if (dueAfter) {
            filter.startDate = dueAfter;
          }

          const tasks = await this.tasksService.filter(userId, filter);

          if (tasks.length === 0) {
            return {
              success: true,
              message: 'No tasks found matching the criteria.',
              componentData: null,
            };
          }

          return {
            success: true,
            message: `Found ${tasks.length} task${tasks.length === 1 ? '' : 's'}.`,
            componentData: {
              type: 'task',
              data: tasks,
            },
          };
        } catch (error) {
          this.logger.error(`Error searching tasks: ${error.message}`);
          return {
            success: false,
            error: error.message,
            message: `Failed to search tasks: ${error.message}`,
          };
        }
      },
    });

    const updateTaskTool = new DynamicStructuredTool({
      name: 'update_task',
      description: 'Update an existing task. Use this to mark tasks as complete, change status, update title, description, priority, or due date. You must know the task ID.',
      schema: z.object({
        taskId: z.string().describe('The ID of the task to update'),
        status: z.enum(['TODO', 'IN_PROGRESS', 'COMPLETED']).optional().describe('New status for the task'),
        title: z.string().optional().describe('New title for the task'),
        description: z.string().optional().describe('New description for the task'),
        priority: z.enum(['LOW', 'MEDIUM', 'HIGH']).optional().describe('New priority level'),
        dueDate: z.string().optional().describe('New due date in ISO 8601 format'),
      }),
      func: async ({ taskId, status, title, description, priority, dueDate }) => {
        this.logger.debug(`Updating task ${taskId} with: ${JSON.stringify({ status, title, description, priority, dueDate })}`);
        try {
          const updateData: any = {};
          if (status) updateData.status = status;
          if (title) updateData.title = title;
          if (description !== undefined) updateData.description = description;
          if (priority) updateData.priority = priority;
          if (dueDate) updateData.dueDate = new Date(dueDate);

          const updatedTask = await this.tasksService.update(taskId, userId, updateData);

          return {
            success: true,
            message: `Task "${updatedTask.title}" has been updated successfully.`,
            componentData: {
              type: 'task',
              data: updatedTask,
            },
          };
        } catch (error) {
          this.logger.error(`Error updating task: ${error.message}`);
          return {
            success: false,
            error: error.message,
            message: `Failed to update task: ${error.message}`,
          };
        }
      },
    });

    const getTaskTool = new DynamicStructuredTool({
      name: 'get_task',
      description: 'Look up and display detailed information about a task by searching its title or description. Use this when the user asks about a specific task.',
      schema: z.object({
        search: z.string().describe('Search term to find the task by title or description'),
      }),
      func: async ({ search }) => {
        this.logger.debug(`Looking up task with search: ${search}`);
        try {
          const tasks = await this.tasksService.filter(userId, {
            search,
            resultsPerPage: 5,
          });

          if (tasks.length === 0) {
            return {
              success: true,
              message: `No tasks found matching "${search}".`,
              componentData: null,
            };
          }

          return {
            success: true,
            message: `Found ${tasks.length} task${tasks.length === 1 ? '' : 's'} matching "${search}".`,
            componentData: {
              type: 'task',
              data: tasks.length === 1 ? tasks[0] : tasks,
            },
          };
        } catch (error) {
          this.logger.error(`Error looking up task: ${error.message}`);
          return {
            success: false,
            error: error.message,
            message: `Failed to look up task: ${error.message}`,
          };
        }
      },
    });

    // Notes tools
    const searchNotesTool = new DynamicStructuredTool({
      name: 'search_notes',
      description: 'Search through the user\'s notes by title or content. Use this to find notes related to a topic, keyword, or phrase. Returns visual note cards that the user will see.',
      schema: z.object({
        query: z.string().describe('Search query to find notes by title or content'),
        limit: z.number().optional().describe('Maximum number of notes to return (default: 5)'),
      }),
      func: async ({ query, limit }) => {
        this.logger.debug(`Searching notes with query: ${query}, limit: ${limit}`);
        try {
          const searchResults = await this.searchService.search(query, userId, 'notes');

          if (!searchResults.noteResults || searchResults.noteResults.length === 0) {
            return {
              success: true,
              message: `No notes found matching "${query}".`,
              componentData: null,
            };
          }

          // Apply limit
          const maxResults = limit || 5;
          const limitedResults = searchResults.noteResults.slice(0, maxResults);

          return {
            success: true,
            message: `Found ${limitedResults.length} note${limitedResults.length === 1 ? '' : 's'} matching "${query}".`,
            componentData: {
              type: 'note',
              data: limitedResults,
            },
          };
        } catch (error) {
          this.logger.error(`Error searching notes: ${error.message}`);
          return {
            success: false,
            error: error.message,
            message: `Failed to search notes: ${error.message}`,
          };
        }
      },
    });

    const createNoteTool = new DynamicStructuredTool({
      name: 'create_note',
      description: 'Create a new note for the user. Use this when the user asks you to create a note, write something down, or save information.',
      schema: z.object({
        title: z.string().describe('The title of the note'),
        content: z.string().describe('The content of the note (can include HTML formatting)'),
        notebookId: z.string().optional().describe('The ID of the notebook to create the note in. If not provided, will use the user\'s first notebook.'),
      }),
      func: async ({ title, content, notebookId }) => {
        this.logger.debug(`Creating note: ${title}`);
        try {
          // If no notebook specified, fall back to the user's default notebook,
          // then to their first top-level notebook if none is marked default.
          let targetNotebookId = notebookId;
          if (!targetNotebookId) {
            const notebooks = await this.prisma.notebook.findMany({
              where: {
                userId,
                deletedAt: null,
                parentId: null, // Top-level notebooks
              },
              orderBy: { createdAt: 'asc' },
            });

            if (notebooks.length === 0) {
              return {
                success: false,
                message: 'No notebooks found. Please create a notebook first.',
                componentData: null,
              };
            }
            const defaultNotebook = notebooks.find((nb) => nb.isDefault);
            targetNotebookId = (defaultNotebook ?? notebooks[0]).id;
          }

          const note = await this.noteService.create(
            { title, content },
            targetNotebookId,
            userId
          );

          return {
            success: true,
            message: `Note "${title}" has been created successfully.`,
            componentData: {
              type: 'note',
              data: {
                id: note.id,
                title: note.title,
                notebookId: note.notebookId,
              },
            },
          };
        } catch (error) {
          this.logger.error(`Error creating note: ${error.message}`);
          return {
            success: false,
            error: error.message,
            message: `Failed to create note: ${error.message}`,
          };
        }
      },
    });

    const getNoteTool = new DynamicStructuredTool({
      name: 'get_note',
      description: 'Get the full content of a specific note by its ID. Use this after searching for notes to retrieve the complete content.',
      schema: z.object({
        noteId: z.string().describe('The ID of the note to retrieve'),
      }),
      func: async ({ noteId }) => {
        this.logger.debug(`Getting note: ${noteId}`);
        try {
          const note = await this.noteService.findOneForUser(noteId, userId);

          if (!note) {
            return {
              success: false,
              message: `Note with ID "${noteId}" not found.`,
              componentData: null,
            };
          }

          return {
            success: true,
            message: `Retrieved note "${note.title}".`,
            componentData: {
              type: 'note',
              data: note,
            },
          };
        } catch (error) {
          this.logger.error(`Error getting note: ${error.message}`);
          return {
            success: false,
            error: error.message,
            message: `Failed to get note: ${error.message}`,
          };
        }
      },
    });

    const updateNoteTool = new DynamicStructuredTool({
      name: 'update_note',
      description:
        "Edit an existing note. Use this to change a note's title or content, move it to a different notebook, or pin/unpin it. " +
        'IMPORTANT: content is REPLACED wholesale, not appended. When making a partial edit (e.g. adding a line), first call get_note to read the current content, then submit the full revised HTML content. ' +
        'Only provide the fields you want to change.',
      schema: z.object({
        noteId: z.string().describe('The ID of the note to update'),
        title: z.string().optional().describe('The new title of the note'),
        content: z
          .string()
          .optional()
          .describe(
            'The full new content of the note (HTML). This replaces the existing content entirely.',
          ),
        notebookId: z
          .string()
          .optional()
          .describe('Move the note to the notebook with this ID. Use list_notebooks to resolve a notebook name to its ID.'),
        pinned: z
          .boolean()
          .optional()
          .describe('Set to true to pin the note, false to unpin it'),
      }),
      func: async ({ noteId, title, content, notebookId, pinned }) => {
        this.logger.debug(`Updating note: ${noteId}`);
        try {
          const data: {
            title?: string;
            content?: string;
            notebookId?: string;
            pinnedAt?: Date | null;
          } = {};
          if (title !== undefined) data.title = title;
          if (content !== undefined) data.content = content;
          if (notebookId !== undefined) data.notebookId = notebookId;
          if (pinned !== undefined) data.pinnedAt = pinned ? new Date() : null;

          const note = await this.noteService.update(noteId, data, userId);

          return {
            success: true,
            message: `Note "${note.title}" has been updated successfully.`,
            componentData: {
              type: 'note',
              data: {
                id: note.id,
                title: note.title,
                notebookId: note.notebookId,
              },
            },
          };
        } catch (error) {
          this.logger.error(`Error updating note: ${error.message}`);
          return {
            success: false,
            error: error.message,
            message: `Failed to update note: ${error.message}`,
          };
        }
      },
    });

    // Notebook tools
    const listNotebooksTool = new DynamicStructuredTool({
      name: 'list_notebooks',
      description:
        "List the user's notebooks. Use this to see what notebooks exist, to answer questions about them, or to resolve a notebook name to its ID before creating or moving a note. Returns each notebook's id, title, parentId (for nesting), and whether it is the default notebook.",
      schema: z.object({}),
      func: async () => {
        this.logger.debug(`Listing notebooks for user ${userId.substring(0, 7)}`);
        try {
          const notebooks = await this.notebookService.getNotebooksForUser(userId);
          const data = notebooks.map((nb) => ({
            id: nb.id,
            title: nb.title,
            parentId: nb.parentId ?? null,
            isDefault: nb.isDefault,
          }));

          return {
            success: true,
            message: `Found ${data.length} notebook${data.length === 1 ? '' : 's'}.`,
            notebooks: data,
            componentData: null,
          };
        } catch (error) {
          this.logger.error(`Error listing notebooks: ${error.message}`);
          return {
            success: false,
            error: error.message,
            message: `Failed to list notebooks: ${error.message}`,
          };
        }
      },
    });

    const createNotebookTool = new DynamicStructuredTool({
      name: 'create_notebook',
      description:
        'Create a new notebook for the user. Use this when the user asks to create or add a notebook. To nest the notebook under an existing one, pass that notebook\'s ID as parentId (use list_notebooks to find it).',
      schema: z.object({
        title: z.string().describe('The title of the notebook'),
        parentId: z
          .string()
          .optional()
          .describe('The ID of the parent notebook to nest this notebook under. Omit for a top-level notebook.'),
      }),
      func: async ({ title, parentId }) => {
        this.logger.debug(`Creating notebook: ${title}`);
        try {
          const notebook = await this.notebookService.createNotebook(userId, {
            title,
            parentId,
            isDefault: false,
          });

          return {
            success: true,
            message: `Notebook "${notebook.title}" has been created successfully.`,
            notebook: {
              id: notebook.id,
              title: notebook.title,
              parentId: notebook.parentId ?? null,
            },
            componentData: null,
          };
        } catch (error) {
          this.logger.error(`Error creating notebook: ${error.message}`);
          return {
            success: false,
            error: error.message,
            message: `Failed to create notebook: ${error.message}`,
          };
        }
      },
    });

    const searchGmailTool = new DynamicStructuredTool({
      name: 'search_gmail',
      description:
        "Search the user's Gmail and return matching message summaries (sender, subject, date, snippet). " +
        'Use Gmail search operators in the query, e.g. "from:alice@example.com", "subject:invoice", ' +
        '"newer_than:7d", "after:2024/01/01", "has:attachment", "is:unread", "label:work". ' +
        'This returns only metadata and a short snippet — to read the full body of a result, call get_email with its messageId.',
      schema: z.object({
        query: z.string().describe('Gmail search query using Gmail search operators'),
        maxResults: z.number().optional().describe('Maximum number of emails to return (default 10, max 25)'),
      }),
      func: async ({ query, maxResults }) => {
        this.logger.debug(`Searching Gmail: ${query}`);
        try {
          const gmail = await this.googleService.getGmailClient(userId);
          const limit = Math.min(maxResults ?? 10, 25);
          const listRes = await gmail.users.messages.list({
            userId: 'me',
            q: query,
            maxResults: limit,
          });
          const ids = (listRes.data.messages ?? [])
            .map((m) => m.id)
            .filter((id): id is string => Boolean(id));
          const emails = await Promise.all(
            ids.map(async (id) => {
              const msg = await gmail.users.messages.get({
                userId: 'me',
                id,
                format: 'metadata',
                metadataHeaders: ['From', 'Subject', 'Date'],
              });
              const headers = msg.data.payload?.headers ?? undefined;
              return {
                messageId: id,
                threadId: msg.data.threadId,
                from: getHeader(headers, 'From'),
                subject: getHeader(headers, 'Subject'),
                date: getHeader(headers, 'Date'),
                snippet: msg.data.snippet ?? '',
              };
            }),
          );
          return { success: true, count: emails.length, emails };
        } catch (error) {
          if (error instanceof GmailNotConnectedError) {
            return {
              success: false,
              message: 'Gmail is not connected. Tell the user to connect it in Settings → Integrations.',
            };
          }
          this.logger.error(`Error searching Gmail: ${error.message}`);
          return {
            success: false,
            error: error.message,
            message: `Failed to search Gmail: ${error.message}`,
          };
        }
      },
    });

    const getEmailTool = new DynamicStructuredTool({
      name: 'get_email',
      description:
        'Read the full content of a single Gmail message by its messageId (obtained from search_gmail). ' +
        'Returns sender, recipients, subject, date, and the plain-text body.',
      schema: z.object({
        messageId: z.string().describe('The Gmail message ID to read (from search_gmail results)'),
      }),
      func: async ({ messageId }) => {
        this.logger.debug(`Reading Gmail message: ${messageId}`);
        try {
          const gmail = await this.googleService.getGmailClient(userId);
          const msg = await gmail.users.messages.get({
            userId: 'me',
            id: messageId,
            format: 'full',
          });
          const headers = msg.data.payload?.headers ?? undefined;
          let body = extractEmailBody(msg.data.payload);
          let truncated = false;
          if (body.length > MAX_EMAIL_BODY_CHARS) {
            body = body.slice(0, MAX_EMAIL_BODY_CHARS);
            truncated = true;
          }
          return {
            success: true,
            email: {
              messageId,
              threadId: msg.data.threadId,
              from: getHeader(headers, 'From'),
              to: getHeader(headers, 'To'),
              subject: getHeader(headers, 'Subject'),
              date: getHeader(headers, 'Date'),
              body,
              truncated,
            },
          };
        } catch (error) {
          if (error instanceof GmailNotConnectedError) {
            return {
              success: false,
              message: 'Gmail is not connected. Tell the user to connect it in Settings → Integrations.',
            };
          }
          this.logger.error(`Error reading Gmail message: ${error.message}`);
          return {
            success: false,
            error: error.message,
            message: `Failed to read email: ${error.message}`,
          };
        }
      },
    });

    return [
      createTaskTool,
      searchTasksTool,
      updateTaskTool,
      getTaskTool,
      searchNotesTool,
      createNoteTool,
      getNoteTool,
      updateNoteTool,
      listNotebooksTool,
      createNotebookTool,
      searchGmailTool,
      getEmailTool,
    ];
  }
}

