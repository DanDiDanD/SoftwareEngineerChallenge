"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
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

const CreateSetupSchema = SetupSchema.pick({
  title: true,
  author: true,
  imageUrl: true,
}) satisfies z.ZodType<CreateSetupFormData>;

export async function createSetup(formData: FormData) {
  const setupData = {
    title: formData.get("title") ?? "",
    author: formData.get("author") ?? "",
    imageUrl: formData.get("imageUrl") ?? "",
  };

  const result = CreateSetupSchema.safeParse(setupData);

  if (!result.success) {
    console.error("Validation errors:", result.error);
    return;
  }

  // Simulate a delay to mimic server processing
  await new Promise((resolve) => setTimeout(resolve, 1000));

  console.log("Setup form data:", result.data);

  revalidatePath("/");
  redirect("/");
}
