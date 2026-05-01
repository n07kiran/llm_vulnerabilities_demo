import { useEffect, useState } from "react";

import { ScenarioCard } from "../components/ScenarioCard";
import { fetchVulnerabilities } from "../services/api";
import type { VulnerabilityCard } from "../types/vulnerability";

export function HomePage() {
  const [scenarios, setScenarios] = useState<VulnerabilityCard[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    fetchVulnerabilities()
      .then((items) => {
        if (isMounted) {
          setScenarios(items);
          setError(null);
        }
      })
      .catch((errorValue: unknown) => {
        if (isMounted) {
          setError(errorValue instanceof Error ? errorValue.message : "Unable to load scenarios.");
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <main className="min-h-screen">
      <div className="mx-auto flex w-full max-w-7xl flex-col px-5 py-8 md:px-8 md:py-12">
        <header className="mb-10 max-w-4xl">
          <div className="mb-4 inline-flex rounded-md border border-signal-cyan/30 bg-signal-cyan/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-cyan-100">
            Educational Cybersecurity Lab
          </div>
          <h1 className="text-4xl font-bold tracking-normal text-white md:text-6xl">
            LLM Vulnerability Demo
          </h1>
          <p className="mt-5 max-w-3xl text-base leading-8 text-slate-300 md:text-lg">
            Explore controlled simulations of common AI chatbot failure modes with safe fake data,
            fake tools, and repeatable backend rules.
          </p>
        </header>

        {isLoading ? (
          <div className="rounded-lg border border-white/10 bg-ink-850 p-8 text-slate-300">
            Loading vulnerability cards...
          </div>
        ) : error ? (
          <div className="rounded-lg border border-signal-red/35 bg-signal-red/10 p-8 text-red-100">
            {error}
          </div>
        ) : (
          <div className="grid gap-5 md:grid-cols-2">
            {scenarios.map((scenario) => (
              <ScenarioCard key={scenario.slug} scenario={scenario} />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
