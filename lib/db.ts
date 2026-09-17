import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import * as schema from "./schema";

type Db = ReturnType<typeof drizzle<typeof schema>>;

/**
 * Netlify DB (Neon) injects NETLIFY_DATABASE_URL on the platform; locally the
 * connection string may be set as DATABASE_URL or POSTGRESQL_URL.
 */
export function databaseUrl(): string {
  const url =
    process.env.DATABASE_URL ??
    process.env.NETLIFY_DATABASE_URL ??
    process.env.POSTGRESQL_URL;

  if (!url) {
    throw new Error(
      "No database connection string found. Set DATABASE_URL (or NETLIFY_DATABASE_URL / POSTGRESQL_URL) in the environment.",
    );
  }
  return url;
}

const globalForDb = globalThis as unknown as { __fulHmsDb?: Db };

/**
 * Lazy singleton so the module can be imported during build without a live
 * DATABASE_URL, and so serverless invocations reuse one pooled client.
 */
export function getDb(): Db {
  if (globalForDb.__fulHmsDb) return globalForDb.__fulHmsDb;

  const client = postgres(databaseUrl(), {
    max: 1,
    idle_timeout: 20,
    prepare: false, // required for transaction-pooled connections (Neon/Supabase pgbouncer)
  });

  const db = drizzle(client, { schema });
  globalForDb.__fulHmsDb = db;
  return db;
}
