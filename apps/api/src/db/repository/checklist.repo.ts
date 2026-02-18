import { and, count, desc, eq, isNull, sql } from "drizzle-orm";

import type { dbClient } from "../client";
import { checklistItems, checklists } from "../schema";
import { generateUID } from "../../lib/utils";

export const getCount = async (db: dbClient) => {
  const result = await db
    .select({ count: count() })
    .from(checklists)
    .where(isNull(checklists.deletedAt));
  return result[0]?.count ?? 0;
};

export const getCountItems = async (db: dbClient) => {
  const result = await db
    .select({ count: count() })
    .from(checklistItems)
    .where(isNull(checklistItems.deletedAt));
  return result[0]?.count ?? 0;
};

export const create = async (
  db: dbClient,
  checklistInput: {
    cardId: number;
    name: string;
    createdBy: string;
  },
) => {
  return db.transaction(async (tx) => {
    const card = await tx.query.checklists.findFirst({
      where: and(
        eq(checklists.cardId, checklistInput.cardId),
        isNull(checklists.deletedAt),
      ),
      orderBy: desc(checklists.index),
    });

    const [result] = await tx
      .insert(checklists)
      .values({
        publicId: generateUID(),
        name: checklistInput.name,
        createdBy: checklistInput.createdBy,
        cardId: checklistInput.cardId,
        index: card ? card.index + 1 : 0,
      })
      .returning({
        id: checklists.id,
        publicId: checklists.publicId,
        name: checklists.name,
      });

    return result;
  });
};

export const createItem = async (
  db: dbClient,
  checklistItemInput: {
    checklistId: number;
    title: string;
    createdBy: string;
    completed?: boolean;
  },
) => {
  return db.transaction(async (tx) => {
    const lastItem = await tx.query.checklistItems.findFirst({
      where: and(
        eq(checklistItems.checklistId, checklistItemInput.checklistId),
        isNull(checklistItems.deletedAt),
      ),
      orderBy: desc(checklistItems.index),
    });

    const [result] = await tx
      .insert(checklistItems)
      .values({
        publicId: generateUID(),
        title: checklistItemInput.title,
        createdBy: checklistItemInput.createdBy,
        checklistId: checklistItemInput.checklistId,
        index: lastItem ? lastItem.index + 1 : 0,
        completed: checklistItemInput.completed ?? false,
      })
      .returning({
        id: checklistItems.id,
        publicId: checklistItems.publicId,
        title: checklistItems.title,
        completed: checklistItems.completed,
      });

    return result;
  });
};

export const getChecklistByPublicId = async (
  db: dbClient,
  checklistPublicId: string,
) => {
  return db.query.checklists.findFirst({
    where: and(
      eq(checklists.publicId, checklistPublicId),
      isNull(checklists.deletedAt),
    ),
    with: {
      card: {
        with: {
          list: {
            with: {
              board: true,
            },
          },
        },
      },
    },
  });
};

export const getChecklistItemByPublicIdWithChecklist = async (
  db: dbClient,
  checklistItemPublicId: string,
) => {
  return db.query.checklistItems.findFirst({
    where: and(
      eq(checklistItems.publicId, checklistItemPublicId),
      isNull(checklistItems.deletedAt),
    ),
    with: {
      checklist: {
        with: {
          card: {
            with: {
              list: {
                with: {
                  board: true,
                },
              },
            },
          },
        },
      },
    },
  });
};

export const updateItemById = async (
  db: dbClient,
  args: { id: number; title?: string; completed?: boolean },
) => {
  const [result] = await db
    .update(checklistItems)
    .set({
      ...(args.title !== undefined ? { title: args.title } : {}),
      ...(args.completed !== undefined ? { completed: args.completed } : {}),
      updatedAt: new Date(),
    })
    .where(eq(checklistItems.id, args.id))
    .returning({
      publicId: checklistItems.publicId,
      title: checklistItems.title,
      completed: checklistItems.completed,
    });

  return result;
};

export const softDeleteItemById = async (
  db: dbClient,
  args: { id: number; deletedAt: Date; deletedBy: string },
) => {
  const [result] = await db
    .update(checklistItems)
    .set({ deletedAt: args.deletedAt, deletedBy: args.deletedBy })
    .where(eq(checklistItems.id, args.id))
    .returning({ id: checklistItems.id });

  return result;
};

export const softDeleteAllItemsByChecklistId = async (
  db: dbClient,
  args: { checklistId: number; deletedAt: Date; deletedBy: string },
) => {
  const result = await db
    .update(checklistItems)
    .set({ deletedAt: args.deletedAt, deletedBy: args.deletedBy })
    .where(
      and(
        eq(checklistItems.checklistId, args.checklistId),
        isNull(checklistItems.deletedAt),
      ),
    )
    .returning({ id: checklistItems.id });

  return result;
};

export const softDeleteById = async (
  db: dbClient,
  args: { id: number; deletedAt: Date; deletedBy: string },
) => {
  const [result] = await db
    .update(checklists)
    .set({ deletedAt: args.deletedAt, deletedBy: args.deletedBy })
    .where(eq(checklists.id, args.id))
    .returning({ id: checklists.id });

  return result;
};

export const updateChecklistById = async (
  db: dbClient,
  args: { id: number; name: string },
) => {
  const [result] = await db
    .update(checklists)
    .set({ name: args.name, updatedAt: new Date() })
    .where(eq(checklists.id, args.id))
    .returning({ publicId: checklists.publicId, name: checklists.name });
  return result;
};

export const reorderItem = async (
  db: dbClient,
  args: {
    itemId: number;
    newIndex: number;
  },
) => {
  return db.transaction(async (tx) => {
    const item = await tx.query.checklistItems.findFirst({
      columns: {
        id: true,
        index: true,
        checklistId: true,
      },
      where: and(
        eq(checklistItems.id, args.itemId),
        isNull(checklistItems.deletedAt),
      ),
    });

    if (!item) {
      throw new Error(`Checklist item not found for ID ${args.itemId}`);
    }

    const currentIndex = item.index;
    const newIndex = args.newIndex;

    if (currentIndex === newIndex) {
      const unchanged = await tx.query.checklistItems.findFirst({
        columns: {
          publicId: true,
          title: true,
          completed: true,
        },
        where: and(
          eq(checklistItems.id, args.itemId),
          isNull(checklistItems.deletedAt),
        ),
      });

      if (!unchanged) {
        throw new Error(`Checklist item not found for ID ${args.itemId}`);
      }

      return unchanged;
    }

    if (currentIndex < newIndex) {
      await tx.execute(sql`
        UPDATE card_checklist_item
        SET index = index - 1
        WHERE "checklistId" = ${item.checklistId}
        AND index > ${currentIndex}
        AND index <= ${newIndex}
        AND "deletedAt" IS NULL
        `);
    } else {
      await tx.execute(sql`
        UPDATE card_checklist_item
        SET index = index + 1
        WHERE "checklistId" = ${item.checklistId}
        AND index >= ${newIndex}
        AND index < ${currentIndex}
        AND "deletedAt" IS NULL
        `);
    }

    const [updated] = await tx
      .update(checklistItems)
      .set({ index: newIndex })
      .where(eq(checklistItems.id, args.itemId))
      .returning({
        publicId: checklistItems.publicId,
        title: checklistItems.title,
        completed: checklistItems.completed,
      });

    if (!updated) {
      throw new Error(`Failed to update checklist item with ID ${args.itemId}`);
    }

    return updated;
  });
};
