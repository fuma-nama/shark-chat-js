import { z } from "zod";

export const uniqueNameSchema = z
    .string()
    .min(3)
    .max(32)
    .regex(
        /^[a-z0-9_]*$/,
        "Unique name can only contain lower-case letters, numbers and underscore"
    );

export const updateGroupSchema = z.object({
    groupId: z.number(),
    name: z.string().min(1).max(100).optional(),
    icon_hash: z.number().optional(),
    public: z.boolean().optional(),
    unique_name: uniqueNameSchema.optional(),
});

export const createGroupSchema = z.object({
    name: z.string().min(1).max(100).trim(),
});
