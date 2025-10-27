import { PrismaClient } from "@prisma/client";
import Typesense from "typesense";
import { config } from "dotenv";
import { existsSync } from "fs";

// Load environment variables - try .env.local first, then .env, or use existing env vars
if (existsSync('.env.local')) {
  config({ path: '.env.local' });
} else if (existsSync('.env')) {
  config({ path: '.env' });
}

// Configure console logging level
const logLevel = process.env.LOG_LEVEL || 'log';
const originalConsoleLog = console.log;
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;
const originalConsoleDebug = console.debug;

// Override console methods based on log level
if (logLevel === 'error') {
  console.log = () => {};
  console.warn = () => {};
  console.debug = () => {};
} else if (logLevel === 'warn') {
  console.log = () => {};
  console.debug = () => {};
} else if (logLevel === 'log') {
  console.debug = () => {};
}

const main = async () => {
  const prisma = new PrismaClient();
  
  // Initialize Typesense client directly
  const typesenseClient = new Typesense.Client({
    nodes: [{
      host: process.env.TYPESENSE_HOST || "localhost",
      port: parseInt(process.env.TYPESENSE_PORT || "8108"),
      protocol: process.env.TYPESENSE_PROTOCOL || "http",
    }],
    apiKey: process.env.TYPESENSE_API_KEY || 'xyz',
  });

  try {
    // Get all notes from database
    const notes = await prisma.note.findMany();
    console.log(`Found ${notes.length} notes in database`);
    
    // Refresh Typesense index with all notes
    for (const note of notes) {
      // Get the userId for each note from the notebook
      const notebook = await prisma.notebook.findUnique({
        where: { id: note.notebookId },
        select: { userId: true }
      });
      
      if (notebook) {
        // Add note to Typesense index
        await typesenseClient.collections("notes").documents().upsert({
          title: note.title,
          content: note.content
            .replace(/<p>/gm, ' ')
            .replace(/<br>/gm, ' ')
            .replace(/<[^>]*>?/gm, '')
            .replace(/&nbsp;/gm, ' '),
          id: note.id,
          userId: notebook.userId,
        });
        
        console.log(`Added note ${note.id.substring(0, 7)} to search index`);
      }
    }
    
    console.log(`Successfully refreshed Typesense index with ${notes.length} notes`);
  } catch (error) {
    console.error('Error refreshing Typesense:', error);
  } finally {
    await prisma.$disconnect();
  }
};

main();