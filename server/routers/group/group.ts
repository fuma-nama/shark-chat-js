import { TRPCError } from "@trpc/server";
import prisma from "@/server/prisma";
import { z } from "zod";
import { procedure, protectedProcedure, router } from "../../trpc";
import { checkIsOwnerOf } from "../chat";
import { inviteRouter } from "./invite";
import { createGroupSchema, updateGroupSchema } from "../../schema/group";

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
        return await prisma.group.findMany({
            where: {
                members: {
                    some: {
                        user_id: ctx.session.user.id,
                    },
                },
            },
        });
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

            const result = await prisma.member
                .create({
                    data: {
                        group_id: invite.group_id,
                        user_id: ctx.session.user.id,
                    },
                    select: {
                        group: true,
                    },
                })
                .catch(() => {
                    throw new TRPCError({
                        code: "FORBIDDEN",
                        message: "You had been joined the group",
                    });
                });

            return result.group;
        }),
    update: protectedProcedure
        .input(updateGroupSchema)
        .mutation(async ({ ctx, input }) => {
            await checkIsOwnerOf(input.groupId, ctx.session);

            const unique_name =
                input.unique_name?.length === 0 ? null : input.unique_name;

            return await prisma.group.update({
                where: {
                    id: input.groupId,
                },
                data: {
                    name: input.name,
                    icon_hash: input.icon_hash,
                    unique_name: unique_name,
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
