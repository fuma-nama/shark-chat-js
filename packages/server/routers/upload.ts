import {
  attachment,
  groupBanners,
  groupIcon,
  userAvatar,
  userBanners,
} from "shared/media/format";
import { getTimestamp } from "shared/media/timestamp";
import cloudinary from "../cloudinary";
import { protectedProcedure, router } from "../trpc";
import { z } from "zod";
import { getMembership } from "../utils/permissions";
import { createId } from "@paralleldrive/cuid2";
import { TRPCError } from "@trpc/server";

type SignOptions = {
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
        groupId: z.string(),
      }),
    )
    .query(async ({ input: { groupId }, ctx }) => {
      const member = await getMembership(groupId, ctx.session.user.id);
      if (!member.owner && !member.admin)
        throw new TRPCError({ message: "Admin Only", code: "UNAUTHORIZED" });

      return sign({
        public_id: groupIcon.id(groupId),
        transformation: "w_300,h_300",
      });
    }),
  signGroupBanner: protectedProcedure
    .input(
      z.object({
        groupId: z.string(),
      }),
    )
    .query(async ({ input: { groupId }, ctx }) => {
      const member = await getMembership(groupId, ctx.session.user.id);
      if (!member.owner && !member.admin)
        throw new TRPCError({ message: "Admin Only", code: "UNAUTHORIZED" });

      return sign({
        public_id: groupBanners.id(groupId),
        transformation: "w_1200",
      });
    }),
  signAttachment: protectedProcedure
    .input(z.object({ filename: z.string() }))
    .query(async ({ input, ctx }) => {
      const id = createId();

      return sign({
        public_id: attachment.id(ctx.session.user.id, id, input.filename),
      });
    }),
  signUserBanner: protectedProcedure.query(async ({ ctx }) => {
    return sign({
      public_id: userBanners.id(ctx.session.user.id),
      transformation: "w_1200",
    });
  }),
});

export function sign(options: SignOptions): SignResponse {
  const config = cloudinary.config();
  const timestamp = getTimestamp();

  const signature = cloudinary.utils.api_sign_request(
    { ...options, timestamp },
    config.api_secret!!,
  );

  return { signature, api_key: config.api_key!!, timestamp, ...options };
}
