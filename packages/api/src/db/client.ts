import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

import * as schema from "./schema";

export type dbClient = NodePgDatabase<typeof schema> & {
  $client: Pool;
};

const pool = new Pool({
  connectionString: process.env.VITE_POSTGRES_URL,
});

export const db = drizzle(pool, { schema }) as dbClient;
