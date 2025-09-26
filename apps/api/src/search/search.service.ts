import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import Typesense from "typesense";
import { noteSchema, taskSchema } from "./schemas";
import { Note } from "@prisma/client";
import { SearchResultsDto, NoteResult } from "./dto/search-results.dto";

@Injectable()
export class SearchService implements OnModuleInit {
  private readonly logger = new Logger(SearchService.name);
  private typesenseClient;

  async onModuleInit() {
    this.logger.log('Initializing search service');
    this.typesenseClient = new Typesense.Client({
      nodes: [{
        host: "localhost",
        port: 8108,
        protocol: "http",
      }],
      apiKey: 'xyz',
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
