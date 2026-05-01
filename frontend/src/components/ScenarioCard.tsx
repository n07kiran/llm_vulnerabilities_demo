import { ArrowRight } from "lucide-react";

import type { VulnerabilityCard } from "../types/vulnerability";
import { navigate } from "../utils/navigation";
import { SeverityBadge } from "./SeverityBadge";

interface ScenarioCardProps {
  scenario: VulnerabilityCard;
}

export function ScenarioCard({ scenario }: ScenarioCardProps) {
  const path = `/vulnerabilities/${scenario.slug}`;

  return (
    <article className="group flex min-h-[260px] flex-col justify-between rounded-lg border border-white/10 bg-ink-850/86 p-6 shadow-panel transition duration-200 hover:-translate-y-1 hover:border-signal-cyan/50 hover:bg-ink-800">
      <div className="space-y-5">
        <div className="flex items-start justify-between gap-4">
          <h2 className="text-balance text-2xl font-semibold text-white">{scenario.title}</h2>
          <SeverityBadge severity={scenario.severity} />
        </div>
        <p className="text-sm leading-6 text-slate-300">{scenario.summary}</p>
      </div>

      <button
        className="mt-8 inline-flex h-11 items-center justify-center gap-2 rounded-md border border-signal-cyan/35 bg-signal-cyan/10 px-4 text-sm font-semibold text-cyan-100 transition hover:bg-signal-cyan/18 focus:outline-none focus:ring-2 focus:ring-signal-cyan/60"
        type="button"
        onClick={() => navigate(path)}
      >
        Open Demo
        <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" aria-hidden="true" />
      </button>
    </article>
  );
}
