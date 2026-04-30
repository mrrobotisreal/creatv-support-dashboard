import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { Link } from "react-router-dom";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { getStats, listTickets, type TicketFilters } from "@/lib/supportApi";
import { cn } from "@/lib/utils";
import type { SupportStatus } from "@/types/support";

const statusOptions: Array<"all" | SupportStatus> = ["all", "pending", "active", "in_progress", "closed", "resolved"];

const defaultFilters: TicketFilters = {
  status: "all",
  requestType: "all",
  search: "",
  startDate: "",
  endDate: "",
  assignedTo: "",
  handledBy: "",
};

export default function DashboardPage() {
  const [filters, setFilters] = useState<TicketFilters>(defaultFilters);
  const [page, setPage] = useState(1);
  const limit = 25;

  const statsQuery = useQuery({
    queryKey: ["support-stats", filters.startDate, filters.endDate, filters.requestType],
    queryFn: () => getStats(filters),
  });
  const ticketsQuery = useQuery({
    queryKey: ["support-tickets", filters, page],
    queryFn: () => listTickets(filters, page, limit),
  });

  const totalPages = useMemo(() => Math.max(1, Math.ceil((ticketsQuery.data?.total ?? 0) / limit)), [ticketsQuery.data?.total]);

  const setFilter = (key: keyof TicketFilters, value: string) => {
    setPage(1);
    setFilters((current) => ({ ...current, [key]: value }));
  };

  return (
    <main className="mx-auto max-w-7xl space-y-6 px-4 py-6">
      <section className="grid gap-4 md:grid-cols-4">
        <StatCard label="Total" value={statsQuery.data?.summary.total ?? 0} />
        <StatCard label="Pending" value={statsQuery.data?.summary.pending ?? 0} tone="amber" />
        <StatCard label="In Progress" value={statsQuery.data?.summary.in_progress ?? 0} tone="blue" />
        <StatCard label="Resolved" value={statsQuery.data?.summary.resolved ?? 0} tone="green" />
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.25fr_0.75fr]">
        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">Ticket volume</h2>
              <p className="text-sm text-muted-foreground">Created tickets by day.</p>
            </div>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={statsQuery.data?.daily ?? []}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }} />
                <Bar dataKey="created" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5">
          <h2 className="text-lg font-semibold">Status mix</h2>
          <div className="mt-4 space-y-3">
            {(statsQuery.data?.counts_by_status ?? []).map((item) => (
              <div key={item.key} className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2">
                <span className="capitalize">{item.key.replace("_", " ")}</span>
                <span className="font-semibold">{item.count}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-border bg-card p-5">
        <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2 className="text-xl font-semibold">Support tickets</h2>
            <p className="text-sm text-muted-foreground">Filter, paginate, and open tickets to read details or respond.</p>
          </div>
          <button className="rounded-lg border border-border px-3 py-2 text-sm hover:bg-muted" onClick={() => setFilters(defaultFilters)}>
            Reset filters
          </button>
        </div>

        <div className="mb-5 grid gap-3 md:grid-cols-3 xl:grid-cols-6">
          <Field label="Status">
            <select className="dashboard-input" value={filters.status} onChange={(event) => setFilter("status", event.target.value)}>
              {statusOptions.map((status) => (
                <option key={status} value={status}>
                  {status.replace("_", " ")}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Type">
            <select className="dashboard-input" value={filters.requestType} onChange={(event) => setFilter("requestType", event.target.value)}>
              <option value="all">all</option>
              <option value="question">question</option>
              <option value="help">help</option>
            </select>
          </Field>
          <Field label="Search">
            <input className="dashboard-input" value={filters.search} onChange={(event) => setFilter("search", event.target.value)} placeholder="email or text" />
          </Field>
          <Field label="Start">
            <input className="dashboard-input" type="date" value={filters.startDate} onChange={(event) => setFilter("startDate", event.target.value)} />
          </Field>
          <Field label="End">
            <input className="dashboard-input" type="date" value={filters.endDate} onChange={(event) => setFilter("endDate", event.target.value)} />
          </Field>
          <Field label="Handled by">
            <input className="dashboard-input" value={filters.handledBy} onChange={(event) => setFilter("handledBy", event.target.value)} placeholder="mwintrow" />
          </Field>
        </div>

        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="min-w-full divide-y divide-border text-sm">
            <thead className="bg-muted/60 text-left text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">Ticket</th>
                <th className="px-4 py-3 font-medium">Type</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Contact</th>
                <th className="px-4 py-3 font-medium">Created</th>
                <th className="px-4 py-3 font-medium">Media</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {(ticketsQuery.data?.tickets ?? []).map((ticket) => (
                <tr key={ticket.request_id} className="hover:bg-muted/30">
                  <td className="max-w-md px-4 py-3">
                    <Link to={`/tickets/${ticket.request_id}`} className="font-mono text-primary hover:underline">
                      {ticket.request_id.slice(0, 8)}
                    </Link>
                    <p className="mt-1 line-clamp-2 text-muted-foreground">{ticket.description}</p>
                  </td>
                  <td className="px-4 py-3 capitalize">{ticket.request_type}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={ticket.status} />
                  </td>
                  <td className="px-4 py-3">{ticket.contact_email}</td>
                  <td className="px-4 py-3 text-muted-foreground">{formatDistanceToNow(new Date(ticket.created_at), { addSuffix: true })}</td>
                  <td className="px-4 py-3">{ticket.media_count}</td>
                </tr>
              ))}
              {!ticketsQuery.isLoading && !ticketsQuery.data?.tickets.length && (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-muted-foreground">
                    No tickets match these filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-4 flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            Page {page} of {totalPages} · {ticketsQuery.data?.total ?? 0} tickets
          </span>
          <div className="flex gap-2">
            <button className="rounded-lg border border-border px-3 py-2 disabled:opacity-50" disabled={page <= 1} onClick={() => setPage((value) => Math.max(1, value - 1))}>
              Previous
            </button>
            <button className="rounded-lg border border-border px-3 py-2 disabled:opacity-50" disabled={page >= totalPages} onClick={() => setPage((value) => Math.min(totalPages, value + 1))}>
              Next
            </button>
          </div>
        </div>
      </section>
    </main>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="grid gap-1 text-sm">
      <span className="text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}

function StatCard({ label, value, tone = "default" }: { label: string; value: number; tone?: "default" | "amber" | "blue" | "green" }) {
  return (
    <div className={cn("rounded-2xl border border-border bg-card p-5", tone === "amber" && "bg-amber-500/10", tone === "blue" && "bg-blue-500/10", tone === "green" && "bg-green-500/10")}>
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-2 text-3xl font-bold">{value}</p>
    </div>
  );
}

function StatusBadge({ status }: { status: SupportStatus }) {
  return <span className="rounded-full border border-border bg-muted px-2 py-1 text-xs capitalize">{status.replace("_", " ")}</span>;
}
