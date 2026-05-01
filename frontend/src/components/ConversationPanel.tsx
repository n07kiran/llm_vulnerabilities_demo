import { AlertTriangle, RotateCcw, Send, ShieldCheck } from "lucide-react";
import { FormEvent, useEffect, useRef, useState } from "react";

import type {
  ChatMessage,
  RetrievedDocument,
  SimulationMode,
  ToolCall,
} from "../types/vulnerability";

interface ConversationPanelProps {
  messages: ChatMessage[];
  samplePrompts: string[];
  mode: SimulationMode;
  isSending: boolean;
  onModeChange: (mode: SimulationMode) => void;
  onSend: (message: string) => Promise<void>;
  onReset: () => Promise<void>;
}

export function ConversationPanel({
  messages,
  samplePrompts,
  mode,
  isSending,
  onModeChange,
  onSend,
  onReset,
}: ConversationPanelProps) {
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages]);

  async function submit(event?: FormEvent<HTMLFormElement>, override?: string) {
    event?.preventDefault();
    const value = (override ?? input).trim();
    if (!value || isSending) {
      return;
    }

    setInput("");
    await onSend(value);
  }

  return (
    <div className="rounded-lg border border-white/10 bg-ink-900 shadow-panel">
      <div className="flex flex-col gap-4 border-b border-white/10 p-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-white">AI Conversation Window</h2>
          <p className="mt-1 text-sm text-slate-400">Controlled local simulation</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            className={`inline-flex h-10 items-center gap-2 rounded-md border px-3 text-sm font-semibold transition ${
              mode === "vulnerable"
                ? "border-signal-red/55 bg-signal-red/15 text-red-100"
                : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10"
            }`}
            type="button"
            onClick={() => onModeChange("vulnerable")}
          >
            <AlertTriangle className="h-4 w-4" aria-hidden="true" />
            Vulnerable
          </button>
          <button
            className={`inline-flex h-10 items-center gap-2 rounded-md border px-3 text-sm font-semibold transition ${
              mode === "protected"
                ? "border-signal-green/55 bg-signal-green/15 text-green-100"
                : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10"
            }`}
            type="button"
            onClick={() => onModeChange("protected")}
          >
            <ShieldCheck className="h-4 w-4" aria-hidden="true" />
            Protected
          </button>
          <button
            className="inline-flex h-10 items-center gap-2 rounded-md border border-white/10 bg-white/5 px-3 text-sm font-semibold text-slate-200 transition hover:bg-white/10"
            type="button"
            onClick={() => void onReset()}
          >
            <RotateCcw className="h-4 w-4" aria-hidden="true" />
            Reset
          </button>
        </div>
      </div>

      <div className="min-h-[420px] overflow-y-auto px-4 py-5 md:px-6">
        {messages.length === 0 ? (
          <div className="flex min-h-[360px] items-center justify-center rounded-lg border border-dashed border-white/12 bg-black/10 text-center text-sm text-slate-500">
            Send your first message to the target below.
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((message, index) => (
              <MessageBubble key={`${message.created_at}-${index}`} message={message} />
            ))}
            <div ref={scrollRef} />
          </div>
        )}
      </div>

      <div className="border-t border-white/10 p-4">
        <div className="mb-4 flex flex-wrap gap-2">
          {samplePrompts.map((prompt) => (
            <button
              className="rounded-md border border-white/10 bg-white/[0.04] px-3 py-2 text-left text-xs leading-5 text-slate-300 transition hover:border-signal-cyan/40 hover:text-cyan-100 disabled:cursor-not-allowed disabled:opacity-60"
              type="button"
              key={prompt}
              disabled={isSending}
              onClick={() => void submit(undefined, prompt)}
            >
              {prompt}
            </button>
          ))}
        </div>

        <form className="flex flex-col gap-3 md:flex-row" onSubmit={(event) => void submit(event)}>
          <textarea
            className="min-h-12 flex-1 resize-none rounded-md border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-signal-cyan/55 focus:ring-2 focus:ring-signal-cyan/20"
            placeholder="Type your probe..."
            rows={1}
            value={input}
            onChange={(event) => setInput(event.target.value)}
          />
          <button
            className="inline-flex h-12 items-center justify-center gap-2 rounded-md bg-signal-cyan px-5 text-sm font-bold text-ink-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-60"
            type="submit"
            disabled={isSending || !input.trim()}
          >
            <Send className="h-4 w-4" aria-hidden="true" />
            Send
          </button>
        </form>
      </div>
    </div>
  );
}

function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === "user";

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[min(780px,92%)] rounded-lg border px-4 py-3 text-sm leading-6 ${
          isUser
            ? "border-signal-cyan/35 bg-signal-cyan/12 text-cyan-50"
            : "border-white/10 bg-white/[0.045] text-slate-100"
        }`}
      >
        <div className="mb-1 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
          {isUser ? "You" : "Assistant"}
        </div>
        <div className="whitespace-pre-wrap">{message.content}</div>
        {!isUser && <MessageMetadata message={message} />}
      </div>
    </div>
  );
}

function MessageMetadata({ message }: { message: ChatMessage }) {
  const { findings, tool_calls, retrieved_context, safety_note, provider } = message.metadata ?? {};

  if (!findings?.length && !tool_calls?.length && !retrieved_context?.length && !safety_note) {
    return null;
  }

  return (
    <div className="mt-4 space-y-3 border-t border-white/10 pt-3">
      {provider && <MetaLine label="Provider" value={provider} />}
      {findings?.length ? (
        <div>
          <div className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
            Rule Matches
          </div>
          <ul className="space-y-1 text-xs text-slate-300">
            {findings.map((finding) => (
              <li key={finding}>{finding}</li>
            ))}
          </ul>
        </div>
      ) : null}
      {tool_calls?.map((toolCall) => (
        <ToolCallBlock key={`${toolCall.name}-${toolCall.status}`} toolCall={toolCall} />
      ))}
      {retrieved_context?.length ? (
        <RetrievedContextBlock documents={retrieved_context} />
      ) : null}
      {safety_note && <MetaLine label="Safety Note" value={safety_note} />}
    </div>
  );
}

function MetaLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="text-xs leading-5 text-slate-400">
      <span className="font-semibold uppercase tracking-[0.12em] text-slate-500">{label}: </span>
      {value}
    </div>
  );
}

function ToolCallBlock({ toolCall }: { toolCall: ToolCall }) {
  return (
    <div className="rounded-md border border-white/10 bg-black/20 p-3">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2 text-xs">
        <span className="font-semibold text-cyan-100">fake_tool.{toolCall.name}</span>
        <span className="rounded-md border border-white/10 px-2 py-1 uppercase tracking-[0.12em] text-slate-300">
          {toolCall.status}
        </span>
      </div>
      <pre className="overflow-x-auto text-xs leading-5 text-slate-300">
        {JSON.stringify(toolCall.input, null, 2)}
      </pre>
      <p className="mt-2 text-xs text-slate-400">{toolCall.output}</p>
    </div>
  );
}

function RetrievedContextBlock({ documents }: { documents: RetrievedDocument[] }) {
  return (
    <div className="space-y-2">
      <div className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
        Simulated Retrieved Context
      </div>
      {documents.map((document) => (
        <div
          className="rounded-md border border-white/10 bg-black/20 p-3 text-xs leading-5 text-slate-300"
          key={`${document.title}-${document.tenant}-${document.trust}`}
        >
          <div className="mb-1 flex flex-wrap gap-2 font-semibold text-slate-100">
            <span>{document.title}</span>
            <span className="text-slate-500">/</span>
            <span>{document.tenant}</span>
            <span className="text-slate-500">/</span>
            <span>{document.trust}</span>
          </div>
          <p>{document.content}</p>
        </div>
      ))}
    </div>
  );
}
