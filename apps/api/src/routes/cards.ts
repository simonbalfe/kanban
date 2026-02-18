import { Elysia, t } from "elysia";

import type { dbClient } from "../db/client";
import * as cardRepo from "../db/repository/card.repo";
import * as labelRepo from "../db/repository/label.repo";
import * as listRepo from "../db/repository/list.repo";
import {
  errorResponseSchema,
  movePositionSchema,
  successResponseSchema,
} from "../lib/schemas";

export const cardRoutes = (db: dbClient) =>
  new Elysia({ prefix: "/cards" })
    .state("userId", "")
    .post("/", async ({ body, store, set }) => {
      const userId = store.userId;

      const list = await listRepo.getListIdByPublicId(db, body.listPublicId);
      if (!list) {
        set.status = 404;
        return { error: "List not found" };
      }

      const newCard = await cardRepo.create(db, {
        title: body.title,
        description: body.description,
        createdBy: userId,
        listId: list.id,
        position: body.position,
        dueDate: body.dueDate ? new Date(body.dueDate) : null,
      });

      if (!newCard?.id) {
        set.status = 500;
        return { error: "Failed to create card" };
      }

      if (body.labelPublicIds?.length) {
        const labels = await labelRepo.getAllByPublicIds(db, body.labelPublicIds);
        if (labels.length) {
          await cardRepo.bulkCreateCardLabelRelationships(
            db,
            labels.map((label) => ({ cardId: newCard.id, labelId: label.id })),
          );
        }
      }

      return newCard;
    }, {
      body: t.Object({
        title: t.String({ minLength: 1, maxLength: 2000 }),
        description: t.String({ maxLength: 10000 }),
        listPublicId: t.String(),
        labelPublicIds: t.Optional(t.Array(t.String())),
        position: movePositionSchema,
        dueDate: t.Optional(t.Nullable(t.String())),
      }),
      response: {
        404: errorResponseSchema,
        500: errorResponseSchema,
      },
    })

    .get("/:cardPublicId", async ({ params, set }) => {
      const card = await cardRepo.getCardIdByPublicId(db, params.cardPublicId);
      if (!card) {
        set.status = 404;
        return { error: "Card not found" };
      }

      const result = await cardRepo.getWithListAndMembersByPublicId(db, params.cardPublicId);
      if (!result) {
        set.status = 404;
        return { error: "Card not found" };
      }

      return result;
    }, {
      params: t.Object({ cardPublicId: t.String() }),
      response: {
        404: errorResponseSchema,
      },
    })

    .put("/:cardPublicId", async ({ params, body, set }) => {
      const card = await cardRepo.getCardIdByPublicId(db, params.cardPublicId);
      if (!card) {
        set.status = 404;
        return { error: "Card not found" };
      }

      const existingCard = await cardRepo.getByPublicId(db, params.cardPublicId);
      if (!existingCard) {
        set.status = 404;
        return { error: "Card not found" };
      }

      let newListId: number | undefined;
      if (body.listPublicId) {
        const newList = await listRepo.getByPublicId(db, body.listPublicId);
        if (!newList) {
          set.status = 404;
          return { error: "List not found" };
        }
        newListId = newList.id;
      }

      let result:
        | Awaited<ReturnType<typeof cardRepo.update>>
        | Awaited<ReturnType<typeof cardRepo.reorder>>
        | null
        = null;

      if (
        body.title !== undefined ||
        body.description !== undefined ||
        body.dueDate !== undefined
      ) {
        result = await cardRepo.update(
          db,
          {
            ...(body.title !== undefined ? { title: body.title } : {}),
            ...(body.description !== undefined ? { description: body.description } : {}),
            ...(body.dueDate !== undefined && {
              dueDate: body.dueDate ? new Date(body.dueDate) : null,
            }),
          },
          { cardPublicId: params.cardPublicId },
        );
      }

      if (body.index !== undefined) {
        result = await cardRepo.reorder(db, {
          cardId: existingCard.id,
          newIndex: body.index,
          newListId,
        });
      }

      if (!result) {
        set.status = 500;
        return { error: "Failed to update card" };
      }

      return result;
    }, {
      params: t.Object({ cardPublicId: t.String() }),
      body: t.Object({
        title: t.Optional(t.String()),
        description: t.Optional(t.String()),
        index: t.Optional(t.Number()),
        listPublicId: t.Optional(t.String()),
        dueDate: t.Optional(t.Nullable(t.String())),
      }, {
        minProperties: 1,
      }),
      response: {
        404: errorResponseSchema,
        500: errorResponseSchema,
      },
    })

    .delete("/:cardPublicId", async ({ params, store, set }) => {
      const userId = store.userId;

      const card = await cardRepo.getCardIdByPublicId(db, params.cardPublicId);
      if (!card) {
        set.status = 404;
        return { error: "Card not found" };
      }

      await cardRepo.softDelete(db, {
        cardId: card.id,
        deletedAt: new Date(),
        deletedBy: userId,
      });

      return { success: true };
    }, {
      params: t.Object({ cardPublicId: t.String() }),
      response: {
        200: successResponseSchema,
        404: errorResponseSchema,
      },
    })

    .put("/:cardPublicId/labels/:labelPublicId", async ({ params, set }) => {
      const card = await cardRepo.getCardIdByPublicId(db, params.cardPublicId);
      if (!card) {
        set.status = 404;
        return { error: "Card not found" };
      }

      const label = await labelRepo.getByPublicId(db, params.labelPublicId);
      if (!label) {
        set.status = 404;
        return { error: "Label not found" };
      }

      const cardLabelIds = { cardId: card.id, labelId: label.id };
      const existing = await cardRepo.getCardLabelRelationship(db, cardLabelIds);

      if (existing) {
        await cardRepo.hardDeleteCardLabelRelationship(db, cardLabelIds);
        return { newLabel: false };
      }

      await cardRepo.createCardLabelRelationship(db, cardLabelIds);
      return { newLabel: true };
    }, {
      params: t.Object({
        cardPublicId: t.String(),
        labelPublicId: t.String(),
      }),
      response: {
        200: t.Object({ newLabel: t.Boolean() }),
        404: errorResponseSchema,
      },
    });
