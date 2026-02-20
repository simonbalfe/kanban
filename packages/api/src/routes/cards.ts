import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { z } from "zod";

import type { Env } from "../app";
import type { dbClient } from "../db/client";
import * as cardRepo from "../db/repository/card.repo";
import * as labelRepo from "../db/repository/label.repo";
import * as listRepo from "../db/repository/list.repo";
import { movePositionSchema } from "../lib/schemas";

export const cardRoutes = (db: dbClient) =>
  new Hono<Env>()
    .post(
      "/",
      zValidator(
        "json",
        z.object({
          title: z.string().min(1).max(2000),
          description: z.string().max(10000),
          listPublicId: z.string(),
          labelPublicIds: z.array(z.string()).optional(),
          position: movePositionSchema,
          dueDate: z.string().nullable().optional(),
        }),
      ),
      async (c) => {
        const userId = c.get("userId");
        const body = c.req.valid("json");

        const list = await listRepo.getListIdByPublicId(db, body.listPublicId);
        if (!list) {
          return c.json({ error: "List not found" }, 404);
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
          return c.json({ error: "Failed to create card" }, 500);
        }

        if (body.labelPublicIds?.length) {
          const labels = await labelRepo.getAllByPublicIds(
            db,
            body.labelPublicIds,
          );
          if (labels.length) {
            await cardRepo.bulkCreateCardLabelRelationships(
              db,
              labels.map((label) => ({
                cardId: newCard.id,
                labelId: label.id,
              })),
            );
          }
        }

        return c.json(newCard);
      },
    )

    .get("/:cardPublicId", async (c) => {
      const cardPublicId = c.req.param("cardPublicId");

      const card = await cardRepo.getCardIdByPublicId(db, cardPublicId);
      if (!card) {
        return c.json({ error: "Card not found" }, 404);
      }

      const result = await cardRepo.getWithListAndMembersByPublicId(
        db,
        cardPublicId,
      );
      if (!result) {
        return c.json({ error: "Card not found" }, 404);
      }

      return c.json(result);
    })

    .put(
      "/:cardPublicId",
      zValidator(
        "json",
        z
          .object({
            title: z.string().optional(),
            description: z.string().optional(),
            index: z.number().optional(),
            listPublicId: z.string().optional(),
            dueDate: z.string().nullable().optional(),
          })
          .refine((data) => Object.keys(data).length >= 1, {
            message: "At least one field must be provided",
          }),
      ),
      async (c) => {
        const cardPublicId = c.req.param("cardPublicId");
        const body = c.req.valid("json");

        const card = await cardRepo.getCardIdByPublicId(db, cardPublicId);
        if (!card) {
          return c.json({ error: "Card not found" }, 404);
        }

        const existingCard = await cardRepo.getByPublicId(db, cardPublicId);
        if (!existingCard) {
          return c.json({ error: "Card not found" }, 404);
        }

        let newListId: number | undefined;
        if (body.listPublicId) {
          const newList = await listRepo.getByPublicId(db, body.listPublicId);
          if (!newList) {
            return c.json({ error: "List not found" }, 404);
          }
          newListId = newList.id;
        }

        let result:
          | Awaited<ReturnType<typeof cardRepo.update>>
          | Awaited<ReturnType<typeof cardRepo.reorder>>
          | null = null;

        if (
          body.title !== undefined ||
          body.description !== undefined ||
          body.dueDate !== undefined
        ) {
          result = await cardRepo.update(
            db,
            {
              ...(body.title !== undefined ? { title: body.title } : {}),
              ...(body.description !== undefined
                ? { description: body.description }
                : {}),
              ...(body.dueDate !== undefined && {
                dueDate: body.dueDate ? new Date(body.dueDate) : null,
              }),
            },
            { cardPublicId },
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
          return c.json({ error: "Failed to update card" }, 500);
        }

        return c.json(result);
      },
    )

    .delete("/:cardPublicId", async (c) => {
      const userId = c.get("userId");
      const cardPublicId = c.req.param("cardPublicId");

      const card = await cardRepo.getCardIdByPublicId(db, cardPublicId);
      if (!card) {
        return c.json({ error: "Card not found" }, 404);
      }

      await cardRepo.softDelete(db, {
        cardId: card.id,
        deletedAt: new Date(),
        deletedBy: userId,
      });

      return c.json({ success: true });
    })

    .put("/:cardPublicId/labels/:labelPublicId", async (c) => {
      const cardPublicId = c.req.param("cardPublicId");
      const labelPublicId = c.req.param("labelPublicId");

      const card = await cardRepo.getCardIdByPublicId(db, cardPublicId);
      if (!card) {
        return c.json({ error: "Card not found" }, 404);
      }

      const label = await labelRepo.getByPublicId(db, labelPublicId);
      if (!label) {
        return c.json({ error: "Label not found" }, 404);
      }

      const cardLabelIds = { cardId: card.id, labelId: label.id };
      const existing = await cardRepo.getCardLabelRelationship(
        db,
        cardLabelIds,
      );

      if (existing) {
        await cardRepo.hardDeleteCardLabelRelationship(db, cardLabelIds);
        return c.json({ newLabel: false });
      }

      await cardRepo.createCardLabelRelationship(db, cardLabelIds);
      return c.json({ newLabel: true });
    });
