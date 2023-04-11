import prisma from "@/server/prisma";
import { protectedProcedure, router } from "@/server/trpc";
import { channels } from "@/server/ably";
import { checkIsMemberOf, checkIsOwnerOf } from "@/utils/trpc/permissions";
import { TRPCError } from "@trpc/server";
import { z } from "zod";

export const membersRouter = router({
    get: protectedProcedure
        .input(
            z.object({
                groupId: z.number(),
            })
        )
        .query(async ({ ctx, input }) => {
            await checkIsMemberOf(input.groupId, ctx.session);

            return prisma.member.findMany({
                include: {
                    user: {
                        select: {
                            image: true,
                            name: true,
                            id: true,
                        },
                    },
                },
                where: {
                    group_id: input.groupId,
                },
            });
        }),
    kick: protectedProcedure
        .input(
            z.object({
                groupId: z.number(),
                userId: z.string(),
            })
        )
        .mutation(async ({ ctx, input }) => {
            await checkIsOwnerOf(input.groupId, ctx.session);
            if (ctx.session.user.id === input.userId) {
                throw new TRPCError({
                    code: "BAD_REQUEST",
                    message: "You can't kick yourself",
                });
            }

            await prisma.member.delete({
                where: {
                    group_id_user_id: {
                        group_id: input.groupId,
                        user_id: input.userId,
                    },
                },
            });

            await channels.private.group_removed.publish([input.userId], {
                id: input.groupId,
            });
        }),
});
