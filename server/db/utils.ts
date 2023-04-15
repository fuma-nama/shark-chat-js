import { TRPCError } from "@trpc/server";
import type {
    AnyMySqlTable,
    MySqlUpdateSetSource,
} from "drizzle-orm/mysql-core";
import { v4 as uuid } from "uuid";
import db from "./client";
import { users } from "./schema";
import { SQL } from "drizzle-orm";

export function oneOrNull<T>(items: T[]): T | null {
    if (items.length === 0) return null;

    return items[0];
}

export function requireOne<T>(items: T[], error?: string): T {
    if (items.length !== 1) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error });
    }

    return items[0];
}

export function generateInviteCode() {
    return uuid();
}

/**
 * Fix syntax error caused by undefined values
 */
export function update<TTable extends AnyMySqlTable>(
    table: TTable,
    value: MySqlUpdateSetSource<TTable>
) {
    Object.keys(table).forEach((key) => {
        if (value[key] === undefined) {
            delete value[key];
        }
    });

    return db.update(table).set(value);
}

/**
 * Update If needed
 */
export async function updateOptional<TTable extends AnyMySqlTable>({
    table,
    value,
    where,
}: {
    table: TTable;
    value: MySqlUpdateSetSource<TTable>;
    where: SQL;
}) {
    Object.keys(table).forEach((key) => {
        if (value[key] === undefined) {
            delete value[key];
        }
    });

    if (Object.keys(value).length !== 0) {
        return await db.update(table).set(value).where(where);
    }
}

export const userSelect = {
    name: users.name,
    id: users.id,
    image: users.image,
} as const;
