import {
    InworldClient,
    ServiceError,
    Session,
    status,
} from "@inworld/nodejs-sdk";
import { channels } from "@/server/ably";
import { User } from "@/drizzle/schema";
import redis from "./redis/client";
import db from "./db/client";
import { messages, users } from "../drizzle/schema";
import { eq } from "drizzle-orm";
import { requireOne } from "./db/utils";

type Message = {
    group_id: number;
    content: string;
    user_name: string;
};

//preload bot account
createBotAccount();

async function get(groupId: number) {
    const json = await redis.get<string>(getKey(groupId));

    return json != null ? Session.deserialize(json) : undefined;
}

async function set(groupId: number, entity: Session) {
    await redis.set(getKey(groupId), Session.serialize(entity));
}

export async function onReceiveMessage(message: Message) {
    const { group_id, content, user_name } = message;
    const lines: string[] = [];
    const bot = await createBotAccount();

    const connection = new InworldClient()
        .setOnSession({
            get: () => get(message.group_id),
            set: (session) => set(message.group_id, session),
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
                sendMessage(group_id, lines.join("\n")).catch((e) =>
                    sendErrorMessage(group_id, e?.toString())
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

    channels.chat.typing.publish([group_id], { user: bot });
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
                    .del(getKey(message.group_id))
                    .then(() => onReceiveMessage(message))
                    .catch((e) =>
                        sendErrorMessage(message.group_id, e?.toString())
                    );
                break;
            case status.UNAVAILABLE:
                sendErrorMessage(message.group_id, "The Shark is sleeping now");
            default:
                sendErrorMessage(message.group_id, err.message);
                break;
        }
    };
}

function sendErrorMessage(group_id: number, message?: string) {
    return sendMessage(
        group_id,
        message != null
            ? `Oops! something went wrong: ${message}`
            : `Oops! something went wrong`
    );
}

async function sendMessage(group_id: number, content: string) {
    const bot = await createBotAccount();
    const insertResult = await db.insert(messages).values({
        author_id: bot.id,
        content,
        group_id,
    });

    const message = await db
        .select()
        .from(messages)
        .where(eq(messages.id, Number(insertResult.insertId)));

    await channels.chat.message_sent.publish([group_id], {
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
    await db.insert(users).ignore().values({
        id: "shark",
        name: "Shark AI",
        is_ai: true,
    });
    const user = await db
        .select()
        .from(users)
        .where(eq(users.id, "shark"))
        .then((res) => requireOne(res));

    global.bot_account = user;
    return user;
}

function getKey(group_id: number) {
    return `ai_session_g_${group_id}`;
}
