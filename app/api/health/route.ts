import { NextResponse } from "next/server";
import { sql } from "drizzle-orm";
import { getDb } from "@/lib/db";

export const dynamic = "force-dynamic";

/**
 * Deployment diagnostic. Reports which connection variables the running
 * function can see (names only, never values), the commit it was built from,
 * and whether a trivial query reaches the database.
 */
export async function GET() {
  const body = {
    commit: process.env.COMMIT_REF?.slice(0, 7) ?? null,
    context: process.env.CONTEXT ?? null,
    sees: {
      DATABASE_URL: Boolean(process.env.DATABASE_URL),
      NETLIFY_DATABASE_URL: Boolean(process.env.NETLIFY_DATABASE_URL),
      POSTGRESQL_URL: Boolean(process.env.POSTGRESQL_URL),
      SESSION_SECRET: Boolean(process.env.SESSION_SECRET),
    },
  };

  try {
    await getDb().execute(sql`select 1`);
    return NextResponse.json({ ...body, database: "reachable" });
  } catch (error) {
    const cause = (error as { cause?: { code?: string } }).cause;
    return NextResponse.json(
      {
        ...body,
        database: "unreachable",
        code: cause?.code ?? null,
        reason: (error as Error).message.split("\n")[0].slice(0, 160),
      },
      { status: 503 },
    );
  }
}
