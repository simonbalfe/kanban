import { Elysia, t } from "elysia";

import type { dbClient } from "../db/client";
import * as boardRepo from "../db/repository/board.repo";
import * as cardRepo from "../db/repository/card.repo";
import * as labelRepo from "../db/repository/label.repo";
import * as listRepo from "../db/repository/list.repo";
import { colours } from "../lib/constants";
import {
  boardTypeSchema,
  boardVisibilitySchema,
  dueDateFilterSchema,
  errorResponseSchema,
  successResponseSchema,
} from "../lib/schemas";
import {
  convertDueDateFiltersToRanges,
  generateSlug,
  generateUID,
} from "../lib/utils";

const boardFiltersSchema = t.Object({
  members: t.Optional(t.Array(t.String())),
  labels: t.Optional(t.Array(t.String())),
  lists: t.Optional(t.Array(t.String())),
  dueDateFilters: t.Optional(t.Array(dueDateFilterSchema)),
  type: t.Optional(boardTypeSchema),
});

export const boardRoutes = (db: dbClient) =>
  new Elysia({ prefix: "/boards" })
    .state("userId", "")
    .get(
      "/",
      async ({ query, store }) => {
        const userId = store.userId;
        const type = query.type;
        return boardRepo.getAllByUserId(db, userId, { type });
      },
      {
        query: t.Object({
          type: t.Optional(boardTypeSchema),
        }),
      },
    )

    .get(
      "/:boardPublicId",
      async ({ params, query, store, set }) => {
        const userId = store.userId;

        const board = await boardRepo.getBoardIdByPublicId(
          db,
          params.boardPublicId,
        );
        if (!board) {
          set.status = 404;
          return { error: "Board not found" };
        }

        const dueDateFilters = query.dueDateFilters
          ? convertDueDateFiltersToRanges(query.dueDateFilters)
          : [];

        return boardRepo.getByPublicId(db, params.boardPublicId, userId, {
          members: query.members ?? [],
          labels: query.labels ?? [],
          lists: query.lists ?? [],
          dueDate: dueDateFilters,
          type: query.type,
        });
      },
      {
        params: t.Object({ boardPublicId: t.String() }),
        query: boardFiltersSchema,
        response: {
          404: errorResponseSchema,
        },
      },
    )

    .get(
      "/by-slug/:boardSlug",
      async ({ params, query }) => {
        const dueDateFilters = query.dueDateFilters
          ? convertDueDateFiltersToRanges(query.dueDateFilters)
          : [];

        return boardRepo.getBySlug(db, params.boardSlug, {
          members: query.members ?? [],
          labels: query.labels ?? [],
          lists: query.lists ?? [],
          dueDate: dueDateFilters,
        });
      },
      {
        params: t.Object({ boardSlug: t.String() }),
        query: t.Object({
          members: t.Optional(t.Array(t.String())),
          labels: t.Optional(t.Array(t.String())),
          lists: t.Optional(t.Array(t.String())),
          dueDateFilters: t.Optional(t.Array(dueDateFilterSchema)),
        }),
      },
    )

    .post(
      "/",
      async ({ body, store, set }) => {
        const userId = store.userId;

        if (body.sourceBoardPublicId) {
          const sourceBoardInfo = await boardRepo.getIdByPublicId(
            db,
            body.sourceBoardPublicId,
          );
          if (!sourceBoardInfo) {
            set.status = 404;
            return { error: "Source board not found" };
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
            set.status = 404;
            return { error: "Source board not found" };
          }

          let slug = generateSlug(body.name);
          const isSlugUnique = await boardRepo.isSlugUnique(db, { slug });
          if (!isSlugUnique || body.type === "template")
            slug = `${slug}-${generateUID()}`;

          return boardRepo.createFromSnapshot(db, {
            source: sourceBoard,
            createdBy: userId,
            slug,
            name: body.name,
            type: body.type ?? "regular",
            sourceBoardId: sourceBoardInfo.id,
          });
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
          set.status = 500;
          return { error: "Failed to create board" };
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

        return result;
      },
      {
        body: t.Object({
          name: t.String({ minLength: 1, maxLength: 100 }),
          lists: t.Array(t.String()),
          labels: t.Array(t.String()),
          type: t.Optional(boardTypeSchema),
          sourceBoardPublicId: t.Optional(t.String()),
        }),
        response: {
          404: errorResponseSchema,
          500: errorResponseSchema,
        },
      },
    )

    .put(
      "/:boardPublicId",
      async ({ params, body, set }) => {
        const board = await boardRepo.getBoardIdByPublicId(
          db,
          params.boardPublicId,
        );
        if (!board) {
          set.status = 404;
          return { error: "Board not found" };
        }

        if (body.slug) {
          const available = await boardRepo.isBoardSlugAvailable(db, body.slug);
          if (!available) {
            set.status = 400;
            return { error: `Board slug ${body.slug} is not available` };
          }
        }

        const result = await boardRepo.update(db, {
          name: body.name,
          slug: body.slug,
          boardPublicId: params.boardPublicId,
          visibility: body.visibility,
        });

        if (!result) {
          set.status = 500;
          return { error: "Failed to update board" };
        }

        return result;
      },
      {
        params: t.Object({ boardPublicId: t.String() }),
        body: t.Object(
          {
            name: t.Optional(t.String()),
            slug: t.Optional(t.String()),
            visibility: t.Optional(boardVisibilitySchema),
          },
          {
            minProperties: 1,
          },
        ),
        response: {
          400: errorResponseSchema,
          404: errorResponseSchema,
          500: errorResponseSchema,
        },
      },
    )

    .delete(
      "/:boardPublicId",
      async ({ params, store, set }) => {
        const userId = store.userId;

        const board = await boardRepo.getWithListIdsByPublicId(
          db,
          params.boardPublicId,
        );
        if (!board) {
          set.status = 404;
          return { error: "Board not found" };
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

        return { success: true };
      },
      {
        params: t.Object({ boardPublicId: t.String() }),
        response: {
          200: successResponseSchema,
          404: errorResponseSchema,
        },
      },
    )

    .get(
      "/:boardPublicId/check-slug",
      async ({ params, query, set }) => {
        const board = await boardRepo.getBoardIdByPublicId(
          db,
          params.boardPublicId,
        );
        if (!board) {
          set.status = 404;
          return { error: "Board not found" };
        }

        const available = await boardRepo.isBoardSlugAvailable(
          db,
          query.boardSlug,
        );
        return { isReserved: !available };
      },
      {
        params: t.Object({ boardPublicId: t.String() }),
        query: t.Object({ boardSlug: t.String() }),
        response: {
          200: t.Object({ isReserved: t.Boolean() }),
          404: errorResponseSchema,
        },
      },
    );
