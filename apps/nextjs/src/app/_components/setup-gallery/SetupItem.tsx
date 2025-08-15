import Image from "next/image";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@acme/ui";

import type { Setup } from "~/types/setup";

interface SetupItemProps {
  setup: Setup;
}

export function SetupItem({ setup }: SetupItemProps) {
  return (
    <article role="listitem">
      <Card className="overflow-hidden">
        <div className="relative aspect-video">
          <Image
            src={setup.imageUrl}
            alt={setup.title}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        </div>
        <CardHeader>
          <CardTitle
            className="text-lg text-primary"
            role="heading"
            aria-level={2}
          >
            {setup.title}
          </CardTitle>
          <CardDescription className="text-sm text-muted-foreground">
            by <span>{setup.author}</span>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="mb-3 text-sm text-gray-600">{setup.description}</p>
          <div
            className="flex flex-wrap gap-1"
            role="list"
            aria-label="Setup tags"
          >
            {setup.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-gray-100 px-2 py-1 text-xs text-gray-700"
                role="listitem"
              >
                {tag}
              </span>
            ))}
          </div>
        </CardContent>
      </Card>
    </article>
  );
}
