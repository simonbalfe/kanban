import { Elysia, t } from "elysia";

import type { dbClient } from "../db/client";
import * as boardRepo from "../db/repository/board.repo";
import * as cardRepo from "../db/repository/card.repo";
import * as listRepo from "../db/repository/list.repo";
import { errorResponseSchema, successResponseSchema } from "../lib/schemas";

export const listRoutes = (db: dbClient) =>
  new Elysia({ prefix: "/lists" })
    .state("userId", "")
    .post("/", async ({ body, store, set }) => {
      const userId = store.userId;

      const board = await boardRepo.getBoardIdByPublicId(db, body.boardPublicId);
      if (!board) {
        set.status = 404;
        return { error: "Board not found" };
      }

      const result = await listRepo.create(db, {
        name: body.name,
        createdBy: userId,
        boardId: board.id,
      });

      if (!result) {
        set.status = 500;
        return { error: "Failed to create list" };
      }

      return result;
    }, {
      body: t.Object({
        name: t.String({ minLength: 1 }),
        boardPublicId: t.String(),
      }),
      response: {
        404: errorResponseSchema,
        500: errorResponseSchema,
      },
    })

    .put("/:listPublicId", async ({ params, body, set }) => {
      const list = await listRepo.getListIdByPublicId(db, params.listPublicId);
      if (!list) {
        set.status = 404;
        return { error: "List not found" };
      }

      let result:
        | Awaited<ReturnType<typeof listRepo.update>>
        | Awaited<ReturnType<typeof listRepo.reorder>>
        | null
        = null;

      if (body.name !== undefined) {
        result = await listRepo.update(
          db,
          { name: body.name },
          { listPublicId: params.listPublicId },
        );
      }

      if (body.index !== undefined) {
        result = await listRepo.reorder(db, {
          listPublicId: params.listPublicId,
          newIndex: body.index,
        });
      }

      if (!result) {
        set.status = 500;
        return { error: "Failed to update list" };
      }

      return result;
    }, {
      params: t.Object({ listPublicId: t.String() }),
      body: t.Object({
        name: t.Optional(t.String()),
        index: t.Optional(t.Number()),
      }, {
        minProperties: 1,
      }),
      response: {
        404: errorResponseSchema,
        500: errorResponseSchema,
      },
    })

    .delete("/:listPublicId", async ({ params, store, set }) => {
      const userId = store.userId;

      const list = await listRepo.getListIdByPublicId(db, params.listPublicId);
      if (!list) {
        set.status = 404;
        return { error: "List not found" };
      }

      const deletedAt = new Date();

      await listRepo.softDeleteById(db, {
        listId: list.id,
        deletedAt,
        deletedBy: userId,
      });

      await cardRepo.softDeleteAllByListIds(db, {
        listIds: [list.id],
        deletedAt,
        deletedBy: userId,
      });

      return { success: true };
    }, {
      params: t.Object({ listPublicId: t.String() }),
      response: {
        200: successResponseSchema,
        404: errorResponseSchema,
      },
    });
