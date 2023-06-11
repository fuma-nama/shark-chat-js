import db from "db/client";
import {
    DirectMessageInfo,
    Member,
    directMessageInfos,
    groups,
    members,
    messageChannels,
} from "db/schema";
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
    const channel = await db
        .select({ member: members, dm: directMessageInfos })
        .from(messageChannels)
        .where(eq(messageChannels.id, channelId))
        .leftJoin(groups, eq(groups.channel_id, messageChannels.id))
        .leftJoin(
            members,
            and(
                eq(members.group_id, groups.id),
                eq(members.user_id, user.user.id)
            )
        )
        .leftJoin(
            directMessageInfos,
            and(
                eq(directMessageInfos.channel_id, messageChannels.id),
                eq(directMessageInfos.user_id, user.user.id),
                eq(directMessageInfos.open, true)
            )
        )
        .limit(1)
        .then((res) => res[0]);

    if (channel?.member != null) {
        return { type: "group", data: channel.member };
    }

    if (channel?.dm != null) {
        return { type: "dm", data: channel.dm };
    }

    throw new TRPCError({ code: "NOT_FOUND" });
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

    return rows;
}
