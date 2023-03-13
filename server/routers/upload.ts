import { userAvatar, groupIcon } from "@/utils/media/format";
import { getTimestamp } from "@/utils/media/timestamp";
import cloudinary from "../cloudinary";
import { protectedProcedure, router } from "../trpc";
import { z } from "zod";
import { checkIsOwnerOf } from "./chat";

export type SignOptions = {
    resource_type?: "image";
    transformation?: string;
    public_id?: string;
};

export type SignResponse = {
    timestamp: number;
    signature: string;
    api_key: string;
} & SignOptions;

export const uploadRouter = router({
    signAvatar: protectedProcedure.query(async ({ ctx }) => {
        return sign({
            public_id: userAvatar.id(ctx.session.user.id),
            transformation: "w_300,h_300",
        });
    }),
    signGroupIcon: protectedProcedure
        .input(
            z.object({
                groupId: z.number(),
            })
        )
        .query(async ({ input: { groupId }, ctx }) => {
            checkIsOwnerOf(groupId, ctx.session);

            return sign({
                public_id: groupIcon.id(groupId),
                transformation: "w_300,h_300",
            });
        }),
});

function sign(options: SignOptions): SignResponse {
    const config = cloudinary.config();
    const timestamp = getTimestamp();

    const signature = cloudinary.utils.api_sign_request(
        { ...options, timestamp },
        config.api_secret!!
    );

    return { signature, api_key: config.api_key!!, timestamp, ...options };
}
