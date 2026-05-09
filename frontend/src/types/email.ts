export type EmailTrust = "trusted" | "untrusted";

export interface EmailMessage {
  id: string;
  from: string;
  to: string;
  subject: string;
  body: string;
  received_at: string;
  trust: EmailTrust;
}

export interface EmailListResponse {
  emails: EmailMessage[];
}

export interface EmailCreateRequest {
  from: string;
  to: string;
  subject: string;
  body: string;
  trust?: EmailTrust;
}

export interface EmailCreateResponse {
  email: EmailMessage;
}
