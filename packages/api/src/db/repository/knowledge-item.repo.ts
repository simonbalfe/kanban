import { and, desc, eq, isNull } from "drizzle-orm";
import { generateUID } from "../../lib/utils";
import type { dbClient } from "../client";
import type { KnowledgeItemType } from "../schema";
import { knowledgeItems, knowledgeItemsToLabels } from "../schema";

export const getAllByUserId = async (db: dbClient, userId: string) => {
  return db.query.knowledgeItems.findMany({
    columns: {
      publicId: true,
      title: true,
      description: true,
      type: true,
      url: true,
      createdAt: true,
    },
    with: {
      labels: {
        with: {
          knowledgeLabel: {
            columns: {
              publicId: true,
              name: true,
              colourCode: true,
            },
          },
        },
      },
    },
    where: and(
      eq(knowledgeItems.createdBy, userId),
      isNull(knowledgeItems.deletedAt),
    ),
    orderBy: [desc(knowledgeItems.createdAt)],
  });
};

export const getByPublicId = async (db: dbClient, publicId: string) => {
  return db.query.knowledgeItems.findFirst({
    columns: {
      publicId: true,
      title: true,
      description: true,
      type: true,
      url: true,
      createdAt: true,
    },
    with: {
      labels: {
        with: {
          knowledgeLabel: {
            columns: {
              publicId: true,
              name: true,
              colourCode: true,
            },
          },
        },
      },
    },
    where: and(
      eq(knowledgeItems.publicId, publicId),
      isNull(knowledgeItems.deletedAt),
    ),
  });
};

export const create = async (
  db: dbClient,
  input: {
    title: string;
    type: KnowledgeItemType;
    url?: string | null;
    description?: string | null;
    createdBy: string;
  },
) => {
  const [result] = await db
    .insert(knowledgeItems)
    .values({
      publicId: generateUID(),
      title: input.title,
      type: input.type,
      url: input.url ?? null,
      description: input.description ?? null,
      createdBy: input.createdBy,
    })
    .returning({
      publicId: knowledgeItems.publicId,
      title: knowledgeItems.title,
      type: knowledgeItems.type,
      url: knowledgeItems.url,
      description: knowledgeItems.description,
    });

  return result;
};

export const update = async (
  db: dbClient,
  input: {
    publicId: string;
    title?: string;
    description?: string | null;
    url?: string | null;
    type?: KnowledgeItemType;
  },
) => {
  const [result] = await db
    .update(knowledgeItems)
    .set({
      title: input.title,
      description: input.description,
      url: input.url,
      type: input.type,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(knowledgeItems.publicId, input.publicId),
        isNull(knowledgeItems.deletedAt),
      ),
    )
    .returning({
      publicId: knowledgeItems.publicId,
      title: knowledgeItems.title,
      type: knowledgeItems.type,
      url: knowledgeItems.url,
      description: knowledgeItems.description,
    });

  return result;
};

export const softDelete = async (
  db: dbClient,
  args: {
    publicId: string;
    deletedBy: string;
  },
) => {
  const [result] = await db
    .update(knowledgeItems)
    .set({
      deletedAt: new Date(),
      deletedBy: args.deletedBy,
    })
    .where(
      and(
        eq(knowledgeItems.publicId, args.publicId),
        isNull(knowledgeItems.deletedAt),
      ),
    )
    .returning({
      publicId: knowledgeItems.publicId,
    });

  return result;
};

export const getIdByPublicId = async (db: dbClient, publicId: string) => {
  const result = await db.query.knowledgeItems.findFirst({
    columns: { id: true },
    where: and(
      eq(knowledgeItems.publicId, publicId),
      isNull(knowledgeItems.deletedAt),
    ),
  });

  return result ?? null;
};

export const toggleLabel = async (
  db: dbClient,
  args: { knowledgeItemId: number; knowledgeLabelId: number },
) => {
  const existing = await db.query.knowledgeItemsToLabels.findFirst({
    where: and(
      eq(knowledgeItemsToLabels.knowledgeItemId, args.knowledgeItemId),
      eq(knowledgeItemsToLabels.knowledgeLabelId, args.knowledgeLabelId),
    ),
  });

  if (existing) {
    await db
      .delete(knowledgeItemsToLabels)
      .where(
        and(
          eq(knowledgeItemsToLabels.knowledgeItemId, args.knowledgeItemId),
          eq(knowledgeItemsToLabels.knowledgeLabelId, args.knowledgeLabelId),
        ),
      );
    return { added: false };
  }

  await db.insert(knowledgeItemsToLabels).values({
    knowledgeItemId: args.knowledgeItemId,
    knowledgeLabelId: args.knowledgeLabelId,
  });
  return { added: true };
};
