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
                name: z.string(),
            })
        )
        .mutation(async ({ input, ctx }) => {
            const userId = ctx.session.user.id;

            await prisma.user.update({
                where: {
                    id: userId,
                },
                data: {
                    name: input.name,
                },
            });
        }),
});
