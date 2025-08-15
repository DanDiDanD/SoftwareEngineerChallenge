import type { Setup } from "~/types/setup";
import { SetupItem } from "./SetupItem";

interface SetupList {
  setups: Setup[];
}

export function SetupList({ setups }: SetupList) {
  return (
    <section className="mx-auto px-4 py-8">
      <div
        className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3"
        role="list"
      >
        {setups.map((setup) => (
          <SetupItem key={setup.id} setup={setup} />
        ))}
      </div>
    </section>
  );
}
