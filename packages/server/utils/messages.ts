import db from "db";
import {
    messages,
    users,
    attachments,
    messageChannels,
    Attachment,
} from "db/schema";
import { requireOne } from "db/utils";
import { and, eq, placeholder, or, isNull, lt, desc } from "drizzle-orm";
import { alias } from "drizzle-orm/mysql-core";
import { pick } from "shared/common";
import { z } from "zod";
import {
    AttachmentType,
    UploadAttachment,
    contentSchema,
    uploadAttachmentSchema,
} from "shared/schema/chat";
import { createId } from "@paralleldrive/cuid2";

const reply_message = alias(messages, "reply_message");
const reply_user = alias(users, "reply_user");
const userProfileKeys = ["id", "name", "image"] as const;

const message_query = db
    .select({
        ...(messages as typeof messages._.columns),
        author: pick(users, ...userProfileKeys),
        attachment: attachments,
        reply_message: pick(reply_message, "content"),
        reply_user: pick(reply_user, ...userProfileKeys),
    })
    .from(messages)
    .where(
        and(
            eq(messages.channel_id, placeholder("channel")),
            or(
                isNull(placeholder("after")),
                lt(messages.timestamp, placeholder("after"))
            ),
            or(
                isNull(placeholder("before")),
                lt(messages.timestamp, placeholder("before"))
            )
        )
    )
    .leftJoin(users, eq(users.id, messages.author_id))
    .leftJoin(attachments, eq(attachments.id, messages.attachment_id))
    .leftJoin(reply_message, eq(messages.reply_id, reply_message.id))
    .leftJoin(reply_user, eq(reply_message.author_id, reply_user.id))
    .orderBy(desc(messages.timestamp))
    .limit(30)
    .prepare();

export function fetchMessages(channel: string, after?: Date, before?: Date) {
    return message_query.execute({
        after: after ?? null,
        before: before ?? null,
        channel,
    });
}

export const messageSchema = z
    .object({
        channelId: z.string(),
        content: contentSchema,
        attachment: uploadAttachmentSchema.optional(),
        reply: z.number().optional(),
        nonce: z.number().optional(),
    })
    .refine(
        ({ content, attachment }) => content.length !== 0 || attachment != null,
        "Message is empty"
    );

export async function createMessage(
    input: z.infer<typeof messageSchema>,
    author_id: string
) {
    const attachment = insertAttachment(input.attachment);

    const message_id = await db
        .insert(messages)
        .values({
            author_id: author_id,
            content: input.content,
            channel_id: input.channelId,
            attachment_id: attachment?.id ?? null,
            reply_id: input.reply,
        })
        .then((res) => Number(res.insertId));

    const reply_message = alias(messages, "reply_message");
    const reply_user = alias(users, "reply_user");

    const message = await db
        .select({
            ...(messages as typeof messages._.columns),
            reply_message: pick(reply_message, "content"),
            reply_user: pick(reply_user, ...userProfileKeys),
            author: pick(users, ...userProfileKeys),
        })
        .from(messages)
        .where(eq(messages.id, message_id))
        .innerJoin(users, eq(users.id, messages.author_id))
        .leftJoin(reply_message, eq(reply_message.id, messages.reply_id))
        .leftJoin(reply_user, eq(reply_message.author_id, reply_user.id))
        .then((res) => requireOne(res));

    db.update(messageChannels)
        .set({
            last_message_id: message.id,
        })
        .where(eq(messageChannels.id, message.channel_id))
        .execute();

    return { ...message, attachment };
}

function insertAttachment(
    attachment: UploadAttachment | null | undefined
): AttachmentType | null {
    if (attachment == null) return null;

    const values: Attachment = {
        ...attachment,
        id: createId(),
        width: attachment.width ?? null,
        height: attachment.height ?? null,
    };

    db.insert(attachments)
        .values({ ...values })
        .execute();

    return values;
}
