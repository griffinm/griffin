# Design: Sortable / Filterable Data Tables in the Editor

**Status:** Proposed
**Author:** Griffin (with Claude)
**Date:** 2026-06-10
**Branch:** `sortable-table`

## 1. Summary

Add a new **data table** to the note editor: a structured, typed table whose columns can be
**sorted** and whose rows can be **filtered**. It is a *new editor node*, separate from the
existing prose table — the two coexist.

This document is the design of record. It is grounded in the existing plugin conventions
(`docs/editor-plugins.md`) and closely mirrors the **Dropdown plugin**, which is the nearest
precedent for an interactive, backend-backed editor node.

### Decisions locked in

| # | Decision | Choice |
|---|----------|--------|
| 1 | Extend prose table vs. new node | **New `dataTable` node** (prose table untouched) |
| 2 | Where structured data lives | **Backend DB record**; the node stores only a `tableId` |
| 3 | Sort/filter persistence | **Persisted per-note, shared by all viewers**, applied **non-destructively** |
| 4 | Cell content | **Typed scalar values** — `text \| number \| date \| select` |

## 2. Why keep both tables

Sorting and filtering are only meaningful over *typed, columnar* data ("sort by date
descending", "show rows where Status = Done"). The existing prose table
(`@tiptap/extension-table` + `mui-tiptap`'s `TableImproved`) has **no column identity and no
cell types** — sorting it would be string-only and unreliable, and physically reordering rows
would mean mutating the ProseMirror document (fighting column-resize, bumping the note version
on every sort, and breaking when cells hold rich content or other custom nodes).

So we keep two distinct tools:

| | Prose table (existing) | Data table (new) |
|---|---|---|
| Node | stock `table`/`tableRow`/`tableCell` | new `dataTable` atom node |
| Purpose | free-form layout, mixed prose | structured records |
| Cell content | arbitrary rich text / other nodes | typed scalar values |
| Sort / filter | ✗ | ✓ |
| Stored in | `Note.content` HTML | `data_tables` DB row (node holds `tableId`) |
| Insert | toolbar `Add table`, `@ → Table` | toolbar button, `@ → Data Table` |

The prose table is **not modified** by this work. A future "convert prose table → data table"
affordance is a possible follow-up (out of scope here).

## 3. Goals / Non-goals

**Goals (v1)**
- Insert a data table from the toolbar and the `@` menu.
- Columns with a name and a type: `text | number | date | select` (select has a fixed option list).
- Add / remove / rename columns and change a column's type; add / remove rows; edit cells inline.
- Sort by a single column (asc/desc) with type-correct comparison.
- Filter rows with per-column conditions (AND-combined in v1).
- Sort + filter **configuration persists** with the table and is shared across viewers of the note.
- Round-trips through copy/paste and is pruned when deleted (reusing the Dropdown machinery).

**Non-goals (v1)** — explicitly deferred: formulas/computed columns, relations between tables,
rich content inside cells, cross-note shared table definitions, server-side pagination,
multi-column sort, grouping, column reordering, and indexing table contents into Typesense
search.

## 4. Architecture overview

Follows the **backend-backed-by-id** pattern (`docs/editor-plugins.md`), identical in shape to
Dropdown:

```
<datatable tableid="uuid"></datatable>          ← lives in Note.content (atom, empty)
        │
        │ tableId
        ▼
data_tables row { columns, rows, sort, filters } ← all structured data + view state
        │
        ▼
React NodeView (Mantine Table) — sort/filter applied client-side over fetched rows
```

Because the node tag carries only a `tableId`, `Note.content` stays lean:
- **Search stays clean automatically** — `search.service.ts` strips HTML tags, and the
  `<datatable>` tag is empty, so no cell text pollutes Typesense.
- **Previews stay clean** — `buildNotePreview()` sees an empty tag and spends none of its
  300-char budget on table data.
- **Note version churn is minimal** — `notes.service.update()` only bumps `version` when
  `content` changes. The *initial insert* writes `tableid="…"` once (one bump); subsequent cell,
  sort, and filter edits write to the `data_tables` row via its own API and **do not** touch
  `content`, so they don't bump the note version.

### Data flow for sort/filter (decision #3)

The persisted `sort` and `filters` are the *configuration*. The stored `rows` keep their
insertion order — sorting/filtering is applied to the **rendered view only**, never to stored
order. Every viewer who opens the note sees the same configured sort/filter.

## 5. Data model

A data table is **unique per placement** (its rows *are* the content; there is nothing reusable
across notes). So — unlike Dropdown's definition+instance split — we need a **single record per
placement**. Columns/rows/view-state are stored as `Json` on that one row; this is simple,
adequate for the expected table sizes, and keeps `Note.content` lean.

### Prisma — `apps/api/prisma/schema.prisma`

```prisma
model DataTable {
  id        String    @id @default(uuid()) @map("id")
  noteId    String    @map("note_id")
  userId    String    @map("user_id")
  columns   Json      @map("columns")               // DataTableColumn[]
  rows      Json      @map("rows")                   // DataTableRow[]
  sort      Json?     @map("sort")                   // DataTableSort | null
  filters   Json      @default("[]") @map("filters") // DataTableFilter[]
  createdAt DateTime  @default(now()) @map("created_at")
  updatedAt DateTime  @updatedAt @map("updated_at")
  deletedAt DateTime? @map("deleted_at")
  note      Note      @relation(fields: [noteId], references: [id])
  user      User      @relation(fields: [userId], references: [id])

  @@index([noteId])
  @@index([userId])
  @@map("data_tables")
}
```

Add the back-relations (mirroring `dropdownInstances DropdownInstance[]`):
- `Note` model: `dataTables DataTable[]`
- `User` model: `dataTables DataTable[]`

Apply with `npm run prisma:push` (project convention — there is no migrations folder).

### Shared TS types — `apps/ui2/src/types/dataTable.ts`

```ts
export type ColumnType = 'text' | 'number' | 'date' | 'select';

export interface DataTableColumn {
  id: string;            // stable uuid, referenced by cells/sort/filters
  name: string;
  type: ColumnType;
  options?: string[];    // for type === 'select' with custom (typed-in) options
  dropdownId?: string;   // for type === 'select': source options from a reusable
                         // Dropdown definition instead; cells then store the
                         // option id, so Dropdown renames propagate to cells
  width?: number;        // optional, reserved for column resize (future)
}

// Stored value by type: text -> string | number -> number | date -> ISO string | select -> string
export type CellValue = string | number | null;

export interface DataTableRow {
  id: string;                          // stable uuid
  cells: Record<string, CellValue>;    // columnId -> value
}

export interface DataTableSort {
  columnId: string;
  direction: 'asc' | 'desc';
}

export type FilterOp =
  | 'contains' | 'equals' | 'notEquals'
  | 'gt' | 'lt' | 'gte' | 'lte'
  | 'isEmpty' | 'isNotEmpty';

export interface DataTableFilter {
  columnId: string;
  op: FilterOp;
  value: CellValue;
}

export interface DataTable {
  id: string;
  noteId: string;
  userId: string;
  columns: DataTableColumn[];
  rows: DataTableRow[];
  sort: DataTableSort | null;
  filters: DataTableFilter[];
  createdAt: string;
  updatedAt: string;
}
```

A new table is seeded with a small default (e.g. 3 `text` columns × 3 empty rows, mirroring the
prose table's `insertTable({ rows: 3, cols: 3 })` default).

## 6. Backend API

Mirror the dropdowns module exactly: `apps/api/src/data-tables/` with
`data-tables.module.ts`, `data-tables.controller.ts`, `data-tables.service.ts`, and a `dto/`
folder. Register `DataTablesModule` in the app module and import `PrismaModule` +
`forwardRef(AuthModule)` + `forwardRef(UsersModule)` like `dropdowns.module.ts`.

### Routes (`@UseGuards(AuthGuard)`, `userId` from `request.user.id`)

| Verb | Path | Body DTO | Returns |
|------|------|----------|---------|
| POST | `/data-tables` | `NewDataTableDto { noteId, columns?, rows? }` | `DataTableEntity` |
| POST | `/data-tables/clone` | `CloneDataTableDto { noteId, sourceId }` | `DataTableEntity` |
| GET | `/data-tables/:id` | — | `DataTableEntity` |
| PATCH | `/data-tables/:id` | `UpdateDataTableDto { columns?, rows?, sort?, filters? }` | `DataTableEntity` |
| DELETE | `/data-tables/:id` | — | `{ id: string }` |

- **`POST /data-tables`** — creates a row tied to `noteId` + `userId`; if no `columns`/`rows`
  given, seeds the default 3×3. (Called lazily by the NodeView on first mount.)
- **`POST /data-tables/clone`** — deep-copies `columns`/`rows`/`sort`/`filters` from `sourceId`
  (ownership-checked) into a new row for `noteId`, regenerating row ids. Used by copy/paste so a
  duplicated table is a real, independent copy rather than an empty one.
- **`PATCH /data-tables/:id`** — partial update. v1 uses whole-table PATCH (the JSON arrays are
  small); granular row/column endpoints are a scale follow-up.
- **`DELETE`** — soft-delete (`deletedAt = new Date()`), per the Dropdown convention. Never hard-delete.

### Service (`DataTablesService`, mirrors `DropdownsService`)

`create`, `clone`, `getById(id, userId)`, `update(id, userId, dto)`, `deleteById(id, userId)`.
Ownership is checked directly against `DataTable.userId` (`deletedAt: null`) — simpler than
Dropdown because we don't need the definition/option machinery (`ensureSingleDefault`, etc.).
`getById` throws `NotFoundException` when missing or not owned.

### Save-path integration — `apps/api/src/notes/notes.service.ts`

Add an orphan-pruner alongside the existing ones in the fire-and-forget block of `update()`
(currently lines ~177–180):

```ts
this.searchService.addNote(updatedNote, userId);
associateTasks(updatedNote, userId, this.prisma, this.logger);
associateQuestions(updatedNote, userId, this.prisma, this.logger);
associateDropdownInstances(updatedNote, this.prisma, this.logger);
associateDataTables(updatedNote, this.prisma, this.logger);   // ← new
```

`apps/api/src/notes/associateDataTables.ts` mirrors `associateDropdownInstances.ts`:
scan `note.content` with `/tableid="([^"]+)"/g`, fetch live `DataTable` rows for the note, and
soft-delete any whose id is no longer referenced. (`tableId`s are uuids, so the unescaped regex
is safe.) Like the others, this is fire-and-forget — pruning is eventually-consistent, which is
fine.

## 7. Frontend

### 7.1 API client — `apps/ui2/src/api/dataTablesApi.ts`

Use the shared `baseClient` (axios, `baseURL: '/api'`, `withCredentials: true`). Mirror
`dropdownsApi.ts`:

```ts
fetchDataTable(id)                 // GET    /data-tables/:id
createDataTable(data)              // POST   /data-tables          { noteId, columns?, rows? }
cloneDataTable(data)               // POST   /data-tables/clone    { noteId, sourceId }
updateDataTable(id, patch)         // PATCH  /data-tables/:id      { columns?, rows?, sort?, filters? }
deleteDataTable(id)                // DELETE /data-tables/:id
```

### 7.2 React Query hooks — `apps/ui2/src/hooks/useDataTables.ts`

Mirror `useDropdowns.ts` (query keys `['dataTable', id]`; `staleTime` 5 min; `enabled: !!id`):

- `useDataTable(id)` — `useQuery(['dataTable', id], …)`
- `useCreateDataTable()` — `onSuccess: setQueryData(['dataTable', dt.id], dt)`
- `useCloneDataTable()` — same caching
- `useUpdateDataTable()` — `onSuccess: setQueryData(['dataTable', dt.id], dt)`
- `useDeleteDataTable()` — `onSuccess: removeQueries(['dataTable', id])`

Cell/sort/filter writes go through `useUpdateDataTable`, **debounced** (~400–500 ms, matching the
note autosave cadence) so rapid typing doesn't flood the API. An optimistic `setQueryData`
keeps the grid responsive between debounced flushes.

### 7.3 Editor plugin — `apps/ui2/src/components/Editor/plugins/DataTable/`

Three files, per the recipe in `docs/editor-plugins.md`.

**`Extension.ts`** — block atom node, modeled on `Dropdown/Extension.ts`:

```ts
declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    dataTable: { setDataTable: () => ReturnType };
  }
}

export const DataTableExtension = Node.create<DataTableOptions>({
  name: 'dataTable',
  group: 'block',
  atom: true,
  draggable: true,
  addOptions() { return { noteId: undefined }; },
  addAttributes() {
    return {
      tableId:   { default: '' },
      cloneFrom: { default: '' }, // transient: set by dedup so a paste clones, not blanks
    };
  },
  parseHTML()  { return [{ tag: 'datatable' }]; },
  renderHTML({ HTMLAttributes }) { return ['datatable', mergeAttributes(HTMLAttributes)]; },
  addNodeView() { return ReactNodeViewRenderer(DataTableComponent); },
  addCommands() {
    return { setDataTable: () => ({ chain }) =>
      chain().insertContent({ type: this.name, attrs: { tableId: '', cloneFrom: '' } }).run() };
  },
  addProseMirrorPlugins() { /* dedup, see below */ },
});
```

**Copy/paste dedup** — adapt Dropdown's `appendTransaction` plugin. When a duplicate `tableId`
is found, instead of just blanking it, set `cloneFrom` to the old id and blank `tableId`:

```ts
tr.setNodeMarkup(pos, undefined, { ...node.attrs, tableId: '', cloneFrom: node.attrs.tableId });
```

This is the one intentional divergence from Dropdown (whose pasted instances reset to default).
A pasted data table should be a real, independent copy of its data.

**`Component.tsx`** — `NodeViewWrapper` (block) with an inner
`<div contentEditable={false} data-drag-handle>`; reads `noteId` from extension options like
Dropdown does. Lazy create/clone on mount with a `createdRef` guard:

```ts
useEffect(() => {
  if (tableId || createdRef.current || !noteId) return;
  createdRef.current = true;
  const run = cloneFrom
    ? cloneDataTable.mutateAsync({ noteId, sourceId: cloneFrom })
    : createDataTable.mutateAsync({ noteId });
  run.then((dt) => updateAttributes({ tableId: dt.id, cloneFrom: '' }));
}, [tableId, cloneFrom, noteId]);
```

Then `useDataTable(tableId)` fetches the row and renders a **Mantine `Table`**
(`Table.Thead/Tbody/Tr/Th/Td`, with `highlightOnHover`, `withTableBorder`, `stickyHeader`).

**`MenuItem.tsx`** — `MenuButton` + `useRichTextEditorContext`, gated on `noteId`:

```tsx
export const DataTableMenuItem = ({ noteId }: { noteId?: string }) => {
  const editor = useRichTextEditorContext();
  return <MenuButton IconComponent={IconDatabase} tooltipLabel="Data table"
    onClick={() => editor?.chain().focus().setDataTable().run()} />;
};
```

No preemptive backend call is needed (unlike Dropdown, which must pick a definition) — the
NodeView's lazy-create handles it, so both the toolbar and the `@` menu just insert an empty
node.

### 7.4 Sort / filter UI (reuse the Tasks pattern)

Reuse the proven client-side approach from `components/tasks/`:
- **Filter bar** — a `TasksFilters`-style row (`flex flex-wrap items-center gap-3`) of Mantine
  controls chosen per column type: `Input` (text `contains`), `NumberInput`/range (number),
  `DatePickerInput` (date), `MultiSelect` (select `equals`). Filters AND-combine in v1.
- **Sort** — clickable column headers cycle `none → asc → desc`; the active state writes
  `{ columnId, direction }` to the table's `sort`.
- **Comparators by type** — `number`: numeric; `date`: `Date.parse` numeric; `text`/`select`:
  `localeCompare`. Empty/null values sort last.
- **Application** — `useMemo` over fetched `rows` → apply `filters` then `sort` for rendering
  only (stored order untouched). Same shape as `QuestionsView`'s `useMemo` sort.

### 7.5 Inline cell editing

Per-cell editor by column type (text input / number input / date picker / select), following
`TaskRow`'s `persist()` pattern: update local state → debounced `updateDataTable` PATCH with the
new `rows` → optimistic `setQueryData`. Add/remove row and add/remove/configure column controls
PATCH `columns`/`rows` the same way. A column-config popover edits name, type, and (for `select`)
the option list. Changing a column's type best-effort coerces existing cell values (e.g.
text→number parses, falling back to null).

### 7.6 Edit vs. view

There is no global read-only mode in this editor — each node manages local state (Prompt/Task
precedent). The data table:
- **View:** read-only Mantine table with sortable headers + a compact filter summary; optionally
  collapse to the first N rows with an "X more" toggle (Prompt's collapsed-header idea).
- **Edit:** inline-editable cells, add/remove row & column controls, and the column-config popover.

## 8. Editor registration — `apps/ui2/src/components/Editor/Editor.tsx`

The extension needs `noteId`, so register it in the **`useMemo`** (not `baseExtensions`), exactly
like Dropdown (current lines ~115–118):

```ts
const extensions = useMemo(
  () => [
    ...baseExtensions,
    DropdownExtension.configure({ noteId }),
    DataTableExtension.configure({ noteId }),   // ← new
  ],
  [noteId],
);
```

Add the toolbar button next to the other custom items (current lines ~319–322), gated on `noteId`:

```tsx
<TaskMenuItem />
{noteId && <DropdownMenuItem noteId={noteId} />}
{noteId && <DataTableMenuItem noteId={noteId} />}   // ← new
<QuestionMenuItem />
<PromptMenuItem />
```

Add the `@`-menu entry in `plugins/NoteLink/ActionMenuList.tsx` (`EDITOR_ACTIONS`, lines ~27–34)
— use an icon distinct from the prose table's `IconTable` so the two are visually
distinguishable:

```ts
{ id: 'dataTable', label: 'Data Table', Icon: IconDatabase },
```

And handle it in `plugins/NoteLink/AtMenuList.tsx` (`handleActionSelect` switch, lines ~52–91),
as a direct insert like `task` (the NodeView lazy-creates the backing row):

```ts
case 'dataTable':
  editor.chain().focus().insertContentAt(range, { type: 'dataTable' }).run();
  break;
```

## 9. Styling

Add data-table styles to `apps/ui2/src/components/Editor/styles.scss` alongside the existing
plugin styles, using Mantine CSS variables (`var(--mantine-color-*)`) and the project's Tailwind
conventions, so the table renders consistently in both the editor and `HtmlPreview`.

## 10. Risks & edge cases

- **Whole-table PATCH is last-write-wins.** Two tabs editing the same table can clobber each
  other. Acceptable for a single-user app; revisit with granular row endpoints if needed.
- **Scale.** All rows in one JSON blob + client-side sort/filter is fine into the low thousands
  of rows. Beyond that, move to relational rows + server-side pagination (mirroring
  `useInfiniteTasksByStatus`). Flagged as a non-goal for v1.
- **Orphan pruning is fire-and-forget** (like Dropdown). A `DataTable` row lingers briefly after
  its node is deleted, then `associateDataTables` soft-deletes it on next save. Harmless.
- **Clone-on-paste** must regenerate row ids and is the deliberate divergence from Dropdown's
  reset-to-default semantics — call this out in code comments.
- **Column type changes** can't always cleanly coerce values; coerce best-effort and null out
  what doesn't fit, rather than dropping data silently — surface a small confirmation.
- **Initial-insert version bump:** writing `tableid` the first time changes `content` and bumps
  `Note.version` once. This is expected and acceptable; later edits don't bump it.

## 11. Implementation phases

1. **Schema + types** — `DataTable` model + relations; `prisma:push`; `types/dataTable.ts`.
2. **Backend** — `data-tables` module (service/controller/dto/module), app-module registration,
   `associateDataTables` wired into `notes.service.update`.
3. **Frontend data layer** — `dataTablesApi.ts` + `useDataTables.ts`.
4. **Read-only node** — `DataTable/{Extension,Component,MenuItem}.tsx` rendering a Mantine table
   from a fetched row; lazy create-on-mount; register in `Editor.tsx` + toolbar + `@` menu.
5. **Editing** — inline cells, add/remove rows & columns, column-config popover (debounced PATCH).
6. **Sort + filter** — headers + filter bar, persisted to `sort`/`filters`, applied client-side.
7. **Copy/paste + pruning** — dedup `appendTransaction` with clone semantics; verify orphan prune.
8. **Polish + docs** — collapsed view, `styles.scss`, and add a DataTable entry to
   `docs/editor-plugins.md`.

## 12. Open questions (product calls; v1 defaults assumed)

- Multi-column sort? *(v1: single column.)*
- Filter combinator — AND vs OR / mixed? *(v1: AND.)*
- Expected max rows per table — does v1 need pagination? *(v1: assume small, client-side.)*
- Should data-table contents be searchable in Typesense? *(v1: no; index as a follow-up.)*
- Column reordering / resizing in v1? *(v1: no; `width` reserved on the column type.)*

## 13. Files at a glance

**Add**
- `apps/ui2/src/components/Editor/plugins/DataTable/{Extension,Component,MenuItem}.tsx`
- `apps/ui2/src/api/dataTablesApi.ts`
- `apps/ui2/src/hooks/useDataTables.ts`
- `apps/ui2/src/types/dataTable.ts`
- `apps/api/src/data-tables/{data-tables.module,data-tables.controller,data-tables.service}.ts`
- `apps/api/src/data-tables/dto/*.ts`
- `apps/api/src/notes/associateDataTables.ts`

**Modify**
- `apps/api/prisma/schema.prisma` — `DataTable` model + `Note`/`User` relations
- `apps/api/src/notes/notes.service.ts` — call `associateDataTables` in `update()`
- `apps/api/src/app.module.ts` (or equivalent) — register `DataTablesModule`
- `apps/ui2/src/components/Editor/Editor.tsx` — register extension + toolbar button
- `apps/ui2/src/components/Editor/plugins/NoteLink/ActionMenuList.tsx` — `@` action
- `apps/ui2/src/components/Editor/plugins/NoteLink/AtMenuList.tsx` — `@` handler
- `apps/ui2/src/components/Editor/styles.scss` — data-table styles
- `docs/editor-plugins.md` — document the new plugin
