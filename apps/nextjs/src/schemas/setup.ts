import { z } from "zod/v4";

import type { CreateSetupFormData, Setup } from "~/types/setup";

const SetupSchema = z.object({
  id: z.string(),
  title: z.string().min(1, "Title is required"),
  author: z.string().min(1, "Author is required"),
  imageUrl: z.url("Image URL must be a valid URL"),
  description: z.string(),
  likes: z.number().default(0),
  tags: z.array(z.string()).default([]),
}) satisfies z.ZodType<Setup>;

export const CreateSetupSchema = SetupSchema.pick({
  title: true,
  author: true,
  imageUrl: true,
}) satisfies z.ZodType<CreateSetupFormData>;
