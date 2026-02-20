import { Elysia, t } from "elysia";

import type { dbClient } from "../db/client";
import * as userRepo from "../db/repository/user.repo";
import { errorResponseSchema } from "../lib/schemas";

export const userRoutes = (db: dbClient) =>
  new Elysia({ prefix: "/users" })
    .state("userId", "")
    .get(
      "/me",
      async ({ store, set }) => {
        const userId = store.userId;

        const result = await userRepo.getById(db, userId);
        if (!result) {
          set.status = 404;
          return { error: "User not found" };
        }

        return result;
      },
      {
        response: {
          200: t.Object({
            id: t.String(),
            name: t.Nullable(t.String()),
            email: t.String(),
            image: t.Nullable(t.String()),
          }),
          404: errorResponseSchema,
        },
      },
    )

    .put(
      "/",
      async ({ body, store, set }) => {
        const userId = store.userId;

        const result = await userRepo.update(db, userId, body);
        if (!result) {
          set.status = 404;
          return { error: "User not found" };
        }

        return result;
      },
      {
        body: t.Object(
          {
            name: t.Optional(t.String()),
            image: t.Optional(t.String()),
          },
          {
            minProperties: 1,
          },
        ),
        response: {
          200: t.Object({
            name: t.Nullable(t.String()),
            image: t.Nullable(t.String()),
          }),
          404: errorResponseSchema,
        },
      },
    );
