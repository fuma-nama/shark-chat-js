import prisma from "@/prisma/client";
import { procedure, protectedProcedure, router } from "@/server/trpc";
import { z } from "zod";
import { checkIsOwnerOf } from "../chat";

export const inviteRouter = router({
    get: procedure
        .input(
            z.object({
                groupId: z.number(),
            })
        )
        .query(async ({ input }) => {
            return await prisma.groupInvite.findUnique({
                where: {
                    group_id: input.groupId,
                },
            });
        }),
    /**create or replace current invite code */
    create: protectedProcedure
        .input(z.object({ groupId: z.number() }))
        .mutation(async ({ input, ctx }) => {
            await checkIsOwnerOf(input.groupId, ctx.session);

            await prisma.groupInvite.deleteMany({
                where: {
                    group_id: input.groupId,
                },
            });

            return await prisma.groupInvite.create({
                data: {
                    group_id: input.groupId,
                },
            });
        }),
    delete: protectedProcedure
        .input(z.object({ groupId: z.number() }))
        .mutation(async ({ ctx, input }) => {
            await checkIsOwnerOf(input.groupId, ctx.session);

            return await prisma.groupInvite.deleteMany({
                where: {
                    group_id: input.groupId,
                },
            });
        }),
});
