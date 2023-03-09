import { TRPCError } from "@trpc/server";
import prisma from "@/prisma/client";
import { z } from "zod";
import { protectedProcedure, router } from "../trpc";
import cloudinary from "../cloudinary";
import { getTimestamp } from "@/utils/media/timestamp";
import { userAvatar } from "@/utils/media";

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
    signUploadAvatar: protectedProcedure.query(async ({ ctx }) => {
        const config = cloudinary.config();
        const timestamp = getTimestamp();
        const options = {
            public_id: userAvatar.id(ctx.session.user.id),
            timestamp: timestamp,
            transformation: "w_300,h_300",
        };

        const signature = cloudinary.utils.api_sign_request(
            options,
            config.api_secret!!
        );

        return { signature, api_key: config.api_key!!, ...options };
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
