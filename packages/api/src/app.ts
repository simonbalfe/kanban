import { Hono } from "hono";
import { logger } from "hono/logger";

import type { dbClient } from "./db/client";
import { createDb } from "./db/client";
import * as userRepo from "./db/repository/user.repo";
import { boardRoutes } from "./routes/boards";
import { cardRoutes } from "./routes/cards";
import { checklistRoutes } from "./routes/checklists";
import { healthRoutes } from "./routes/health";
import { labelRoutes } from "./routes/labels";
import { listRoutes } from "./routes/lists";
import { userRoutes } from "./routes/users";

export type Env = {
  Variables: {
    userId: string;
    db: dbClient;
  };
};

const DEFAULT_EMAIL = "local@kan.dev";

let cachedUser: { id: string } | null = null;

const getDefaultUser = async (db: dbClient) => {
  if (cachedUser) return cachedUser;

  const existing = await userRepo.getByEmail(db, DEFAULT_EMAIL);
  if (existing) {
    cachedUser = existing;
    return existing;
  }

  const created = await userRepo.create(db, { email: DEFAULT_EMAIL });
  if (!created) throw new Error("Failed to initialize default user");
  cachedUser = created;
  return created;
};

export const app = new Hono<Env>()
  .basePath("/api")
  .use(logger())
  .use(async (c, next) => {
    const db = createDb();
    c.set("db", db);
    const user = await getDefaultUser(db);
    c.set("userId", user.id);
    await next();
  })
  .onError((err, c) => {
    console.error(`[API] ${c.req.method} ${c.req.path} ERROR:`, err);
    return c.json({ error: "Internal server error" }, 500);
  })
  .route("/", healthRoutes())
  .route("/boards", boardRoutes())
  .route("/cards", cardRoutes())
  .route("/checklists", checklistRoutes())
  .route("/labels", labelRoutes())
  .route("/lists", listRoutes())
  .route("/users", userRoutes());
