import { RotateCcw, Send } from "lucide-react";
import { FormEvent, useEffect, useRef, useState } from "react";

import type { ChatMessage } from "../types/vulnerability";
import { MarkdownText } from "./MarkdownText";

interface ConversationPanelProps {
  messages: ChatMessage[];
  samplePrompts: string[];
  isSending: boolean;
  onSend: (message: string) => Promise<void>;
  onReset: () => Promise<void>;
}

export function ConversationPanel({
  messages,
  samplePrompts,
  isSending,
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
          <h2 className="text-lg font-semibold text-white">JC Ai Chatbot</h2>
          <p className="mt-1 text-sm text-slate-400">Live Gemini chatbot target</p>
        </div>

        <button
          className="inline-flex h-10 items-center gap-2 rounded-md border border-white/10 bg-white/5 px-3 text-sm font-semibold text-slate-200 transition hover:bg-white/10"
          type="button"
          onClick={() => void onReset()}
        >
          <RotateCcw className="h-4 w-4" aria-hidden="true" />
          Reset
        </button>
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
          {isUser ? "You" : "JC Ai Chatbot"}
        </div>
        <MarkdownText text={message.content} />
      </div>
    </div>
  );
}
