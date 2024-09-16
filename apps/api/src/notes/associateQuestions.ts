import { Logger } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { Note } from "@prisma/client";

export async function associateQuestions(
  note: Note,
  userId: string,
  prisma: PrismaService,
  logger: Logger
) {
  logger.debug(`Pruning questions for noteId ${note.id.substring(0, 7)}`);
  const noteContent = note.content;
  // Find all of the questions currently in the note
  const questionRegex = /<question\squestionid="([^"]+)"/g
  const questionsIdsFound = []
  let match;
  console.log(noteContent);
  while ((match = questionRegex.exec(noteContent)) !== null) {
    questionsIdsFound.push(match[1]);
  }
  console.log(questionsIdsFound);

  // Find all of the questions already associated with the note
  const questions = await prisma.question.findMany({
    where: {
      noteId: note.id,
      deletedAt: null,
      userId,
      note: {
        deletedAt: null,
      },
    },
  });

  // Remove any questions that are not in the note
  const questionsToRemove = questions.filter((question) => !questionsIdsFound.includes(question.id));
  if (questionsToRemove.length > 0) {
    logger.debug(`Removing questions ${questionsToRemove.map((question) => question.id.substring(0, 7)).join(", ")} for noteId ${note.id.substring(0, 7)}`);
    await prisma.question.updateMany({
      where: {
        id: {
          in: questionsToRemove.map((question) => question.id),
        },
      },
      data: {
        deletedAt: new Date(),
      },
    });
  } else {
    logger.debug(`No questions to remove for noteId ${note.id.substring(0, 7)}`);
  }
}
