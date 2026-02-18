import { TRPCError } from "@trpc/server";
import { sql } from "drizzle-orm";
import { z } from "zod";

import type { dbClient } from "~/db/client";
import * as boardRepo from "~/db/repository/board.repo";
import * as cardRepo from "~/db/repository/card.repo";
import * as checklistRepo from "~/db/repository/checklist.repo";
import * as labelRepo from "~/db/repository/label.repo";
import * as listRepo from "~/db/repository/list.repo";
import * as userRepo from "~/db/repository/user.repo";

import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "../trpc";

const checkDatabaseConnection = async (db: dbClient) => {
  try {
    await db.execute(sql`SELECT 1`);
    return true;
  } catch {
    return false;
  }
};

export const healthRouter = createTRPCRouter({
  health: publicProcedure
    .meta({
      openapi: {
        method: "GET",
        path: "/health",
        summary: "Health check",
        description:
          "Returns the health status of the application and its dependencies",
        tags: ["Health"],
        protect: false,
      },
    })
    .input(z.void())
    .output(
      z.object({
        status: z.enum(["ok", "error"]),
        database: z.enum(["ok", "error"]).optional(),
      }),
    )
    .query(async ({ ctx }) => {
      const dbHealthy = await checkDatabaseConnection(ctx.db);

      return {
        status: dbHealthy ? "ok" : "error",
        database: dbHealthy ? "ok" : "error",
      };
    }),
  stats: protectedProcedure
    .meta({
      openapi: {
        method: "GET",
        path: "/stats",
        summary: "Get statistics",
        description:
          "Returns statistics about the application (workspaces, users, cards, etc.)",
        tags: ["Health"],
        protect: true,
      },
    })
    .input(z.void())
    .output(
      z.object({
        users: z.number(),
        boards: z.number(),
        lists: z.number(),
        cards: z.number(),
        labels: z.number(),
        checklists: z.number(),
        checklistItems: z.number(),
      }),
    )
    .query(async ({ ctx }) => {
      try {
        const [
          usersCount,
          boardsCount,
          listsCount,
          cardsCount,
          checklistItemsCount,
          checklistsCount,
          labelsCount,
        ] = await Promise.all([
          userRepo.getCount(ctx.db),
          boardRepo.getCount(ctx.db),
          listRepo.getCount(ctx.db),
          cardRepo.getCount(ctx.db),
          checklistRepo.getCountItems(ctx.db),
          checklistRepo.getCount(ctx.db),
          labelRepo.getCount(ctx.db),
        ]);

        return {
          users: usersCount,
          boards: boardsCount,
          lists: listsCount,
          cards: cardsCount,
          checklistItems: checklistItemsCount,
          checklists: checklistsCount,
          labels: labelsCount,
        };
      } catch (error) {
        throw new TRPCError({
          message: `Failed to retrieve statistics: ${error instanceof Error ? error.message : "Unknown error"}`,
          code: "INTERNAL_SERVER_ERROR",
        });
      }
    }),
});
