import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { z } from "zod";

import type { Env } from "../app";
import * as cardRepo from "../db/repository/card.repo";
import * as checklistRepo from "../db/repository/checklist.repo";

export const checklistRoutes = () =>
  new Hono<Env>()
    .post(
      "/",
      zValidator(
        "json",
        z.object({
          cardPublicId: z.string(),
          name: z.string().min(1).max(255),
        }),
      ),
      async (c) => {
        const db = c.var.db;
        const userId = c.get("userId");
        const body = c.req.valid("json");

        const card = await cardRepo.getCardIdByPublicId(db, body.cardPublicId);
        if (!card) {
          return c.json({ error: "Card not found" }, 404);
        }

        const result = await checklistRepo.create(db, {
          name: body.name,
          createdBy: userId,
          cardId: card.id,
        });

        if (!result?.id) {
          return c.json({ error: "Failed to create checklist" }, 500);
        }

        return c.json(result);
      },
    )

    .put(
      "/:checklistPublicId",
      zValidator(
        "json",
        z.object({
          name: z.string().min(1).max(255),
        }),
      ),
      async (c) => {
        const db = c.var.db;
        const checklistPublicId = c.req.param("checklistPublicId");
        const body = c.req.valid("json");

        const checklist = await checklistRepo.getChecklistByPublicId(
          db,
          checklistPublicId,
        );
        if (!checklist) {
          return c.json({ error: "Checklist not found" }, 404);
        }

        const updated = await checklistRepo.updateChecklistById(db, {
          id: checklist.id,
          name: body.name,
        });

        if (!updated) {
          return c.json({ error: "Failed to update checklist" }, 500);
        }

        return c.json(updated);
      },
    )

    .delete("/:checklistPublicId", async (c) => {
      const db = c.var.db;
      const userId = c.get("userId");
      const checklistPublicId = c.req.param("checklistPublicId");

      const checklist = await checklistRepo.getChecklistByPublicId(
        db,
        checklistPublicId,
      );
      if (!checklist) {
        return c.json({ error: "Checklist not found" }, 404);
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

      return c.json({ success: true });
    })

    .post(
      "/:checklistPublicId/items",
      zValidator(
        "json",
        z.object({
          title: z.string().min(1).max(500),
        }),
      ),
      async (c) => {
        const db = c.var.db;
        const userId = c.get("userId");
        const checklistPublicId = c.req.param("checklistPublicId");
        const body = c.req.valid("json");

        const checklist = await checklistRepo.getChecklistByPublicId(
          db,
          checklistPublicId,
        );
        if (!checklist) {
          return c.json({ error: "Checklist not found" }, 404);
        }

        const result = await checklistRepo.createItem(db, {
          title: body.title,
          createdBy: userId,
          checklistId: checklist.id,
        });

        if (!result?.id) {
          return c.json({ error: "Failed to create checklist item" }, 500);
        }

        return c.json(result);
      },
    )

    .patch(
      "/items/:checklistItemPublicId",
      zValidator(
        "json",
        z
          .object({
            title: z.string().optional(),
            completed: z.boolean().optional(),
            index: z.number().optional(),
          })
          .refine((data) => Object.keys(data).length >= 1, {
            message: "At least one field must be provided",
          }),
      ),
      async (c) => {
        const db = c.var.db;
        const checklistItemPublicId = c.req.param("checklistItemPublicId");
        const body = c.req.valid("json");

        const item =
          await checklistRepo.getChecklistItemByPublicIdWithChecklist(
            db,
            checklistItemPublicId,
          );
        if (!item) {
          return c.json({ error: "Checklist item not found" }, 404);
        }

        let updatedItem:
          | Awaited<ReturnType<typeof checklistRepo.updateItemById>>
          | Awaited<ReturnType<typeof checklistRepo.reorderItem>>
          | null = null;

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
          return c.json({ error: "Failed to update checklist item" }, 500);
        }

        return c.json(updatedItem);
      },
    )

    .delete("/items/:checklistItemPublicId", async (c) => {
      const db = c.var.db;
      const userId = c.get("userId");
      const checklistItemPublicId = c.req.param("checklistItemPublicId");

      const item = await checklistRepo.getChecklistItemByPublicIdWithChecklist(
        db,
        checklistItemPublicId,
      );
      if (!item) {
        return c.json({ error: "Checklist item not found" }, 404);
      }

      await checklistRepo.softDeleteItemById(db, {
        id: item.id,
        deletedAt: new Date(),
        deletedBy: userId,
      });

      return c.json({ success: true });
    });
