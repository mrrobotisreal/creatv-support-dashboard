export type SupportStatus = "pending" | "active" | "in_progress" | "closed" | "resolved";
export type SupportRequestType = "question" | "help";

export type TicketSummary = {
  id: number;
  request_id: string;
  request_type: SupportRequestType;
  contact_email: string;
  description: string;
  status: SupportStatus;
  requester_firebase_uid?: string;
  requester_email?: string;
  opened_by_support_tech_id?: string;
  assigned_support_tech_id?: string;
  details_s3_key: string;
  media_count: number;
  opened_at?: string;
  first_responded_at?: string;
  closed_at?: string;
  resolved_at?: string;
  created_at: string;
  updated_at: string;
};

export type TicketMedia = {
  upload_id: string;
  media_kind: "image" | "video";
  file_extension: string;
  content_type: string;
  file_size_bytes: number;
  s3_bucket: string;
  s3_key: string;
  upload_status: string;
  uploaded_at?: string;
  created_at: string;
};

export type TicketEvent = {
  event_id: string;
  event_type: string;
  actor_type: string;
  actor_id?: string;
  actor_display_name?: string;
  from_status?: string;
  to_status?: string;
  message?: string;
  delivery_status: string;
  metadata: Record<string, unknown>;
  created_at: string;
};

export type TicketDetail = {
  ticket: TicketSummary;
  media: TicketMedia[];
  events: TicketEvent[];
};

export type TicketListResponse = {
  tickets: TicketSummary[];
  page: number;
  limit: number;
  total: number;
};

export type SupportStats = {
  start_date: string;
  end_date: string;
  request_type: string;
  summary: Record<string, number>;
  counts_by_status: Array<{ key: string; count: number }>;
  counts_by_type: Array<{ key: string; count: number }>;
  daily: Array<{ date: string; created: number; resolved: number; closed: number; responded: number }>;
};
