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
    ├── NoteLink/           # extends @tiptap/extension-mention (inline)
    │   ├── Extension.ts
    │   ├── suggestion.ts
    │   └── NoteLinkList.tsx
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

All extensions are listed in the module-level `extensions` array in `Editor.tsx`, and
their toolbar buttons are placed in `renderControls()`. Notable detail:

```ts
// Editor.tsx
const extensions = [
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

The block plugins are all atomic block nodes. `Task` is the cleanest canonical example
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
- The `declare module '@tiptap/core'` block makes `setX()` type-check on
  `editor.chain()`.

### NodeView component

The React NodeView is wrapped in `NodeViewWrapper`, with an inner element marked
`contentEditable={false}` and `data-drag-handle`. Attributes are read from
`props.node.attrs` and written back with `props.updateAttributes(...)`. See
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

A thin wrapper around `mui-tiptap`'s `MenuButton` that grabs the editor from context
and runs the plugin's command. See
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
   `content`, `collapsed`) lives in the node's attributes and round-trips through the
   note's stored TipTap HTML. No backend record. Good for content that is purely part
   of the note.
2. **Backend-backed by id** (e.g. **Task**, **Question**) — the node stores only an id
   (`taskId` / `questionId`); the React component fetches and persists the real record
   through an API client
   ([tasksApi.ts](../apps/ui2/src/api/tasksApi.ts),
   [questionsApi.ts](../apps/ui2/src/api/questionsApi.ts)). Good when the entity has its
   own lifecycle, lives in its own DB table, or is queried outside the note.

### Triggers (input rules & suggestions)

Plugins are inserted either from the toolbar button, an `addInputRules()` rule, or a
suggestion popup:

| Plugin | Trigger | Mechanism |
| --- | --- | --- |
| Prompt | type `/prompt ` (trailing space) | `nodeInputRule({ find: /\/prompt\s$/ })` |
| Question | type `qq` | `nodeInputRule({ find: /qq/ })` — note: a bare `qq`, not `/qq` |
| NoteLink | type `@` | Mention `suggestion` popup |
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
  (`draft | ready | running | done`), monospace content, and collapse support.
- **Base / type:** Custom `Node`, `group: 'block'`, `atom: true`, `draggable: true`.
- **Attributes:** `title`, `status`, `content`, `collapsed` (the `collapsed` attribute
  has custom `parseHTML`/`renderHTML` that map to/from a `collapsed="true"` HTML
  attribute).
- **Storage:** Self-contained — everything lives in node attributes; no backend record.
- **Trigger:** `nodeInputRule({ find: /\/prompt\s$/ })` and the toolbar button
  (`PromptMenuItem`, terminal icon).
- **Files:** `Extension.ts`, `Component.tsx`, `MenuItem.tsx`.

### NoteLink — `plugins/NoteLink/`

- **What:** An inline "pill" that links to another note the user owns (a wiki-style
  `@`-mention of a note).
- **Base / type:** **Inline**, extends `@tiptap/extension-mention` (not a custom
  `Node`). Renamed to `noteLink` and `.configure()`d.
- **Trigger:** `@` opens a suggestion popup.
- **Suggestion popup:** [suggestion.ts](../apps/ui2/src/components/Editor/plugins/NoteLink/suggestion.ts)
  implements the `render` lifecycle with TipTap's `ReactRenderer` (so the popup inherits
  the editor's Mantine/MUI React context) and positions it manually at the caret via
  `clientRect` — **deliberately not** `tippy.js`. The list component
  [NoteLinkList.tsx](../apps/ui2/src/components/Editor/plugins/NoteLink/NoteLinkList.tsx)
  resolves items two ways: a debounced Typesense search, or a pasted note URL matched by
  a `/notes/:id` regex.
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
- **Base / type:** Extends `@tiptap/extension-heading` (so `StarterKit` disables its own
  heading).
- **Attributes:** inherits the parent's (`...this.parent?.()`) plus `collapsed`, which
  maps to/from a `data-collapsed="true"` HTML attribute.
- **Mechanism:** Uses `addProseMirrorPlugins()` with a `DecorationSet`. When the user
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
