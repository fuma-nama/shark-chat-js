import { TRPCError } from "@trpc/server";
import prisma from "@/prisma/client";
import { z } from "zod";
import ably from "../ably";
import cloudinary from "../cloudinary";
import { procedure, protectedProcedure, router } from "../trpc";
import { channels } from "@/utils/ably";
import { groupIcon } from "@/utils/media";
import { checkIsOwnerOf } from "./chat";

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
            const userId = ctx.session.user.id;
            const channel = channels.private.get(ably, [userId]);

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

            await channels.private.group_created.publish(channel, result);
            return result;
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
    update: protectedProcedure
        .input(
            z.object({
                groupId: z.number(),
                name: z.string().optional(),
                icon_hash: z.number().optional(),
            })
        )
        .mutation(async ({ ctx, input }) => {
            checkIsOwnerOf(input.groupId, ctx.session);

            return await prisma.group.update({
                where: {
                    id: input.groupId,
                },
                data: {
                    name: input.name,
                    icon_hash: input.icon_hash,
                },
            });
        }),
    delete: protectedProcedure
        .input(z.object({ groupId: z.number() }))
        .mutation(async ({ ctx, input }) => {
            checkIsOwnerOf(input.groupId, ctx.session);

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
});
