import { Logger } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { Note } from "@prisma/client";


export async function associateTasks(note: Note, userId: string, prisma: PrismaService, logger: Logger) {
  logger.debug(`Pruning tasks for noteId ${note.id.substring(0, 7)}`);
  const noteContent = note.content;

  // Find all of the tasks currently in the note
  const taskRegex = /<task\s+taskid="([^"]*)">/g
  const tasksIdsFound = []
  let match;
  while ((match = taskRegex.exec(noteContent)) !== null) {
    tasksIdsFound.push(match[1]);
  }

  // Find all of the tasks already associated with the note
  const tasks = await prisma.task.findMany({
    where: {
      noteId: note.id,
      deletedAt: null,
    },
  });

  // Remove any tasks that are not in the note
  const tasksToRemove = tasks.filter((task) => !tasksIdsFound.includes(task.id));
  if (tasksToRemove.length > 0) {
    logger.debug(`Removing tasks ${tasksToRemove.map((task) => task.id).join(", ")} for noteId ${note.id.substring(0, 7)}`);
    await prisma.task.updateMany({
      where: {
        id: {
          in: tasksToRemove.map((task) => task.id),
        },
      },
      data: {
        deletedAt: new Date(),
      },
    });
  } else {
    logger.debug(`No tasks to remove for noteId ${note.id.substring(0, 7)}`);
  }
}

