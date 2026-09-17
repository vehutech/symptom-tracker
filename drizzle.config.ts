import type { Config } from "drizzle-kit";

export default {
  schema: "./lib/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url:
      process.env.DATABASE_URL ??
      process.env.NETLIFY_DATABASE_URL ??
      process.env.POSTGRESQL_URL ??
      "",
  },
  strict: true,
} satisfies Config;
