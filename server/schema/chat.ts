import {
    DirectMessage,
    User,
    Message,
    DirectMessageChannel,
} from "@prisma/client";
import { z } from "zod";

export type UserInfo = Pick<User, "id" | "name" | "image">;

export type RecentChatType = DirectMessageChannel & {
    receiver: UserInfo;
    last_message: string | null;
    unread_messages: number;
};

export type MessageType = Message & {
    author: UserInfo;
};

export type DirectMessageType = DirectMessage & {
    author: UserInfo;
};

export type DirectMessageWithReceiver = DirectMessage & {
    receiver: UserInfo;
    author: UserInfo;
};

export const contentSchema = z.string().min(1).max(2000).trim();

export const userSelect = {
    select: {
        image: true,
        name: true,
        id: true,
    },
} as const;
