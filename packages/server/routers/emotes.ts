import { protectedProcedure, router } from "../trpc";
import { z } from "zod";
import { Emotes, users } from "db/schema";
import { TRPCError } from "@trpc/server";
import { sign } from "./upload";
import { emotes } from "shared/media/format";
import { desc, eq } from "drizzle-orm";
import { pick } from "next/dist/lib/pick";

export const emotesRouter = router({
  get: protectedProcedure
    .input(
      z.strictObject({
        offset: z.number().optional(),
        count: z.number().max(50).default(50),
      }),
    )
    .query(async ({ input }) => {
      return await db
        .select()
        .from(Emotes)
        .orderBy(desc(Emotes.timestamp))
        .offset(input.offset ?? 0)
        .limit(input.count)
        .innerJoin(users, eq(users.id, Emotes.creatorId))
        .then((res) =>
          res.map((item) => ({
            ...item.emotes,
            creator: pick(item.User, ["id", "image", "name"]),
          })),
        );
    }),
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
