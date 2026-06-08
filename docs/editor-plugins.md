# Editor Plugins

This document is the source of truth for the **custom TipTap editor plugins** in the
web app (`apps/ui2`). It is written primarily for AI agents that build new plugins or
modify existing ones. It catalogs every custom plugin, documents the shared
conventions they follow, and gives a step-by-step recipe for adding a new plugin that
matches the existing patterns.

> The editor is [TipTap](https://tiptap.dev/) (a ProseMirror wrapper) rendered through
> [`mui-tiptap`](https://github.com/sjdemartini/mui-tiptap). UI components are
> [Mantine](https://mantine.dev/) + Tailwind utilities; icons are
> [`@tabler/icons-react`](https://tabler.io/icons).
>
> The app pins `@tiptap/*` **v2.5.x** and `mui-tiptap` **^1.10**, so every TipTap link in
> this doc targets the **v2** docs. §6 collects them in one concept → docs lookup table.

---

## 1. Overview & directory layout

The editor is a single React component:

- **`apps/ui2/src/components/Editor/Editor.tsx`** — instantiates the editor with
  `useEditor`, declares the `extensions` array, and renders the toolbar in
  `renderControls()`.
- **`apps/ui2/src/components/Editor/styles.scss`** — shared editor/plugin styles
  (imported at the top of `Editor.tsx`).
- **`apps/ui2/src/components/Editor/plugins/`** — one directory per custom plugin.

```
apps/ui2/src/components/Editor/
├── Editor.tsx              # editor config + toolbar (registration point)
├── styles.scss             # shared styles (.note-link-pill, .collapsed-content, …)
└── plugins/
    ├── CollapsibleHeading/ # extends @tiptap/extension-heading
    │   ├── Extension.ts
    │   └── Component.tsx
    ├── Dropdown/           # inline node (backend-backed instance reference)
    │   ├── Extension.ts
    │   ├── Component.tsx
    │   └── MenuItem.tsx
    ├── NoteLink/           # extends @tiptap/extension-mention (inline)
    │   ├── Extension.ts
    │   ├── suggestion.ts
    │   ├── ActionMenuList.tsx    # "@" stage 1: actions menu
    │   ├── AtMenuList.tsx        # routes between stages
    │   ├── NoteLinkList.tsx      # stage 2: note search
    │   └── DropdownPickerList.tsx # stage 2: dropdown picker
    ├── Prompt/             # block node (self-contained attributes)
    │   ├── Extension.ts
    │   ├── Component.tsx
    │   └── MenuItem.tsx
    ├── Question/           # block node (backend-backed)
    │   ├── Extension.ts
    │   ├── Component.tsx
    │   └── MenuItem.tsx
    └── Task/               # block node (backend-backed)
        ├── Extension.ts
        ├── Component.tsx
        └── MenuItem.tsx
```

### Registration

Most extensions are listed in the module-level `baseExtensions` array in `Editor.tsx`,
and their toolbar buttons are placed in `renderControls()`. Extensions that need the
current note's id are appended per-instance in a `useMemo` so each editor gets its own
configured copy (see **Dropdown** and the `noteId`-gating note in §5):

```ts
// Editor.tsx
const baseExtensions = [
  StarterKit.configure({
    heading: false, // disabled — CollapsibleHeading replaces it
  }),
  CollapsibleHeading.configure({ levels: [1, 2, 3, 4, 5, 6] }),
  // …stock extensions…
  TaskExtension,
  QuestionExtension,
  PromptExtension,
  NoteLinkExtension,
];

// Inside the Editor component — inject this note's id into the Dropdown plugin:
const extensions = useMemo(
  () => [...baseExtensions, DropdownExtension.configure({ noteId })],
  [noteId],
);
```

### Stock extensions (do not reimplement)

These come from TipTap / `mui-tiptap` and already cover their features — reuse them
rather than building custom equivalents:

`StarterKit` (Bold, Italic, Strike, Code, CodeBlock, Paragraph, lists, Blockquote,
HorizontalRule, Image, History, …), `TaskList` + `TaskItem` (checkbox lists — distinct
from the custom **Task** block), `TextAlign`, `Link`, `TableCell` / `TableHeader` /
`TableRow`, `TableImproved` (resizable tables, `mui-tiptap`), `ResizableImage`
(`mui-tiptap`), `LinkBubbleMenuHandler` (`mui-tiptap`).

---

## 2. Shared architecture

Every custom plugin follows the same conventions. Replicate these when adding a new one.

### Folder convention

One PascalCase directory per plugin under `plugins/`, containing:

| File | Purpose | Required? |
| --- | --- | --- |
| `Extension.ts` | The TipTap `Node` / `Mark` / extended-extension definition. Always named `Extension.ts`. | Yes |
| `Component.tsx` | React NodeView rendered via `ReactNodeViewRenderer`. | If the plugin has custom UI |
| `MenuItem.tsx` | A `mui-tiptap` `MenuButton` wrapper for the toolbar. | If it has a toolbar button |
| _other_ | Plugin-specific helpers (e.g. NoteLink's `suggestion.ts`, `NoteLinkList.tsx`). | As needed |

### Block-node skeleton (Task / Question / Prompt)

The block plugins are all atomic block nodes created with TipTap's
[`Node.create`](https://tiptap.dev/docs/editor/extensions/custom-extensions/create-new/node)
(see [Custom extensions](https://tiptap.dev/docs/editor/extensions/custom-extensions) for
the bigger picture). `Task` is the cleanest canonical example
([Task/Extension.ts](../apps/ui2/src/components/Editor/plugins/Task/Extension.ts)):

```ts
import { mergeAttributes, Node } from '@tiptap/core'
import { ReactNodeViewRenderer } from '@tiptap/react'
import { Component } from './Component'

// Make the custom command type-visible to editor.chain().setTask()
declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    task: {
      setTask: () => ReturnType
    }
  }
}

export const TaskExtension = Node.create({
  name: 'task',
  group: 'block',
  atom: true,        // leaf node — no editable ProseMirror content inside
  draggable: true,
  addAttributes() {
    return { taskId: { default: '' } }
  },
  parseHTML() {
    return [{ tag: 'task' }]   // custom element tag for round-tripping
  },
  renderHTML({ HTMLAttributes }) {
    return ['task', mergeAttributes(HTMLAttributes)]
  },
  addNodeView() {
    return ReactNodeViewRenderer(Component)
  },
  addCommands() {
    return {
      setTask: () => ({ chain }) =>
        chain().insertContent({ type: 'task' }).run(),
    }
  },
})
```

Key points:

- `atom: true` means the node has no internal editable content — **all editing happens
  inside the React component** via `updateAttributes`.
- `parseHTML` / `renderHTML` use a custom element tag (`<task>`, `<prompt>`,
  `<question>`). This is what is stored in the note's TipTap HTML and parsed back on
  load — keep them symmetric.
- `addNodeView` returns
  [`ReactNodeViewRenderer(Component)`](https://tiptap.dev/docs/editor/extensions/custom-extensions/node-views/react),
  which renders the node through the React `Component`. `addCommands` registers the
  [`setX()` command](https://tiptap.dev/docs/editor/api/commands) the toolbar button and
  input rule call.
- The `declare module '@tiptap/core'` block makes `setX()` type-check on
  `editor.chain()` — TipTap's
  [TypeScript](https://tiptap.dev/docs/guides/typescript) command-typing pattern.

### NodeView component

The React NodeView ([node views](https://tiptap.dev/docs/editor/extensions/custom-extensions/node-views),
[React](https://tiptap.dev/docs/editor/extensions/custom-extensions/node-views/react)) is
wrapped in `NodeViewWrapper`, with an inner element marked `contentEditable={false}` and
`data-drag-handle`. Attributes are read from `props.node.attrs` and written back with
`props.updateAttributes(...)`. See
[Task/Component.tsx](../apps/ui2/src/components/Editor/plugins/Task/Component.tsx):

```tsx
import { NodeViewWrapper } from '@tiptap/react'
import type { NodeViewProps } from '@tiptap/react'

export function Component(props: NodeViewProps) {
  const [isSelected, setIsSelected] = useState(false)
  // …read props.node.attrs.taskId, fetch/persist via API…
  return (
    <NodeViewWrapper className="task-component">
      <div contentEditable={false} data-drag-handle>
        {isSelected ? renderEdit() : renderShow()}
      </div>
    </NodeViewWrapper>
  )
}
```

A common pattern: a `show` (read-only) view that swaps to an `edit` (form) view on
click, and a `useRef` guard so a backend fetch only fires once per mounted node.

### MenuItem (toolbar button)

A thin wrapper around [`mui-tiptap`](https://github.com/sjdemartini/mui-tiptap)'s
`MenuButton` that grabs the editor from context (`useRichTextEditorContext`) and runs the
plugin's command. See
[Task/MenuItem.tsx](../apps/ui2/src/components/Editor/plugins/Task/MenuItem.tsx):

```tsx
import { MenuButton, type MenuButtonProps, useRichTextEditorContext } from 'mui-tiptap'
import { IconCheckbox } from '@tabler/icons-react'

export const TaskMenuItem = (props: Partial<MenuButtonProps>) => {
  const editor = useRichTextEditorContext()
  return (
    <MenuButton
      IconComponent={IconCheckbox}
      tooltipLabel="Task"
      onClick={() => editor?.chain().focus().setTask().run()}
      {...props}
    />
  )
}
```

It is rendered in `Editor.tsx`'s `renderControls()` (e.g. `<TaskMenuItem />`).

### Serialization model — two patterns

Plugins persist their data in one of two ways. **Pick deliberately:**

1. **Self-contained attributes** (e.g. **Prompt**) — all data (`title`, `status`,
   `content`) lives in the node's attributes and round-trips through the note's stored
   TipTap HTML. No backend record. Good for content that is purely part of the note.
2. **Backend-backed by id** (e.g. **Task**, **Question**) — the node stores only an id
   (`taskId` / `questionId`); the React component fetches and persists the real record
   through an API client
   ([tasksApi.ts](../apps/ui2/src/api/tasksApi.ts),
   [questionsApi.ts](../apps/ui2/src/api/questionsApi.ts)). Good when the entity has its
   own lifecycle, lives in its own DB table, or is queried outside the note.

### Triggers (input rules & suggestions)

Plugins are inserted either from the toolbar button, an
[`addInputRules()`](https://tiptap.dev/docs/editor/api/input-rules) rule (`nodeInputRule`),
or a [suggestion](https://tiptap.dev/docs/editor/api/utilities/suggestion) popup:

| Plugin | Trigger | Mechanism |
| --- | --- | --- |
| Prompt | type `/prompt ` (trailing space) | `nodeInputRule({ find: /\/prompt\s$/ })` |
| Question | type `qq` | `nodeInputRule({ find: /qq/ })` — note: a bare `qq`, not `/qq` |
| NoteLink | type `@` | Mention `suggestion` popup |
| Dropdown | toolbar `Menu` + `@ → Dropdown` | `setDropdown(id)` command / `insertContentAt` |
| Task | toolbar button only | `setTask()` command |

```ts
// Prompt/Extension.ts
addInputRules() {
  return [nodeInputRule({ find: /\/prompt\s$/, type: this.type })]
},
```

---

## 3. Plugin catalog

### Task — `plugins/Task/`

- **What:** An inline task/todo block with a checkbox, title, priority, due date, and
  description.
- **Base / type:** Custom `Node`, `group: 'block'`, `atom: true`, `draggable: true`.
- **Attributes:** `taskId`.
- **Storage:** Backend-backed. The component creates/updates the task via
  [tasksApi.ts](../apps/ui2/src/api/tasksApi.ts)
  (`createTask`, `updateTask`, `fetchTaskById`) and stores the returned id in `taskId`.
  Types in [types/task.ts](../apps/ui2/src/types/task.ts).
- **Trigger:** Toolbar button (`TaskMenuItem`, checkbox icon).
- **Files:** `Extension.ts`, `Component.tsx`, `MenuItem.tsx`.

### Dropdown — `plugins/Dropdown/`

- **What:** A reusable Google-Sheets-style dropdown. A user defines a dropdown once (a
  name + colored options) and stamps it into notes many times; each placement renders
  the selected option as a colored pill; clicking it opens an anchored Mantine `Menu`
  of the options (each shown as its own colored pill, the current one checked) — the
  pill keeps its inline footprint rather than swapping to a full input.
- **Base / type:** Custom `Node`, **inline** (`group: 'inline'`, `inline: true`,
  `atom: true`) — it flows within a paragraph rather than occupying its own line, so a
  line can hold text plus one or more dropdowns. The NodeView renders through a
  `NodeViewWrapper as="span"`.
- **Attributes:** `dropdownId` (the definition) and `instanceId` (the per-placement row).
- **Storage:** Backend-backed **by reference**, with three tables behind it
  (`Dropdown` → `DropdownOption`, and `DropdownInstance`). The node stores only ids; the
  NodeView loads the definition via `useDropdown(dropdownId)` (shared cache across all
  placements of the same definition) and the selection via
  `useDropdownInstance(instanceId)`. See
  [dropdownsApi.ts](../apps/ui2/src/api/dropdownsApi.ts),
  [useDropdowns.ts](../apps/ui2/src/hooks/useDropdowns.ts),
  [types/dropdown.ts](../apps/ui2/src/types/dropdown.ts). Each option has a single
  Mantine color token (its "color scheme") that drives both the pill background and
  text, resolved by [components/dropdowns/colors.ts](../apps/ui2/src/components/dropdowns/colors.ts).
- **Lifecycle (important):**
  - **Lazy instance creation** — a freshly inserted node has `instanceId === ''`; the
    NodeView creates the `DropdownInstance` row (POST `/dropdown-instances`) on mount and
    writes the id back with `updateAttributes`. New instances start with
    `selectedOptionId = null`, which renders the definition's **default** option.
  - **Independent on paste** — an `appendTransaction` ProseMirror plugin (in
    `Extension.ts`) detects two nodes sharing a non-empty `instanceId` (copy/paste) and
    resets the later one's `instanceId` to `''`, so it mints its own instance. This keeps
    every placement independent.
  - **Association on save** — like Task/Question, the backend prunes orphaned rows:
    [associateDropdownInstances.ts](../apps/api/src/notes/associateDropdownInstances.ts)
    (called from `NoteService.update`) soft-deletes instances of the note whose
    `instanceid="…"` no longer appears in the saved content.
  - **Definition/option deletes** cascade server-side: deleting a dropdown soft-deletes
    its options and instances; deleting an option nulls the selection of instances that
    used it (so they fall back to the default) and promotes a new default if needed.
- **Trigger:** Toolbar `Menu` (`DropdownMenuItem` — lists the user's dropdowns + a
  "Configure…" item opening [DropdownConfigModal](../apps/ui2/src/components/dropdowns/DropdownConfigModal.tsx))
  and the `@ → Dropdown` action (see NoteLink). The toolbar button and `@` action both
  require a `noteId` (an instance must belong to a note).
- **Files:** `Extension.ts`, `Component.tsx`, `MenuItem.tsx`; plus
  `components/dropdowns/` (config modal, color picker, color util) and the
  `dropdowns` API/hooks/types.

### Question — `plugins/Question/`

- **What:** A note-linked Q&A block.
- **Base / type:** Custom `Node`, `group: 'block'`, `atom: true`, `draggable: true`.
- **Attributes:** `questionId`, `questionContent`, `questionAnswer`.
- **Storage:** Backend-backed via [questionsApi.ts](../apps/ui2/src/api/questionsApi.ts)
  and the `useQuestions` hook; types in
  [types/question.ts](../apps/ui2/src/types/question.ts).
- **Trigger:** `nodeInputRule({ find: /qq/ })` and the toolbar button
  (`QuestionMenuItem`).
- **Files:** `Extension.ts`, `Component.tsx`, `MenuItem.tsx`.

### Prompt — `plugins/Prompt/`

- **What:** An AI-prompt block with a title, a status badge
  (`draft | ready | running | done`), monospace content, and a copy-to-clipboard button.
  Its read-only view is a compact title bar; clicking the title opens an inline edit form
  (local React `editing` state — there is no persisted collapsed flag).
- **Base / type:** Custom `Node`, `group: 'block'`, `atom: true`, `draggable: true`.
- **Attributes:** `title`, `status`, `content`.
- **Storage:** Self-contained — everything lives in node attributes; no backend record.
- **Trigger:** `nodeInputRule({ find: /\/prompt\s$/ })` and the toolbar button
  (`PromptMenuItem`, terminal icon).
- **Files:** `Extension.ts`, `Component.tsx`, `MenuItem.tsx`.

### NoteLink — `plugins/NoteLink/`

- **What:** An inline "pill" that links to another note the user owns (a wiki-style
  `@`-mention of a note).
- **Base / type:** **Inline**, extends
  [`@tiptap/extension-mention`](https://tiptap.dev/docs/editor/api/nodes/mention) (not a
  custom `Node`). Renamed to `noteLink` and `.configure()`d.
- **Trigger:** `@` opens a suggestion popup.
- **Suggestion popup:** [suggestion.ts](../apps/ui2/src/components/Editor/plugins/NoteLink/suggestion.ts)
  implements the [suggestion](https://tiptap.dev/docs/editor/api/utilities/suggestion)
  `render` lifecycle with TipTap's
  [`ReactRenderer`](https://tiptap.dev/docs/editor/extensions/custom-extensions/node-views/react)
  (so the popup inherits
  the editor's Mantine/MUI React context) and positions it manually at the caret via
  `clientRect` — **deliberately not** `tippy.js`.
- **Multi-stage menu:** the popup is mounted as
  [AtMenuList.tsx](../apps/ui2/src/components/Editor/plugins/NoteLink/AtMenuList.tsx),
  which starts on an actions list
  ([ActionMenuList.tsx](../apps/ui2/src/components/Editor/plugins/NoteLink/ActionMenuList.tsx),
  `EDITOR_ACTIONS`) and routes to a stage-2 list per action: **Link To Note** →
  [NoteLinkList.tsx](../apps/ui2/src/components/Editor/plugins/NoteLink/NoteLinkList.tsx)
  (debounced Typesense search, or a pasted `/notes/:id` URL); **Dropdown** →
  [DropdownPickerList.tsx](../apps/ui2/src/components/Editor/plugins/NoteLink/DropdownPickerList.tsx)
  (lists the user's dropdowns and inserts a placement via `insertContentAt`). To add an
  action, add an entry to `EDITOR_ACTIONS` and a branch + stage to `AtMenuList`.
- **Rendering & storage:** Custom `renderHTML`/`renderText` return just the note title;
  Mention wraps it in `<span data-type="noteLink" data-id=… data-label=…>` which is what
  round-trips. Styled via the `.note-link-pill` class so it looks consistent in the
  editor and in read-only HTML previews.
- **Navigation:** Clicking a pill is handled in `Editor.tsx`'s `handleClick`, which
  reads `data-id` off the closest `[data-type="noteLink"]` element and calls
  `openNote(id)` (from [useOpenNote](../apps/ui2/src/hooks/useOpenNote.ts)).
- **Files:** `Extension.ts`, `suggestion.ts`, `NoteLinkList.tsx`.

### CollapsibleHeading — `plugins/CollapsibleHeading/`

- **What:** Replaces the stock heading with one that can collapse/expand the section
  beneath it.
- **Base / type:** Extends
  [`@tiptap/extension-heading`](https://tiptap.dev/docs/editor/api/nodes/heading) (so
  `StarterKit` disables its own heading).
- **Attributes:** inherits the parent's (`...this.parent?.()`) plus `collapsed`, which
  maps to/from a `data-collapsed="true"` HTML attribute.
- **Mechanism:** Uses `addProseMirrorPlugins()` with a
  [`DecorationSet`](https://prosemirror.net/docs/ref/#view.Decoration) (raw ProseMirror,
  via `@tiptap/pm`). When the user
  toggles a heading, the plugin computes which following block nodes fall under that
  heading (down to the next same-or-higher-level heading) and decorates them with the
  `.collapsed-content` class (hidden via CSS). Collapse state resets on note open
  (`init` returns `DecorationSet.empty`) and is preserved through edits by mapping
  decorations across the transaction.
- **Files:** `Extension.ts`, `Component.tsx`.

---

## 4. How to add a new plugin

Follow this checklist. Most new plugins are block nodes, so start from the **Task**
skeleton; for inline/mention behavior, extend an official extension like **NoteLink**
does.

1. **Create the directory** `plugins/<PascalName>/` and `Extension.ts`. Copy the
   block-node skeleton from §2 (or extend an official extension). Set a unique `name`,
   declare `addAttributes`, symmetric `parseHTML`/`renderHTML` (custom tag), and an
   `addCommands` `set<Name>` command. Add the `declare module '@tiptap/core'` typing.
2. **Create `Component.tsx`** (the NodeView): `NodeViewWrapper` + inner
   `contentEditable={false} data-drag-handle`. Read attributes from `props.node.attrs`;
   persist with `props.updateAttributes(...)`. Decide the **storage model** (self-
   contained attributes vs. id + API — see §2).
3. **If backend-backed**, add or extend an API client in
   [src/api/](../apps/ui2/src/api/) and types in [src/types/](../apps/ui2/src/types/),
   and (optionally) a React Query hook in [src/hooks/](../apps/ui2/src/hooks/), mirroring
   `tasksApi.ts` / `useTasks`.
4. **Create `MenuItem.tsx`** if it needs a toolbar button (copy `Task/MenuItem.tsx`,
   pick a Tabler icon, call `set<Name>()`).
5. **Register in `Editor.tsx`:** import the extension and add it to the `extensions`
   array; add `<XMenuItem />` to `renderControls()`.
6. **Add a trigger** if desired: `addInputRules()` with `nodeInputRule`, and/or a
   suggestion (see NoteLink) for `@`/`/`-style insertion.
7. **Style it** with component-level Tailwind utilities + Mantine CSS variables
   (`var(--mantine-color-*)`), and/or a class in
   [styles.scss](../apps/ui2/src/components/Editor/styles.scss).
8. **Verify HTML round-trips:** the content produced by `renderHTML` must be re-parsed
   by `parseHTML`, so stored notes and the read-only `HtmlPreview` render correctly.
   Insert the node, reload the note, and confirm it survives.

---

## 5. Conventions & gotchas

- **Styling:** Tailwind utility classes + Mantine CSS variables
  (`var(--mantine-color-default-hover)`, `var(--mantine-color-dimmed)`, …) for component
  styling; shared classes (`.note-link-pill`, `.collapsed-content`, `.collapse-toggle`)
  live in `styles.scss`. Tabler icons at consistent sizes (14/16/20).
- **`atom: true` nodes have no editable inner content** — all editing must go through
  the React component and `updateAttributes`. Don't expect the user to type inside them.
- **`noteId`-gated features:** image paste/drop/upload in `Editor.tsx` only work when the
  editor is given a `noteId` prop. If a new plugin needs the current note, thread it the
  same way rather than assuming it's available.
- **`.configure()` replaces the whole `suggestion` object.** NoteLink re-implements
  Mention's default `command` because configuring `suggestion` does not merge with the
  inherited one. If you extend a configurable extension, re-supply every sub-field you
  rely on.
- **Input-rule regexes are literal.** Question's trigger is a bare `/qq/` (matches `qq`
  anywhere), and Prompt's is `/\/prompt\s$/` (requires the trailing space). Match the
  exact behavior you want; test it.
- **Keep `parseHTML`/`renderHTML` symmetric.** Notes are stored as TipTap HTML; an
  asymmetric pair silently drops node data on reload.
- **Backend-backed nodes are blank in `HtmlPreview`.** Reference nodes (Task, Dropdown)
  store only ids in the HTML, so the read-only `HtmlPreview` (raw `dangerouslySetInnerHTML`)
  shows nothing for them — their visible data lives in the DB and is only rendered by the
  live NodeView. Self-contained nodes (Prompt) keep their data in attributes but are
  likewise not specially rendered in the preview. Don't rely on previews to show them.

---

## 6. TipTap & library reference

The editor is **TipTap v2** (`@tiptap/*` v2.5.x) — a thin wrapper over
[ProseMirror](https://prosemirror.net/) (accessed via `@tiptap/pm`) — rendered through
**mui-tiptap** (^1.10). When you need the underlying API while building or changing a
plugin, start here. Every TipTap link points to the **v2** docs (match the version, the
v3 docs differ).

| Concept (where it shows up in this codebase) | Official docs |
| --- | --- |
| Custom extensions — the big picture | [Custom extensions](https://tiptap.dev/docs/editor/extensions/custom-extensions) |
| `Node.create`, `addAttributes`, `parseHTML`/`renderHTML` (Task / Question / Prompt) | [Node API](https://tiptap.dev/docs/editor/extensions/custom-extensions/create-new/node) |
| Extending a non-node extension | [Extension API](https://tiptap.dev/docs/editor/extensions/custom-extensions/create-new/extension) |
| `ReactNodeViewRenderer`, `NodeViewWrapper`, `NodeViewProps`, `ReactRenderer` | [React node views](https://tiptap.dev/docs/editor/extensions/custom-extensions/node-views/react) |
| Node views in general (DOM + lifecycle) | [Node views](https://tiptap.dev/docs/editor/extensions/custom-extensions/node-views) |
| `addCommands` + chained `editor.chain().setX().run()` | [Commands](https://tiptap.dev/docs/editor/api/commands) |
| `declare module '@tiptap/core'` command typing | [TypeScript guide](https://tiptap.dev/docs/guides/typescript) |
| `addInputRules()` / `nodeInputRule` (Question `qq`, Prompt `/prompt `) | [Input Rules](https://tiptap.dev/docs/editor/api/input-rules) |
| `@tiptap/extension-mention` base (NoteLink) | [Mention extension](https://tiptap.dev/docs/editor/api/nodes/mention) |
| `@` suggestion popup, `render` lifecycle, `debounce` / `minQueryLength` (NoteLink) | [Suggestion utility](https://tiptap.dev/docs/editor/api/utilities/suggestion) |
| `@tiptap/extension-heading` base (CollapsibleHeading) | [Heading extension](https://tiptap.dev/docs/editor/api/nodes/heading) |
| `addProseMirrorPlugins()`, `Decoration` / `DecorationSet` (CollapsibleHeading) | [ProseMirror decorations](https://prosemirror.net/docs/ref/#view.Decoration) |
| `MenuButton`, `RichTextEditor`, `useRichTextEditorContext` (toolbar) | [mui-tiptap](https://github.com/sjdemartini/mui-tiptap) |
| Component UI primitives and icons | [Mantine](https://mantine.dev/) · [Tabler icons](https://tabler.io/icons) |
