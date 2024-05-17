import db from "db/client";
import {
  DirectMessageInfo,
  directMessageInfos,
  groups,
  Member,
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
  userId: string,
): Promise<Result> {
  const channel = await db
    .select({ member: members, dm: directMessageInfos })
    .from(messageChannels)
    .where(eq(messageChannels.id, channelId))
    .leftJoin(
      members,
      and(
        eq(members.group_id, messageChannels.group_id),
        eq(members.user_id, userId),
      ),
    )
    .leftJoin(
      directMessageInfos,
      and(
        eq(messageChannels.type, "DM"),
        eq(directMessageInfos.channel_id, messageChannels.id),
        eq(directMessageInfos.user_id, userId),
      ),
    )
    .limit(1)
    .then((res) => res[0]);

  if (channel?.member) {
    return { type: "group", data: channel.member };
  }

  if (channel?.dm) {
    return { type: "dm", data: channel.dm };
  }

  throw new TRPCError({ code: "NOT_FOUND" });
}

export async function getMembership(
  groupId: string,
  userId: string,
): Promise<Member & { owner: boolean; ownerId: string }> {
  const result = await db
    .select({ member: members, owner_id: groups.owner_id })
    .from(members)
    .where(and(eq(members.group_id, groupId), eq(members.user_id, userId)))
    .innerJoin(groups, eq(groups.id, groupId))
    .limit(1);

  if (result.length === 0)
    throw new TRPCError({
      message: "Not a member of group",
      code: "UNAUTHORIZED",
    });

  // todo: Store is_owner in member table
  return {
    ...result[0].member,
    owner: result[0].owner_id === userId,
    ownerId: result[0].owner_id,
  };
}

export async function checkIsMemberOf(groupId: string, user: Session) {
  const rows = await db
    .select()
    .from(members)
    .where(
      and(eq(members.group_id, groupId), eq(members.user_id, user.user.id)),
    )
    .limit(1);

  if (rows.length === 0) {
    throw new TRPCError({
      message: "You must join the group in order to receive messages",
      code: "BAD_REQUEST",
    });
  }
}

export async function checkIsOwnerOf(groupId: string, user: Session) {
  const rows = await db
    .select()
    .from(groups)
    .where(and(eq(groups.owner_id, user.user.id), eq(groups.id, groupId)))
    .limit(1);

  if (rows.length === 0) {
    throw new TRPCError({
      message: "You must be the owner of the group to do this action",
      code: "BAD_REQUEST",
    });
  }

  return rows;
}
