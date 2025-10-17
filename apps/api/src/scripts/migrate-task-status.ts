import { PrismaClient, TaskStatus } from "@prisma/client";
import { config } from "dotenv";

// Load environment variables from .env.local
config({ path: '.env.local' });

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
  
  try {
    console.log('Starting task status migration...');
    
    // Get all tasks that have a completedAt value
    const completedTasks = await prisma.$queryRaw`
      SELECT id, completed_at, created_at, updated_at
      FROM tasks 
      WHERE completed_at IS NOT NULL
    ` as Array<{ id: string; completed_at: Date; created_at: Date; updated_at: Date }>;
    
    console.log(`Found ${completedTasks.length} completed tasks to migrate`);
    
    // Get all tasks that don't have a completedAt value (should be TODO or IN_PROGRESS)
    const incompleteTasks = await prisma.$queryRaw`
      SELECT id, created_at, updated_at
      FROM tasks 
      WHERE completed_at IS NULL
    ` as Array<{ id: string; created_at: Date; updated_at: Date }>;
    
    console.log(`Found ${incompleteTasks.length} incomplete tasks to migrate`);
    
    let migratedCount = 0;
    
    // Migrate completed tasks
    for (const task of completedTasks) {
      try {
        // Update the task status to COMPLETED
        await prisma.$executeRaw`
          UPDATE tasks 
          SET status = 'COMPLETED'::task_status
          WHERE id = ${task.id}
        `;
        
        // Create status history entries
        // First, create the initial TODO status at creation time
        await prisma.$executeRaw`
          INSERT INTO task_status_history (id, task_id, status, changed_at)
          VALUES (gen_random_uuid(), ${task.id}, 'TODO'::task_status, ${task.created_at})
        `;
        
        // Then create the COMPLETED status at the completion time
        await prisma.$executeRaw`
          INSERT INTO task_status_history (id, task_id, status, changed_at)
          VALUES (gen_random_uuid(), ${task.id}, 'COMPLETED'::task_status, ${task.completed_at})
        `;
        
        migratedCount++;
        console.log(`Migrated completed task ${task.id.substring(0, 7)}...`);
        
      } catch (error) {
        console.error(`Error migrating completed task ${task.id}:`, error);
      }
    }
    
    // Migrate incomplete tasks (set to TODO and create initial history)
    for (const task of incompleteTasks) {
      try {
        // Update the task status to TODO
        await prisma.$executeRaw`
          UPDATE tasks 
          SET status = 'TODO'::task_status
          WHERE id = ${task.id}
        `;
        
        // Create initial status history entry
        await prisma.$executeRaw`
          INSERT INTO task_status_history (id, task_id, status, changed_at)
          VALUES (gen_random_uuid(), ${task.id}, 'TODO'::task_status, ${task.created_at})
        `;
        
        migratedCount++;
        console.log(`Migrated incomplete task ${task.id.substring(0, 7)}...`);
        
      } catch (error) {
        console.error(`Error migrating incomplete task ${task.id}:`, error);
      }
    }
    
    console.log(`Successfully migrated ${migratedCount} tasks`);
    console.log('Task status migration completed!');
    console.log('Note: completed_at column is preserved for backward compatibility.');
    
  } catch (error) {
    console.error('Error during task status migration:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
};

// Handle script execution
if (require.main === module) {
  main()
    .then(() => {
      console.log('Migration script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Migration script failed:', error);
      process.exit(1);
    });
}

export default main;
