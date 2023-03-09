import { userAvatar } from "@/utils/media";
import { getTimestamp } from "@/utils/media/timestamp";
import cloudinary from "../cloudinary";
import { protectedProcedure, router } from "../trpc";

export const uploadRouter = router({
    signAvatar: protectedProcedure.query(async ({ ctx }) => {
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
});
