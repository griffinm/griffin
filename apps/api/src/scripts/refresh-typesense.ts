import { PrismaClient } from "@prisma/client";
import Typesense from "typesense";
import { config } from "dotenv";
import { existsSync } from "fs";
import { noteSchema, taskSchema, tagSchema } from "../search/schemas";

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
    // Delete existing collections
    console.log('Deleting existing collections...');
    try {
      await typesenseClient.collections('notes').delete();
      console.log('Deleted notes collection');
    } catch (e) {
      console.log('Notes collection does not exist');
    }
    
    try {
      await typesenseClient.collections('tasks').delete();
      console.log('Deleted tasks collection');
    } catch (e) {
      console.log('Tasks collection does not exist');
    }
    
    try {
      await typesenseClient.collections('tags').delete();
      console.log('Deleted tags collection');
    } catch (e) {
      console.log('Tags collection does not exist');
    }
    
    // Create collections with new schema
    console.log('Creating collections with updated schema...');
    await typesenseClient.collections().create(noteSchema);
    console.log('Created notes collection');
    
    await typesenseClient.collections().create(taskSchema);
    console.log('Created tasks collection');
    
    await typesenseClient.collections().create(tagSchema);
    console.log('Created tags collection');
    
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
    
    // Get all tasks from database
    const tasks = await prisma.task.findMany();
    console.log(`Found ${tasks.length} tasks in database`);
    
    // Refresh Typesense index with all tasks
    for (const task of tasks) {
      const taskDoc: any = {
        id: task.id,
        userId: task.userId,
        title: task.title,
        description: task.description || '',
        status: task.status,
        priority: task.priority,
      };
      
      // Only include dueDate if it exists
      if (task.dueDate) {
        taskDoc.dueDate = Math.floor(task.dueDate.getTime() / 1000);
      }
      
      await typesenseClient.collections("tasks").documents().upsert(taskDoc);
      console.log(`Added task ${task.id.substring(0, 7)} to search index`);
    }
    
    // Get all tags from database
    const tags = await prisma.tag.findMany();
    console.log(`Found ${tags.length} tags in database`);
    
    // Refresh Typesense index with all tags
    for (const tag of tags) {
      await typesenseClient.collections("tags").documents().upsert({
        id: tag.id,
        userId: tag.userId,
        name: tag.name,
      });
      console.log(`Added tag ${tag.id.substring(0, 7)} to search index`);
    }
    
    console.log(`\nSuccessfully refreshed Typesense index:`);
    console.log(`- ${notes.length} notes`);
    console.log(`- ${tasks.length} tasks`);
    console.log(`- ${tags.length} tags`);
  } catch (error) {
    console.error('Error refreshing Typesense:', error);
  } finally {
    await prisma.$disconnect();
  }
};

main();