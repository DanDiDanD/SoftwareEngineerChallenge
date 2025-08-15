import Link from "next/link";

import { Button } from "@acme/ui";

import type { Setup } from "~/types/setup";
import { SetupItem } from "./SetupItem";

interface SetupListProps {
  setups: Setup[];
}

export function SetupList({ setups }: SetupListProps) {
  return (
    <section
      className="mx-auto py-8 md:px-4"
      aria-label="Workspace setups gallery"
    >
      {setups.length ? (
        <>
          <div className="mb-4 flex items-center justify-between">
            <div className="text-base" role="status" aria-live="polite">
              Total setups:{" "}
              <span id="setup-count" className="font-medium text-primary">
                {setups.length}
              </span>
            </div>
            <Button asChild>
              <Link 
                href="/submit"
                aria-label="Navigate to setup submission form"
              >
                Go to Setup
              </Link>
            </Button>
          </div>
          <div
            className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3"
            role="list"
            aria-describedby="setup-count"
          >
            {setups.map((setup) => (
              <SetupItem key={setup.id} setup={setup} />
            ))}
          </div>
        </>
      ) : (
        <div role="status" className="py-8 text-center">
          <p>No workspace setups available at the moment.</p>
        </div>
      )}
    </section>
  );
}
