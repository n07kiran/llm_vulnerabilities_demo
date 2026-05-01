import type { Severity } from "../types/vulnerability";

const severityStyles: Record<string, string> = {
  Critical: "border-signal-red/45 bg-signal-red/12 text-red-100",
  High: "border-signal-amber/45 bg-signal-amber/12 text-amber-100",
  Medium: "border-signal-cyan/45 bg-signal-cyan/12 text-cyan-100",
  Low: "border-signal-green/45 bg-signal-green/12 text-green-100",
};

interface SeverityBadgeProps {
  severity: Severity;
}

export function SeverityBadge({ severity }: SeverityBadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-md border px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.12em] ${
        severityStyles[severity] ?? "border-white/15 bg-white/10 text-white"
      }`}
    >
      {severity}
    </span>
  );
}
