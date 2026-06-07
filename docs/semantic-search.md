# Semantic (vector) search for notes

**Status:** Draft / proposal — 2026-06-07
**Owner:** Griffin

A working doc for adding embedding-based semantic search so the AI chat agent
(and eventually the search UI) can retrieve notes by *meaning*, not just keyword
overlap. This captures the decisions to make before writing code; nothing here
is final.

## Goal

Today the agent finds notes with the `search_notes` tool, which runs a Typesense
keyword query. Keyword search misses notes that are *about* a query but don't
share its words ("how do I stay focused" vs. a note titled "Deep work routine").
We want the agent to retrieve by semantic similarity, with keyword search still
available where it's stronger (exact titles, names, IDs, code).

Non-goals for v1: re-ranking models, cross-note summarization, replacing the
human-facing search page. Start with the agent retrieval path.

## How search works today

- **Index:** `SearchService` (`apps/api/src/search/search.service.ts`) keeps
  Typesense collections defined in `schemas.ts`. The note collection indexes
  `id, title, content, userId, notebookId`. HTML is stripped before indexing.
- **Freshness:** `NoteService.create()` / `update()`
  (`apps/api/src/notes/notes.service.ts`) call `searchService.addNote(note, userId)`
  inline. `npm run refresh-typesense` does a full rebuild.
- **Agent:** `LlmService.getTools(userId)` (`apps/api/src/llm/llm.service.ts`)
  exposes `search_notes`, which calls `searchService.search(query, userId, 'notes')`
  and returns matching notes with highlights. Tools are LangChain
  `DynamicStructuredTool`s bound to a `ChatOpenAI` model (currently `gpt-5.5`,
  Responses API). Messages are processed async via BullMQ (`LlmProcessor`).
- **Data:** `Note.content` is TipTap HTML. There is **no** stored plaintext —
  it's stripped on the fly. `Note.version` (int) already increments only when
  content changes. Postgres 17 in `docker-compose.yml`. No pgvector today.
- **Embeddings:** an OpenAI embedding client exists (`libs/open-ai`
  `OpenAIClient.createEmbeddings()`), but we are **embedding locally** instead
  (see §4), so this path won't be used for notes embeddings.

So the building blocks (async queue, a version-based dirty check, an indexing
hook point) already exist. The remaining design work is mostly *which local
embedding model*, *what we embed*, and *how we keep them fresh* — the storage
question is now settled (pgvector, §2).

## Decisions to make

### 1. Augment or replace Typesense?

**Recommendation: augment — hybrid search, not a replacement.** Keyword and
vector search fail in opposite directions. Keyword nails exact tokens (names,
dates, code, acronyms) and is cheap; vectors handle paraphrase and concept
queries but blur exact matches and add embedding latency/cost per query. Combine
them (see §6) and keep the door open to keyword-only for some agent calls.

Replacing Typesense outright also means re-solving tasks/questions/tags search,
which already work. Don't.

### 2. Where do the vectors live? — **Decided: pgvector**

**Decision: pgvector in the existing Postgres 17.** The deciding factor is
operational safety: **Postgres is backed up; Typesense is not.** Putting the
vectors (and any data we'd be sad to lose / expensive to recompute) where the
backups already run means a restore brings the embeddings back with the notes,
in one consistent snapshot — no separate recovery story for a second datastore.

Supporting reasons: vectors live next to the source-of-truth note row
(transactional, no second sync target to drift), and per-user isolation is a
plain SQL `WHERE userId = ...` pre-filter on `notebookId`/`deletedAt` too. Cost:
a new extension + migration, an HNSW index to maintain, and we hand-write the
hybrid fusion (§6) that Typesense would have given for free.

Options considered and rejected:
- **Typesense-native vector/hybrid** (v27 supports it): removes a sync pipeline
  and gives RRF for free, but lives outside our backups and deepens Typesense
  coupling. Rejected on the backup risk.
- **Dedicated vector DB** (Qdrant/Weaviate/etc.): another service to operate for
  a personal app — overkill, and again outside the pg backup story.

### 3. What do we embed? (chunking)

Notes are HTML and can be long; one vector per note buries a relevant paragraph
inside an averaged whole-note vector and hurts recall.

- **Extract plaintext first.** Reuse/centralize the HTML-stripping already in
  the search service. Decide how custom TipTap nodes (`<task>`, `<question>`,
  note links) render to text.
- **Chunk by structure.** Split on headings / collapsible-heading sections (the
  editor already has a heading hierarchy), with a target size (~256–512 tokens)
  and small overlap. Store chunks in a child table (`NoteChunk`: `noteId`,
  `ordinal`, `text`, `embedding`, `noteVersion`).
- **Always keep the title** — prepend or embed it separately; titles carry a lot
  of signal.
- Retrieval returns chunks; the agent tool maps them back to notes (dedupe,
  keep best chunk per note, optionally fetch full note via existing `get_note`).

Open question: is whole-note embedding "good enough" for v1 to ship faster, with
chunking as a fast-follow? For short notes it may be.

### 4. Embedding model & dimensions — **local, model TBD**

**Decision: embed locally** (no external embedding API). Keeps note content on
our own infra, removes per-token API cost and rate limits, and means embedding
works offline. The trade-off is we now run and maintain the model ourselves
(compute, warm-up, the model file shipped wherever the API runs). The OpenAI
`createEmbeddings()` helper in `libs/open-ai` is therefore **not** used for this.

**Still open: which model.** Pick one before building, because pgvector columns
are dimension-fixed and a model swap means migration + full backfill. Things to
weigh:

- **Quality vs. size/speed** on our content. Candidates (dims in parens):
  `all-MiniLM-L6-v2` (384, tiny/fast, weaker), `bge-small` (384) / `bge-base`
  (768), `nomic-embed-text` (768, strong for the size), `gte-base` (768),
  `mxbai-embed-large` (1024), `bge-large` (1024). Lower dims = smaller index and
  faster ANN; higher dims usually = better recall. Check the MTEB leaderboard for
  current standings, but validate on **our own eval set** (§9) — leaderboard rank
  doesn't always transfer.
- **How it runs.** Options: a small **Python sidecar** (sentence-transformers),
  **Ollama** as an embedding server (`nomic-embed-text`, `mxbai-embed-large`),
  or **in-process Node** via Transformers.js / fastembed (ONNX, no extra
  service). In-process is simplest to deploy; a sidecar/Ollama is easier to
  swap models and uses GPU/Apple-Silicon more readily.
- **Hardware reality:** CPU-only is fine for these small models at personal
  scale, but measure warm-up and per-batch latency on the box the API runs on.
- **Consistency:** the *same* model must embed both stored chunks and incoming
  queries — distances across models aren't comparable.
- **Provenance:** store the model name + dimension alongside each vector so we
  can detect a model change and trigger a re-embed.

### 5. Generating and keeping embeddings fresh

This is where most of the real complexity lives.

- **Hook point:** same place as `addNote` in `NoteService.create()/update()`.
- **Async, not inline.** Embedding calls the OpenAI API; don't block the save.
  Queue an embedding job on the existing BullMQ/Redis setup (mirror
  `LlmProcessor`). Inline is acceptable only for a quick v1 spike.
- **Dirty check via `version`.** `version` already bumps only on content change.
  Store `noteVersion` (or a content hash) on the chunk rows; skip re-embedding
  when unchanged. This avoids re-embedding on saves that only touched metadata,
  and avoids cost on autosave churn — **confirm how often `update()` fires on
  autosave**, since that drives embedding spend.
- **Deletes:** notes use soft delete (`deletedAt`). Exclude soft-deleted notes
  from retrieval and clean up their chunks (cascade on `noteId`).
- **Backfill:** a script like `refresh-typesense.ts` to embed all existing notes,
  batched (the embeddings API takes arrays), with rate-limit handling and resume.
- **Partial-failure handling:** a note can be saved but its embedding job fail.
  Track an embedding status / `embeddedVersion` so a reconciler can find notes
  whose `version > embeddedVersion` and retry.

### 6. Retrieval & ranking

- **Per-user isolation is mandatory.** Every query filters to the caller's
  `userId` (and optionally `notebookId`). With pgvector, pre-filter in SQL; with
  Typesense, use a filter on the vector query.
- **Hybrid fusion.** Run keyword + vector, combine with Reciprocal Rank Fusion
  (or a weighted score). RRF is simple and robust and avoids tuning raw score
  scales. Typesense gives this natively; with pgvector we implement it.
- **Top-k and thresholds.** Return ~5–10 results to the agent; apply a minimum
  similarity threshold so "no good match" returns empty instead of garbage (the
  agent should be able to learn nothing relevant exists).
- **What we return to the agent:** note id, title, best-matching snippet, score.
  Keep payloads small; let the agent call `get_note` for full content.

### 7. Agent tool design

Two options:
- **Transparent upgrade:** keep the `search_notes` tool name/signature, swap the
  implementation to hybrid. Zero prompt changes; the agent just gets better
  results. Preferred for v1.
- **Explicit tools:** add `semantic_search_notes` alongside keyword search and
  let the model choose. More control, more prompt surface, more ways to misuse.

Recommend the transparent upgrade first; revisit if the agent needs to choose
the mode deliberately. Either way, document the `limit`/threshold behavior in the
tool description so the model uses it well.

### 8. Cost & latency

With local embedding there is **no per-token API cost**; cost moves to local
compute and latency.

- **Indexing cost:** one local embedding pass per changed note/chunk (CPU/GPU
  time, not dollars). The `version` dirty check keeps this bounded — verify
  autosave cadence (§5). Batch chunks per note to amortize model overhead.
- **Query cost:** every semantic query embeds the query string locally + ANN
  lookup. No API cost; still worth caching identical recent query embeddings to
  skip redundant compute.
- **Latency:** dominated by local model inference (warm-up + per-call) plus ANN
  search. Keep the model warm/loaded rather than cold-starting per request.
  Fine for the async agent path; measure before exposing to the live search box.
- **Storage:** depends on chosen dimension — e.g. 768 floats ≈ 3 KB/vector,
  1024 ≈ 4 KB, before HNSW index overhead. Trivial at personal scale, but
  chunking multiplies the row count.

### 9. Evaluation

We need to know it's actually better, not just different.

- Build a small fixed set of real queries → expected note(s).
- Compare keyword-only vs vector-only vs hybrid on recall@k / MRR.
- Spot-check agent transcripts on conceptual questions before/after.
- Keep the eval set in the repo so model/threshold changes are measurable.

### 10. Rollout

- **Feature flag / env var** to switch the `search_notes` implementation, so we
  can fall back to Typesense instantly.
- Backfill embeddings before flipping the flag.
- Run hybrid in shadow first (log both result sets, compare) if we want
  confidence before changing agent behavior.

## Proposed v1 (opinionated starting point)

A concrete path to argue against:

1. **pgvector** in the existing Postgres (decided — backed up; see §2).
2. **Chunk by heading**, ~512-token target; `NoteChunk` table with `embedding`,
   `noteVersion`, HNSW index; title prepended to each chunk.
3. **Local embedding model** (decided — local; specific model + dimension TBD,
   §4), with model name + dim stored per row.
4. **Async embedding** via BullMQ on create/update, gated by `version`; backfill
   script; `embeddedVersion` reconciler for retries.
5. **Hybrid retrieval** (vector + Typesense keyword, RRF), per-user filtered,
   top-k with a min-score threshold.
6. **Transparent `search_notes` upgrade** behind a feature flag.
7. **Eval set** of real queries committed before flipping the flag.

## Open questions

- Which local embedding model + dimension (§4), and how it runs (in-process
  Node ONNX vs. Python/Ollama sidecar). Validate on our eval set before locking
  the pgvector column dimension.
- Whole-note vs chunked embeddings for v1 (ship speed vs recall quality).
- How often does `NoteService.update()` fire on autosave? Drives embedding cost.
- Where should HTML→plaintext extraction live so search, embeddings, and
  previews share one implementation?
- Do we ever want semantic search in the human-facing search UI, or agent-only
  for now? (Affects latency budget.)

## Code pointers

- Search: `apps/api/src/search/search.service.ts`, `schemas.ts`
- Indexing hook: `apps/api/src/notes/notes.service.ts` (`create`, `update`)
- Agent tools: `apps/api/src/llm/llm.service.ts` (`getTools`, `search_notes`)
- Async pattern to mirror: `LlmProcessor` (BullMQ worker)
- Embedding client: `libs/open-ai` `OpenAIClient.createEmbeddings()`
- Full rebuild precedent: `apps/api/src/scripts/refresh-typesense.ts`
- Schema: `apps/api/prisma/schema.prisma` (`Note.version`, `Note.deletedAt`)
