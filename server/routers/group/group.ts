import { TRPCError } from "@trpc/server";
import prisma from "@/server/prisma";
import { z } from "zod";
import { protectedProcedure, router } from "../../trpc";
import { checkIsOwnerOf } from "@/utils/trpc/permissions";
import { inviteRouter } from "./invite";
import {
    createGroupSchema,
    GroupWithNotifications,
    updateGroupSchema,
} from "../../schema/group";
import { membersRouter } from "./members";
import { channels } from "@/server/ably";
import { getLastRead } from "@/server/utils/last-read";
import db from "@/server/db/client";
import { members } from "@/server/db/schema";

export const groupRouter = router({
    create: protectedProcedure
        .input(createGroupSchema)
        .mutation(async ({ ctx, input }) => {
            return await prisma.group.create({
                data: {
                    name: input.name,
                    owner_id: ctx.session.user.id,
                    members: {
                        create: {
                            user_id: ctx.session.user.id,
                        },
                    },
                },
            });
        }),
    all: protectedProcedure.query(async ({ ctx }) => {
        return await prisma.$transaction(async () =>
            getGroupWithNotifications(ctx.session.user.id)
        );
    }),
    info: protectedProcedure
        .input(
            z.object({
                groupId: z.number(),
            })
        )
        .query(async ({ input, ctx }) => {
            const member = await prisma.member.findUnique({
                select: {
                    group: true,
                },
                where: {
                    group_id_user_id: {
                        group_id: input.groupId,
                        user_id: ctx.session.user.id,
                    },
                },
            });

            if (member == null) {
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "You aren't the member of this group yet",
                });
            }

            return member.group;
        }),
    join: protectedProcedure
        .input(
            z.object({
                code: z.string(),
            })
        )
        .mutation(async ({ ctx, input }) => {
            const invite = await prisma.groupInvite.findUnique({
                where: {
                    code: input.code,
                },
            });
            if (invite == null)
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Invite not found",
                });

            return await joinMember(invite.group_id, ctx.session.user.id);
        }),
    joinByUniqueName: protectedProcedure
        .input(
            z.object({
                uniqueName: z.string(),
            })
        )
        .mutation(async ({ ctx, input }) => {
            const group = await prisma.group.findUnique({
                where: {
                    unique_name: input.uniqueName,
                },
            });
            if (group == null)
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Group not found",
                });

            if (!group.public)
                throw new TRPCError({
                    code: "BAD_REQUEST",
                    message: "The group isn't a public group",
                });

            return await joinMember(group.id, ctx.session.user.id);
        }),
    update: protectedProcedure
        .input(updateGroupSchema)
        .mutation(async ({ ctx, input }) => {
            await checkIsOwnerOf(input.groupId, ctx.session);

            const updated = await prisma.group.update({
                where: {
                    id: input.groupId,
                },
                data: {
                    name: input.name,
                    icon_hash: input.icon_hash,
                    unique_name: input.unique_name,
                    public: input.public,
                },
            });

            await channels.chat.group_updated.publish([input.groupId], updated);

            return updated;
        }),
    delete: protectedProcedure
        .input(z.object({ groupId: z.number() }))
        .mutation(async ({ ctx, input }) => {
            await checkIsOwnerOf(input.groupId, ctx.session);

            await prisma.group.deleteMany({
                where: {
                    id: input.groupId,
                },
            });

            await channels.chat.group_deleted.publish([input.groupId], {
                id: input.groupId,
            });
        }),
    leave: protectedProcedure
        .input(
            z.object({
                groupId: z.number(),
            })
        )
        .mutation(async ({ ctx, input }) => {
            const group = await prisma.group.findUnique({
                where: {
                    id: input.groupId,
                },
            });
            if (group == null)
                throw new TRPCError({
                    code: "BAD_REQUEST",
                    message: "Group doesn't exist",
                });
            if (group.owner_id === ctx.session.user.id)
                throw new TRPCError({
                    code: "BAD_REQUEST",
                    message:
                        "The group owner cannot leave the group, please transfer your permissions before leaving it",
                });

            await prisma.member.deleteMany({
                where: {
                    group_id: input.groupId,
                    user_id: ctx.session.user.id,
                },
            });
        }),
    invite: inviteRouter,
    member: membersRouter,
});

async function joinMember(groupId: number, userId: string) {
    try {
        await prisma.member.createMany({
            data: {
                group_id: groupId,
                user_id: userId,
            },
        });

        return await prisma.group.findUniqueOrThrow({
            where: {
                id: groupId,
            },
        });
    } catch (e) {
        throw new TRPCError({
            code: "FORBIDDEN",
            message: "You had been joined the group",
        });
    }
}

async function getGroupWithNotifications(
    userId: string
): Promise<GroupWithNotifications[]> {
    const joined = await prisma.member.findMany({
        orderBy: {
            group_id: "desc",
        },
        select: {
            group: true,
        },
        where: {
            user_id: userId,
        },
    });

    return await Promise.all(
        joined.map(async (member) => {
            const count = await prisma.message.count({
                where: {
                    group_id: member.group.id,
                    timestamp: {
                        gt:
                            (await getLastRead(member.group.id, userId)) ??
                            undefined,
                    },
                },
            });

            return {
                ...member.group,
                unread_messages: count,
            };
        })
    );
}
