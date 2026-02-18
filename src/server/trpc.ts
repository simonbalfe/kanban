import type { CreateNextContextOptions } from "@trpc/server/adapters/next";
import type { OpenApiMeta } from "trpc-to-openapi";
import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import { ZodError } from "zod";

import type { dbClient } from "~/db/client";
import { createDrizzleClient } from "~/db/client";
import * as userRepo from "~/db/repository/user.repo";

interface User {
  id: string;
  name: string | null;
  email: string;
  createdAt: Date;
  updatedAt: Date;
  image?: string | null | undefined;
}

interface CreateContextOptions {
  user: User;
  db: dbClient;
  headers: Headers;
}

const createInnerTRPCContext = (opts: CreateContextOptions) => {
  return {
    user: opts.user,
    db: opts.db,
    headers: opts.headers,
  };
};

const DEFAULT_EMAIL = "local@kan.dev";

const getDefaultUser = async (db: dbClient): Promise<User> => {
  const existing = await userRepo.getByEmail(db, DEFAULT_EMAIL);
  const user =
    existing ??
    (await userRepo.create(db, {
      email: DEFAULT_EMAIL,
    }));
  if (!user) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Failed to initialize default user",
    });
  }

  return {
    id: user.id,
    name: user.name ?? "Local User",
    email: user.email,
    createdAt: new Date(),
    updatedAt: new Date(),
    image: null,
  };
};

export const createTRPCContext = async ({ req }: CreateNextContextOptions) => {
  const db = createDrizzleClient();
  const headers = new Headers(req.headers as Record<string, string>);
  const user = await getDefaultUser(db);

  return createInnerTRPCContext({ db, user, headers });
};

export const createRESTContext = async ({ req }: CreateNextContextOptions) => {
  const db = createDrizzleClient();
  const headers = new Headers(req.headers as Record<string, string>);
  const user = await getDefaultUser(db);

  return createInnerTRPCContext({ db, user, headers });
};

const t = initTRPC
  .context<typeof createTRPCContext>()
  .meta<OpenApiMeta>()
  .create({
    transformer: superjson,
    errorFormatter({ shape, error }) {
      return {
        ...shape,
        data: {
          ...shape.data,
          zodError:
            error.cause instanceof ZodError ? error.cause.flatten() : null,
        },
      };
    },
  });

export const createTRPCRouter = t.router;

export const publicProcedure = t.procedure.meta({
  openapi: { method: "GET", path: "/public" },
});

const enforceUserIsAuthed = t.middleware(async ({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }

  return next({
    ctx,
  });
});

export const protectedProcedure = t.procedure.use(enforceUserIsAuthed).meta({
  openapi: {
    method: "GET",
    path: "/protected",
  },
});
