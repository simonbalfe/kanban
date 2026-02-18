import { Elysia, t } from "elysia";

import type { dbClient } from "../db/client";
import * as cardRepo from "../db/repository/card.repo";
import * as checklistRepo from "../db/repository/checklist.repo";
import { errorResponseSchema, successResponseSchema } from "../lib/schemas";

export const checklistRoutes = (db: dbClient) =>
  new Elysia({ prefix: "/checklists" })
    .state("userId", "")
    .post("/", async ({ body, store, set }) => {
      const userId = store.userId;

      const card = await cardRepo.getCardIdByPublicId(db, body.cardPublicId);
      if (!card) {
        set.status = 404;
        return { error: "Card not found" };
      }

      const result = await checklistRepo.create(db, {
        name: body.name,
        createdBy: userId,
        cardId: card.id,
      });

      if (!result?.id) {
        set.status = 500;
        return { error: "Failed to create checklist" };
      }

      return result;
    }, {
      body: t.Object({
        cardPublicId: t.String(),
        name: t.String({ minLength: 1, maxLength: 255 }),
      }),
      response: {
        404: errorResponseSchema,
        500: errorResponseSchema,
      },
    })

    .put("/:checklistPublicId", async ({ params, body, set }) => {
      const checklist = await checklistRepo.getChecklistByPublicId(db, params.checklistPublicId);
      if (!checklist) {
        set.status = 404;
        return { error: "Checklist not found" };
      }

      const updated = await checklistRepo.updateChecklistById(db, {
        id: checklist.id,
        name: body.name,
      });

      if (!updated) {
        set.status = 500;
        return { error: "Failed to update checklist" };
      }

      return updated;
    }, {
      params: t.Object({ checklistPublicId: t.String() }),
      body: t.Object({
        name: t.String({ minLength: 1, maxLength: 255 }),
      }),
      response: {
        404: errorResponseSchema,
        500: errorResponseSchema,
      },
    })

    .delete("/:checklistPublicId", async ({ params, store, set }) => {
      const userId = store.userId;

      const checklist = await checklistRepo.getChecklistByPublicId(db, params.checklistPublicId);
      if (!checklist) {
        set.status = 404;
        return { error: "Checklist not found" };
      }

      await checklistRepo.softDeleteAllItemsByChecklistId(db, {
        checklistId: checklist.id,
        deletedAt: new Date(),
        deletedBy: userId,
      });

      await checklistRepo.softDeleteById(db, {
        id: checklist.id,
        deletedAt: new Date(),
        deletedBy: userId,
      });

      return { success: true };
    }, {
      params: t.Object({ checklistPublicId: t.String() }),
      response: {
        200: successResponseSchema,
        404: errorResponseSchema,
      },
    })

    .post("/:checklistPublicId/items", async ({ params, body, store, set }) => {
      const userId = store.userId;

      const checklist = await checklistRepo.getChecklistByPublicId(db, params.checklistPublicId);
      if (!checklist) {
        set.status = 404;
        return { error: "Checklist not found" };
      }

      const result = await checklistRepo.createItem(db, {
        title: body.title,
        createdBy: userId,
        checklistId: checklist.id,
      });

      if (!result?.id) {
        set.status = 500;
        return { error: "Failed to create checklist item" };
      }

      return result;
    }, {
      params: t.Object({ checklistPublicId: t.String() }),
      body: t.Object({
        title: t.String({ minLength: 1, maxLength: 500 }),
      }),
      response: {
        404: errorResponseSchema,
        500: errorResponseSchema,
      },
    })

    .patch("/items/:checklistItemPublicId", async ({ params, body, set }) => {
      const item = await checklistRepo.getChecklistItemByPublicIdWithChecklist(
        db, params.checklistItemPublicId,
      );
      if (!item) {
        set.status = 404;
        return { error: "Checklist item not found" };
      }

      let updatedItem:
        | Awaited<ReturnType<typeof checklistRepo.updateItemById>>
        | Awaited<ReturnType<typeof checklistRepo.reorderItem>>
        | null
        = null;

      if (body.title !== undefined || body.completed !== undefined) {
        updatedItem = await checklistRepo.updateItemById(db, {
          id: item.id,
          title: body.title,
          completed: body.completed,
        });
      }

      if (body.index !== undefined) {
        updatedItem = await checklistRepo.reorderItem(db, {
          itemId: item.id,
          newIndex: body.index,
        });
      }

      if (!updatedItem) {
        set.status = 500;
        return { error: "Failed to update checklist item" };
      }

      return updatedItem;
    }, {
      params: t.Object({ checklistItemPublicId: t.String() }),
      body: t.Object({
        title: t.Optional(t.String()),
        completed: t.Optional(t.Boolean()),
        index: t.Optional(t.Number()),
      }, {
        minProperties: 1,
      }),
      response: {
        404: errorResponseSchema,
        500: errorResponseSchema,
      },
    })

    .delete("/items/:checklistItemPublicId", async ({ params, store, set }) => {
      const userId = store.userId;

      const item = await checklistRepo.getChecklistItemByPublicIdWithChecklist(
        db, params.checklistItemPublicId,
      );
      if (!item) {
        set.status = 404;
        return { error: "Checklist item not found" };
      }

      await checklistRepo.softDeleteItemById(db, {
        id: item.id,
        deletedAt: new Date(),
        deletedBy: userId,
      });

      return { success: true };
    }, {
      params: t.Object({ checklistItemPublicId: t.String() }),
      response: {
        200: successResponseSchema,
        404: errorResponseSchema,
      },
    });
