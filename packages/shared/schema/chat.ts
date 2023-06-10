import { User, Attachment } from "db/schema";
import { z } from "zod";

export type UserInfo = Pick<User, "id" | "name" | "image">;

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
