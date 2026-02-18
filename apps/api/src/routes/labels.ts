import { Elysia, t } from "elysia";

import type { dbClient } from "../db/client";
import * as boardRepo from "../db/repository/board.repo";
import * as cardRepo from "../db/repository/card.repo";
import * as labelRepo from "../db/repository/label.repo";
import {
  errorResponseSchema,
  hexColourCodeSchema,
  labelSummarySchema,
  successResponseSchema,
} from "../lib/schemas";

export const labelRoutes = (db: dbClient) =>
  new Elysia({ prefix: "/labels" })
    .state("userId", "")
    .get("/:labelPublicId", async ({ params, set }) => {
      const label = await labelRepo.getByPublicId(db, params.labelPublicId);
      if (!label) {
        set.status = 404;
        return { error: "Label not found" };
      }

      return {
        publicId: label.publicId,
        name: label.name,
        colourCode: label.colourCode,
      };
    }, {
      params: t.Object({ labelPublicId: t.String() }),
      response: {
        200: labelSummarySchema,
        404: errorResponseSchema,
      },
    })

    .post("/", async ({ body, store, set }) => {
      const userId = store.userId;

      const board = await boardRepo.getBoardIdByPublicId(db, body.boardPublicId);
      if (!board) {
        set.status = 404;
        return { error: "Board not found" };
      }

      const result = await labelRepo.create(db, {
        name: body.name,
        colourCode: body.colourCode,
        createdBy: userId,
        boardId: board.id,
      });

      if (!result) {
        set.status = 500;
        return { error: "Failed to create label" };
      }

      return {
        publicId: result.publicId,
        name: result.name,
        colourCode: result.colourCode,
      };
    }, {
      body: t.Object({
        name: t.String({ minLength: 1, maxLength: 36 }),
        boardPublicId: t.String(),
        colourCode: hexColourCodeSchema,
      }),
      response: {
        200: labelSummarySchema,
        404: errorResponseSchema,
        500: errorResponseSchema,
      },
    })

    .put("/:labelPublicId", async ({ params, body, set }) => {
      const label = await labelRepo.getLabelIdByPublicId(db, params.labelPublicId);
      if (!label) {
        set.status = 404;
        return { error: "Label not found" };
      }

      const result = await labelRepo.update(db, {
        labelPublicId: params.labelPublicId,
        name: body.name,
        colourCode: body.colourCode,
      });

      if (!result) {
        set.status = 500;
        return { error: "Failed to update label" };
      }

      return {
        publicId: result.publicId,
        name: result.name,
        colourCode: result.colourCode,
      };
    }, {
      params: t.Object({ labelPublicId: t.String() }),
      body: t.Object({
        name: t.String({ minLength: 1, maxLength: 36 }),
        colourCode: hexColourCodeSchema,
      }),
      response: {
        200: labelSummarySchema,
        404: errorResponseSchema,
        500: errorResponseSchema,
      },
    })

    .delete("/:labelPublicId", async ({ params, store, set }) => {
      const userId = store.userId;

      const label = await labelRepo.getLabelIdByPublicId(db, params.labelPublicId);
      if (!label) {
        set.status = 404;
        return { error: "Label not found" };
      }

      await cardRepo.hardDeleteAllCardLabelRelationships(db, label.id);

      await labelRepo.softDelete(db, {
        labelId: label.id,
        deletedAt: new Date(),
        deletedBy: userId,
      });

      return { success: true };
    }, {
      params: t.Object({ labelPublicId: t.String() }),
      response: {
        200: successResponseSchema,
        404: errorResponseSchema,
      },
    });
