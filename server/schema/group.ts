import { z } from "zod";

export const groupSchema = z.object({
    name: z.string(),
    icon_hash: z.number().nullable(),
    id: z.number(),
    owner_id: z.string(),
    public: z.boolean(),
    unique_name: z.string(),
});

export const updateGroupSchema = z.object({
    groupId: z.number(),
    name: z.string().min(1).max(100).optional(),
    icon_hash: z.number().optional(),
    public: z.boolean().optional(),
    unique_name: z
        .string()
        .min(3)
        .max(32)
        .regex(
            /^[a-z0-9_]*$/,
            "Unique name can only contain lower-case letters, numbers and underscore"
        )
        .optional(),
});

export const createGroupSchema = z.object({
    name: z.string().min(1).max(100).trim(),
});
