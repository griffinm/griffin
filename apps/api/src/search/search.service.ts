import { Injectable } from "@nestjs/common";
import { Note } from "@prisma/client";
import Typesense from "typesense";

let noteSchema = {
  name: "notes",
  fields: [
    {
      name: "title",
      type: "string",
    },
    {
      name: "content",
      type: "string",
    },

  ],
};

@Injectable()
export class SearchService {
  private typesenseClient;

  constructor() {
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

    if (!existingSchemaNames.includes(noteSchema.name)) {
      await this.typesenseClient.collections().create(noteSchema);
    }
  }
  
  async addNote(note: Note) {
    this.typesenseClient.collections("notes").documents().create({
      title: note.title,
      content: note.content,
    });
  }
}
