import type { ReactNode } from "react";

interface MarkdownTextProps {
  text: string;
}

export function MarkdownText({ text }: MarkdownTextProps) {
  const blocks = parseBlocks(text);

  return (
    <div className="space-y-3">
      {blocks.map((block, index) => (
        <MarkdownBlock block={block} key={`${block.type}-${index}`} />
      ))}
    </div>
  );
}

type MarkdownBlock =
  | { type: "paragraph"; lines: string[] }
  | { type: "heading"; level: number; text: string }
  | { type: "ul"; items: string[] }
  | { type: "ol"; items: string[] }
  | { type: "quote"; lines: string[] }
  | { type: "code"; code: string };

function MarkdownBlock({ block }: { block: MarkdownBlock }) {
  if (block.type === "heading") {
    const className = "font-semibold text-white";
    if (block.level <= 2) {
      return <h3 className={`${className} text-base`}>{renderInline(block.text)}</h3>;
    }
    return <h4 className={`${className} text-sm`}>{renderInline(block.text)}</h4>;
  }

  if (block.type === "ul") {
    return (
      <ul className="list-disc space-y-1 pl-5">
        {block.items.map((item, index) => (
          <li key={`${item}-${index}`}>{renderInline(item)}</li>
        ))}
      </ul>
    );
  }

  if (block.type === "ol") {
    return (
      <ol className="list-decimal space-y-1 pl-5">
        {block.items.map((item, index) => (
          <li key={`${item}-${index}`}>{renderInline(item)}</li>
        ))}
      </ol>
    );
  }

  if (block.type === "quote") {
    return (
      <blockquote className="border-l-2 border-signal-cyan/50 pl-3 text-slate-300">
        {block.lines.map((line, index) => (
          <p key={`${line}-${index}`}>{renderInline(line)}</p>
        ))}
      </blockquote>
    );
  }

  if (block.type === "code") {
    return (
      <pre className="overflow-x-auto rounded-md border border-white/10 bg-black/25 p-3 text-xs leading-5 text-cyan-50">
        <code>{block.code}</code>
      </pre>
    );
  }

  return (
    <p>
      {block.lines.map((line, index) => (
        <span key={`${line}-${index}`}>
          {index > 0 ? <br /> : null}
          {renderInline(line)}
        </span>
      ))}
    </p>
  );
}

function parseBlocks(text: string): MarkdownBlock[] {
  const lines = text.replace(/\r\n/g, "\n").split("\n");
  const blocks: MarkdownBlock[] = [];
  let index = 0;

  while (index < lines.length) {
    const line = lines[index];
    if (!line.trim()) {
      index += 1;
      continue;
    }

    if (line.trimStart().startsWith("```")) {
      const codeLines: string[] = [];
      index += 1;
      while (index < lines.length && !lines[index].trimStart().startsWith("```")) {
        codeLines.push(lines[index]);
        index += 1;
      }
      index += 1;
      blocks.push({ type: "code", code: codeLines.join("\n") });
      continue;
    }

    const heading = line.match(/^(#{1,4})\s+(.+)$/);
    if (heading) {
      blocks.push({ type: "heading", level: heading[1].length, text: heading[2] });
      index += 1;
      continue;
    }

    if (/^\s*[-*]\s+/.test(line)) {
      const items: string[] = [];
      while (index < lines.length && /^\s*[-*]\s+/.test(lines[index])) {
        items.push(lines[index].replace(/^\s*[-*]\s+/, ""));
        index += 1;
      }
      blocks.push({ type: "ul", items });
      continue;
    }

    if (/^\s*\d+\.\s+/.test(line)) {
      const items: string[] = [];
      while (index < lines.length && /^\s*\d+\.\s+/.test(lines[index])) {
        items.push(lines[index].replace(/^\s*\d+\.\s+/, ""));
        index += 1;
      }
      blocks.push({ type: "ol", items });
      continue;
    }

    if (/^\s*>\s?/.test(line)) {
      const quoteLines: string[] = [];
      while (index < lines.length && /^\s*>\s?/.test(lines[index])) {
        quoteLines.push(lines[index].replace(/^\s*>\s?/, ""));
        index += 1;
      }
      blocks.push({ type: "quote", lines: quoteLines });
      continue;
    }

    const paragraphLines: string[] = [];
    while (
      index < lines.length &&
      lines[index].trim() &&
      !lines[index].trimStart().startsWith("```") &&
      !/^(#{1,4})\s+/.test(lines[index]) &&
      !/^\s*[-*]\s+/.test(lines[index]) &&
      !/^\s*\d+\.\s+/.test(lines[index]) &&
      !/^\s*>\s?/.test(lines[index])
    ) {
      paragraphLines.push(lines[index]);
      index += 1;
    }
    blocks.push({ type: "paragraph", lines: paragraphLines });
  }

  return blocks;
}

function renderInline(text: string): ReactNode[] {
  const parts = text.split(/(`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*)/g).filter(Boolean);

  return parts.map((part, index) => {
    if (part.startsWith("`") && part.endsWith("`")) {
      return (
        <code className="rounded bg-black/25 px-1.5 py-0.5 text-cyan-100" key={`${part}-${index}`}>
          {part.slice(1, -1)}
        </code>
      );
    }
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={`${part}-${index}`}>{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith("*") && part.endsWith("*")) {
      return <em key={`${part}-${index}`}>{part.slice(1, -1)}</em>;
    }
    return <span key={`${part}-${index}`}>{part}</span>;
  });
}
