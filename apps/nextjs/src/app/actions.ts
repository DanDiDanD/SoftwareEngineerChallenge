"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import type { CreateSetupFormData } from "~/types/setup";

export async function createSetup(formData: FormData) {
  const setupData: CreateSetupFormData = {
    title: formData.get("title") as string,
    author: formData.get("author") as string,
    imageUrl: formData.get("imageUrl") as string,
  };

  // Simulate a delay to mimic server processing
  await new Promise((resolve) => setTimeout(resolve, 1000));

  console.log("Setup form data:", setupData);

  revalidatePath("/");
  redirect("/");
}
