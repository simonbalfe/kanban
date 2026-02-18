import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

import * as schema from "./schema";

export type dbClient = NodePgDatabase<typeof schema> & {
  $client: Pool;
};

function getConnectionString(connectionString: string | undefined): string | undefined {
  if (!connectionString) {
    return connectionString;
  }

  try {
    const url = new URL(connectionString);
    const sslMode = url.searchParams.get("sslmode");
    const useLibpqCompat = url.searchParams.get("uselibpqcompat") === "true";

    if (
      !useLibpqCompat &&
      (sslMode === "prefer" || sslMode === "require" || sslMode === "verify-ca")
    ) {
      url.searchParams.set("sslmode", "verify-full");
      return url.toString();
    }
  } catch {
    return connectionString;
  }

  return connectionString;
}

const pool = new Pool({
  connectionString: getConnectionString(process.env.POSTGRES_URL),
});

export const db = drizzle(pool, { schema }) as dbClient;
