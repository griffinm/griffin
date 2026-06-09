import { Logger } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { Note } from "@prisma/client";

/**
 * Prune dropdown instances that are no longer referenced by a note's content.
 * Mirrors `associateTasks` / `associateQuestions`: the editor stores each
 * placement as `<dropdown ... instanceid="..."></dropdown>`, so any instance row
 * for this note whose id is absent from the saved content is soft-deleted.
 */
export async function associateDropdownInstances(
  note: Note,
  prisma: PrismaService,
  logger: Logger,
) {
  logger.debug(`Pruning dropdown instances for noteId ${note.id.substring(0, 7)}`);
  const noteContent = note.content ?? '';

  // Find all dropdown instance ids currently in the note.
  const instanceRegex = /instanceid="([^"]+)"/g;
  const instanceIdsFound: string[] = [];
  let match: RegExpExecArray | null;
  while ((match = instanceRegex.exec(noteContent)) !== null) {
    instanceIdsFound.push(match[1]);
  }

  // Find all instances already associated with the note.
  const instances = await prisma.dropdownInstance.findMany({
    where: { noteId: note.id, deletedAt: null },
  });

  // Soft-delete any instances that are no longer in the note content.
  const instancesToRemove = instances.filter(
    (instance) => !instanceIdsFound.includes(instance.id),
  );
  if (instancesToRemove.length > 0) {
    logger.debug(
      `Removing dropdown instances ${instancesToRemove
        .map((i) => i.id.substring(0, 7))
        .join(", ")} for noteId ${note.id.substring(0, 7)}`,
    );
    await prisma.dropdownInstance.updateMany({
      where: { id: { in: instancesToRemove.map((i) => i.id) } },
      data: { deletedAt: new Date() },
    });
  } else {
    logger.debug(`No dropdown instances to remove for noteId ${note.id.substring(0, 7)}`);
  }
}
