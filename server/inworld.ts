import {
    InworldClient,
    ServiceError,
    SessionToken,
    status,
} from "@inworld/nodejs-sdk";
import prisma from "./prisma";
import { channels } from "@/server/ably";
import { User } from "@prisma/client";

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
                sendMessage(bot, group_id, lines.join("\n"));
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
                prisma.botSession
                    .delete({
                        where: {
                            group_id: message.group_id,
                        },
                    })
                    .then(() => {
                        onReceiveMessage(message);
                    });
                break;
            default:
                throw err;
        }
    };
}

async function sendMessage(bot: User, group_id: number, content: string) {
    const message = await prisma.message.create({
        data: {
            author_id: bot.id,
            content,
            group_id,
        },
        include: {
            author: {
                select: {
                    id: true,
                    name: true,
                    image: true,
                },
            },
        },
    });

    await channels.chat.message_sent.publish([group_id], message);
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

        const { session_id } = await prisma.botSession.upsert({
            where: {
                group_id,
            },
            create: {
                group_id,
                session_id: token.getSessionId(),
            },
            update: {},
        });

        return new SessionToken({
            expirationTime: token.getExpirationTime(),
            token: token.getToken(),
            type: token.getType(),
            sessionId: session_id,
        });
    };
}
