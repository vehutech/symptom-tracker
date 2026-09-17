import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import * as schema from "./schema";

type Db = ReturnType<typeof drizzle<typeof schema>>;

const globalForDb = globalThis as unknown as { __fulHmsDb?: Db };

/**
 * Lazy singleton so the module can be imported during build without a live
 * DATABASE_URL, and so serverless invocations reuse one pooled client.
 */
export function getDb(): Db {
  if (globalForDb.__fulHmsDb) return globalForDb.__fulHmsDb;

  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      "DATABASE_URL is not set. Add your Neon/Postgres connection string to the environment before starting the app.",
    );
  }

  const client = postgres(url, {
    max: 1,
    idle_timeout: 20,
    prepare: false, // required for transaction-pooled connections (Neon/Supabase pgbouncer)
  });

  const db = drizzle(client, { schema });
  globalForDb.__fulHmsDb = db;
  return db;
}
