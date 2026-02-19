---
name: kan-task-manager
description: >
  Manage tasks on a Kan Kanban board via its REST API. Use when the agent needs to
  create, update, move, or delete cards (tasks) on a board; create or manage lists,
  labels, and checklists; or query board state. Triggers on any request involving
  task tracking, project management, or Kanban workflows backed by a running Kan instance.
---

# Kan Task Manager

Kan is a self-hostable Kanban board. The API runs on `http://localhost:3001` (Elysia framework, no auth required in local dev — a default user is auto-provisioned).

All entities expose a `publicId` (12-char string) used in URLs. Internal integer IDs are never exposed.

## Workflow: Creating a Task

1. List boards to find the target board's `publicId`
2. Fetch the board to get its lists and their `publicId` values
3. POST a card to the desired list

## API Reference

Base URL: `http://localhost:3001`

All requests use `Content-Type: application/json`.

### Boards

```
GET    /boards                          → list all boards
GET    /boards/:boardPublicId           → get board (includes lists with cards)
POST   /boards                          → create board
PUT    /boards/:boardPublicId           → update board
DELETE /boards/:boardPublicId           → soft-delete board
```

**Create board:**
```json
POST /boards
{
  "name": "Sprint 1",
  "lists": ["To Do", "In Progress", "Done"],
  "labels": ["Bug", "Feature", "Chore"]
}
```

**Update board:**
```json
PUT /boards/:boardPublicId
{
  "name": "Sprint 2",
  "slug": "sprint-2",
  "visibility": "public"
}
```

### Lists

```
POST   /lists                           → create list
PUT    /lists/:listPublicId             → update/reorder list
DELETE /lists/:listPublicId             → soft-delete list
```

**Create list:**
```json
POST /lists
{ "name": "Backlog", "boardPublicId": "<boardPublicId>" }
```

**Reorder list:**
```json
PUT /lists/:listPublicId
{ "index": 2 }
```

### Cards (Tasks)

```
GET    /cards/:cardPublicId                         → get card details
POST   /cards                                       → create card
PUT    /cards/:cardPublicId                         → update card
DELETE /cards/:cardPublicId                         → soft-delete card
PUT    /cards/:cardPublicId/labels/:labelPublicId   → toggle label on card
```

**Create card:**
```json
POST /cards
{
  "title": "Fix login bug",
  "description": "Users see a blank screen after OAuth redirect",
  "listPublicId": "<listPublicId>",
  "position": "end",
  "dueDate": "2026-03-01T00:00:00.000Z",
  "labelPublicIds": ["<labelPublicId>"]
}
```

Fields: `title` (1–2000 chars, required), `description` (markdown string, max 10000, required), `listPublicId` (required), `position` (`"start"` or `"end"`, required). Optional: `dueDate` (ISO string or null), `labelPublicIds` (array).

**Update card:**
```json
PUT /cards/:cardPublicId
{
  "title": "Fix login bug (critical)",
  "description": "Updated description",
  "dueDate": "2026-03-15T00:00:00.000Z"
}
```

**Move card to another list:**
```json
PUT /cards/:cardPublicId
{
  "listPublicId": "<targetListPublicId>",
  "index": 0
}
```

### Labels

```
GET    /labels/:labelPublicId           → get label
POST   /labels                          → create label
PUT    /labels/:labelPublicId           → update label
DELETE /labels/:labelPublicId           → soft-delete label
```

**Create label:**
```json
POST /labels
{
  "name": "Urgent",
  "boardPublicId": "<boardPublicId>",
  "colourCode": "#dc2626"
}
```

Available colours: `#0d9488` (teal), `#65a30d` (green), `#0284c7` (blue), `#4f46e5` (purple), `#ca8a04` (yellow), `#ea580c` (orange), `#dc2626` (red), `#db2777` (pink).

### Checklists

```
POST   /checklists                                  → create checklist on card
PUT    /checklists/:checklistPublicId               → rename checklist
DELETE /checklists/:checklistPublicId               → soft-delete checklist
POST   /checklists/:checklistPublicId/items         → add item
PATCH  /checklists/items/:checklistItemPublicId     → update/reorder item
DELETE /checklists/items/:checklistItemPublicId     → soft-delete item
```

**Create checklist:**
```json
POST /checklists
{ "cardPublicId": "<cardPublicId>", "name": "Acceptance Criteria" }
```

**Add checklist item:**
```json
POST /checklists/:checklistPublicId/items
{ "title": "Unit tests pass" }
```

**Toggle item completion:**
```json
PATCH /checklists/items/:checklistItemPublicId
{ "completed": true }
```

### Health

```
GET /health   → { "status": "ok", "database": "connected" }
GET /stats    → { "boards": 5, "cards": 42, "users": 1 }
```

## Common Patterns

**Full task creation flow using curl:**

```bash
# 1. Get boards
curl -s http://localhost:3001/boards | jq .

# 2. Get a specific board's lists
curl -s http://localhost:3001/boards/<boardPublicId> | jq '.lists[] | {publicId, name}'

# 3. Create a card on the first list
curl -s -X POST http://localhost:3001/cards \
  -H 'Content-Type: application/json' \
  -d '{"title":"My task","description":"","listPublicId":"<listPublicId>","position":"end"}'

# 4. Move card to "Done" list
curl -s -X PUT http://localhost:3001/cards/<cardPublicId> \
  -H 'Content-Type: application/json' \
  -d '{"listPublicId":"<doneListPublicId>","index":0}'
```

**Board query filters** (as query params on GET /boards/:id):
- `members[]` — filter by member IDs
- `labels[]` — filter by label publicIds
- `lists[]` — filter by list publicIds
- `dueDateFilters[]` — `overdue`, `today`, `tomorrow`, `next-week`, `next-month`, `no-due-date`

## Running the App

```bash
# Install dependencies
pnpm install

# Start dev (API on :3001, Web on :3000)
pnpm dev

# Or with Docker
docker compose up
```

Requires `POSTGRES_URL` in `apps/api/.env` and `apps/web/.env`.
