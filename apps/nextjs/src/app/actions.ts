"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import type { CreateSetupFormData } from "~/types/setup";
import { CreateSetupSchema } from "~/schemas/setup";

export async function createSetup(data: CreateSetupFormData) {
  const result = CreateSetupSchema.safeParse(data);

  if (!result.success) {
    console.error("Validation errors:", result.error);
    return;
  }

  // Simulate a delay to mimic server processing
  await new Promise((resolve) => setTimeout(resolve, 1000));

  if (Math.random() < 0.25) {
    throw new Error("Failed to create setup due to server error");
  }

  console.log("Setup form data:", result.data);

  revalidatePath("/");
  redirect("/");
}
