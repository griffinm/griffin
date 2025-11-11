import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { TasksService } from '../tasks/tasks.service';
import { ChatOpenAI } from '@langchain/openai';
import { DynamicStructuredTool } from '@langchain/core/tools';
import { z } from 'zod';
import { HumanMessage, AIMessage, SystemMessage, ToolMessage } from '@langchain/core/messages';
import { ConversationItemRole } from '@prisma/client';

@Injectable()
export class LlmService {
  private readonly logger = new Logger(LlmService.name);
  private chatModel: ChatOpenAI;

  constructor(
    private prisma: PrismaService,
    private tasksService: TasksService,
    private configService: ConfigService,
  ) {
    // Initialize ChatOpenAI with API key from config
    const apiKey = this.configService.get<string>('OPENAI_API_KEY');
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY is not configured');
    }

    this.chatModel = new ChatOpenAI({
      openAIApiKey: apiKey,
      modelName: 'gpt-4o-mini',
      temperature: 0.7,
    });
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

    // Get conversation history
    const history = conversation.conversationItems || [];

    // Convert history to Langchain messages
    const messages = history.map((item) => {
      switch (item.role) {
        case ConversationItemRole.USER:
          return new HumanMessage(item.content);
        case ConversationItemRole.ASSISTANT:
          // If the assistant message has tool_calls, include them in the AIMessage
          if (item.toolCalls) {
            return new AIMessage({
              content: item.content,
              tool_calls: item.toolCalls,
            });
          }
          return new AIMessage(item.content);
        case ConversationItemRole.SYSTEM:
          return new SystemMessage(item.content);
        case ConversationItemRole.TOOL:
          return new ToolMessage({
            content: item.content,
            tool_call_id: item.toolCallId || '',
          });
        default:
          return new HumanMessage(item.content);
      }
    });

    // Add the new user message
    messages.push(new HumanMessage(content));

    // Get tools
    const tools = this.getTools(userId);

    // Bind tools to the model
    const modelWithTools = this.chatModel.bindTools(tools);

    // Get AI response
    const aiResponse = await modelWithTools.invoke(messages);

    this.logger.debug(`AI Response: ${JSON.stringify(aiResponse)}`);

    // Check if AI wants to use tools
    if (aiResponse.tool_calls && aiResponse.tool_calls.length > 0) {
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

      // Execute each tool call
      for (const toolCall of aiResponse.tool_calls) {
        const tool = tools.find((t) => t.name === toolCall.name);
        if (tool) {
          try {
            this.logger.debug(`Executing tool: ${toolCall.name} with args: ${JSON.stringify(toolCall.args)}`);
            const toolResult = await tool.invoke(toolCall);
            this.logger.debug(`Tool result: ${JSON.stringify(toolResult)}`);

            // Extract componentData if present
            const componentData = toolResult.componentData || null;

            // Save tool result
            await this.prisma.conversationItem.create({
              data: {
                conversationId,
                role: ConversationItemRole.TOOL,
                content: JSON.stringify(toolResult),
                toolCallId: toolCall.id,
                toolName: toolCall.name,
                componentData: componentData ? JSON.parse(JSON.stringify(componentData)) : null,
              },
            });

            // Add tool result to messages
            messages.push(aiResponse);
            messages.push(
              new ToolMessage({
                content: JSON.stringify(toolResult),
                tool_call_id: toolCall.id || '',
              })
            );
          } catch (error) {
            this.logger.error(`Error executing tool ${toolCall.name}: ${error.message}`);
            // Save error as tool result
            await this.prisma.conversationItem.create({
              data: {
                conversationId,
                role: ConversationItemRole.TOOL,
                content: JSON.stringify({ error: error.message }),
                toolCallId: toolCall.id,
                toolName: toolCall.name,
              },
            });

            messages.push(aiResponse);
            messages.push(
              new ToolMessage({
                content: JSON.stringify({ error: error.message }),
                tool_call_id: toolCall.id || '',
              })
            );
          }
        }
      }

      // Get final AI response after tool execution
      const finalResponse = await this.chatModel.invoke(messages);
      const finalContent = typeof finalResponse.content === 'string' 
        ? finalResponse.content 
        : JSON.stringify(finalResponse.content);

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
        actionTaken: true, // Tool was executed, action was taken
      };
    } else {
      // No tool calls, just save the AI response
      const aiContent = typeof aiResponse.content === 'string' 
        ? aiResponse.content 
        : JSON.stringify(aiResponse.content);

      const aiMessage = await this.prisma.conversationItem.create({
        data: {
          conversationId,
          role: ConversationItemRole.ASSISTANT,
          content: aiContent,
        },
      });

      // Update conversation timestamp
      await this.prisma.conversation.update({
        where: { id: conversationId },
        data: { updatedAt: new Date() },
      });

      return {
        userMessage,
        aiMessage,
        actionTaken: false, // No tool call, conversational response only
      };
    }
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
            task: {
              id: task.id,
              title: task.title,
              description: task.description,
              dueDate: task.dueDate,
              priority: task.priority,
              status: task.status,
            },
            message: `Task "${title}" has been created successfully.`,
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

    return [createTaskTool, searchTasksTool, updateTaskTool, getTaskTool];
  }
}

