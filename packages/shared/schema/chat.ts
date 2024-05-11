import { Attachment, User } from "db/schema";
import { z } from "zod";

export type UserInfo = Pick<User, "id" | "name" | "image">;

export type UploadAttachment = z.infer<typeof uploadAttachmentSchema>;

export type AttachmentType = Attachment;

export const uploadAttachmentSchema = z
  .strictObject({
    name: z.string(),
    url: z.string(),
    type: z.literal("raw"),
    bytes: z.number(),
  })
  .or(
    z.strictObject({
      name: z.string(),
      // only from Cloudinary
      url: z.string().startsWith("https://res.cloudinary.com"),
      type: z.enum(["image", "video"]),
      bytes: z.number(),
      width: z.number(),
      height: z.number(),
    }),
  );

export const contentSchema = z.string().max(2000).trim();
