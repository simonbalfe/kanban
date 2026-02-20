import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

import * as schema from "./schema";

export type dbClient = NodePgDatabase<typeof schema> & {
  $client: Pool;
};

const connectionString = process.env.POSTGRES_URL;

if (!connectionString) {
  throw new Error("Missing database connection string. Set POSTGRES_URL.");
}

const pool = new Pool({
  connectionString,
});

export const db = drizzle(pool, { schema }) as dbClient;
