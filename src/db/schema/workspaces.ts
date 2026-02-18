import { relations } from "drizzle-orm";
import {
  bigint,
  bigserial,
  boolean,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

import { boards } from "./boards";
import { users } from "./users";

export const memberRoles = ["admin", "member", "guest"] as const;
export type MemberRole = (typeof memberRoles)[number];
export const memberRoleEnum = pgEnum("role", memberRoles);

export const memberStatuses = [
  "invited",
  "active",
  "removed",
  "paused",
] as const;
export type MemberStatus = (typeof memberStatuses)[number];
export const memberStatusEnum = pgEnum("member_status", memberStatuses);

export const workspaces = pgTable("workspace", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  publicId: varchar("publicId", { length: 12 }).notNull().unique(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  showEmailsToMembers: boolean("showEmailsToMembers").notNull().default(true),
  createdBy: uuid("createdBy").references(() => users.id, {
    onDelete: "set null",
  }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt"),
  deletedAt: timestamp("deletedAt"),
  deletedBy: uuid("deletedBy").references(() => users.id, {
    onDelete: "set null",
  }),
}).enableRLS();

export const workspaceRelations = relations(workspaces, ({ one, many }) => ({
  user: one(users, {
    fields: [workspaces.createdBy],
    references: [users.id],
    relationName: "workspaceCreatedByUser",
  }),
  deletedBy: one(users, {
    fields: [workspaces.deletedBy],
    references: [users.id],
    relationName: "workspaceDeletedByUser",
  }),
  members: many(workspaceMembers),
  boards: many(boards),
}));

export const workspaceMembers = pgTable("workspace_members", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  publicId: varchar("publicId", { length: 12 }).notNull().unique(),
  email: varchar("email", { length: 255 }).notNull(),
  userId: uuid("userId").references(() => users.id, { onDelete: "set null" }),
  workspaceId: bigint("workspaceId", { mode: "number" })
    .notNull()
    .references(() => workspaces.id, { onDelete: "cascade" }),
  createdBy: uuid("createdBy").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt"),
  deletedAt: timestamp("deletedAt"),
  deletedBy: uuid("deletedBy").references(() => users.id, {
    onDelete: "set null",
  }),
  // Legacy role enum
  role: memberRoleEnum("role").notNull(),
  status: memberStatusEnum("status").default("invited").notNull(),
}).enableRLS();

export const workspaceMembersRelations = relations(
  workspaceMembers,
  ({ one, many }) => ({
    user: one(users, {
      fields: [workspaceMembers.userId],
      references: [users.id],
      relationName: "workspaceMembersUser",
    }),
    workspace: one(workspaces, {
      fields: [workspaceMembers.workspaceId],
      references: [workspaces.id],
      relationName: "workspaceMembersWorkspace",
    }),
  }),
);

