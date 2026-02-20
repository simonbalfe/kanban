---
name: kan-task-manager
description: Manage tasks on a Kan Kanban board via its REST API. Use when the agent needs to create, update, move, or delete cards (tasks) on a board; create or manage lists, labels, and checklists; or query board state. Triggers on any request involving task tracking, project management, or Kanban workflows backed by a running Kan instance.
---

# Kan Task Manager

Kan is a self-hosted Kanban board application. This skill enables interaction with its REST API to manage boards, lists, cards, labels, and checklists.

## Base URL

All endpoints are prefixed with `/api`. The default local development URL is `http://localhost:3000/api`.

## Core Concepts

- **Board**: Top-level container holding lists and labels. Has a `publicId` and a unique `slug`.
- **List**: A column within a board (e.g., "To Do", "In Progress", "Done"). Contains cards ordered by `index`.
- **Card**: A task within a list. Supports descriptions, due dates, labels, and checklists.
- **Label**: A colored tag scoped to a board, applied to cards via toggle.
- **Checklist**: A named checklist attached to a card, containing ordered items with completion state.

All entities use `publicId` (12-char string) as the identifier in API paths. Internal numeric `id` is never used in requests.

Soft-delete is used throughout: deleted records keep their data but are excluded from queries.

## Authentication

No token-based auth. A default user (`local@kan.dev`) is auto-created and injected into every request.

## Endpoints

### Health

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/health` | Returns `{ status, database }` both `"ok"` or `"error"` |
| GET | `/stats` | Returns counts: `{ users, boards, lists, cards, checklistItems, checklists, labels }` |

### Users

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/users/me` | Get current user profile |
| PUT | `/users/` | Update user. Body: `{ name?, image? }` |

### Boards

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/boards/` | List all boards. Query: `type?=regular\|template` |
| GET | `/boards/:boardPublicId` | Get board with lists, cards, labels. Query filters: `members`, `labels`, `lists`, `dueDateFilters`, `type` |
| GET | `/boards/by-slug/:boardSlug` | Same as above but lookup by slug |
| POST | `/boards/` | Create board. Body: `{ name, lists: string[], labels: string[], type?, sourceBoardPublicId? }` |
| PUT | `/boards/:boardPublicId` | Update board. Body: `{ name?, slug?, visibility? }` |
| DELETE | `/boards/:boardPublicId` | Soft-delete board and all child lists/cards |
| GET | `/boards/:boardPublicId/check-slug` | Check slug availability. Query: `boardSlug`. Returns `{ isReserved }` |

### Lists

| Method | Path | Purpose |
|--------|------|---------|
| POST | `/lists/` | Create list. Body: `{ name, boardPublicId }` |
| PUT | `/lists/:listPublicId` | Update list. Body: `{ name?, index? }` |
| DELETE | `/lists/:listPublicId` | Soft-delete list and all child cards |

### Cards

| Method | Path | Purpose |
|--------|------|---------|
| POST | `/cards/` | Create card. Body: `{ title, description?, listPublicId, labelPublicIds?, position, dueDate? }` |
| GET | `/cards/:cardPublicId` | Get card with list info and labels |
| PUT | `/cards/:cardPublicId` | Update card. Body: `{ title?, description?, index?, listPublicId?, dueDate? }` |
| DELETE | `/cards/:cardPublicId` | Soft-delete card |
| PUT | `/cards/:cardPublicId/labels/:labelPublicId` | Toggle label on card. Returns `{ newLabel: boolean }` |

### Labels

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/labels/:labelPublicId` | Get label details |
| POST | `/labels/` | Create label. Body: `{ name, boardPublicId, colourCode }` (`colourCode` is hex `#RRGGBB`) |
| PUT | `/labels/:labelPublicId` | Update label. Body: `{ name, colourCode }` |
| DELETE | `/labels/:labelPublicId` | Soft-delete label and remove from all cards |

### Checklists

| Method | Path | Purpose |
|--------|------|---------|
| POST | `/checklists/` | Create checklist. Body: `{ cardPublicId, name }` |
| PUT | `/checklists/:checklistPublicId` | Update checklist. Body: `{ name }` |
| DELETE | `/checklists/:checklistPublicId` | Soft-delete checklist and all items |
| POST | `/checklists/:checklistPublicId/items` | Create item. Body: `{ title }` |
| PATCH | `/checklists/items/:checklistItemPublicId` | Update item. Body: `{ title?, completed?, index? }` |
| DELETE | `/checklists/items/:checklistItemPublicId` | Soft-delete item |

## Common Workflows

### Create a board with default columns

```
POST /api/boards/
{
  "name": "My Project",
  "lists": ["Backlog", "In Progress", "Done"],
  "labels": ["Bug", "Feature", "Urgent"]
}
```

### Add a task to a list

1. `GET /api/boards/` to find the board's `publicId`.
2. `GET /api/boards/:boardPublicId` to find the target list's `publicId`.
3. `POST /api/cards/` with `{ title, listPublicId, position: { index: 0 } }`.

### Move a card to a different list

```
PUT /api/cards/:cardPublicId
{ "listPublicId": "<target-list-public-id>", "index": 0 }
```

### Toggle a label on a card

```
PUT /api/cards/:cardPublicId/labels/:labelPublicId
```

Returns `{ newLabel: true }` if added, `{ newLabel: false }` if removed.

### Add a checklist with items

1. `POST /api/checklists/` with `{ cardPublicId, name: "Subtasks" }`.
2. `POST /api/checklists/:checklistPublicId/items` with `{ title: "Step 1" }`.
3. `PATCH /api/checklists/items/:itemPublicId` with `{ completed: true }` to check it off.

## Error Handling

All errors return JSON `{ error: string }` with standard HTTP status codes:
- **400** — validation failure or slug conflict
- **404** — resource not found
- **500** — server error

## Field Constraints

| Field | Constraint |
|-------|-----------|
| Board name | 1–100 chars |
| Card title | 1–2000 chars |
| Card description | max 10000 chars |
| Label name | 1–36 chars |
| Label colourCode | hex `#RRGGBB` |
| Checklist name | 1–255 chars |
| Checklist item title | 1–500 chars |
