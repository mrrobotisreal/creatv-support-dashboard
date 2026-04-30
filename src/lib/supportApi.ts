import { authFetch } from "@/lib/authFetch";
import type { SupportStats, SupportTech, TicketDetail, TicketListResponse } from "@/types/support";

const BASE_URL = import.meta.env.VITE_SUPPORT_API_URL as string;

async function readJson<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const text = await response.text().catch(() => "");
    try {
      const parsed = text ? (JSON.parse(text) as { error?: string }) : null;
      throw new Error(parsed?.error || text || `Request failed with status ${response.status}`);
    } catch (error) {
      if (error instanceof SyntaxError) {
        throw new Error(text || `Request failed with status ${response.status}`);
      }
      throw error;
    }
  }
  return response.json() as Promise<T>;
}

function apiUrl(path: string) {
  if (!BASE_URL) {
    throw new Error("Missing VITE_SUPPORT_API_URL");
  }
  return `${BASE_URL}${path}`;
}

export type TicketFilters = {
  status: string;
  requestType: string;
  search: string;
  startDate: string;
  endDate: string;
  assignedTo: string;
  handledBy: string;
};

export async function listTickets(filters: TicketFilters, page: number, limit: number) {
  const url = new URL(apiUrl("/support/tickets"));
  url.searchParams.set("page", String(page));
  url.searchParams.set("limit", String(limit));
  if (filters.status !== "all") url.searchParams.set("status", filters.status);
  if (filters.requestType !== "all") url.searchParams.set("request_type", filters.requestType);
  if (filters.search.trim()) url.searchParams.set("search", filters.search.trim());
  if (filters.startDate) url.searchParams.set("start_date", filters.startDate);
  if (filters.endDate) url.searchParams.set("end_date", filters.endDate);
  if (filters.assignedTo.trim()) url.searchParams.set("assigned_to", filters.assignedTo.trim());
  if (filters.handledBy.trim()) url.searchParams.set("handled_by", filters.handledBy.trim());
  return readJson<TicketListResponse>(await authFetch(url));
}

export async function getStats(filters: TicketFilters) {
  const url = new URL(apiUrl("/support/stats"));
  if (filters.startDate) url.searchParams.set("start_date", filters.startDate);
  if (filters.endDate) url.searchParams.set("end_date", filters.endDate);
  if (filters.requestType !== "all") url.searchParams.set("request_type", filters.requestType);
  return readJson<SupportStats>(await authFetch(url));
}

export async function getCurrentSupportTech(accessToken?: string) {
  const headers = accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined;
  return readJson<SupportTech>(await authFetch(apiUrl("/support/me"), { headers }));
}

export async function getTicket(requestID: string) {
  return readJson<TicketDetail>(await authFetch(apiUrl(`/support/tickets/${encodeURIComponent(requestID)}`)));
}

export async function updateTicket(requestID: string, input: { status?: string; assigned_support_tech_id?: string }) {
  return readJson<{ ok: boolean }>(
    await authFetch(apiUrl(`/support/tickets/${encodeURIComponent(requestID)}`), {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    }),
  );
}

export async function createTicketEvent(requestID: string, input: { event_type: "note" | "response"; message: string }) {
  return readJson<{ ok: boolean }>(
    await authFetch(apiUrl(`/support/tickets/${encodeURIComponent(requestID)}/events`), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    }),
  );
}
