# Plan: Strip Workspaces from Kanban App

## Strategy

The workspace layer sits between users and boards. Boards have a `workspaceId` FK, and workspace members are the identity used for card assignments. Since permissions are already no-ops, the main job is removing the workspace indirection so boards belong directly to the authenticated user instead.

**Key decisions:**
- Remove `workspaceId` from `boards` table (and the unique slug constraint that uses it)
- Remove `workspace` and `workspace_members` tables entirely
- Remove the `_card_workspace_members` junction table (card member assignments) and `workspaceMemberId` from `card_activity` — these tie to workspace_members which is going away
- Remove the entire members system (invite, roles, etc.) since it's workspace-scoped
- Remove the workspace provider, workspace menu, workspace settings, and public workspace routes from the frontend
- Remove the permission system entirely (already no-ops)
- Board slug uniqueness becomes global (per user via `createdBy`) instead of per-workspace
- Search moves from workspace-scoped to user-scoped (boards where `createdBy = userId`)

## Changes by Layer

### 1. Database Schema

**`src/db/schema/workspaces.ts`** — DELETE entire file
- Removes: `workspace`, `workspace_members` tables, role/status enums, relations

**`src/db/schema/boards.ts`** — Edit
- Remove `workspaceId` column and its FK to workspaces
- Remove `import { workspaces }`
- Remove workspace relation from `boardsRelations`
- Change unique index from `(workspaceId, slug)` to just `(slug, createdBy)` or `(slug)` with deletedAt filter

**`src/db/schema/cards.ts`** — Edit
- Remove `import { workspaceMembers }`
- Remove `cardToWorkspaceMembers` table and its relations
- Remove `workspaceMemberId` from `cardActivities` table and its relation
- Remove `members: many(cardToWorkspaceMembers)` from cards relations

**`src/db/schema/index.ts`** — Edit
- Remove `export * from "./workspaces"`

### 2. Repositories

**`src/db/repository/workspace.repo.ts`** — DELETE entire file

**`src/db/repository/member.repo.ts`** — DELETE entire file

**`src/db/repository/board.repo.ts`** — Edit
- `getAllByWorkspaceId` → rename to `getAllByUserId`, filter by `createdBy` instead of `workspaceId`
- `getByPublicId` — remove `workspace` from the `with` clause (including workspace members)
- `getBySlug` — change to look up by slug alone (remove workspaceId param), remove workspace from `with`
- `create` / `createFromSnapshot` — remove `workspaceId` from input/insert
- `isSlugUnique` / `isBoardSlugAvailable` — remove `workspaceId` param, check globally or per-user
- `getWorkspaceAndBoardIdByBoardPublicId` — rename, remove `workspaceId` from return
- `getWithListIdsByPublicId` / `getWithLatestListIndexByPublicId` — remove `workspaceId` from columns
- `hardDelete` — change to delete by boardId instead of workspaceId
- `searchBoardsAndCards` — filter by `createdBy` instead of `workspaceId`

**`src/db/repository/card.repo.ts`** — Edit
- `getWorkspaceAndCardIdByCardPublicId` — remove `workspaceId`/`workspaceVisibility` from return
- `getWithListAndMembersByPublicId` — remove `workspace` from the nested `with` query, remove card `members` that reference workspace_members
- Remove `bulkCreateCardWorkspaceMemberRelationships`
- Remove `getCardMemberRelationship`, `createCardMemberRelationship`, `hardDeleteCardMemberRelationship`
- Remove imports of `workspaceMembers`, `cardToWorkspaceMembers`

**`src/db/repository/list.repo.ts`** — Edit
- `getWorkspaceAndListIdByListPublicId` — remove `workspaceId` from return

**`src/db/repository/label.repo.ts`** — Edit
- `getWorkspaceAndLabelIdByLabelPublicId` — remove `workspaceId` from return

**`src/db/repository/checklist.repo.ts`** — Edit
- `getChecklistByPublicId` — remove `workspace: true` from nested board `with`
- `getChecklistItemByPublicIdWithChecklist` — same

### 3. Server Routers

**`src/server/routers/workspace.ts`** — DELETE entire file

**`src/server/routers/member.ts`** — DELETE entire file

**`src/server/utils/permissions.ts`** — DELETE entire file

**`src/server/root.ts`** — Edit
- Remove workspace and member router imports and registrations

**`src/server/routers/board.ts`** — Edit
- `all` — remove `workspacePublicId` input, query boards by `createdBy = userId`
- `byId` — remove workspace permission check
- `bySlug` — remove workspace lookup, query by slug+visibility directly
- `create` — remove `workspacePublicId` input, remove workspace lookup
- `update` — remove workspace permission calls, use `board.createdBy` for auth
- `delete` — same
- `checkSlugAvailability` — remove workspace scoping
- Remove all `assertPermission`/`assertCanEdit`/`assertCanDelete` calls
- Remove `workspaceRepo` import

**`src/server/routers/card.ts`** — Edit
- Remove all `assertPermission`/`assertCanEdit`/`assertCanDelete` calls
- Remove workspace lookups from each procedure
- Remove `addOrRemoveMember` procedure entirely
- In `create` — remove member assignment logic
- In `byId` — remove workspace visibility check (use board visibility directly)
- Remove `workspaceRepo` import

**`src/server/routers/list.ts`** — Edit
- Remove all permission calls, simplify workspace lookups to just board lookups

**`src/server/routers/label.ts`** — Edit
- Remove all permission calls

**`src/server/routers/attachment.ts`** — Edit
- Remove workspace lookup for S3 key generation (use board publicId or card publicId instead)
- Remove `assertMember` calls
- Remove `workspaceRepo` import

**`src/server/routers/checklist.ts`** — Edit
- Remove all `assertPermission` calls that traverse to `workspace.id`

### 4. Frontend — Providers & Layout

**`src/providers/workspace.tsx`** — DELETE entire file

**`src/hooks/usePermissions.ts`** — DELETE entire file

**`src/components/Dashboard.tsx`** — Edit
- Remove `WorkspaceProvider` wrapper
- Remove workspace-related modals (NEW_WORKSPACE)
- Remove `useWorkspace` usage

**`src/components/SideNavigation.tsx`** — Edit
- Remove `WorkspaceMenu` component
- Remove `useWorkspace` hook usage
- Remove Members nav link (workspace-scoped feature)

**`src/components/WorkspaceMenu.tsx`** — DELETE entire file

**`src/components/SettingsLayout.tsx`** — Edit
- Remove "Workspace" tab
- Remove `useWorkspace` and `usePermissions` usage

**`src/components/CommandPallette.tsx`** — Edit
- Remove workspace-scoped search, search all user boards instead

**`src/components/NewWorkspaceForm.tsx`** — DELETE entire file

### 5. Frontend — Views

**`src/views/boards/index.tsx`** — Edit
- Remove `useWorkspace`, remove NEW_WORKSPACE modal

**`src/views/boards/components/BoardsList.tsx`** — Edit
- Remove `workspacePublicId` from query, fetch all boards for user

**`src/views/boards/components/NewBoardForm.tsx`** — Edit
- Remove `workspacePublicId` from form/mutation

**`src/views/board/index.tsx`** — Edit
- Remove `useWorkspace`, remove workspace references in slug form, visibility button
- Remove NEW_WORKSPACE modal

**`src/views/board/components/UpdateBoardSlugForm.tsx`** — Edit
- Remove `workspaceSlug` prop

**`src/views/board/components/NewTemplateForm.tsx`** — Edit
- Remove `workspacePublicId` prop

**`src/views/board/components/NewCardForm.tsx`** — Edit
- Remove workspace members for mentions (simplify to board-level)

**`src/views/card/index.tsx`** — Edit
- Remove `useWorkspace`, remove workspace breadcrumb, NEW_WORKSPACE modal

**`src/views/card/components/MemberSelector.tsx`** — DELETE or gut (no more workspace members)

**`src/views/card/components/NewCommentForm.tsx`** — Edit
- Remove `workspaceMembers` prop for mentions

### 6. Frontend — Pages to Delete

**`src/pages/settings/workspace.tsx`** — DELETE
**`src/pages/[workspaceSlug]/index.tsx`** — DELETE
**`src/pages/[workspaceSlug]/[...boardSlug].tsx`** — DELETE
**`src/views/settings/WorkspaceSettings.tsx`** — DELETE
**`src/views/settings/components/UpdateWorkspaceNameForm.tsx`** — DELETE
**`src/views/settings/components/UpdateWorkspaceUrlForm.tsx`** — DELETE
**`src/views/settings/components/UpdateWorkspaceDescriptionForm.tsx`** — DELETE
**`src/views/settings/components/UpdateWorkspaceEmailVisibilityForm.tsx`** — DELETE
**`src/views/settings/components/DeleteWorkspaceConfirmation.tsx`** — DELETE
**`src/views/members/index.tsx`** — DELETE
**`src/views/members/components/InviteMemberForm.tsx`** — DELETE
**`src/views/members/components/DeleteMemberConfirmation.tsx`** — DELETE
**`src/views/public/boards/index.tsx`** — DELETE
**`src/views/public/board/index.tsx`** — DELETE

### 7. Database Migration

Generate a new Drizzle migration that:
- Drops the `workspace_members` table
- Drops the `_card_workspace_members` table
- Drops the `workspaceMemberId` column from `card_activity`
- Drops the `workspaceId` column from `board`
- Drops the `workspace` table
- Drops the `role` and `member_status` enums
- Updates the unique index on `board` (slug)

## Execution Order

1. Schema changes (DB layer)
2. Repository updates
3. Router updates
4. Frontend provider/layout cleanup
5. Frontend view cleanup
6. Delete unused files
7. Generate migration
8. Type-check to verify
