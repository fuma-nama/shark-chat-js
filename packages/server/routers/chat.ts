import { TRPCError } from "@trpc/server";
import { channels } from "../ably";
import { z } from "zod";
import { protectedProcedure, router } from "./../trpc";
import { contentSchema } from "shared/schema/chat";
import { getLastRead, setLastRead } from "../redis/last-read";
import db from "db/client";
import { directMessageInfos, groups, messages, users } from "db/schema";
import { and, eq } from "drizzle-orm";
import { generateText } from "../eden";
import { onReceiveMessage } from "../inworld";
import { checkChannelPermissions } from "../utils/permissions";
import { pick } from "shared/common";
import {
  createMessage,
  fetchMessages,
  getEmbeds,
  messageSchema,
} from "../utils/messages";

const userProfileKeys = ["id", "name", "image"] as const;

export const chatRouter = router({
  send: protectedProcedure
    .input(messageSchema)
    .mutation(async ({ input, ctx }) => {
      const { type, data } = await checkChannelPermissions(
        input.channelId,
        ctx.session,
      );

      const embeds = await getEmbeds(input.content);
      const { message, is_new_dm } = await db.transaction(async () => {
        const message = await createMessage(input, ctx.session.user.id, embeds);

        let is_new_dm = false;

        if (type === "dm") {
          const result = await db
            .update(directMessageInfos)
            .set({
              open: true,
            })
            .where(
              and(
                eq(directMessageInfos.channel_id, input.channelId),
                eq(directMessageInfos.open, false),
              ),
            );
          is_new_dm = result.rowCount !== 0;
        }

        return {
          message: {
            ...message,
            nonce: input.nonce,
          },
          is_new_dm,
        };
      });

      if (type === "dm" && is_new_dm) {
        await channels.private.open_dm.publish([data.to_user_id], {
          id: data.channel_id,
          user: message.author,
          unread_messages: 0,
          last_message: message,
        });
      }

      await channels.chat.message_sent.publish([input.channelId], message);

      setLastRead(input.channelId, ctx.session.user.id, message.timestamp);

      if (input.content.startsWith("@Shark")) {
        await onReceiveMessage({
          content: input.content,
          channel_id: input.channelId,
          user_name: message.author.name,
        });
      }

      return message;
    }),
  messages: protectedProcedure
    .input(
      z.object({
        channelId: z.string(),
        count: z.number().min(0).max(50).default(50),
        cursorType: z.enum(["after", "before"]).default("before"),
        cursor: z.string().datetime().optional(),
      }),
    )
    .query(async ({ input, ctx }) => {
      await checkChannelPermissions(input.channelId, ctx.session);

      return await fetchMessages(
        input.channelId,
        input.count,
        input.cursor != null && input.cursorType === "after"
          ? new Date(input.cursor)
          : undefined,
        input.cursor != null && input.cursorType === "before"
          ? new Date(input.cursor)
          : undefined,
      );
    }),
  update: protectedProcedure
    .input(
      z.object({
        messageId: z.number(),
        channelId: z.string(),
        content: contentSchema.min(1),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const embeds = await getEmbeds(input.content);

      const rows = await db
        .update(messages)
        .set({
          content: input.content,
          embeds,
        })
        .where(
          and(
            eq(messages.id, input.messageId),
            eq(messages.author_id, ctx.session.user.id),
            eq(messages.channel_id, input.channelId),
          ),
        );

      if (rows.rowCount === 0)
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "No permission or message doesn't exist",
        });

      await channels.chat.message_updated.publish([input.channelId], {
        id: input.messageId,
        content: input.content,
        embeds,
        channel_id: input.channelId,
      });
    }),
  delete: protectedProcedure
    .input(
      z.object({
        messageId: z.number(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { channel_id } = await checkDeleteMessage(
        input.messageId,
        ctx.session.user.id,
      );

      await db.delete(messages).where(eq(messages.id, input.messageId));
      await channels.chat.message_deleted.publish([channel_id], {
        id: input.messageId,
        channel_id,
      });
    }),
  read: protectedProcedure
    .input(z.object({ channelId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await setLastRead(
        input.channelId,
        ctx.session.user.id,
        new Date(Date.now()),
      );
    }),
  checkout: protectedProcedure
    .input(
      z.object({
        channelId: z.string(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const old = await getLastRead(input.channelId, ctx.session.user.id);

      await setLastRead(
        input.channelId,
        ctx.session.user.id,
        new Date(Date.now()),
      );

      return { last_read: old };
    }),
  type: protectedProcedure
    .input(
      z.object({
        channelId: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const user = await db
        .select(pick(users, ...userProfileKeys))
        .from(users)
        .where(eq(users.id, ctx.session.user.id))
        .then((res) => res[0]);

      if (user == null)
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "User not found",
        });

      await channels.chat.typing.publish([input.channelId], {
        user,
      });
    }),
  generateText: protectedProcedure
    .input(z.object({ text: z.string().trim().min(0) }))
    .mutation(async ({ input }) => {
      return {
        text: await generateText(input.text),
      };
    }),
});

async function checkDeleteMessage(messageId: number, user: string) {
  const message = await db
    .select({
      author_id: messages.author_id,
      channel_id: messages.channel_id,
      owner_id: groups.owner_id,
    })
    .from(messages)
    .where(eq(messages.id, messageId))
    .leftJoin(groups, eq(groups.channel_id, messages.channel_id))
    .limit(1)
    .then((res) => res[0]);

  if (message == null)
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Message not found",
    });

  if (message.author_id !== user && message.owner_id !== user) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Missing required permission",
    });
  }

  return { channel_id: message.channel_id };
}
