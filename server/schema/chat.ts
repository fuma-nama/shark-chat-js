import { User, Attachment } from "@/drizzle/schema";
import { RouterOutput } from "@/utils/trpc";
import { z } from "zod";

export type UserInfo = Pick<User, "id" | "name" | "image">;

export type DMChannel = RouterOutput["dm"]["channels"][number];

export type MessageType = RouterOutput["chat"]["messages"][number];

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
