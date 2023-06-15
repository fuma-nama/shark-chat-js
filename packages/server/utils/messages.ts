import db from "db";
import {
    messages,
    users,
    attachments,
    messageChannels,
    Attachment,
    Embed,
} from "db/schema";
import { requireOne } from "db/utils";
import { and, eq, lt, desc, gt } from "drizzle-orm";
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
import { info } from "./og-meta";

const userProfileKeys = ["id", "name", "image"] as const;
const url_regex = /(https?:\/\/[^\s]+)/g;

export function fetchMessages(
    channel: string,
    count: number,
    after?: Date,
    before?: Date
) {
    const reply_message = alias(messages, "reply_message");
    const reply_user = alias(users, "reply_user");

    return db
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
                eq(messages.channel_id, channel),
                after != null ? gt(messages.timestamp, after) : undefined,
                before != null ? lt(messages.timestamp, before) : undefined
            )
        )
        .leftJoin(users, eq(users.id, messages.author_id))
        .leftJoin(attachments, eq(attachments.id, messages.attachment_id))
        .leftJoin(reply_message, eq(messages.reply_id, reply_message.id))
        .leftJoin(reply_user, eq(reply_message.author_id, reply_user.id))
        .orderBy(desc(messages.timestamp))
        .limit(count);
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
    author_id: string,
    embeds: Embed[]
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
            embeds: embeds.length === 0 ? null : embeds,
        })
        .then((res) => Number(res.insertId));

    db.update(messageChannels)
        .set({
            last_message_id: message_id,
        })
        .where(eq(messageChannels.id, input.channelId))
        .execute();

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

    return { ...message, attachment, embeds };
}

export async function getEmbeds(content: string): Promise<Embed[]> {
    const embeds: Embed[] = [];
    const url_result = content.match(url_regex);

    if (url_result != null) {
        await Promise.all(
            Array.from(new Set(url_result))
                .slice(0, 3)
                .map((url) =>
                    info(url)
                        .then((res) => {
                            if (res != null) embeds.push(res);
                        })
                        .catch(() => {})
                )
        );
    }

    return embeds;
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
