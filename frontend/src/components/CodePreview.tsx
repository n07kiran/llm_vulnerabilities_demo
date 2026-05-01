interface CodePreviewProps {
  code: string;
}

export function CodePreview({ code }: CodePreviewProps) {
  return (
    <div className="overflow-hidden rounded-lg border border-white/10 bg-[#090d14]">
      <div className="border-b border-white/10 px-4 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
        Goal / Code Preview
      </div>
      <pre className="overflow-x-auto p-5 text-sm leading-6 text-cyan-50">
        <code>{code.trim()}</code>
      </pre>
    </div>
  );
}
