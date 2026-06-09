import { Notebook } from '@/types/notebook';

// Walk the parentId chain upward from `notebookId`, returning notebooks ordered
// root -> ... -> the note's own notebook. Cycle-guarded.
export function getNotebookPath(
  notebookId: string | undefined,
  notebooks: Notebook[] | undefined,
): Notebook[] {
  if (!notebookId || !notebooks?.length) return [];
  const byId = new Map(notebooks.map((nb) => [nb.id, nb]));
  const chain: Notebook[] = [];
  const seen = new Set<string>();
  let currentId: string | null | undefined = notebookId;
  while (currentId && !seen.has(currentId)) {
    seen.add(currentId);
    const nb = byId.get(currentId);
    if (!nb) break;
    chain.unshift(nb); // prepend so result is root -> leaf
    currentId = nb.parentId;
  }
  return chain;
}

// Convenience: ordered breadcrumb titles, root -> leaf.
export function getNotebookPathSegments(
  notebookId: string | undefined,
  notebooks: Notebook[] | undefined,
): string[] {
  return getNotebookPath(notebookId, notebooks).map(
    (nb) => nb.title || 'Untitled Notebook',
  );
}

// Convenience: breadcrumb string "Root > Parent > Leaf".
export function getNotebookPathString(
  notebookId: string | undefined,
  notebooks: Notebook[] | undefined,
): string {
  return getNotebookPathSegments(notebookId, notebooks).join(' > ');
}
