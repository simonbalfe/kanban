import type { NeonDatabase } from "drizzle-orm/neon-serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import { Pool } from "@neondatabase/serverless";

import * as schema from "./schema";

export type dbClient = NeonDatabase<typeof schema>;

const connectionString = process.env.POSTGRES_URL;

if (!connectionString) {
  throw new Error("Missing database connection string. Set POSTGRES_URL.");
}

const pool = new Pool({
  connectionString,
  max: 5,
  connectionTimeoutMillis: 5000,
  idleTimeoutMillis: 10000,
});

export const db = drizzle(pool, { schema }) as dbClient;
