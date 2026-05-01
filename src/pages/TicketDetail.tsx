import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { ArrowLeft } from "lucide-react";
import { Link, useParams } from "react-router-dom";

import { createTicketEvent, getTicket, updateTicket } from "@/lib/supportApi";
import type { SupportStatus } from "@/types/support";

const statuses: SupportStatus[] = ["pending", "active", "in_progress", "closed", "resolved"];

export default function TicketDetailPage() {
  const { requestID = "" } = useParams();
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<SupportStatus>("active");
  const [assignedTo, setAssignedTo] = useState("mwintrow");
  const [eventType, setEventType] = useState<"note" | "response">("note");
  const [message, setMessage] = useState("");

  const ticketQuery = useQuery({
    queryKey: ["support-ticket", requestID],
    queryFn: () => getTicket(requestID),
    enabled: Boolean(requestID),
  });

  const saveMutation = useMutation({
    mutationFn: () => updateTicket(requestID, { status, assigned_support_tech_id: assignedTo }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["support-ticket", requestID] });
      void queryClient.invalidateQueries({ queryKey: ["support-tickets"] });
      void queryClient.invalidateQueries({ queryKey: ["support-stats"] });
    },
  });

  const eventMutation = useMutation({
    mutationFn: () => createTicketEvent(requestID, { event_type: eventType, message }),
    onSuccess: () => {
      setMessage("");
      void queryClient.invalidateQueries({ queryKey: ["support-ticket", requestID] });
      void queryClient.invalidateQueries({ queryKey: ["support-tickets"] });
      void queryClient.invalidateQueries({ queryKey: ["support-stats"] });
    },
  });

  const detail = ticketQuery.data;

  useEffect(() => {
    if (!detail) return;
    setStatus(detail.ticket.status);
    setAssignedTo(detail.ticket.assigned_support_tech_id || "mwintrow");
  }, [detail]);

  return (
    <main className="mx-auto max-w-6xl space-y-6 px-4 py-6">
      <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" />
        Back to tickets
      </Link>

      {ticketQuery.isLoading && <div className="rounded-2xl border border-border bg-card p-6 text-muted-foreground">Loading ticket...</div>}
      {ticketQuery.error && <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-6 text-red-300">{ticketQuery.error instanceof Error ? ticketQuery.error.message : "Failed to load ticket"}</div>}

      {detail && (
        <>
          <section className="grid gap-6 lg:grid-cols-[1fr_320px]">
            <div className="rounded-2xl border border-border bg-card p-6">
              <div className="mb-4 flex flex-wrap items-center gap-3">
                <span className="rounded-full border border-border bg-muted px-3 py-1 text-xs capitalize">{detail.ticket.status.replace("_", " ")}</span>
                <span className="rounded-full border border-border bg-muted px-3 py-1 text-xs capitalize">{detail.ticket.request_type}</span>
                <span className="font-mono text-xs text-muted-foreground">{detail.ticket.request_id}</span>
              </div>
              <h1 className="text-2xl font-bold">{detail.ticket.subject || `Ticket from ${detail.ticket.contact_email}`}</h1>
              <p className="mt-2 text-sm text-muted-foreground">
                Created {formatDistanceToNow(new Date(detail.ticket.created_at), { addSuffix: true })}
                {detail.ticket.assigned_support_tech_id ? ` · Assigned to ${detail.ticket.assigned_support_tech_id}` : ""}
              </p>
              <div className="mt-4 grid gap-3 text-sm md:grid-cols-2">
                <InfoCard title="Requester">
                  <InfoLine label="Contact email" value={detail.ticket.contact_email} />
                  <InfoLine label="Account email" value={stringValue(detail.ticket.requester_snapshot.email) || detail.ticket.requester_email || "none"} />
                  <InfoLine label="Username" value={stringValue(detail.ticket.requester_snapshot.username) || "none"} />
                  <InfoLine label="User ID" value={stringValue(detail.ticket.requester_snapshot.user_id) || "none"} />
                  <InfoLine label="Firebase UID" value={detail.ticket.requester_firebase_uid || stringValue(detail.ticket.requester_snapshot.firebase_uid) || "none"} />
                  <InfoLine label="Premium" value={boolLabel(detail.ticket.requester_snapshot.is_premium)} />
                  <InfoLine label="Partner" value={boolLabel(detail.ticket.requester_snapshot.is_partner)} />
                  <InfoLine label="Verified" value={boolLabel(detail.ticket.requester_snapshot.is_verified)} />
                </InfoCard>
                <InfoCard title="Security context">
                  <InfoLine label="Client IP" value={stringValue(detail.ticket.submission_geo.ip_address) || stringValue(detail.ticket.submission_security.client_ip) || "none"} />
                  <InfoLine label="Location" value={[detail.ticket.submission_geo.city, detail.ticket.submission_geo.region, detail.ticket.submission_geo.country_code].map(stringValue).filter(Boolean).join(", ") || "none"} />
                  <InfoLine label="Lat/Lon" value={latLon(detail.ticket.submission_geo)} />
                  <InfoLine label="ASN" value={[detail.ticket.submission_geo.asn_number, detail.ticket.submission_geo.asn_org].map(stringValue).filter(Boolean).join(" · ") || "none"} />
                  <InfoLine label="Email matches account" value={boolLabel(detail.ticket.submission_security.contact_email_matches_account_email)} />
                  <InfoLine label="Prior email tickets" value={String(detail.ticket.prior_contact_email_ticket_count)} />
                  <InfoLine label="Prior account tickets" value={String(detail.ticket.prior_authenticated_user_ticket_count)} />
                  <InfoLine label="Rating" value={detail.ticket.rating ? `${detail.ticket.rating}/5` : "not rated"} />
                </InfoCard>
              </div>
              <div className="mt-6 whitespace-pre-wrap rounded-xl border border-border bg-background p-4 leading-7">{detail.ticket.description}</div>
            </div>

            <aside className="space-y-4 rounded-2xl border border-border bg-card p-5">
              <h2 className="font-semibold">Manage ticket</h2>
              <label className="grid gap-1 text-sm">
                Status
                <select className="dashboard-input" value={status} onChange={(event) => setStatus(event.target.value as SupportStatus)}>
                  {statuses.map((item) => (
                    <option key={item} value={item}>
                      {item.replace("_", " ")}
                    </option>
                  ))}
                </select>
              </label>
              <label className="grid gap-1 text-sm">
                Assigned support tech
                <input className="dashboard-input" value={assignedTo} onChange={(event) => setAssignedTo(event.target.value)} />
              </label>
              <button className="w-full rounded-lg bg-primary px-4 py-2 font-semibold text-primary-foreground disabled:opacity-60" disabled={saveMutation.isPending} onClick={() => saveMutation.mutate()}>
                {saveMutation.isPending ? "Saving..." : "Save changes"}
              </button>
              {saveMutation.error && <p className="text-sm text-red-300">{saveMutation.error instanceof Error ? saveMutation.error.message : "Save failed"}</p>}
            </aside>
          </section>

          <section className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-2xl border border-border bg-card p-5">
              <h2 className="mb-4 font-semibold">Attachments</h2>
              <div className="space-y-3">
                {detail.media.map((media) => (
                  <div key={media.upload_id} className="rounded-xl border border-border bg-background p-3 text-sm">
                    <div className="flex items-center justify-between gap-3">
                      <span className="font-medium capitalize">{media.media_kind}</span>
                      <span className="rounded-full bg-muted px-2 py-1 text-xs">{media.upload_status}</span>
                    </div>
                    <p className="mt-2 break-all font-mono text-xs text-muted-foreground">{media.s3_key}</p>
                  </div>
                ))}
                {detail.media.length === 0 && <p className="text-sm text-muted-foreground">No media attachments.</p>}
              </div>
              <div className="mt-4 rounded-xl border border-border bg-background p-3 text-sm">
                <p className="font-medium">Details JSON</p>
                <p className="mt-2 break-all font-mono text-xs text-muted-foreground">{detail.ticket.details_s3_key}</p>
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-card p-5">
              <h2 className="mb-4 font-semibold">Add note or response</h2>
              <div className="mb-3 flex gap-2">
                <button className={`rounded-lg border px-3 py-2 text-sm ${eventType === "note" ? "border-primary bg-primary/20" : "border-border"}`} onClick={() => setEventType("note")}>
                  Internal note
                </button>
                <button className={`rounded-lg border px-3 py-2 text-sm ${eventType === "response" ? "border-primary bg-primary/20" : "border-border"}`} onClick={() => setEventType("response")}>
                  Response history
                </button>
              </div>
              <textarea className="dashboard-input min-h-32" value={message} maxLength={8000} onChange={(event) => setMessage(event.target.value)} placeholder="Write an internal note or response text. Responses are stored only for now; email sending will be added later via AWS SES." />
              <button className="mt-3 rounded-lg bg-primary px-4 py-2 font-semibold text-primary-foreground disabled:opacity-60" disabled={eventMutation.isPending || !message.trim()} onClick={() => eventMutation.mutate()}>
                {eventMutation.isPending ? "Saving..." : "Save event"}
              </button>
              {eventMutation.error && <p className="mt-2 text-sm text-red-300">{eventMutation.error instanceof Error ? eventMutation.error.message : "Save failed"}</p>}
            </div>
          </section>

          <section className="rounded-2xl border border-border bg-card p-5">
            <h2 className="mb-4 font-semibold">History</h2>
            <div className="space-y-4">
              {detail.events.map((event) => (
                <div key={event.event_id} className="rounded-xl border border-border bg-background p-4">
                  <div className="flex flex-wrap items-center gap-2 text-sm">
                    <span className="font-semibold capitalize">{event.event_type.replace("_", " ")}</span>
                    <span className="text-muted-foreground">by {event.actor_display_name || event.actor_type}</span>
                    <span className="text-muted-foreground">{formatDistanceToNow(new Date(event.created_at), { addSuffix: true })}</span>
                    {event.delivery_status !== "not_applicable" && <span className="rounded-full bg-muted px-2 py-1 text-xs">{event.delivery_status}</span>}
                  </div>
                  {event.message && <p className="mt-3 whitespace-pre-wrap text-sm leading-6">{event.message}</p>}
                  {(event.from_status || event.to_status) && (
                    <p className="mt-2 text-xs text-muted-foreground">
                      {event.from_status || "none"} → {event.to_status || "none"}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </section>
        </>
      )}
    </main>
  );
}

function InfoCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-background p-3">
      <h2 className="mb-2 text-sm font-semibold">{title}</h2>
      <div className="space-y-1">{children}</div>
    </div>
  );
}

function InfoLine({ label, value }: { label: string; value: string }) {
  return (
    <p className="flex justify-between gap-3 text-xs">
      <span className="text-muted-foreground">{label}</span>
      <span className="min-w-0 break-words text-right">{value}</span>
    </p>
  );
}

function stringValue(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  return "";
}

function boolLabel(value: unknown): string {
  if (typeof value !== "boolean") return "unknown";
  return value ? "yes" : "no";
}

function latLon(geo: Record<string, unknown>): string {
  const lat = stringValue(geo.latitude);
  const lon = stringValue(geo.longitude);
  return lat && lon ? `${lat}, ${lon}` : "none";
}
