import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { TasksService } from '../tasks/tasks.service';
import { NoteService } from '../notes/notes.service';
import { SearchService } from '../search/search.service';
import { ChatOpenAI } from '@langchain/openai';
import { DynamicStructuredTool } from '@langchain/core/tools';
import { z } from 'zod';
import { HumanMessage, AIMessage, SystemMessage, ToolMessage } from '@langchain/core/messages';
import { ConversationItemRole } from '@prisma/client';
import { TavilySearch } from '@langchain/tavily';

// Configuration constants
const MAX_TOOL_ITERATIONS = 5;
const MAX_HISTORY_MESSAGES = 50;

@Injectable()
export class LlmService {
  private readonly logger = new Logger(LlmService.name);
  private chatModel: ChatOpenAI;
  private tavilyApiKey: string;

  constructor(
    private prisma: PrismaService,
    private tasksService: TasksService,
    private noteService: NoteService,
    private searchService: SearchService,
    private configService: ConfigService,
  ) {
    // Initialize ChatOpenAI with API key from config
    const apiKey = this.configService.get<string>('OPENAI_API_KEY');
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY is not configured');
    }

    // Configurable model settings with defaults
    const modelName = this.configService.get<string>('LLM_MODEL') || 'gpt-4o-mini';
    const temperature = parseFloat(this.configService.get<string>('LLM_TEMPERATURE') || '0.7');

    this.chatModel = new ChatOpenAI({
      openAIApiKey: apiKey,
      modelName,
      temperature,
    });

    const tavilyKey = this.configService.get<string>('TAVILY_API_KEY');
    if (!tavilyKey) {
      throw new Error('TAVILY_API_KEY is not configured');
    }
    this.tavilyApiKey = tavilyKey;
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
- Search and create notes
- Look up information on the internet

Today's date is ${today}.

Be concise and helpful. When creating tasks, infer reasonable due dates and priorities from context if not specified.
When searching for tasks or notes, use the search tools to find relevant items before making changes.

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
        deletedAt: null,
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
   * Send a message to a conversation and get AI response
   */
  async sendMessage(conversationId: string, userId: string, content: string) {
    // Verify conversation exists and belongs to user
    const conversation = await this.getConversation(conversationId, userId);

    // Save user message
    const userMessage = await this.prisma.conversationItem.create({
      data: {
        conversationId,
        role: ConversationItemRole.USER,
        content,
      },
    });

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
        case ConversationItemRole.USER:
          messages.push(new HumanMessage(item.content));
          break;
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

    // Add the new user message
    messages.push(new HumanMessage(content));

    // Get tools
    const tools = this.getTools(userId);

    // Bind tools to the model
    const modelWithTools = this.chatModel.bindTools(tools);

    // Track if any tools were executed and collect tool messages
    let actionTaken = false;
    let iterations = 0;
    const toolMessages: any[] = [];

    // Get initial AI response
    let aiResponse = await modelWithTools.invoke(messages);
    this.logger.debug(`AI Response: ${JSON.stringify(aiResponse)}`);

    // Multi-round tool execution loop
    while (aiResponse.tool_calls && aiResponse.tool_calls.length > 0 && iterations < MAX_TOOL_ITERATIONS) {
      actionTaken = true;
      iterations++;
      this.logger.debug(`Tool iteration ${iterations}/${MAX_TOOL_ITERATIONS}`);

      // Save AI message with tool calls
      const aiMessageContent = aiResponse.content || 'Using tools...';
      await this.prisma.conversationItem.create({
        data: {
          conversationId,
          role: ConversationItemRole.ASSISTANT,
          content: typeof aiMessageContent === 'string' ? aiMessageContent : JSON.stringify(aiMessageContent),
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
        const toolMessage = await this.prisma.conversationItem.create({
          data: {
            conversationId,
            role: ConversationItemRole.TOOL,
            content: JSON.stringify(result),
            toolCallId: toolCall.id,
            toolName: toolCall.name,
            componentData: componentData ? JSON.parse(JSON.stringify(componentData)) : null,
          },
        });

        // Collect for response
        toolMessages.push(toolMessage);

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

    // Save final AI response
    const finalContent = typeof aiResponse.content === 'string'
      ? aiResponse.content
      : JSON.stringify(aiResponse.content);

    const finalAiMessage = await this.prisma.conversationItem.create({
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

    return {
      userMessage,
      aiMessage: finalAiMessage,
      toolMessages,
      actionTaken,
    };
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

    const searchInternetTool = new TavilySearch({
      name: 'search_internet',
      description: 'Search the internet for current information, news, facts, or answers to questions. Use this when you need up-to-date information that you may not have in your training data.',
      maxResults: 5,
      tavilyApiKey: this.tavilyApiKey,
      includeRawContent: true,
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
          // If no notebook specified, get the user's first notebook
          let targetNotebookId = notebookId;
          if (!targetNotebookId) {
            const notebooks = await this.prisma.notebook.findMany({
              where: {
                userId,
                deletedAt: null,
                parentId: null, // Top-level notebooks
              },
              orderBy: { createdAt: 'asc' },
              take: 1,
            });

            if (notebooks.length === 0) {
              return {
                success: false,
                message: 'No notebooks found. Please create a notebook first.',
                componentData: null,
              };
            }
            targetNotebookId = notebooks[0].id;
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

    return [
      createTaskTool,
      searchTasksTool,
      updateTaskTool,
      getTaskTool,
      searchNotesTool,
      createNoteTool,
      getNoteTool,
      searchInternetTool,
    ];
  }
}

