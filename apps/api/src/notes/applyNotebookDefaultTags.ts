import { Logger } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { Note } from "@prisma/client";

/**
 * Seed a freshly-created note with the default tags inherited from its notebook and
 * every ancestor notebook. Default tags are stored on `NotebookDefaultTag`; once seeded
 * they become ordinary `ObjectTag` rows, so per-note removal and tag loading work as usual.
 *
 * Mirrors `associateDropdownInstances` / `associateTasks`: a small, prisma-only helper
 * called from the note service so the service itself needs no extra dependencies.
 */
export async function applyNotebookDefaultTags(
  note: Note,
  prisma: PrismaService,
  logger: Logger,
) {
  logger.debug(`Applying notebook default tags for noteId ${note.id.substring(0, 7)}`);

  // Walk the parent chain upward from the note's notebook, collecting notebook ids.
  const notebookIds: string[] = [];
  let currentId: string | null = note.notebookId;
  while (currentId) {
    notebookIds.push(currentId);
    const notebook = await prisma.notebook.findUnique({
      where: { id: currentId },
      select: { parentId: true },
    });
    currentId = notebook?.parentId ?? null;
  }

  // Collect the distinct default tag ids across the notebook ancestry.
  const defaults = await prisma.notebookDefaultTag.findMany({
    where: { notebookId: { in: notebookIds } },
    select: { tagId: true },
  });
  const tagIds = [...new Set(defaults.map(d => d.tagId))];
  if (tagIds.length === 0) {
    logger.debug(`No default tags to apply for noteId ${note.id.substring(0, 7)}`);
    return;
  }

  // Skip any tag already associated with the note (1 instance each), then create the rest.
  const existing = await prisma.objectTag.findMany({
    where: { objectType: 'note', objectId: note.id, tagId: { in: tagIds } },
    select: { tagId: true },
  });
  const existingSet = new Set(existing.map(ot => ot.tagId));
  const toCreate = tagIds.filter(tagId => !existingSet.has(tagId));

  if (toCreate.length > 0) {
    await prisma.objectTag.createMany({
      data: toCreate.map(tagId => ({ tagId, objectType: 'note', objectId: note.id })),
    });
    logger.debug(
      `Applied ${toCreate.length} default tag(s) to noteId ${note.id.substring(0, 7)}`,
    );
  }
}
