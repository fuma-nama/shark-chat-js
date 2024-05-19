import type { Config } from "drizzle-kit";

const url = process.env.PUSH_DATABASE_URL ?? process.env.DATABASE_URL;
if (url == null) {
  throw new Error("Missing environment variables");
}

export default {
  dialect: "postgresql",
  out: "./packages/db/migrations",
  schema: "./packages/db/schema.ts",
  dbCredentials: {
    url,
  },
  breakpoints: true,
} satisfies Config;
