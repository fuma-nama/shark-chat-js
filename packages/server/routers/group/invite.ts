import { protectedProcedure, router } from "../../trpc";
import { z } from "zod";
import { checkIsOwnerOf } from "../../utils/permissions";
import { groupInvites } from "db/schema";
import db from "db/client";
import { and, eq } from "drizzle-orm";
import { requireOne } from "db/utils";
import { v4 as uuid } from "uuid";
/**
 * Only the group owner can manage invites
 */
export const inviteRouter = router({
    get: protectedProcedure
        .input(
            z.object({
                groupId: z.number(),
            })
        )
        .query(async ({ input, ctx }) => {
            await checkIsOwnerOf(input.groupId, ctx.session);

            return await db
                .select()
                .from(groupInvites)
                .where(eq(groupInvites.group_id, input.groupId));
        }),
    create: protectedProcedure
        .input(z.object({ groupId: z.number() }))
        .mutation(async ({ input, ctx }) => {
            await checkIsOwnerOf(input.groupId, ctx.session);
            const code = uuid();

            await db.insert(groupInvites).values({
                group_id: input.groupId,
                code,
            });

            return db
                .select()
                .from(groupInvites)
                .where(eq(groupInvites.code, code))
                .then((res) => requireOne(res));
        }),
    delete: protectedProcedure
        .input(z.object({ groupId: z.number(), code: z.string() }))
        .mutation(async ({ ctx, input }) => {
            await checkIsOwnerOf(input.groupId, ctx.session);

            await db
                .delete(groupInvites)
                .where(
                    and(
                        eq(groupInvites.code, input.code),
                        eq(groupInvites.group_id, input.groupId)
                    )
                );
        }),
});
