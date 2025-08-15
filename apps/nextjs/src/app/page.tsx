import { Suspense } from "react";

import { HydrateClient, prefetch, trpc } from "~/trpc/server";
import SetupGallery from "./_components/setup-gallery";
import { SetupSkeleton } from "./_components/setup-gallery/SetupSkeleton";

export default function HomePage() {
  prefetch(trpc.setup.all.queryOptions());

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
        <div className="mt-8 border-t border-gray-600" aria-hidden="true"></div>
        <Suspense fallback={<SetupSkeleton />}>
          <SetupGallery />
        </Suspense>
      </main>
    </HydrateClient>
  );
}
