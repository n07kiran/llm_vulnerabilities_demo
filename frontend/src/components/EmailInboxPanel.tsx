import { RotateCcw, RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";

import { fetchInboxEmails, resetInboxEmails } from "../services/api";
import type { EmailMessage } from "../types/email";

export function EmailInboxPanel() {
  const [emails, setEmails] = useState<EmailMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isWorking, setIsWorking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setIsWorking(true);
    setError(null);
    try {
      const response = await fetchInboxEmails();
      setEmails(response.emails);
    } catch (errorValue) {
      setError(errorValue instanceof Error ? errorValue.message : "Unable to load inbox.");
    } finally {
      setIsWorking(false);
      setIsLoading(false);
    }
  }

  async function reset() {
    setIsWorking(true);
    setError(null);
    try {
      const response = await resetInboxEmails();
      setEmails(response.emails);
    } catch (errorValue) {
      setError(errorValue instanceof Error ? errorValue.message : "Unable to reset inbox.");
    } finally {
      setIsWorking(false);
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  return (
    <div className="rounded-lg border border-white/10 bg-ink-900 shadow-panel">
      <div className="flex flex-col gap-4 border-b border-white/10 p-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h3 className="text-lg font-semibold text-white">Victim Inbox (Fake)</h3>
          <p className="mt-1 text-sm text-slate-400">
            These emails are the RAG data source for the scenario.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            className="inline-flex h-10 items-center gap-2 rounded-md border border-white/10 bg-white/5 px-3 text-sm font-semibold text-slate-200 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
            type="button"
            disabled={isWorking}
            onClick={() => void load()}
          >
            <RefreshCw className="h-4 w-4" aria-hidden="true" />
            Refresh
          </button>
          <button
            className="inline-flex h-10 items-center gap-2 rounded-md border border-signal-red/35 bg-signal-red/10 px-3 text-sm font-semibold text-red-100 transition hover:bg-signal-red/15 disabled:cursor-not-allowed disabled:opacity-60"
            type="button"
            disabled={isWorking}
            onClick={() => void reset()}
          >
            <RotateCcw className="h-4 w-4" aria-hidden="true" />
            Reset Inbox
          </button>
        </div>
      </div>

      <div className="space-y-3 p-4">
        {error ? (
          <div className="rounded-md border border-signal-red/35 bg-signal-red/10 p-3 text-sm text-red-100">
            {error}
          </div>
        ) : null}

        {isLoading ? (
          <div className="rounded-md border border-white/10 bg-black/10 p-4 text-sm text-slate-300">
            Loading inbox...
          </div>
        ) : emails.length === 0 ? (
          <div className="rounded-md border border-white/10 bg-black/10 p-4 text-sm text-slate-400">
            Inbox is empty.
          </div>
        ) : (
          <div className="space-y-3">
            {emails.map((email) => (
              <details
                key={email.id}
                className="rounded-md border border-white/10 bg-white/[0.04] px-4 py-3"
              >
                <summary className="cursor-pointer list-none">
                  <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                    <div>
                      <div className="text-sm font-semibold text-white">{email.subject}</div>
                      <div className="mt-1 text-xs text-slate-400">
                        {email.from} • {new Date(email.received_at).toLocaleString()}
                      </div>
                    </div>
                    <TrustBadge trust={email.trust} />
                  </div>
                </summary>

                <div className="mt-3 whitespace-pre-wrap rounded-md border border-white/10 bg-black/20 p-3 text-sm leading-6 text-slate-200">
                  {email.body}
                </div>
              </details>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function TrustBadge({ trust }: { trust: string }) {
  if (trust === "untrusted") {
    return (
      <span className="inline-flex h-7 items-center rounded-full border border-signal-red/35 bg-signal-red/10 px-3 text-xs font-semibold text-red-100">
        Untrusted
      </span>
    );
  }

  return (
    <span className="inline-flex h-7 items-center rounded-full border border-signal-green/35 bg-signal-green/10 px-3 text-xs font-semibold text-green-100">
      Trusted
    </span>
  );
}
