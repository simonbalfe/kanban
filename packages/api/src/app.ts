import { Hono } from "hono";
import { logger } from "hono/logger";

import { db } from "./db/client";
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
  };
};

const DEFAULT_EMAIL = "local@kan.dev";

const getDefaultUser = async () => {
  const existing = await userRepo.getByEmail(db, DEFAULT_EMAIL);
  if (existing) return existing;

  const created = await userRepo.create(db, { email: DEFAULT_EMAIL });
  if (!created) throw new Error("Failed to initialize default user");
  return created;
};

export const app = new Hono<Env>()
  .basePath("/api")
  .use(logger())
  .use(async (c, next) => {
    const user = await getDefaultUser();
    c.set("userId", user.id);
    await next();
  })
  .onError((err, c) => {
    console.error(`[API] ${c.req.method} ${c.req.path} ERROR:`, err);
    return c.json({ error: "Internal server error" }, 500);
  })
  .route("/", healthRoutes(db))
  .route("/boards", boardRoutes(db))
  .route("/cards", cardRoutes(db))
  .route("/checklists", checklistRoutes(db))
  .route("/labels", labelRoutes(db))
  .route("/lists", listRoutes(db))
  .route("/users", userRoutes(db));
