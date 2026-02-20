import { Elysia } from "elysia";
import type { ValidationError } from "elysia/error";

import { db } from "./db/client";
import * as userRepo from "./db/repository/user.repo";
import { boardRoutes } from "./routes/boards";
import { cardRoutes } from "./routes/cards";
import { checklistRoutes } from "./routes/checklists";
import { healthRoutes } from "./routes/health";
import { labelRoutes } from "./routes/labels";
import { listRoutes } from "./routes/lists";
import { userRoutes } from "./routes/users";

const logger = (name: string) => (app: Elysia) =>
  app
    .onBeforeHandle(({ request }) => {
      const method = request.method;
      const url = new URL(request.url).pathname;
      console.log(`[${name}] ${method} ${url}`);
    })
    .onError(({ request, code, error }) => {
      const method = request.method;
      const url = new URL(request.url).pathname;
      console.error(`[${name}] ${method} ${url} ERROR: ${code}`, error);
    });

const DEFAULT_EMAIL = "local@kan.dev";

const getDefaultUser = async () => {
  const existing = await userRepo.getByEmail(db, DEFAULT_EMAIL);
  if (existing) return existing;

  const created = await userRepo.create(db, { email: DEFAULT_EMAIL });
  if (!created) throw new Error("Failed to initialize default user");
  return created;
};

export const app = new Elysia({ prefix: "/api", aot: false })
  .state("userId", "")
  .use(logger("API"))
  .onError(({ code, error, set }) => {
    if (code === "VALIDATION") {
      set.status = 422;
      return {
        error: "Validation failed",
        details: (error as ValidationError).all,
      };
    }

    set.status = 500;
    return { error: "Internal server error" };
  })
  .onBeforeHandle(async ({ store }) => {
    const user = await getDefaultUser();
    store.userId = user.id;
  })
  .use(healthRoutes(db))
  .use(boardRoutes(db))
  .use(cardRoutes(db))
  .use(checklistRoutes(db))
  .use(labelRoutes(db))
  .use(listRoutes(db))
  .use(userRoutes(db));
