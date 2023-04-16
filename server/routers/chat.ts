import { TRPCError } from "@trpc/server";
import { channels } from "@/server/ably";
import { z } from "zod";
import { protectedProcedure, router } from "./../trpc";
import {
    AttachmentType,
    DirectMessageType,
    MessageType,
    UploadAttachment,
    contentSchema,
    uploadAttachmentSchema,
} from "../schema/chat";
import { checkIsMemberOf } from "@/utils/trpc/permissions";
import { onReceiveMessage } from "../inworld";
import { getLastRead, setLastRead } from "../redis/last-read";
import db from "../db/client";
import { attachments, groups, messages, users } from "../../drizzle/schema";
import { and, desc, eq, gt, lt } from "drizzle-orm";
import { attachmentSelect, requireOne, update, userSelect } from "../db/utils";
import { createId } from "@paralleldrive/cuid2";

export const chatRouter = router({
    send: protectedProcedure
        .input(
            z
                .object({
                    groupId: z.number(),
                    content: contentSchema,
                    attachments: z.array(uploadAttachmentSchema),
                    nonce: z.number().optional(),
                })
                .refine(
                    ({ content, attachments }) =>
                        content.length !== 0 || attachments.length !== 0,
                    "Message is empty"
                )
        )
        .mutation(async ({ input, ctx }) => {
            const message = await db.transaction(async () => {
                await checkIsMemberOf(input.groupId, ctx.session);
                const message_id = await db
                    .insert(messages)
                    .values({
                        author_id: ctx.session.user.id,
                        content: input.content,
                        group_id: input.groupId,
                    })
                    .then((res) => Number(res.insertId));

                const message = await db
                    .select({
                        ...(messages as typeof messages._.columns),
                        author: userSelect,
                    })
                    .from(messages)
                    .where(eq(messages.id, message_id))
                    .innerJoin(users, eq(users.id, messages.author_id))
                    .then((res) => requireOne(res));

                return {
                    ...message,
                    attachments: await insertAttachments(
                        message_id,
                        input.attachments,
                        false
                    ),
                    nonce: input.nonce,
                };
            });

            await channels.chat.message_sent.publish([input.groupId], message);

            await setLastRead(
                input.groupId,
                ctx.session.user.id,
                message.timestamp
            );

            if (input.content.startsWith("@Shark")) {
                await onReceiveMessage({
                    group_id: message.group_id,
                    content: message.content.replaceAll("@Shark", ""),
                    user_name: message.author.name,
                });
            }

            return message;
        }),
    messages: protectedProcedure
        .input(
            z.object({
                groupId: z.number(),
                count: z.number().min(0).max(50).default(50),
                cursorType: z.enum(["after", "before"]).default("before"),
                cursor: z.string().datetime().optional(),
            })
        )
        .query(async ({ input, ctx }) => {
            await checkIsMemberOf(input.groupId, ctx.session);
            const count = Math.min(input.count, 50);

            return await db
                .select({
                    ...(messages as typeof messages._.columns),
                    author: userSelect,
                    attachment: attachmentSelect,
                })
                .from(messages)
                .where(
                    and(
                        eq(messages.group_id, input.groupId),
                        input.cursor != null && input.cursorType === "after"
                            ? gt(messages.timestamp, new Date(input.cursor))
                            : undefined,
                        input.cursor != null && input.cursorType === "before"
                            ? lt(messages.timestamp, new Date(input.cursor))
                            : undefined
                    )
                )
                .leftJoin(users, eq(users.id, messages.author_id))
                .leftJoin(attachments, eq(attachments.message_id, messages.id))
                .orderBy(desc(messages.timestamp))
                .limit(count)
                .then((rows) => combineOneToManyMessages<MessageType>(rows));
        }),
    update: protectedProcedure
        .input(
            z.object({
                messageId: z.number(),
                groupId: z.number(),
                content: contentSchema,
            })
        )
        .mutation(async ({ ctx, input }) => {
            const rows = await update(messages, {
                content: input.content,
            }).where(
                and(
                    eq(messages.id, input.messageId),
                    eq(messages.author_id, ctx.session.user.id),
                    eq(messages.group_id, input.groupId)
                )
            );

            if (rows.rowsAffected === 0)
                throw new TRPCError({
                    code: "BAD_REQUEST",
                    message: "No permission or message doesn't exist",
                });

            await channels.chat.message_updated.publish([input.groupId], {
                id: input.messageId,
                content: input.content,
                group_id: input.groupId,
            });
        }),
    delete: protectedProcedure
        .input(
            z.object({
                messageId: z.number(),
            })
        )
        .mutation(async ({ ctx, input }) => {
            const { group_id } = await checkDeleteMessage(
                input.messageId,
                ctx.session.user.id
            );

            await db.delete(messages).where(eq(messages.id, input.messageId));
            await channels.chat.message_deleted.publish([group_id], {
                id: input.messageId,
                group_id: group_id,
            });
        }),
    read: protectedProcedure
        .input(z.object({ groupId: z.number() }))
        .mutation(async ({ ctx, input }) => {
            await setLastRead(
                input.groupId,
                ctx.session.user.id,
                new Date(Date.now())
            );
        }),
    checkout: protectedProcedure
        .input(
            z.object({
                groupId: z.number(),
            })
        )
        .query(async ({ ctx, input }) => {
            const old = await getLastRead(input.groupId, ctx.session.user.id);

            await setLastRead(
                input.groupId,
                ctx.session.user.id,
                new Date(Date.now())
            );

            return { last_read: old };
        }),
    type: protectedProcedure
        .input(
            z.object({
                groupId: z.number(),
            })
        )
        .mutation(async ({ ctx, input }) => {
            const user = await db
                .select(userSelect)
                .from(users)
                .where(eq(users.id, ctx.session.user.id))
                .then((res) => res[0]);

            if (user == null)
                throw new TRPCError({
                    code: "BAD_REQUEST",
                    message: "User not found",
                });

            await channels.chat.typing.publish([input.groupId], {
                user,
            });
        }),
});

async function checkDeleteMessage(messageId: number, user: string) {
    const message = await db
        .select({
            author_id: messages.author_id,
            group_id: messages.group_id,
        })
        .from(messages)
        .where(eq(messages.id, messageId))
        .limit(1)
        .then((res) => res[0]);

    if (message == null)
        throw new TRPCError({
            code: "NOT_FOUND",
            message: "Message not found",
        });

    if (message.author_id === user) {
        return { group_id: message.group_id };
    }

    const group_rows = await db
        .select({ owner: groups.owner_id })
        .from(groups)
        .where(eq(groups.id, message.group_id))
        .limit(1);

    if (group_rows.length !== 0 && group_rows[0].owner === user) {
        return { group_id: message.group_id };
    }

    throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Missing required permission",
    });
}

export function insertAttachments(
    message_id: number,
    uploads: UploadAttachment[],
    direct: boolean
): Promise<AttachmentType[]> {
    const mapped_attachments = uploads.map(async (attachment) => {
        const values: AttachmentType = {
            ...attachment,
            id: createId(),
            width: attachment.width ?? null,
            height: attachment.height ?? null,
        };

        await db.insert(attachments).values({
            direct_message_id: direct ? message_id : null,
            message_id: !direct ? message_id : null,
            ...values,
        });

        return values;
    });

    return Promise.all(mapped_attachments);
}

export function combineOneToManyMessages<
    T extends MessageType | DirectMessageType
>(
    rows: (Omit<T, "attachments"> & {
        attachment: AttachmentType | null;
    })[]
): T[] {
    const arr: T[] = [];
    for (const message of rows) {
        const { attachment, ...row } = message;

        if (arr.length !== 0 && arr[arr.length - 1].id === row.id) {
            const prev_attachments = arr[arr.length - 1].attachments;

            if (attachment != null) {
                prev_attachments.push(attachment);
            }
        } else {
            arr.push({
                ...(row as unknown as T),
                attachments: attachment != null ? [attachment] : [],
            });
        }
    }

    return arr;
}
