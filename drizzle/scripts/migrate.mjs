import { drizzle } from "drizzle-orm/planetscale-serverless/index.js";
import { connect } from "@planetscale/database";
import { migrate } from "drizzle-orm/planetscale-serverless/migrator.js";
import "dotenv/config";

const connection = connect({
    url: process.env.DATABASE_URL,
});

const db = drizzle(connection);

async function run() {
    await migrate(db, { migrationsFolder: "./drizzle" });
}

run();
