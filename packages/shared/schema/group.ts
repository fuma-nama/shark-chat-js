import { z } from "zod";

export const uniqueNameSchema = z
  .string()
  .min(3)
  .max(32)
  .regex(
    /^[a-z0-9_]*$/,
    "Unique name can only contain lower-case letters, numbers and underscore",
  );

const groupName = z.string().trim().min(1).max(100);

export const updateGroupSchema = z.strictObject({
  groupId: z.string(),
  name: groupName.optional(),
  icon_hash: z.number().optional(),
  banner_hash: z.number().optional(),
  public: z.boolean().optional(),
  unique_name: uniqueNameSchema.optional(),
});

export const createGroupSchema = z.strictObject({
  name: groupName,
});
