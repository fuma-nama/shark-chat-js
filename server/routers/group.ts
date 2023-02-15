import prisma from "@/prisma/client";
import { z } from "zod";
import ably from "../ably";
import cloudinary from "../cloudinary";
import { protectedProcedure, router } from "../trpc";
import { getChannel, publishMessage } from "@/utils/ably";
import { groupIcon } from "@/utils/media";

const imageSchema = z.string({
    description: "Base64 format file",
});

const createGroupSchema = z.object({
    name: z.string().min(1).max(100),
    /**
     * Base64 file
     */
    icon: imageSchema.optional(),
});

export const groupRouter = router({
    create: protectedProcedure
        .input(createGroupSchema)
        .mutation(async ({ ctx, input }) => {
            const userId = ctx.session!!.user.id;
            const channel = getChannel(ably, "private", userId);

            let result = await prisma.group.create({
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

            if (input.icon != null) {
                const res = await cloudinary.uploader.upload(
                    input.icon,
                    groupIcon.uploadOptions(result.id)
                );

                result = await prisma.group.update({
                    where: {
                        id: result.id,
                    },
                    data: {
                        icon_hash: res.version,
                    },
                });
            }

            await publishMessage(channel, "group_created", result);
            return result;
        }),
    all: protectedProcedure.query(async ({ ctx }) => {
        return await prisma.group.findMany({
            where: {
                members: {
                    some: {
                        user_id: ctx.session!!.user.id,
                    },
                },
            },
        });
    }),
});
