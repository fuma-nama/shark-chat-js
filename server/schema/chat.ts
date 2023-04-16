import {
    DirectMessage,
    User,
    Message,
    DirectMessageChannel,
    Attachment,
} from "@/drizzle/schema";
import { z } from "zod";

export type UserInfo = Pick<User, "id" | "name" | "image">;

export type RecentChatType = DirectMessageChannel & {
    receiver: UserInfo;
    last_message: string | null;
    unread_messages: number;
};

export type MessageType = Message & {
    author: UserInfo | null;
    attachments: AttachmentType[];
};

export type DirectMessageType = DirectMessage & {
    author: UserInfo | null;
    attachments: AttachmentType[];
};

export type DirectMessageWithReceiver = DirectMessage & {
    receiver: UserInfo;
    author: UserInfo;
    attachments: AttachmentType[];
};

export type UploadAttachment = z.infer<typeof uploadAttachmentSchema>;

export type AttachmentType = Omit<
    Attachment,
    "message_id" | "direct_message_id"
>;

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
