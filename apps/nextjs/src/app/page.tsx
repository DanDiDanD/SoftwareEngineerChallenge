import { Suspense } from "react";

import { HydrateClient, prefetch, trpc } from "~/trpc/server";
import SetupGallery from "./_components/setup-gallery";

export default function HomePage() {
  prefetch(trpc.post.all.queryOptions());

  return (
    <HydrateClient>
      <main className="container h-screen py-16">
        <header
          className="text-center"
          aria-label="Setups Gallery - Discover and explore amazing workspace setups from the community"
        >
          <h1 className="text-5xl font-extrabold tracking-tight sm:text-[5rem]">
            Setups <span className="text-primary">Gallery</span>
          </h1>
        </header>
        <Suspense fallback={<div>Loading setups...</div>}>
          <SetupGallery />
        </Suspense>
      </main>
    </HydrateClient>
  );
}
