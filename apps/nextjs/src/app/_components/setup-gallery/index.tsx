import { caller } from "~/trpc/server";
import { SetupList } from "./SetupList";

export default async function SetupGallery() {
  const tRPCCaller = await caller();
  const setups = await tRPCCaller.setup.all();

  return <SetupList setups={setups} />;
}
