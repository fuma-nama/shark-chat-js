import {
  InworldClient,
  ServiceError,
  Session,
  status,
} from "@inworld/nodejs-sdk";
import { channels } from "./ably";
import redis from "./redis/client";
import db from "db/client";
import { eq } from "drizzle-orm";
import { requireOne } from "db/utils";
import { messages, users, User } from "db/schema";

type Message = {
  channel_id: string;
  content: string;
  user_name: string;
};

//preload bot account
createBotAccount();

async function get(channelId: string) {
  const json = await redis.get<string>(getKey(channelId));

  return json != null ? Session.deserialize(json) : undefined;
}

async function set(channelId: string, entity: Session) {
  await redis.set(getKey(channelId), Session.serialize(entity));
}

export async function onReceiveMessage(message: Message) {
  const { channel_id, content, user_name } = message;
  const lines: string[] = [];
  const bot = await createBotAccount();

  const connection = new InworldClient()
    .setOnSession({
      get: () => get(message.channel_id),
      set: (session) => set(message.channel_id, session),
    })
    .setApiKey({
      key: process.env.INWORLD_KEY!,
      secret: process.env.INWORLD_SECRET!,
    })
    .setConfiguration({
      capabilities: {
        audio: false,
        emotions: false,
        interruptions: false,
      },
    })
    .setScene(process.env.INWORLD_SCENE!)
    .setUser({ fullName: user_name })
    .setOnError(handleError(message))
    .setOnMessage((packet) => {
      if (packet.isInteractionEnd()) {
        sendMessage(channel_id, lines.join("\n")).catch((e) =>
          sendErrorMessage(channel_id, e?.toString())
        );
        connection.close();
        return;
      }

      if (packet.isText() && packet.text.final) {
        lines.push(packet.text.text.trim());
        return;
      }
    })
    .build();

  channels.chat.typing.publish([channel_id], { user: bot });
  await connection.sendText(content);
}

function handleError(message: Message) {
  return (err: ServiceError) => {
    switch (err.code) {
      case status.ABORTED:
      case status.CANCELLED:
        break;
      case status.FAILED_PRECONDITION:
        redis
          .del(getKey(message.channel_id))
          .then(() => onReceiveMessage(message))
          .catch((e) => sendErrorMessage(message.channel_id, e?.toString()));
        break;
      case status.UNAVAILABLE:
        sendErrorMessage(message.channel_id, "The Shark is sleeping now");
      default:
        sendErrorMessage(message.channel_id, err.message);
        break;
    }
  };
}

function sendErrorMessage(channel_id: string, message?: string) {
  return sendMessage(
    channel_id,
    message != null
      ? `Oops! something went wrong: ${message}`
      : `Oops! something went wrong`
  );
}

async function sendMessage(channel_id: string, content: string) {
  const bot = await createBotAccount();
  const insertResult = await db
    .insert(messages)
    .values({
      author_id: bot.id,
      content,
      channel_id,
    })
    .returning({ id: messages.id });

  const message = await db
    .select()
    .from(messages)
    .where(eq(messages.id, insertResult[0].id));

  await channels.chat.message_sent.publish([channel_id], {
    ...message[0],
    attachment: null,
    reply_id: null,
    reply_message: null,
    reply_user: null,
    author: bot,
  });
}

declare global {
  var bot_account: User;
}

async function createBotAccount() {
  if (global.bot_account != null) return global.bot_account;
  await db
    .insert(users)
    .values({
      id: "shark",
      name: "Shark AI",
      is_ai: true,
    })
    .onConflictDoNothing();
  const user = await db
    .select()
    .from(users)
    .where(eq(users.id, "shark"))
    .then((res) => requireOne(res));

  global.bot_account = user;
  return user;
}

function getKey(group_id: string) {
  return `ai_session_g_${group_id}`;
}
