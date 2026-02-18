import type { CreateNextContextOptions } from "@trpc/server/adapters/next";
import type { NextApiRequest } from "next";
import type { OpenApiMeta } from "trpc-to-openapi";
import { initTRPC, TRPCError } from "@trpc/server";
import { env } from "next-runtime-env";
import superjson from "superjson";
import { ZodError } from "zod";

import type { dbClient } from "~/db/client";
import { createDrizzleClient } from "~/db/client";
import * as userRepo from "~/db/repository/user.repo";

interface User {
  id: string;
  name: string | null;
  email: string;
  emailVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
  image?: string | null | undefined;
}

interface AuthAdapter {
  api: {
    getSession: () => Promise<{ user: User } | null>;
    signInMagicLink: (input: {
      email: string;
      callbackURL: string;
    }) => Promise<{ status: boolean }>;
  };
}

const createAuthWithHeaders = (_headers: Headers): AuthAdapter => {
  return {
    api: {
      getSession: async () => null,
      signInMagicLink: async (_input) => ({ status: true }),
    },
  };
};

interface CreateContextOptions {
  user: User | null | undefined;
  db: dbClient;
  auth: AuthAdapter;
  headers: Headers;
}

const createInnerTRPCContext = (opts: CreateContextOptions) => {
  return {
    user: opts.user,
    db: opts.db,
    auth: opts.auth,
    headers: opts.headers,
  };
};

const FALLBACK_EMAIL = "local@kan.dev";

const getEffectiveUser = async (db: dbClient): Promise<User> => {
  const existing = await userRepo.getByEmail(db, FALLBACK_EMAIL);
  const user =
    existing ??
    (await userRepo.create(db, {
      email: FALLBACK_EMAIL,
    }));
  if (!user) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Failed to initialize local auth bypass user",
    });
  }

  return {
    id: user.id,
    name: user.name ?? "Local User",
    email: user.email,
    emailVerified: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    image: null,
  };
};

export const createTRPCContext = async ({ req }: CreateNextContextOptions) => {
  const db = createDrizzleClient();
  const headers = new Headers(req.headers as Record<string, string>);
  const auth = createAuthWithHeaders(headers);
  const user = await getEffectiveUser(db);

  return createInnerTRPCContext({ db, user, auth, headers });
};

export const createNextApiContext = async (req: NextApiRequest) => {
  const db = createDrizzleClient();
  const headers = new Headers(req.headers as Record<string, string>);
  const auth = createAuthWithHeaders(headers);
  const user = await getEffectiveUser(db);

  return createInnerTRPCContext({ db, user, auth, headers });
};

export const createRESTContext = async ({ req }: CreateNextContextOptions) => {
  const db = createDrizzleClient();
  const headers = new Headers(req.headers as Record<string, string>);
  const auth = createAuthWithHeaders(headers);
  const user = await getEffectiveUser(db);

  return createInnerTRPCContext({ db, user, auth, headers });
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

const enforceUserIsAdmin = t.middleware(async ({ ctx, next }) => {
  if (ctx.headers.get("x-admin-api-key") !== env("KAN_ADMIN_API_KEY")) {
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

export const adminProtectedProcedure = t.procedure
  .use(enforceUserIsAdmin)
  .meta({
    openapi: {
      method: "GET",
      path: "/admin/protected",
    },
  });
