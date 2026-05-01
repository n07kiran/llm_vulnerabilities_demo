import type { ReactNode } from "react";

interface SectionProps {
  title: string;
  children: ReactNode;
}

export function Section({ title, children }: SectionProps) {
  return (
    <section className="border-t border-white/10 py-8">
      <div className="grid gap-5 lg:grid-cols-[260px_1fr]">
        <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-400">
          {title}
        </h2>
        <div className="text-sm leading-7 text-slate-300">{children}</div>
      </div>
    </section>
  );
}
