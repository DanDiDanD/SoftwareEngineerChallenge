"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { CreateSetupSchema } from "~/schemas/setup";

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
