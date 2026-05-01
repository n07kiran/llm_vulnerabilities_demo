import type {
  ChatHistoryResponse,
  ChatResponse,
  SimulationMode,
  VulnerabilityCard,
  VulnerabilityDetail,
} from "../types/vulnerability";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000";

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
  mode: SimulationMode,
): Promise<ChatResponse> {
  return request<ChatResponse>(`/api/chat/${slug}`, {
    method: "POST",
    body: JSON.stringify({
      session_id: sessionId,
      message,
      mode,
    }),
  });
}

export function resetChat(slug: string, sessionId: string): Promise<ChatHistoryResponse> {
  return request<ChatHistoryResponse>(`/api/reset/${slug}`, {
    method: "POST",
    body: JSON.stringify({ session_id: sessionId }),
  });
}
