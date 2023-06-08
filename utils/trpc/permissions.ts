import db from "@/server/db/client";
import {
    DirectMessageInfo,
    Member,
    directMessageInfos,
    groups,
    members,
} from "@/drizzle/schema";
import { TRPCError } from "@trpc/server";
import { and, eq } from "drizzle-orm";
import { Session } from "next-auth";

type Result =
    | {
          type: "dm";
          data: DirectMessageInfo;
      }
    | {
          type: "group";
          data: Member;
      };
export async function checkChannelPermissions(
    channelId: string,
    user: Session
): Promise<Result> {
    if (channelId.startsWith("g_")) {
        const rows = await db
            .select()
            .from(members)
            .where(
                and(
                    eq(members.group_id, Number(channelId.slice("g_".length))),
                    eq(members.user_id, user.user.id)
                )
            )
            .limit(1);

        if (rows.length === 0) {
            throw new TRPCError({
                code: "UNAUTHORIZED",
                message: "Missing required permissions",
            });
        }

        return { type: "group", data: rows[0] };
    }

    const rows = await db
        .select()
        .from(directMessageInfos)
        .where(
            and(
                eq(directMessageInfos.channel_id, channelId),
                eq(directMessageInfos.user_id, user.user.id),
                eq(directMessageInfos.open, true)
            )
        )
        .limit(1);

    if (rows.length === 0) {
        throw new TRPCError({
            code: "NOT_FOUND",
            message: "Channel not found",
        });
    }

    return { type: "dm", data: rows[0] };
}

export async function checkIsMemberOf(group: number, user: Session) {
    const rows = await db
        .select()
        .from(members)
        .where(
            and(eq(members.group_id, group), eq(members.user_id, user.user.id))
        )
        .limit(1);

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
        .where(and(eq(groups.owner_id, user.user.id), eq(groups.id, group)))
        .limit(1);

    if (rows.length === 0) {
        throw new TRPCError({
            message: "You must be the owner of the group to do this action",
            code: "BAD_REQUEST",
        });
    }
}
