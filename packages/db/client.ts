import { drizzle as neonDrizzle } from "drizzle-orm/neon-serverless";
import { drizzle as pgDrizzle } from "drizzle-orm/node-postgres";
import { Pool } from "@neondatabase/serverless";
import { Client } from "pg";

declare global {
  var db: ReturnType<typeof pgDrizzle> | ReturnType<typeof neonDrizzle>;
}

if (!globalThis.db) {
  if (process.env.NODE_ENV === "development") {
    const client = new Client({
      connectionString: process.env.DATABASE_URL,
    });

    void client.connect();
    globalThis.db = pgDrizzle(client);
  } else {
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });

    globalThis.db = neonDrizzle(pool);
  }
}

export default globalThis.db;
