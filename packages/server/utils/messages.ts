import db from "db";
import {
  Attachment,
  attachments,
  Embed,
  Message,
  messageChannels,
  messages,
  users,
} from "db/schema";
import { requireOne } from "db/utils";
import { and, desc, eq, gt, lt } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { pick } from "shared/common";
import { z } from "zod";
import {
  AttachmentType,
  contentSchema,
  uploadAttachmentSchema,
  UserInfo,
} from "shared/schema/chat";
import { createId } from "@paralleldrive/cuid2";
import { info } from "./og-meta";

const userProfileKeys = ["id", "name", "image"] as const;
const url_regex = /(https?:\/\/\S+)/g;

export interface ComplexMessage
  extends Pick<
    Message,
    "id" | "content" | "embeds" | "channel_id" | "timestamp" | "reply_id"
  > {
  author: UserInfo | null;
  attachment: AttachmentType | null;

  reply_user: UserInfo | null;
  reply_message: {
    content: string;
  } | null;
}

export async function fetchMessages(
  channel: string,
  count: number,
  after?: Date,
  before?: Date,
): Promise<ComplexMessage[]> {
  const reply_message = alias(messages, "reply_message");
  const reply_user = alias(users, "reply_user");

  return db
    .select({
      id: messages.id,
      content: messages.content,
      embeds: messages.embeds,
      channel_id: messages.channel_id,
      timestamp: messages.timestamp,
      reply_id: messages.reply_id,
      author: pick(users, ...userProfileKeys),
      attachment: attachments,
      reply_message: pick(reply_message, "content"),
      reply_user: pick(reply_user, ...userProfileKeys),
    })
    .from(messages)
    .where(
      and(
        eq(messages.channel_id, channel),
        after ? gt(messages.timestamp, after) : undefined,
        before ? lt(messages.timestamp, before) : undefined,
      ),
    )
    .leftJoin(users, eq(users.id, messages.author_id))
    .leftJoin(attachments, eq(attachments.id, messages.attachment_id))
    .leftJoin(reply_message, eq(messages.reply_id, reply_message.id))
    .leftJoin(reply_user, eq(reply_message.author_id, reply_user.id))
    .orderBy(desc(messages.timestamp))
    .limit(count)
    .then((res) => res.reverse());
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
    "Message is empty",
  );

export async function createMessage(
  input: z.infer<typeof messageSchema>,
  author_id: string,
): Promise<ComplexMessage> {
  const embeds = await getEmbeds(input.content);
  const attachment: Attachment | null = input.attachment
    ? {
        ...input.attachment,
        id: createId(),
        width: input.attachment.type === "raw" ? null : input.attachment.width,
        height:
          input.attachment.type === "raw" ? null : input.attachment.height,
      }
    : null;

  const [result] = await Promise.all([
    db
      .insert(messages)
      .values({
        author_id: author_id,
        content: input.content,
        channel_id: input.channelId,
        attachment_id: attachment?.id ?? null,
        reply_id: input.reply,
        embeds: embeds.length === 0 ? null : embeds,
      })
      .returning({ message_id: messages.id }),
    attachment && db.insert(attachments).values(attachment),
  ]);
  const messageId = result[0].message_id;

  await db
    .update(messageChannels)
    .set({
      last_message_id: messageId,
    })
    .where(eq(messageChannels.id, input.channelId))
    .execute();

  const reply_message = alias(messages, "reply_message");
  const reply_user = alias(users, "reply_user");
  const context = await db
    .select()
    .from(users)
    .where(eq(users.id, author_id))
    .innerJoin(reply_message, eq(reply_message.id, messageId))
    .innerJoin(reply_user, eq(reply_user.id, reply_message.author_id))
    .then((res) => requireOne(res));

  return {
    id: messageId,
    content: input.content,
    embeds,
    channel_id: input.channelId,
    timestamp: new Date(Date.now()),
    author: pick(context.User, ...userProfileKeys),
    reply_id: input.reply ?? null,
    reply_message: context.reply_message,
    reply_user: pick(context.reply_user, ...userProfileKeys),
    attachment,
  };
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
            .catch(() => {}),
        ),
    );
  }

  return embeds;
}
