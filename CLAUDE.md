# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

Griffin is a personal notes and task management application built as an Nx monorepo with a NestJS API backend and React frontend.

## Common Commands

### Development
```bash
npm run dev                    # Start both API and UI in development mode
npx nx serve api               # Start only the API (port 3000)
npx nx serve ui2               # Start only the UI (Vite dev server)
```

### Database
```bash
npm run prisma:push            # Push schema changes to database
npm run prisma:studio          # Open Prisma Studio GUI
npm run prisma:seed            # Seed the database
```

### Build & Test
```bash
npx nx build api               # Build API for production
npx nx build ui2               # Build UI for production
npx nx test <project>          # Run tests for a project
npx nx lint <project>          # Lint a project
npx nx run-many -t test        # Run tests for all projects
npx nx run-many -t lint        # Lint all projects
```

### Search Index
```bash
npm run refresh-typesense      # Rebuild Typesense search index
```

### Docker
```bash
docker-compose up              # Start Postgres and Typesense services
```

## Architecture

### Monorepo Structure
- **apps/api**: NestJS backend (port 3000)
- **apps/ui2**: React frontend with Vite, Mantine UI, and TailwindCSS
- **libs/types**: Shared TypeScript types
- **libs/open-ai**: OpenAI/LLM integration utilities

### Backend (apps/api)
NestJS application with feature-based module organization:
- **auth**: JWT authentication with cookie-based tokens
- **notes**: Note CRUD with rich text content (TipTap HTML)
- **notebooks**: Hierarchical notebook organization (supports nesting via parentId)
- **tasks**: Task management with status history tracking
- **tags**: Polymorphic tagging system (ObjectTag links tags to notes or tasks)
- **search**: Typesense full-text search integration
- **llm**: LangChain-based AI features with OpenAI and Tavily
- **audio**: Audio transcription via OpenAI Whisper
- **questions**: Note-linked Q&A feature

### Frontend (apps/ui2)
- React 18 with React Router for navigation
- Mantine v8 component library
- TanStack Query for server state
- TipTap for rich text editing
- API client in `src/api/` with React Query hooks in `src/hooks/`

### Database
PostgreSQL with Prisma ORM. Schema at `apps/api/prisma/schema.prisma`.

Key relationships:
- User → Notebooks → Notes (hierarchical)
- Notes can have Tasks, Questions, and Media attachments
- Tags are polymorphic via ObjectTag (objectType: 'note' | 'task')
- Conversations store LLM chat history with ConversationItems

### Search
Typesense provides full-text search. Collections defined in `apps/api/src/search/schemas.ts`:
- notes: id, title, content, userId
- tasks: id, title, description, userId, dueDate, status, priority
- tags: id, name, userId

Data stored in `./typesense-data/` (Docker volume mount).

## Environment Variables

Required in `.env`:
- `DATABASE_URL`: PostgreSQL connection string
- `JWT_TOKEN_SECRET`: Secret for JWT signing
- `OPENAI_API_KEY`: For LLM and transcription features
- `AWS_*`: S3 configuration for media uploads
- `TYPESENSE_PORT`: Typesense server port (default 8108)
