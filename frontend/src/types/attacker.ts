export interface ExfilEvent {
  received_at: string;
  session_id: string | null;
  n: number | null;
  raw: string | null;
  decoded: string | null;
  remote_ip: string | null;
  user_agent: string | null;
}

export interface ExfilEventsResponse {
  events: ExfilEvent[];
}

export interface AttackerSendEmailRequest {
  victim_base_url?: string;
  from: string;
  to: string;
  subject: string;
  body: string;
  trust?: string;
}

export interface AttackerSendEmailResponse {
  delivered: boolean;
  victim_response: Record<string, unknown> | null;
}
