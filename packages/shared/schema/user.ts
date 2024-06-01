import { z } from "zod";

export const updateProfileSchema = z
  .object({
    name: z.string().trim().min(1).max(255),
    avatar_url: z.string().trim().min(1).max(255),
    banner_hash: z.number(),
  })
  .partial();
