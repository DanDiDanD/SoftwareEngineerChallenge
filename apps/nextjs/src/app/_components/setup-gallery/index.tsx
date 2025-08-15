import { caller } from "~/trpc/server";

export default async function SetupGallery() {
  const tRPCCaller = await caller();
  const setups = await tRPCCaller.setup.all();

  return <pre>{JSON.stringify(setups, null, 2)}</pre>;
}
