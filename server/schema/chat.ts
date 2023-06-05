import { User, DirectMessageChannel, Attachment } from "@/drizzle/schema";
import { RouterOutput } from "@/utils/trpc";
import { z } from "zod";

export type UserInfo = Pick<User, "id" | "name" | "image">;

export type RecentChatType = DirectMessageChannel & {
    receiver: UserInfo;
    last_message: string | null;
    unread_messages: number;
};

export type MessageType = RouterOutput["chat"]["messages"][number];

export type DirectMessageType = RouterOutput["dm"]["messages"][number];

export type DirectMessageEvent = Omit<DirectMessageType, "author"> & {
    author: UserInfo;
    receiver: UserInfo;
};

export type UploadAttachment = z.infer<typeof uploadAttachmentSchema>;

export type AttachmentType = Attachment;

export const uploadAttachmentSchema = z.object({
    name: z.string(),
    url: z.string(),
    type: z.enum(["image", "video", "raw"]),
    bytes: z.number(),
    width: z.number().optional(),
    height: z.number().optional(),
});

export const contentSchema = z.string().max(2000).trim();

export const deletedUser: UserInfo = {
    id: "",
    name: "Deleted User",
    image: null,
};
