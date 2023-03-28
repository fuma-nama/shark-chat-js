import { DirectMessage, User, Message } from "@prisma/client";
import { z } from "zod";

type UserInfo = Pick<User, "id" | "name" | "image">;

export type RecentChatType = Pick<
    DirectMessageType,
    "content" | "timestamp" | "id"
> & {
    user: UserInfo;
};

export type MessageType = Message & {
    author: UserInfo;
};

export type DirectMessageType = DirectMessage & {
    author: UserInfo;
};

export const contentSchema = z.string().min(1).max(2000).trim();
