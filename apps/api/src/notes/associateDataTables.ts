import { Logger } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { Note } from "@prisma/client";

/**
 * Prune data tables that are no longer referenced by a note's content.
 * Mirrors `associateDropdownInstances`: the editor stores each placement as
 * `<datatable tableid="..."></datatable>`, so any data table row for this note
 * whose id is absent from the saved content is soft-deleted.
 */
export async function associateDataTables(
  note: Note,
  prisma: PrismaService,
  logger: Logger,
) {
  logger.debug(`Pruning data tables for noteId ${note.id.substring(0, 7)}`);
  const noteContent = note.content ?? '';

  // Find all data table ids currently in the note.
  const tableRegex = /tableid="([^"]+)"/g;
  const tableIdsFound: string[] = [];
  let match: RegExpExecArray | null;
  while ((match = tableRegex.exec(noteContent)) !== null) {
    tableIdsFound.push(match[1]);
  }

  // Find all data tables already associated with the note.
  const tables = await prisma.dataTable.findMany({
    where: { noteId: note.id, deletedAt: null },
  });

  // Soft-delete any tables that are no longer in the note content — except
  // rows created in the last minute: a freshly inserted node autosaves once
  // with tableid="" before the NodeView writes the created id back, and that
  // save must not delete the row it is about to reference.
  const cutoff = new Date(Date.now() - 60 * 1000);
  const tablesToRemove = tables.filter(
    (table) => !tableIdsFound.includes(table.id) && table.createdAt < cutoff,
  );
  if (tablesToRemove.length > 0) {
    logger.debug(
      `Removing data tables ${tablesToRemove
        .map((t) => t.id.substring(0, 7))
        .join(", ")} for noteId ${note.id.substring(0, 7)}`,
    );
    await prisma.dataTable.updateMany({
      where: { id: { in: tablesToRemove.map((t) => t.id) } },
      data: { deletedAt: new Date() },
    });
  } else {
    logger.debug(`No data tables to remove for noteId ${note.id.substring(0, 7)}`);
  }
}
