const SESSION_KEY = "llm-vulnerability-lab-session";

function newSessionId(): string {
  if (globalThis.crypto?.randomUUID) {
    return globalThis.crypto.randomUUID();
  }
  return `session-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function getSessionId(): string {
  const existing = window.localStorage.getItem(SESSION_KEY);
  if (existing) {
    return existing;
  }

  const created = newSessionId();
  window.localStorage.setItem(SESSION_KEY, created);
  return created;
}
