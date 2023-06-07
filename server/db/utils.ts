import { TRPCError } from "@trpc/server";
import { v4 as uuid } from "uuid";

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
