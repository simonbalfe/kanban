import type { NeonHttpDatabase } from "drizzle-orm/neon-http";
import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";

import * as schema from "./schema";

export type dbClient = NeonHttpDatabase<typeof schema>;

const connectionString = process.env.POSTGRES_URL;

if (!connectionString) {
  throw new Error("Missing database connection string. Set POSTGRES_URL.");
}

const sql = neon(connectionString);

export const db = drizzle(sql, { schema }) as dbClient;
