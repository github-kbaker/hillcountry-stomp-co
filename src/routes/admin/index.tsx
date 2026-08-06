import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";

import { getSession, listLeads, logout, sendTestEmail } from "~/lib/admin";
import { LEAD_SOURCES, LEAD_STATUSES } from "~/lib/admin-meta";
import type { LeadListResult, LeadRow, LeadStatus } from "~/lib/admin-meta";
import { SITE_NAME } from "~/lib/site";

/**
 * /admin — the lead pipeline dashboard.
 *
 * Lists every submitted lead with pipeline status tabs (per-status counts),
 * lead-source filtering, UTM attribution, and created date. Every row links to
 * /admin/lead/<id> (the detail view ships in part 2).
 *
 * Security: this page itself only *redirects* unauthenticated visitors to
 * /admin/login — the real enforcement is server-side: `listLeads` returns
 * HTTP 401 for any request without a valid session cookie, and this page
 * bounces to the login page if that happens.
 *
 * noindex — the admin area must never appear in search results.
 */
export const Route = createFileRoute("/admin/")({
  head: () => ({
    meta: [
      { title: `Leads Dashboard | ${SITE_NAME} Admin` },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AdminDashboard,
});

type ViewState = {
  loading: boolean;
  authed: boolean | null; // null = still checking
  data: LeadListResult | null;
  status: string; // "" = all
  source: string; // "" = all
};

function AdminDashboard() {
  const [state, setState] = useState<ViewState>({
    loading: true,
    authed: null,
    data: null,
    status: "",
    source: "",
  });

  const setStatus = (status: string) =>
    setState((s) => ({ ...s, status, loading: true }));
  const setSource = (source: string) =>
    setState((s) => ({ ...s, source, loading: true }));

  const load = useCallback(async (status: string, source: string) => {
    const res = await listLeads({ data: { status, source } });
    if (res instanceof Response) {
      // 401 — session invalid or expired.
      window.location.replace("/admin/login");
      return;
    }
    setState((s) => ({ ...s, data: res, loading: false }));
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const session = await getSession();
        if (cancelled) return;
        if (!session.authed) {
          window.location.replace("/admin/login");
          return;
        }
        setState((s) => ({ ...s, authed: true, loading: true }));
        await load("", "");
      } catch {
        if (!cancelled) setState((s) => ({ ...s, loading: false }));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [load]);

  useEffect(() => {
    if (state.authed && state.loading) {
      load(state.status, state.source).catch(() => {
        setState((s) => ({ ...s, loading: false }));
      });
    }
  }, [state.authed, state.loading, state.status, state.source, load]);

  async function onLogout() {
    try {
      await logout();
    } finally {
      window.location.href = "/admin/login";
    }
  }

  const { data, status, source } = state;
  const counts = data?.counts;
  const [testState, setTestState] = useState("");
  async function runTestEmail() { setTestState("Sending…"); try { const r = await sendTestEmail(); if (r instanceof Response) setTestState("Unauthorized"); else setTestState(r.ok ? `Success (${r.messageId ?? "no message ID"})` : (r.error ?? "Email failed")); } catch (e) { setTestState(e instanceof Error ? e.message : String(e)); } }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-forest-900 sm:text-3xl">
            Leads Dashboard
          </h1>
          <p className="mt-1 text-sm text-charcoal-500">
            {data ? (
              <>
                {data.total} lead{data.total === 1 ? "" : "s"} ·{" "}
                {data.leads.length} shown
              </>
            ) : (
              "Loading…"
            )}
          </p>
        </div>
        <div className="flex items-center gap-2"><Link to="/admin/calendar" className="btn-secondary px-4 py-2 text-sm">Calendar</Link><button onClick={runTestEmail} className="btn-primary px-4 py-2 text-sm">Send Test Email</button><button onClick={onLogout} className="btn-charcoal px-4 py-2 text-sm">Sign Out</button></div>
      </div>
      {testState && <div role="status" className="mt-3 rounded-lg border border-limestone-300 bg-limestone-50 px-4 py-3 text-sm">{testState}</div>}


      {/* Pipeline status tabs */}
      <div className="mt-6 flex flex-wrap gap-1.5">
        <StatusTab
          active={status === ""}
          label={`All${counts ? ` (${data!.total})` : ""}`}
          onClick={() => setStatus("")}
        />
        {LEAD_STATUSES.map((s) => (
          <StatusTab
            key={s}
            active={status === s}
            label={`${formatStatus(s)}${counts ? ` (${counts[s]})` : ""}`}
            onClick={() => setStatus(s)}
          />
        ))}
      </div>

      {/* Source filter */}
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <label htmlFor="source-filter" className="text-sm font-semibold text-charcoal-700">
          Source:
        </label>
        <select
          id="source-filter"
          value={source}
          onChange={(e) => setSource(e.target.value)}
          className="input w-auto py-1.5 text-sm"
        >
          <option value="">All sources</option>
          {LEAD_SOURCES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      <div className="mt-6">
        {state.loading || !data ? (
          <div className="card text-charcoal-500">Loading leads…</div>
        ) : data.leads.length === 0 ? (
          <div className="card text-charcoal-500">
            No leads match this filter yet. New submissions from the Free
            Estimate and Contact forms appear here.
          </div>
        ) : (
          <>
            {/* Mobile: stacked cards */}
            <ul className="space-y-3 md:hidden">
              {data.leads.map((lead) => (
                <li key={lead.id} className="card p-4">
                  <LeadCard lead={lead} />
                </li>
              ))}
            </ul>
            {/* Desktop: table */}
            <div className="hidden overflow-x-auto rounded-xl border border-limestone-300 bg-white shadow-sm md:block">
              <table className="w-full min-w-[820px] text-left text-sm">
                <thead>
                  <tr className="border-b border-limestone-200 bg-limestone-100 text-xs uppercase tracking-wider text-charcoal-500">
                    <th className="px-4 py-3 font-semibold">Name</th>
                    <th className="px-4 py-3 font-semibold">Contact</th>
                    <th className="px-4 py-3 font-semibold">City</th>
                    <th className="px-4 py-3 font-semibold">Kind</th>
                    <th className="px-4 py-3 font-semibold">Source</th>
                    <th className="px-4 py-3 font-semibold">Status</th>
                    <th className="px-4 py-3 font-semibold">Created</th>
                  </tr>
                </thead>
                <tbody>
                  {data.leads.map((lead) => (
                    <tr
                      key={lead.id}
                      className="border-b border-limestone-200 last:border-0 hover:bg-limestone-50"
                    >
                      <td className="px-4 py-3">
                        <Link
                          to="/admin/lead/$id"
                          params={{ id: lead.id }}
                          className="font-semibold text-forest-700 hover:text-forest-600 hover:underline"
                        >
                          {lead.name || "(no name)"}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-charcoal-700">
                        <div>
                          <a href={`tel:${lead.phone}`} className="hover:underline">
                            {lead.phone || "—"}
                          </a>
                        </div>
                        <div className="text-charcoal-500">
                          {lead.email || "—"}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-charcoal-700">
                        {lead.city || "—"}
                      </td>
                      <td className="px-4 py-3">
                        <KindBadge kind={lead.kind} />
                      </td>
                      <td className="px-4 py-3 text-charcoal-700">
                        {lead.lead_source || "—"}
                        <Utm utm={lead.utm} />
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={lead.status} /> <EmailBadge status={lead.email_status?.status} />
                      </td>
                      <td className="px-4 py-3 text-charcoal-500">
                        {formatDate(lead.created_at)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function StatusTab({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full px-3.5 py-1.5 text-sm font-semibold transition-colors ${
        active
          ? "bg-forest-700 text-limestone-50"
          : "bg-white text-charcoal-700 ring-1 ring-limestone-300 hover:bg-limestone-200"
      }`}
    >
      {label}
    </button>
  );
}

function LeadCard({ lead }: { lead: LeadRow }) {
  return (
    <div>
      <div className="flex items-start justify-between gap-2">
        <Link
          to="/admin/lead/$id"
          params={{ id: lead.id }}
          className="font-semibold text-forest-700 hover:underline"
        >
          {lead.name || "(no name)"}
        </Link>
        <StatusBadge status={lead.status} /> <EmailBadge status={lead.email_status?.status} />
      </div>
      <div className="mt-2 space-y-1 text-sm text-charcoal-700">
        <div>
          <a href={`tel:${lead.phone}`} className="hover:underline">
            {lead.phone || "—"}
          </a>{" "}
          · {lead.email || "—"}
        </div>
        <div>
          {lead.city || "—"} · <KindBadge kind={lead.kind} /> ·{" "}
          {lead.lead_source || "no source"}
        </div>
        <Utm utm={lead.utm} />
        <div className="text-charcoal-500">{formatDate(lead.created_at)}</div>
      </div>
    </div>
  );
}

function KindBadge({ kind }: { kind: string }) {
  const cls =
    kind === "contractor"
      ? "bg-earth-100 text-earth-700"
      : kind === "contact"
        ? "bg-charcoal-100 text-charcoal-700"
        : "bg-forest-100 text-forest-900";
  return (
    <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${cls}`}>
      {kind}
    </span>
  );
}

function EmailBadge({ status }: { status?: string }) {
  const value = status ?? "pending";
  const cls = value === "sent" ? "bg-forest-100 text-forest-900" : value === "failed" ? "bg-red-100 text-red-800" : "bg-limestone-200 text-charcoal-700";
  return <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${cls}`}>email: {value}</span>;
}

function StatusBadge({ status }: { status: LeadStatus }) {
  const cls =
    status === "new"
      ? "bg-forest-100 text-forest-900"
      : status === "cancelled"
        ? "bg-limestone-200 text-charcoal-500 line-through"
        : "bg-limestone-200 text-charcoal-700";
  return (
    <span className={`inline-block whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-semibold ${cls}`}>
      {formatStatus(status)}
    </span>
  );
}

function Utm({ utm }: { utm: LeadRow["utm"] }) {
  const parts = [utm.source, utm.medium, utm.campaign].filter(Boolean);
  if (parts.length === 0) return null;
  return (
    <div className="text-xs text-charcoal-500">
      utm: {parts.join(" · ")}
    </div>
  );
}

function formatStatus(status: string): string {
  return status.replace(/-/g, " ");
}

function formatDate(iso: string): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}
