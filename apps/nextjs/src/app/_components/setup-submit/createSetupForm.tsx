"use client";

import { Button, Input } from "@acme/ui";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  useForm,
} from "@acme/ui/form";

import type { CreateSetupFormData } from "~/types/setup";
import { createSetup } from "~/app/actions";
import { CreateSetupSchema } from "~/schemas/setup";

export default function CreateSetupForm() {
  const form = useForm({
    schema: CreateSetupSchema,
    defaultValues: {
      title: "",
      author: "",
      imageUrl: "",
    },
  });

  const onSubmit = async (data: CreateSetupFormData) => {
    try {
      await createSetup(data);
      form.reset();
    } catch (error) {
      console.error("Error al enviar:", error);
      form.setError("root", {
        message: "Algo falló en el servidor. Por favor intenta de nuevo.",
      });
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Setup Title</FormLabel>
              <FormControl>
                <Input placeholder="Enter setup title" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="author"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Author</FormLabel>
              <FormControl>
                <Input placeholder="Enter author name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="imageUrl"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Image URL</FormLabel>
              <FormControl>
                <Input placeholder="Enter image URL" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {form.formState.errors.root && (
          <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
            {form.formState.errors.root.message}
          </div>
        )}

        <Button
          type="submit"
          className="w-full"
          disabled={form.formState.isSubmitting}
        >
          {form.formState.isSubmitting ? "Submitting..." : "Submit Setup"}
        </Button>
      </form>
    </Form>
  );
}
