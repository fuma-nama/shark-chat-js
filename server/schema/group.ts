import { z } from "zod";

export const groupSchema = z.object({
    name: z.string(),
    icon_hash: z.number().nullable(),
    id: z.number(),
    owner_id: z.string(),
    public: z.boolean(),
    unique_name: z.string().nullable(),
});

export const updateGroupSchema = z.object({
    groupId: z.number(),
    name: z.string().min(1).max(100).optional(),
    icon_hash: z.number().optional(),
    public: z.boolean().optional(),

    /**
     * Reset unique name if it's empty
     */
    unique_name: z
        .string()
        .max(100)
        .regex(
            /^[a-z0-9_]*$/,
            "Unique name can only contain lower-case letters, numbers and underscore"
        )
        .optional(),
});

export const createGroupSchema = z.object({
    name: z.string().min(1).max(100).trim(),
});
