import type {
  ChatHistoryResponse,
  ChatResponse,
  VulnerabilityCard,
  VulnerabilityDetail,
} from "../types/vulnerability";
import type { AttackerSendEmailRequest, AttackerSendEmailResponse, ExfilEventsResponse } from "../types/attacker";
import type { EmailCreateRequest, EmailCreateResponse, EmailListResponse } from "../types/email";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000";
const ATTACKER_BASE_URL = import.meta.env.VITE_ATTACKER_BASE_URL ?? "http://localhost:8001";

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(options?.headers ?? {}),
    },
    ...options,
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(detail || `Request failed with ${response.status}`);
  }

  return response.json() as Promise<T>;
}

async function attackerRequest<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${ATTACKER_BASE_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(options?.headers ?? {}),
    },
    ...options,
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(detail || `Request failed with ${response.status}`);
  }

  return response.json() as Promise<T>;
}

export function fetchVulnerabilities(): Promise<VulnerabilityCard[]> {
  return request<VulnerabilityCard[]>("/api/vulnerabilities");
}

export function fetchVulnerability(slug: string): Promise<VulnerabilityDetail> {
  return request<VulnerabilityDetail>(`/api/vulnerabilities/${slug}`);
}

export function fetchChatHistory(
  slug: string,
  sessionId: string,
): Promise<ChatHistoryResponse> {
  return request<ChatHistoryResponse>(
    `/api/chat/${slug}?session_id=${encodeURIComponent(sessionId)}`,
  );
}

export function sendChatMessage(
  slug: string,
  sessionId: string,
  message: string,
): Promise<ChatResponse> {
  return request<ChatResponse>(`/api/chat/${slug}`, {
    method: "POST",
    body: JSON.stringify({
      session_id: sessionId,
      message,
    }),
  });
}

export function resetChat(slug: string, sessionId: string): Promise<ChatHistoryResponse> {
  return request<ChatHistoryResponse>(`/api/reset/${slug}`, {
    method: "POST",
    body: JSON.stringify({ session_id: sessionId }),
  });
}

export function fetchInboxEmails(): Promise<EmailListResponse> {
  return request<EmailListResponse>("/api/email/inbox");
}

export function resetInboxEmails(): Promise<EmailListResponse> {
  return request<EmailListResponse>("/api/email/reset", { method: "POST" });
}

export function addInboxEmail(payload: EmailCreateRequest): Promise<EmailCreateResponse> {
  return request<EmailCreateResponse>("/api/email/inbox", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function attackerSendEmail(payload: AttackerSendEmailRequest): Promise<AttackerSendEmailResponse> {
  return attackerRequest<AttackerSendEmailResponse>("/api/attacker/send-email", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function fetchAttackerEvents(): Promise<ExfilEventsResponse> {
  return attackerRequest<ExfilEventsResponse>("/api/attacker/events");
}

export function resetAttackerEvents(): Promise<{ status: string }> {
  return attackerRequest<{ status: string }>("/api/attacker/reset", { method: "POST" });
}
