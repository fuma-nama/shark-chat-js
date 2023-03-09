import { TRPCError } from "@trpc/server";
import prisma from "@/prisma/client";
import { z } from "zod";
import { protectedProcedure, router } from "../trpc";

export const accountRouter = router({
    get: protectedProcedure.query(async ({ ctx }) => {
        const profile = await prisma.user.findUnique({
            where: {
                id: ctx.session.user.id,
            },
        });

        if (profile == null) {
            throw new TRPCError({
                code: "UNAUTHORIZED",
                message: "User not found",
            });
        }

        return profile;
    }),
    updateProfile: protectedProcedure
        .input(
            z.object({
                name: z.string().optional(),
                avatar_url: z.string().optional(),
            })
        )
        .mutation(async ({ input, ctx }) => {
            const userId = ctx.session.user.id;

            return await prisma.user.update({
                where: {
                    id: userId,
                },
                data: {
                    name: input.name ?? undefined,
                    image: input.avatar_url ?? undefined,
                },
            });
        }),
});
