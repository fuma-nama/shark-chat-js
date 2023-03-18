import prisma from "@/prisma/client";
import { protectedProcedure, router } from "@/server/trpc";
import { z } from "zod";
import { checkIsOwnerOf } from "../chat";

/**
 * Only the group owner can manage invites
 */
export const inviteRouter = router({
    get: protectedProcedure
        .input(
            z.object({
                groupId: z.number(),
            })
        )
        .query(async ({ input, ctx }) => {
            await checkIsOwnerOf(input.groupId, ctx.session);

            return await prisma.groupInvite.findMany({
                where: {
                    group_id: input.groupId,
                },
            });
        }),
    create: protectedProcedure
        .input(z.object({ groupId: z.number(), once: z.boolean() }))
        .mutation(async ({ input, ctx }) => {
            await checkIsOwnerOf(input.groupId, ctx.session);

            return await prisma.groupInvite.create({
                data: {
                    group_id: input.groupId,
                },
            });
        }),
    delete: protectedProcedure
        .input(z.object({ groupId: z.number(), code: z.string() }))
        .mutation(async ({ ctx, input }) => {
            await checkIsOwnerOf(input.groupId, ctx.session);

            return await prisma.groupInvite.deleteMany({
                where: {
                    code: input.code,
                    group_id: input.groupId,
                },
            });
        }),
});
