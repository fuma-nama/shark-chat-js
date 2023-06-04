import type { Config } from "drizzle-kit";

const url = process.env.DATABASE_PUSH_URL;
if (url == null) {
    throw new Error("Missing environment variables");
}

export default {
    out: "./drizzle",
    schema: "./drizzle/schema.ts",
    connectionString: url,
    breakpoints: true,
} satisfies Config;
