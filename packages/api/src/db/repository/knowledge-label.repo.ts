import { and, eq, isNull } from "drizzle-orm";
import { generateUID } from "../../lib/utils";
import type { dbClient } from "../client";
import { knowledgeLabels } from "../schema";

export const getAllByUserId = async (db: dbClient, userId: string) => {
  return db.query.knowledgeLabels.findMany({
    columns: {
      id: true,
      publicId: true,
      name: true,
      colourCode: true,
    },
    where: and(
      eq(knowledgeLabels.createdBy, userId),
      isNull(knowledgeLabels.deletedAt),
    ),
  });
};

export const create = async (
  db: dbClient,
  input: {
    name: string;
    colourCode: string;
    createdBy: string;
  },
) => {
  const [result] = await db
    .insert(knowledgeLabels)
    .values({
      publicId: generateUID(),
      name: input.name,
      colourCode: input.colourCode,
      createdBy: input.createdBy,
    })
    .returning({
      publicId: knowledgeLabels.publicId,
      name: knowledgeLabels.name,
      colourCode: knowledgeLabels.colourCode,
    });

  return result;
};

export const update = async (
  db: dbClient,
  input: {
    publicId: string;
    name: string;
    colourCode: string;
  },
) => {
  const [result] = await db
    .update(knowledgeLabels)
    .set({
      name: input.name,
      colourCode: input.colourCode,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(knowledgeLabels.publicId, input.publicId),
        isNull(knowledgeLabels.deletedAt),
      ),
    )
    .returning({
      publicId: knowledgeLabels.publicId,
      name: knowledgeLabels.name,
      colourCode: knowledgeLabels.colourCode,
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
    .update(knowledgeLabels)
    .set({
      deletedAt: new Date(),
      deletedBy: args.deletedBy,
    })
    .where(
      and(
        eq(knowledgeLabels.publicId, args.publicId),
        isNull(knowledgeLabels.deletedAt),
      ),
    )
    .returning({
      publicId: knowledgeLabels.publicId,
    });

  return result;
};

export const getIdByPublicId = async (db: dbClient, publicId: string) => {
  const result = await db.query.knowledgeLabels.findFirst({
    columns: { id: true },
    where: and(
      eq(knowledgeLabels.publicId, publicId),
      isNull(knowledgeLabels.deletedAt),
    ),
  });

  return result ?? null;
};
