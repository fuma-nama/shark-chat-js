import { protectedProcedure, router } from "../trpc";
import { z } from "zod";
import { Emotes, users } from "db/schema";
import { TRPCError } from "@trpc/server";
import { sign } from "./upload";
import { emotes } from "shared/media/format";
import { and, desc, eq } from "drizzle-orm";
import { pick } from "next/dist/lib/pick";

export const emotesRouter = router({
  get: protectedProcedure
    .input(
      z.strictObject({
        cursor: z.number().optional(),
        limit: z.number().max(50).default(50),
      }),
    )
    .query(async ({ input }) => {
      return await db
        .select()
        .from(Emotes)
        .orderBy(desc(Emotes.timestamp))
        .offset(input.cursor ?? 0)
        .limit(input.limit)
        .innerJoin(users, eq(users.id, Emotes.creatorId))
        .then((res) =>
          res.map((item) => ({
            ...item.emotes,
            creator: pick(item.User, ["id", "image", "name"]),
          })),
        );
    }),
  delete: protectedProcedure
    .input(
      z.strictObject({
        id: z.string(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const result = await db
        .delete(Emotes)
        .where(
          and(
            eq(Emotes.id, input.id),
            eq(Emotes.creatorId, ctx.session.user.id),
          ),
        );

      if (result.rowCount === 0) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "You cannot delete this emote",
        });
      }
    }),
  create: protectedProcedure
    .input(
      z.strictObject({
        id: z.string().regex(/^\w+$/),
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
          transformation: "w_50,h_50",
        });
      } catch (e) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Duplicated Id",
        });
      }
    }),
});
