import prisma from "@/prisma/client";
import { z } from "zod";
import cloudinary from "../cloudinary";
import { protectedProcedure, router } from "../trpc";

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
            let result = await prisma.group.create({
                data: {
                    name: input.name,
                    owner_id: ctx.session!!.user.id,
                },
            });

            cloudinary.utils.api_sign_request(
                {},
                process.env.CLOUDINARY_API_SECRET as string
            );
            if (input.icon != null) {
                const res = await cloudinary.uploader.upload(input.icon, {
                    public_id: `icons/${result.id}`,
                    resource_type: "image",
                    transformation: {
                        width: 300,
                        height: 300,
                        crop: "pad",
                        audio_codec: "none",
                    },
                });

                result = await prisma.group.update({
                    where: {
                        id: result.id,
                    },
                    data: {
                        icon_hash: res.version,
                    },
                });

                console.log(res);
            }

            return result;
        }),
});
