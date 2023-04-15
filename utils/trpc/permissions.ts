import db from "@/server/db/client";
import { groups, members } from "@/drizzle/schema";
import { TRPCError } from "@trpc/server";
import { and, eq } from "drizzle-orm";
import { Session } from "next-auth";

export async function checkIsMemberOf(group: number, user: Session) {
    const rows = await db
        .select()
        .from(members)
        .where(
            and(eq(members.group_id, group), eq(members.user_id, user.user.id))
        );

    if (rows.length === 0) {
        throw new TRPCError({
            message: "You must join the group in order to receive messages",
            code: "BAD_REQUEST",
        });
    }
}

export async function checkIsOwnerOf(group: number, user: Session) {
    const rows = await db
        .select()
        .from(groups)
        .where(and(eq(groups.owner_id, user.user.id), eq(groups.id, group)));

    if (rows.length === 0) {
        throw new TRPCError({
            message: "You must be the owner of the group to do this action",
            code: "BAD_REQUEST",
        });
    }
}
