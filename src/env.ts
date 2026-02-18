import { createEnv } from "@t3-oss/env-nextjs";
import { vercel } from "@t3-oss/env-nextjs/presets";
import { z } from "zod";

export const env = createEnv({
  extends: [vercel()],
  shared: {
    NODE_ENV: z
      .enum(["development", "production", "test"])
      .default("development"),
  },
  server: {
    POSTGRES_URL: z.string().url().optional().or(z.literal("")),
    S3_ACCESS_KEY_ID: z.string().optional(),
    S3_SECRET_ACCESS_KEY: z.string().optional(),
    S3_REGION: z.string().optional(),
    S3_ENDPOINT: z.string().optional(),
    S3_FORCE_PATH_STYLE: z.string().optional(),
    REDIS_URL: z.string().url().optional().or(z.literal("")),
  },
  client: {
    NEXT_PUBLIC_BASE_URL: z.string().url().optional(),
    NEXT_PUBLIC_AVATAR_BUCKET_NAME: z.string().optional(),
    NEXT_PUBLIC_ATTACHMENTS_BUCKET_NAME: z.string().optional(),
    NEXT_PUBLIC_APP_VERSION: z.string().optional(),
  },
  experimental__runtimeEnv: {
    NODE_ENV: process.env.NODE_ENV,
    NEXT_PUBLIC_BASE_URL: process.env.NEXT_PUBLIC_BASE_URL,
    NEXT_PUBLIC_AVATAR_BUCKET_NAME: process.env.NEXT_PUBLIC_AVATAR_BUCKET_NAME,
    NEXT_PUBLIC_ATTACHMENTS_BUCKET_NAME:
      process.env.NEXT_PUBLIC_ATTACHMENTS_BUCKET_NAME,
    NEXT_PUBLIC_APP_VERSION: process.env.NEXT_PUBLIC_APP_VERSION,
  },
  skipValidation:
    !!process.env.CI || process.env.npm_lifecycle_event === "lint",
});
