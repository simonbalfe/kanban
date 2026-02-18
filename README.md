# Kan

An open-source Kanban board application. Create boards, organize work into lists, and track tasks with cards — similar to Trello, but self-hostable and fully open source.

## Features

- **Boards** — create, update, and delete boards with public/private visibility
- **Lists & Cards** — drag-and-drop cards between lists, reorder freely
- **Rich Text Descriptions** — full editor powered by Tiptap with markdown support
- **Labels** — color-coded labels for categorizing cards
- **Checklists** — track subtasks with completion progress
- **Due Dates** — set deadlines with smart filters (overdue, today, tomorrow, next week)
- **Filtering** — filter cards by members, labels, lists, and due dates
- **Board Templates** — save and reuse board configurations
- **Dark Mode** — system-aware theme switching
- **REST & tRPC API** — type-safe API with auto-generated OpenAPI spec
- **Docker Ready** — single-command deployment with Docker Compose

## Tech Stack

- **Framework:** Next.js 15 with React 18
- **Language:** TypeScript
- **API:** tRPC with OpenAPI generation
- **Database:** PostgreSQL (or PGLite for zero-config development)
- **ORM:** Drizzle
- **Styling:** Tailwind CSS
- **Drag & Drop:** react-beautiful-dnd
- **Rich Text:** Tiptap
- **Caching:** Redis (optional, for rate limiting)

## Quick Start

### Prerequisites

- Node.js 20+
- pnpm

### Setup

```bash
# Install dependencies
pnpm install

# Copy environment file
cp .env.example .env

# Start development server
pnpm dev
```

The app runs at `http://localhost:3000`. No database setup is required for development — it falls back to PGLite when `POSTGRES_URL` is not set.

### With Docker

```bash
# Set your environment variables in .env, then:
docker compose up
```

This starts both the app and a PostgreSQL 15 instance.

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `NEXT_PUBLIC_BASE_URL` | Yes | Base URL of the application |
| `POSTGRES_URL` | No | PostgreSQL connection string (uses PGLite if omitted) |
| `REDIS_URL` | No | Redis URL for rate limiting (falls back to in-memory) |
| `S3_REGION` | No | S3 region for file storage |
| `S3_ENDPOINT` | No | S3 endpoint URL |
| `S3_ACCESS_KEY_ID` | No | S3 access key |
| `S3_SECRET_ACCESS_KEY` | No | S3 secret key |
| `NEXT_PUBLIC_AVATAR_BUCKET_NAME` | No | S3 bucket for avatars |
| `NEXT_PUBLIC_ATTACHMENTS_BUCKET_NAME` | No | S3 bucket for attachments |

## Scripts

| Command | Description |
|---|---|
| `pnpm dev` | Start development server with Turbo |
| `pnpm build` | Build for production |
| `pnpm start` | Start production server |
| `pnpm lint` | Run ESLint |
| `pnpm typecheck` | Run TypeScript type checking |
| `pnpm test` | Run tests |
| `pnpm test:watch` | Run tests in watch mode |
| `pnpm db:migrate` | Run database migrations |
| `pnpm db:push` | Push schema to database |
| `pnpm db:studio` | Open Drizzle Studio |

## Project Structure

```
src/
├── components/      Reusable UI components
├── db/
│   ├── schema/      Drizzle database schema definitions
│   └── repository/  Data access layer
├── hooks/           Custom React hooks
├── lib/             Shared utilities and constants
├── pages/           Next.js pages and API routes
│   └── api/         tRPC endpoint, REST API (v1), auth
├── providers/       React context providers
├── server/
│   ├── routers/     tRPC procedure definitions
│   └── utils/       Server utilities (rate limiting, etc.)
├── styles/          Global CSS
├── views/           Page-specific view components
└── env.ts           Environment variable validation
```
