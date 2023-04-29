import {
    InworldClient,
    ServiceError,
    SessionToken,
    status,
} from "@inworld/nodejs-sdk";
import { channels } from "@/server/ably";
import { User } from "@/drizzle/schema";
import redis from "./redis/client";
import db from "./db/client";
import { messages, users } from "../drizzle/schema";
import { eq } from "drizzle-orm";

type Message = {
    group_id: number;
    content: string;
    user_name: string;
};

//preload bot account
createBotAccount();

export async function onReceiveMessage(message: Message) {
    const { group_id, content, user_name } = message;
    const lines: string[] = [];
    const bot = await createBotAccount();

    const connection = new InworldClient()
        .setGenerateSessionToken(generateSessionToken(group_id))
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
                sendErrorMessage(message.group_id, "Shark is sleeping now");
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
    const selectResult = await db
        .select()
        .from(users)
        .where(eq(users.id, "shark"));

    global.bot_account = selectResult[0];
    return global.bot_account;
}

function generateSessionToken(group_id: number) {
    const client = new InworldClient().setApiKey({
        key: process.env.INWORLD_KEY!,
        secret: process.env.INWORLD_SECRET!,
    });

    return async () => {
        const token = await client.generateSessionToken();
        const session_id = await redis.get<string>(getKey(group_id));

        if (session_id == null) {
            await redis.set(getKey(group_id), token.getSessionId());
        }

        return new SessionToken({
            expirationTime: token.getExpirationTime(),
            token: token.getToken(),
            type: token.getType(),
            sessionId: session_id ?? token.getSessionId(),
        });
    };
}

function getKey(group_id: number) {
    return `ai_session_group_${group_id}`;
}
