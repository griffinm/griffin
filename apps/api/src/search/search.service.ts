import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import Typesense from "typesense";
import { noteSchema, taskSchema } from "./schemas";
import { Note, Task } from "@prisma/client";
import { SearchResultsDto, NoteResult } from "./dto/search-results.dto";
import { PrismaService } from "../prisma/prisma.service";

const collectionNames = {
  note: 'notes',
  task: 'tasks',
}

@Injectable()
export class SearchService implements OnModuleInit {
  private readonly logger = new Logger(SearchService.name);
  private typesenseClient;

  constructor(private prisma: PrismaService) {}

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
  }
  
  async search(query: string, userId: string): Promise<SearchResultsDto> {
    
    const searchParams = {
      q: query,
      query_by: 'title, content',
      num_typos: 4,
      typo_tokens_threshold: 1,
      per_page: 10,
      filter_by: `userId:${userId}`,
      highlight_affix_num_tokens: 4,
      
    }
    this.logger.debug(`Searching for ${JSON.stringify(searchParams)}`);

    const result = await this.typesenseClient.collections(["notes"]).documents().search(searchParams);

    const searchResults = new SearchResultsDto();
    searchResults.query = query;
    searchResults.hits = result.hits.length;
    searchResults.noteResults = result.hits.map((hit) => {
      const noteResult = new NoteResult();
      noteResult.id = hit.document.id;
      noteResult.title = hit.document.title;
      noteResult.matchedTokens = hit.matched_tokens;
      noteResult.snippet = hit.highlights[0]?.snippet;
      noteResult.matchedField = hit.highlights[0]?.field;
      return noteResult;
    });

    return searchResults;
  }

  public async rebuildIndex() {
    this.logger.debug(`Rebuilding search index`);
    
    this.logger.debug(`Deleting collections ${noteSchema.name} and ${taskSchema.name}`);
    await this.typesenseClient.collections(collectionNames.note).delete();
    await this.typesenseClient.collections(collectionNames.task).delete();
    this.logger.debug(`Creating collections ${noteSchema.name} and ${taskSchema.name}`);
    await this.typesenseClient.collections().create(noteSchema);
    await this.typesenseClient.collections().create(taskSchema);

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

    await this.createCollections();
    return true;
  }

  public async addObject({
    type,
    id,
    object,
    userId,
  }: {
    type: 'note' | 'task';
    id: string;
    object: Note | Task;
    userId: string,
  }): Promise<boolean> {
    this.logger.debug(`Adding ${type} ${id.substring(0, 7)} to search index`);

    const collectionName = collectionNames[type];

    let params:any = { userId };
    if (type === 'task') {
      const task = (object as Task)
      params.dueDate = task.dueDate ? Math.floor(task.dueDate.getTime() / 1000) : null
      params.status = task.status
      params.title = task.title
      params.description = task.description
      params.priority = task.priority
    } else {
      // This is a note
      const note = (object as Note)
      params.title = note.title
      params.content = note.content
    }

    this.typesenseClient.collections(collectionName).documents().upsert(params);

    return true;
  }

  public async removeObject({
    type,
    id,
  }: {
    type: 'note' | 'task';
    id: string;
  }): Promise<boolean> {
    this.logger.debug(`Removing ${type} ${id.substring(0, 7)} from search index`);
    const collectionName = collectionNames[type];
    this.typesenseClient.collections(collectionName).documents(id).delete();
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
    });
  }
}
