import { Notebook } from "@prisma/client";

export function findChildrenForParent(
  parent: Notebook,
  allNotebooks: Notebook[],
): Notebook[] {
  return allNotebooks.filter((notebook) => notebook.parentId === parent.id);
}
