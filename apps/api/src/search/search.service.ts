import { Injectable, Logger, OnModuleInit, Inject, forwardRef } from "@nestjs/common";
import Typesense from "typesense";
import { noteSchema, taskSchema, tagSchema } from "./schemas";
import { Note, Task, Tag } from "@prisma/client";
import { SearchResultsDto, NoteResult, TaskResult } from "./dto/search-results.dto";
import { PrismaService } from "../prisma/prisma.service";
import { NotebookService } from "../notebooks/notebook.service";

const collectionNames = {
  note: 'notes',
  task: 'tasks',
  tag: 'tags',
}

@Injectable()
export class SearchService implements OnModuleInit {
  private readonly logger = new Logger(SearchService.name);
  private typesenseClient;

  constructor(
    private prisma: PrismaService,
    @Inject(forwardRef(() => NotebookService))
    private notebookService: NotebookService,
  ) {}

  async onModuleInit() {
    this.logger.log('Initializing search service');
    this.typesenseClient = new Typesense.Client({
      nodes: [{
        host: process.env.TYPESENSE_HOST || "localhost",
        port: parseInt(process.env.TYPESENSE_PORT || "8108"),
        protocol: process.env.TYPESENSE_PROTOCOL || "http",
      }],
      apiKey: process.env.TYPESENSE_API_KEY || 'xyz',
    });

    this.createCollections();
  }

  private async createCollections() {

    const collections = await this.typesenseClient.collections().retrieve();
    const existingSchemaNames = collections.map(collection => collection.name);

    // Try and create the collections if it don't exist
    if (!existingSchemaNames.includes(noteSchema.name)) {
      this.logger.log(`Creating collection ${noteSchema.name}`);
      await this.typesenseClient.collections().create(noteSchema);
    } else {
      this.logger.log(`Collection ${noteSchema.name} already exists`);
    }

    if (!existingSchemaNames.includes(taskSchema.name)) {
      this.logger.log(`Creating collection ${taskSchema.name}`);
      await this.typesenseClient.collections().create(taskSchema);
    } else {
      this.logger.log(`Collection ${taskSchema.name} already exists`);
    }

    if (!existingSchemaNames.includes(tagSchema.name)) {
      this.logger.log(`Creating collection ${tagSchema.name}`);
      await this.typesenseClient.collections().create(tagSchema);
    } else {
      this.logger.log(`Collection ${tagSchema.name} already exists`);
    }
  }
  
  async search(query: string, userId: string, collection: 'notes' | 'tasks' | 'all' = 'notes', notebookId?: string): Promise<SearchResultsDto> {
    const searchResults = new SearchResultsDto();
    searchResults.query = query;
    searchResults.hits = 0;

    // Search notes if requested
    if (collection === 'notes' || collection === 'all') {
      let filterBy = `userId:${userId}`;

      // If notebookId is provided, filter by notebook and its descendants
      if (notebookId) {
        const notebookIds = await this.notebookService.getDescendantNotebookIds(notebookId, userId);
        filterBy += ` && notebookId:=[${notebookIds.join(',')}]`;
      }

      const noteSearchParams = {
        q: query,
        query_by: 'title, content',
        num_typos: 4,
        typo_tokens_threshold: 1,
        per_page: 10,
        filter_by: filterBy,
        highlight_affix_num_tokens: 4,
      };
      this.logger.debug(`Searching notes: ${JSON.stringify(noteSearchParams)}`);

      const noteResult = await this.typesenseClient.collections(["notes"]).documents().search(noteSearchParams);
      
      searchResults.noteResults = noteResult.hits.map((hit) => {
        const noteResult = new NoteResult();
        noteResult.id = hit.document.id;
        noteResult.title = hit.document.title;
        noteResult.matchedTokens = hit.matched_tokens;
        noteResult.snippet = hit.highlights[0]?.snippet;
        noteResult.matchedField = hit.highlights[0]?.field;
        return noteResult;
      });
      searchResults.hits += noteResult.hits.length;
    }

    // Search tasks if requested
    if (collection === 'tasks' || collection === 'all') {
      const taskSearchParams = {
        q: query,
        query_by: 'title, description',
        num_typos: 4,
        typo_tokens_threshold: 1,
        per_page: 10,
        filter_by: `userId:${userId}`,
        highlight_affix_num_tokens: 4,
      };
      this.logger.debug(`Searching tasks: ${JSON.stringify(taskSearchParams)}`);

      const taskResult = await this.typesenseClient.collections(["tasks"]).documents().search(taskSearchParams);
      
      searchResults.taskResults = taskResult.hits.map((hit) => {
        const taskResult = new TaskResult();
        taskResult.id = hit.document.id;
        taskResult.title = hit.document.title;
        taskResult.description = hit.document.description;
        taskResult.status = hit.document.status;
        taskResult.priority = hit.document.priority;
        taskResult.dueDate = hit.document.dueDate;
        taskResult.matchedTokens = hit.matched_tokens;
        taskResult.snippet = hit.highlights[0]?.snippet;
        taskResult.matchedField = hit.highlights[0]?.field;
        return taskResult;
      });
      searchResults.hits += taskResult.hits.length;
    }

    return searchResults;
  }

  public async rebuildIndex() {
    this.logger.debug(`Rebuilding search index`);
    
    this.logger.debug(`Deleting collections ${noteSchema.name}, ${taskSchema.name}, and ${tagSchema.name}`);
    await this.typesenseClient.collections(collectionNames.note).delete();
    await this.typesenseClient.collections(collectionNames.task).delete();
    await this.typesenseClient.collections(collectionNames.tag).delete();
    this.logger.debug(`Creating collections ${noteSchema.name}, ${taskSchema.name}, and ${tagSchema.name}`);
    await this.typesenseClient.collections().create(noteSchema);
    await this.typesenseClient.collections().create(taskSchema);
    await this.typesenseClient.collections().create(tagSchema);

    // Add all notes to the note collection
    const notes = await this.prisma.note.findMany({
      include: {
        notebook: {
          select: {
            userId: true,
          },
        },
      },
    });
    for (const note of notes) {
      await this.addObject({
        type: 'note',
        id: note.id,
        object: note,
        userId: note.notebook.userId,
      });
    }

    // Add all tasks to the task collection
    const tasks = await this.prisma.task.findMany();
    for (const task of tasks) {
      await this.addObject({
        type: 'task',
        id: task.id,
        object: task,
        userId: task.userId,
      });
    }

    // Add all tags to the tag collection
    const tags = await this.prisma.tag.findMany();
    for (const tag of tags) {
      await this.addObject({
        type: 'tag',
        id: tag.id,
        object: tag,
        userId: tag.userId,
      });
    }

    // Remove all empty notes
    this.logger.debug(`Removing all empty notes`);
    const emptyNotes = await this.prisma.note.findMany({
      where: {
        content: { in: ['', '<p></p>'] },
      },
    });
    for (const note of emptyNotes) {
      await this.removeObject({
        type: 'note',
        id: note.id,
      });
    }
    this.logger.debug(`Removed ${emptyNotes.length} empty notes`);

    return true;
  }

  public async addObject({
    type,
    id,
    object,
    userId,
  }: {
    type: 'note' | 'task' | 'tag';
    id: string;
    object: Note | Task | Tag;
    userId: string,
  }): Promise<boolean> {
    this.logger.debug(`Adding ${type} ${id.substring(0, 7)} to search index`);

    const collectionName = collectionNames[type];

    if(type === 'note') {
      const note = (object as Note)
      if(note.content === '' || note.content === '<p></p>') {
        this.logger.debug(`Skipping empty note ${id.substring(0, 7)}`);
        return true;
      }
    }

    const params: any = { id, userId };
    if (type === 'task') {
      const task = (object as Task)
      params.status = task.status
      params.title = task.title
      params.description = task.description
      params.priority = task.priority
      // Only include dueDate if it exists
      if (task.dueDate) {
        params.dueDate = Math.floor(task.dueDate.getTime() / 1000)
      }
    } else if (type === 'note') {
      // This is a note
      const note = (object as Note)
      params.title = note.title
      params.content = note.content
      params.notebookId = note.notebookId
    } else if (type === 'tag') {
      // This is a tag
      const tag = (object as Tag)
      params.name = tag.name
    }

    this.typesenseClient.collections(collectionName).documents().upsert(params);

    return true;
  }

  public async removeObject({
    type,
    id,
  }: {
    type: 'note' | 'task' | 'tag';
    id: string;
  }): Promise<boolean> {
    this.logger.debug(`Removing ${type} ${id.substring(0, 7)} from search index`);

    try {
      const collectionName = collectionNames[type];
      this.typesenseClient.collections(collectionName).documents(id).delete();
      this.logger.debug(`Removed ${type} ${id.substring(0, 7)} from search index`);
    } catch (error) {
      this.logger.error(`Error removing ${type} ${id.substring(0, 7)} from search index: ${error}`);
      return false;
    }

    return true;
  }

  async removeNote(noteId: string) {
    this.logger.debug(`Removing note ${noteId.substring(0, 7)} from search index`);

    this.typesenseClient.collections("notes").documents(noteId).delete();
  }

  async addNote(note: Note, userId: string) {
    this.logger.debug(`Adding note ${note.id.substring(0, 7)} to search index`);

    this.typesenseClient.collections("notes").documents().upsert({
      title: note.title,
      content: note.content
        .replace(/<p>/gm, ' ')
        .replace(/<br>/gm, ' ')
        .replace(/<[^>]*>?/gm, '')
        .replace(/&nbsp;/gm, ' '),
      id: note.id,
      userId: userId,
      notebookId: note.notebookId,
    });
  }
}
