import { drizzle } from "drizzle-orm/planetscale-serverless";
import { connect } from "@planetscale/database";
import { migrate } from "drizzle-orm/planetscale-serverless/migrator";
import "dotenv/config";

const connection = connect({
    url: process.env.DATABASE_URL,
});

const db = drizzle(connection);

async function run() {
    await migrate(db, { migrationsFolder: "./drizzle" });
}

run();
