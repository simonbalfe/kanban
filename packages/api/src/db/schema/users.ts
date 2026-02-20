import { relations, sql } from "drizzle-orm";
import { pgTable, timestamp, uuid, varchar } from "drizzle-orm/pg-core";

import { boards } from "./boards";
import { cards } from "./cards";
import { lists } from "./lists";

export const users = pgTable("user", {
  id: uuid("id").notNull().primaryKey().default(sql`uuid_generate_v4()`),
  name: varchar("name", { length: 255 }),
  email: varchar("email", { length: 255 }).notNull().unique(),
  image: varchar("image", { length: 255 }),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
}).enableRLS();

export const usersRelations = relations(users, ({ many }) => ({
  deletedBoards: many(boards, {
    relationName: "boardDeletedByUser",
  }),
  boards: many(boards, {
    relationName: "boardCreatedByUser",
  }),
  deletedCards: many(cards, {
    relationName: "cardsDeletedByUser",
  }),
  cards: many(cards, {
    relationName: "cardsCreatedByUser",
  }),
  deletedLists: many(lists, {
    relationName: "listsDeletedByUser",
  }),
  lists: many(lists, {
    relationName: "listsCreatedByUser",
  }),
}));
