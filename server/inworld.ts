import {
    InworldClient,
    ServiceError,
    SessionToken,
    status,
} from "@inworld/nodejs-sdk";
import prisma from "./prisma";
import { channels } from "@/server/ably";
import { User } from "@prisma/client";
import redis from "./redis";

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
                connection.close();
                return sendMessage(group_id, lines.join("\n")).catch((e) =>
                    sendErrorMessage(group_id, e?.toString())
                );
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
    const message = await prisma.message.create({
        data: {
            author_id: bot.id,
            content,
            group_id,
        },
    });

    await channels.chat.message_sent.publish([group_id], {
        ...message,
        author: bot,
    });
}

declare global {
    var bot_account: User;
}

async function createBotAccount() {
    if (global.bot_account != null) return global.bot_account;

    global.bot_account = await prisma.user.upsert({
        create: {
            id: "shark",
            name: "Shark AI",
            is_ai: true,
        },
        where: {
            id: "shark",
        },
        update: {},
    });

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
