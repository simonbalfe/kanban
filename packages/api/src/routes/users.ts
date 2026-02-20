import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { z } from "zod";

import type { Env } from "../app";
import type { dbClient } from "../db/client";
import * as userRepo from "../db/repository/user.repo";

export const userRoutes = (db: dbClient) =>
  new Hono<Env>()
    .get("/me", async (c) => {
      const userId = c.get("userId");

      const result = await userRepo.getById(db, userId);
      if (!result) {
        return c.json({ error: "User not found" }, 404);
      }

      return c.json(result);
    })
    .put(
      "/",
      zValidator(
        "json",
        z
          .object({
            name: z.string().optional(),
            image: z.string().optional(),
          })
          .refine((data) => Object.keys(data).length >= 1, {
            message: "At least one field must be provided",
          }),
      ),
      async (c) => {
        const userId = c.get("userId");
        const body = c.req.valid("json");

        const result = await userRepo.update(db, userId, body);
        if (!result) {
          return c.json({ error: "User not found" }, 404);
        }

        return c.json(result);
      },
    );
