import { TRPCError } from "@trpc/server";
import prisma from "@/server/prisma";
import { z } from "zod";
import { procedure, protectedProcedure, router } from "../../trpc";
import { checkIsOwnerOf } from "@/utils/trpc/permissions";
import { inviteRouter } from "./invite";
import {
    createGroupSchema,
    GroupWithNotifications,
    updateGroupSchema,
} from "../../schema/group";

export const groupRouter = router({
    create: protectedProcedure
        .input(createGroupSchema)
        .mutation(async ({ ctx, input }) => {
            const userId = ctx.session.user.id;
            return await prisma.group.create({
                data: {
                    name: input.name,
                    owner_id: userId,
                    members: {
                        create: {
                            user_id: userId,
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
    info: procedure
        .input(
            z.object({
                groupId: z.number(),
            })
        )
        .query(async ({ input }) => {
            return await prisma.group.findUnique({
                where: {
                    id: input.groupId,
                },
            });
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
            if (invite.once) {
                await prisma.groupInvite.delete({
                    where: { code: invite.code },
                });
            }

            const result = await joinMember(
                invite.group_id,
                ctx.session.user.id
            );
            return result.group;
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

            const result = await joinMember(group.id, ctx.session.user.id);
            return result.group;
        }),
    update: protectedProcedure
        .input(updateGroupSchema)
        .mutation(async ({ ctx, input }) => {
            await checkIsOwnerOf(input.groupId, ctx.session);

            return await prisma.group.update({
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
        }),
    delete: protectedProcedure
        .input(z.object({ groupId: z.number() }))
        .mutation(async ({ ctx, input }) => {
            await checkIsOwnerOf(input.groupId, ctx.session);

            return await prisma.group.delete({
                where: {
                    id: input.groupId,
                },
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

            return prisma.member.delete({
                where: {
                    group_id_user_id: {
                        group_id: input.groupId,
                        user_id: ctx.session.user.id,
                    },
                },
            });
        }),
    invite: inviteRouter,
});

async function joinMember(groupId: number, userId: string) {
    try {
        return await prisma.member.create({
            data: {
                group_id: groupId,
                user_id: userId,
            },
            select: {
                group: true,
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
        include: {
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
                    group_id: member.group_id,
                    timestamp: {
                        gt: member.last_read,
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
