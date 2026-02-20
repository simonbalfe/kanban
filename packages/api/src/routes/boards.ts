import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { z } from "zod";

import type { Env } from "../app";
import * as boardRepo from "../db/repository/board.repo";
import * as cardRepo from "../db/repository/card.repo";
import * as labelRepo from "../db/repository/label.repo";
import * as listRepo from "../db/repository/list.repo";
import { colours } from "../lib/constants";
import {
  boardTypeSchema,
  boardVisibilitySchema,
  dueDateFilterSchema,
} from "../lib/schemas";
import {
  convertDueDateFiltersToRanges,
  generateSlug,
  generateUID,
} from "../lib/utils";

export const boardRoutes = () =>
  new Hono<Env>()
    .get(
      "/",
      zValidator(
        "query",
        z.object({
          type: boardTypeSchema.optional(),
        }),
      ),
      async (c) => {
        const db = c.var.db;
        const userId = c.get("userId");
        const { type } = c.req.valid("query");
        return c.json(await boardRepo.getAllByUserId(db, userId, { type }));
      },
    )

    .get(
      "/:boardPublicId",
      zValidator(
        "query",
        z.object({
          members: z.union([z.array(z.string()), z.string()]).optional(),
          labels: z.union([z.array(z.string()), z.string()]).optional(),
          lists: z.union([z.array(z.string()), z.string()]).optional(),
          dueDateFilters: z
            .union([z.array(dueDateFilterSchema), dueDateFilterSchema])
            .optional(),
          type: boardTypeSchema.optional(),
        }),
      ),
      async (c) => {
        const db = c.var.db;
        const userId = c.get("userId");
        const boardPublicId = c.req.param("boardPublicId");
        const query = c.req.valid("query");

        const board = await boardRepo.getBoardIdByPublicId(db, boardPublicId);
        if (!board) {
          return c.json({ error: "Board not found" }, 404);
        }

        const members = query.members
          ? Array.isArray(query.members)
            ? query.members
            : [query.members]
          : [];
        const labels = query.labels
          ? Array.isArray(query.labels)
            ? query.labels
            : [query.labels]
          : [];
        const lists = query.lists
          ? Array.isArray(query.lists)
            ? query.lists
            : [query.lists]
          : [];
        const rawDueDateFilters = query.dueDateFilters
          ? Array.isArray(query.dueDateFilters)
            ? query.dueDateFilters
            : [query.dueDateFilters]
          : [];
        const dueDateFilters = rawDueDateFilters.length
          ? convertDueDateFiltersToRanges(rawDueDateFilters)
          : [];

        return c.json(
          await boardRepo.getByPublicId(db, boardPublicId, userId, {
            members,
            labels,
            lists,
            dueDate: dueDateFilters,
            type: query.type,
          }),
        );
      },
    )

    .get(
      "/by-slug/:boardSlug",
      zValidator(
        "query",
        z.object({
          members: z.union([z.array(z.string()), z.string()]).optional(),
          labels: z.union([z.array(z.string()), z.string()]).optional(),
          lists: z.union([z.array(z.string()), z.string()]).optional(),
          dueDateFilters: z
            .union([z.array(dueDateFilterSchema), dueDateFilterSchema])
            .optional(),
        }),
      ),
      async (c) => {
        const db = c.var.db;
        const boardSlug = c.req.param("boardSlug");
        const query = c.req.valid("query");

        const members = query.members
          ? Array.isArray(query.members)
            ? query.members
            : [query.members]
          : [];
        const labels = query.labels
          ? Array.isArray(query.labels)
            ? query.labels
            : [query.labels]
          : [];
        const lists = query.lists
          ? Array.isArray(query.lists)
            ? query.lists
            : [query.lists]
          : [];
        const rawDueDateFilters = query.dueDateFilters
          ? Array.isArray(query.dueDateFilters)
            ? query.dueDateFilters
            : [query.dueDateFilters]
          : [];
        const dueDateFilters = rawDueDateFilters.length
          ? convertDueDateFiltersToRanges(rawDueDateFilters)
          : [];

        return c.json(
          await boardRepo.getBySlug(db, boardSlug, {
            members,
            labels,
            lists,
            dueDate: dueDateFilters,
          }),
        );
      },
    )

    .post(
      "/",
      zValidator(
        "json",
        z.object({
          name: z.string().min(1).max(100),
          lists: z.array(z.string()),
          labels: z.array(z.string()),
          type: boardTypeSchema.optional(),
          sourceBoardPublicId: z.string().optional(),
        }),
      ),
      async (c) => {
        const db = c.var.db;
        const userId = c.get("userId");
        const body = c.req.valid("json");

        if (body.sourceBoardPublicId) {
          const sourceBoardInfo = await boardRepo.getIdByPublicId(
            db,
            body.sourceBoardPublicId,
          );
          if (!sourceBoardInfo) {
            return c.json({ error: "Source board not found" }, 404);
          }

          const sourceBoard = await boardRepo.getByPublicId(
            db,
            body.sourceBoardPublicId,
            userId,
            {
              members: [],
              labels: [],
              lists: [],
              dueDate: [],
              type: sourceBoardInfo.type,
            },
          );

          if (!sourceBoard) {
            return c.json({ error: "Source board not found" }, 404);
          }

          let slug = generateSlug(body.name);
          const isSlugUnique = await boardRepo.isSlugUnique(db, { slug });
          if (!isSlugUnique || body.type === "template")
            slug = `${slug}-${generateUID()}`;

          return c.json(
            await boardRepo.createFromSnapshot(db, {
              source: sourceBoard,
              createdBy: userId,
              slug,
              name: body.name,
              type: body.type ?? "regular",
              sourceBoardId: sourceBoardInfo.id,
            }),
          );
        }

        let slug = generateSlug(body.name);
        const isSlugUnique = await boardRepo.isSlugUnique(db, { slug });
        if (!isSlugUnique || body.type === "template")
          slug = `${slug}-${generateUID()}`;

        const result = await boardRepo.create(db, {
          publicId: generateUID(),
          slug,
          name: body.name,
          createdBy: userId,
          type: body.type,
        });

        if (!result) {
          return c.json({ error: "Failed to create board" }, 500);
        }

        if (body.lists.length) {
          const listInputs = body.lists.map((list: string, index: number) => ({
            publicId: generateUID(),
            name: list,
            boardId: result.id,
            createdBy: userId,
            index,
          }));
          await listRepo.bulkCreate(db, listInputs);
        }

        if (body.labels.length) {
          const labelInputs = body.labels.map(
            (label: string, index: number) => ({
              publicId: generateUID(),
              name: label,
              boardId: result.id,
              createdBy: userId,
              colourCode: colours[index % colours.length]?.code ?? "#0d9488",
            }),
          );
          await labelRepo.bulkCreate(db, labelInputs);
        }

        return c.json(result);
      },
    )

    .put(
      "/:boardPublicId",
      zValidator(
        "json",
        z
          .object({
            name: z.string().optional(),
            slug: z.string().optional(),
            visibility: boardVisibilitySchema.optional(),
          })
          .refine((data) => Object.keys(data).length >= 1, {
            message: "At least one field must be provided",
          }),
      ),
      async (c) => {
        const db = c.var.db;
        const boardPublicId = c.req.param("boardPublicId");
        const body = c.req.valid("json");

        const board = await boardRepo.getBoardIdByPublicId(db, boardPublicId);
        if (!board) {
          return c.json({ error: "Board not found" }, 404);
        }

        if (body.slug) {
          const available = await boardRepo.isBoardSlugAvailable(db, body.slug);
          if (!available) {
            return c.json(
              { error: `Board slug ${body.slug} is not available` },
              400,
            );
          }
        }

        const result = await boardRepo.update(db, {
          name: body.name,
          slug: body.slug,
          boardPublicId,
          visibility: body.visibility,
        });

        if (!result) {
          return c.json({ error: "Failed to update board" }, 500);
        }

        return c.json(result);
      },
    )

    .delete("/:boardPublicId", async (c) => {
      const db = c.var.db;
      const userId = c.get("userId");
      const boardPublicId = c.req.param("boardPublicId");

      const board = await boardRepo.getWithListIdsByPublicId(db, boardPublicId);
      if (!board) {
        return c.json({ error: "Board not found" }, 404);
      }

      const listIds = board.lists.map((list) => list.id);
      const deletedAt = new Date();

      await boardRepo.softDelete(db, {
        boardId: board.id,
        deletedAt,
        deletedBy: userId,
      });

      if (listIds.length) {
        await listRepo.softDeleteAllByBoardId(db, {
          boardId: board.id,
          deletedAt,
          deletedBy: userId,
        });

        await cardRepo.softDeleteAllByListIds(db, {
          listIds,
          deletedAt,
          deletedBy: userId,
        });
      }

      return c.json({ success: true });
    })

    .get(
      "/:boardPublicId/check-slug",
      zValidator(
        "query",
        z.object({
          boardSlug: z.string(),
        }),
      ),
      async (c) => {
        const db = c.var.db;
        const boardPublicId = c.req.param("boardPublicId");
        const { boardSlug } = c.req.valid("query");

        const board = await boardRepo.getBoardIdByPublicId(db, boardPublicId);
        if (!board) {
          return c.json({ error: "Board not found" }, 404);
        }

        const available = await boardRepo.isBoardSlugAvailable(db, boardSlug);
        return c.json({ isReserved: !available });
      },
    );
