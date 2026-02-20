import { sql } from "drizzle-orm";
import { Elysia, t } from "elysia";

import type { dbClient } from "../db/client";
import * as boardRepo from "../db/repository/board.repo";
import * as cardRepo from "../db/repository/card.repo";
import * as checklistRepo from "../db/repository/checklist.repo";
import * as labelRepo from "../db/repository/label.repo";
import * as listRepo from "../db/repository/list.repo";
import * as userRepo from "../db/repository/user.repo";
import { errorResponseSchema } from "../lib/schemas";

const checkDatabaseConnection = async (db: dbClient) => {
  try {
    await db.execute(sql`SELECT 1`);
    return true;
  } catch {
    return false;
  }
};

export const healthRoutes = (db: dbClient) =>
  new Elysia()
    .state("userId", "")
    .get(
      "/health",
      async () => {
        const dbHealthy = await checkDatabaseConnection(db);
        const status: "ok" | "error" = dbHealthy ? "ok" : "error";

        return {
          status,
          database: status,
        };
      },
      {
        response: t.Object({
          status: t.Union([t.Literal("ok"), t.Literal("error")]),
          database: t.Union([t.Literal("ok"), t.Literal("error")]),
        }),
      },
    )
    .get(
      "/stats",
      async ({ store, set }) => {
        const userId = store.userId;
        if (!userId) {
          set.status = 401;
          return { error: "Unauthorized" };
        }

        const [
          usersCount,
          boardsCount,
          listsCount,
          cardsCount,
          checklistItemsCount,
          checklistsCount,
          labelsCount,
        ] = await Promise.all([
          userRepo.getCount(db),
          boardRepo.getCount(db),
          listRepo.getCount(db),
          cardRepo.getCount(db),
          checklistRepo.getCountItems(db),
          checklistRepo.getCount(db),
          labelRepo.getCount(db),
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
      },
      {
        response: {
          200: t.Object({
            users: t.Number(),
            boards: t.Number(),
            lists: t.Number(),
            cards: t.Number(),
            checklistItems: t.Number(),
            checklists: t.Number(),
            labels: t.Number(),
          }),
          401: errorResponseSchema,
        },
      },
    );
