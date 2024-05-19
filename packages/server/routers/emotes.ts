import { protectedProcedure, router } from "../trpc";
import { z } from "zod";
import { Emotes } from "db/schema";
import { TRPCError } from "@trpc/server";
import { sign } from "./upload";
import { emotes } from "shared/media/format";

export const emotesRouter = router({
  create: protectedProcedure
    .input(
      z.strictObject({
        id: z.string(),
        name: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      try {
        await db.insert(Emotes).values({
          id: input.id,
          name: input.name,
          creatorId: ctx.session.user.id,
        });

        return sign({
          public_id: emotes.id(input.id),
          transformation: "w_25,h_25",
        });
      } catch (e) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Duplicated Id",
        });
      }
    }),
});
