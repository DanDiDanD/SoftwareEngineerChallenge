import { caller, HydrateClient, prefetch, trpc } from "~/trpc/server";

export default async function HomePage() {
  prefetch(trpc.post.all.queryOptions());

  const tRPCCaller = await caller();
  const setups = await tRPCCaller.setup.all();

  return (
    <HydrateClient>
      <main className="container h-screen py-16">
        <div className="flex flex-col items-center justify-center gap-4">
          <h1 className="text-5xl font-extrabold tracking-tight sm:text-[5rem]">
            Setups <span className="text-primary">Gallery</span>
          </h1>
        </div>
        <section className="mt-8">
          <pre>{JSON.stringify(setups, null, 2)}</pre>
        </section>
      </main>
    </HydrateClient>
  );
}
