import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  assignContractor,
  deleteLead,
  getLead,
  getLeadPhoto,
  getSession,
  sendEstimate,
  sendWorkOrder,
  updateLead,
  markLeadStatus,
} from "~/lib/admin";
import {
  EQUIPMENT_CHECKLIST_CUSTOM_PREFIX,
  EQUIPMENT_CHECKLIST_ITEMS,
  EQUIPMENT_CHECKLIST_LABELS,
  LEAD_STATUSES,
  LEAD_STATUS_STAGES,
  STATUS_LABELS,
  computeProfitSummary,
  nextRecommendedAction,
  normalizeSubcontractor,
  stageReachedAt,
  statusStageIndex,
} from "~/lib/admin-meta";
import type {
  LeadDetail,
  LeadStatus,
  EquipmentItem,
  ServiceCharge,
  JobSchedule,
  Subcontractor,
  StatusHistoryEntry,
} from "~/lib/admin-meta";
import { SITE_NAME } from "~/lib/site";
import {
  buildCalendarEvent,
  buildIcs,
  formatServiceDate,
  googleCalendarUrl,
  icsFilename,
  outlookCalendarUrl,
  validateSchedule,
} from "~/lib/calendar";

export const Route = createFileRoute("/admin/lead/$id")({
  head: () => ({
    meta: [
      { title: `Lead Detail | ${SITE_NAME} Admin` },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: LeadDetailPage,
});

const groups: Array<[string, string[]]> = [
  ["Contact", ["name", "contact_name", "company", "phone", "email", "customer_email", "customer_type", "lead_source", "utm"]],
  ["Location", ["address", "city", "zip"]],
  ["Job details", ["num_stumps", "diameter", "height", "species", "grind_depth", "gate_width", "access_width", "utilities", "fence", "cleanup", "preferred_date", "notes"]],
  ["Contractor partnership", ["monthly_volume", "coverage_area", "insurance", "partnership"]],
];

const label = (s: string) =>
  s.replaceAll("_", " ").replace(/\b\w/g, (c) => c.toUpperCase());
const n = (v: unknown) => Number(String(v ?? "").replace(/[$,]/g, "")) || 0;
const fmt = (v: unknown) => `$${n(v).toFixed(2)}`;
const m = (c: number) => `$${(c / 100).toFixed(2)}`; // integer cents → money
/** Defaults for a fresh subcontractor record (stage D4). */
const EMPTY_SUB: Subcontractor = {
  name: "",
  contact_person: "",
  phone: "",
  email: "",
  service_area: "",
  insurance_verified: false,
  insurance_expiration: null,
  crew_size: "",
  payout_status: "unpaid",
  payout_paid_at: null,
  payout_method: "",
  notes: "",
  equipment_checklist: [],
  equipment_checklist_custom: "",
  assigned_at: null,
};

function LeadDetailPage() {
  const { id } = Route.useParams();
  const [lead, setLead] = useState<LeadDetail | null>(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [marking, setMarking] = useState<string | null>(null);
  const [photoUrls, setPhotoUrls] = useState<string[]>([]);
  // Stage D3 — Save to Calendar control state.
  const [calOpen, setCalOpen] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [calErr, setCalErr] = useState("");
  const [calMsg, setCalMsg] = useState("");
  // Stage D4 — assign / work-order action state.
  const [busy, setBusy] = useState<string | null>(null);
  const [woMsg, setWoMsg] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const s = await getSession();
        if (!s.authed) return window.location.replace("/admin/login");
        const r = await getLead({ data: { id } });
        if (r instanceof Response) return setError("Lead not found.");
        setLead(r as LeadDetail);
      } catch {
        setError("Unable to load lead.");
      }
    })();
  }, [id]);

  useEffect(() => {
    const warn = (e: BeforeUnloadEvent) => {
      if (dirty) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  useEffect(() => {
    if (!lead) return;
    let alive = true;
    (async () => {
      const urls: string[] = [];
      for (const p of lead.photos ?? []) {
        const r = await getLeadPhoto({
          data: { leadId: id, filename: p.split("/").pop() ?? "" },
        });
        if (r instanceof Response && r.ok) urls.push(URL.createObjectURL(await r.blob()));
      }
      if (alive) setPhotoUrls(urls);
    })();
    return () => {
      alive = false;
    };
  }, [lead, id]);

  async function save(patch: Record<string, unknown>) {
    if (!lead) return;
    setSaving(true);
    setError("");
    try {
      const r = await updateLead({ data: { id, patch } });
      if (r instanceof Response) throw Error();
      setLead(r.lead as LeadDetail);
      setDirty(false);
    } catch (e) {
      const x = e as any;
      setError(x?.message || "Couldn't save — please try again");
    } finally {
      setSaving(false);
    }
  }

  async function saveAll() {
    if (!lead) return;
    await save({
      status: lead.status,
      estimate: lead.estimate,
      deposit: lead.deposit,
      schedule: lead.schedule,
      subcontractor: lead.subcontractor,
      contractor_cost: lead.contractor_cost,
      equipment: lead.equipment,
      fuel: lead.fuel,
      disposal: lead.disposal,
      management_fee: lead.management_fee,
      notes: lead.notes,
      payment_processing_cost: lead.payment_processing_cost,
      other_internal_cost: lead.other_internal_cost,
    });
  }

  async function estimate() {
    try {
      const r = await sendEstimate({ data: { id } });
      if (r instanceof Response || !r.ok) throw Error((r as any).error || "Send failed");
      setLead(r.lead as LeadDetail);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to send estimate");
    }
  }

  async function mark(to: LeadStatus, message: string) {
    if (marking) return; // double-click protection
    if (!window.confirm(message)) return;
    setMarking(to);
    setError("");
    try {
      const r = await markLeadStatus({ data: { id, to } });
      if (r instanceof Response) {
        setError("Couldn't update status — please refresh and try again.");
        return;
      }
      setLead(r.lead as LeadDetail);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't update status");
    } finally {
      setMarking(null);
    }
  }
  /** Stage D4 — record the contractor assignment (no status change, no email). */
  async function doAssign() {
    if (busy) return;
    setBusy("assign");
    setError("");
    try {
      const r = await assignContractor({ data: { id } });
      if (r instanceof Response || !r.ok) throw Error((r as any).error || "Assign failed");
      setLead(r.lead as LeadDetail);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't assign contractor");
    } finally {
      setBusy(null);
    }
  }
  /** Stage D4 — send the work-order email to the assigned contractor. */
  async function doWorkOrder() {
    if (busy) return;
    setBusy("work-order");
    setError("");
    setWoMsg(null);
    try {
      const r = await sendWorkOrder({ data: { id } });
      if (r instanceof Response || !r.ok) throw Error((r as any).error || "Send failed");
      setLead(r.lead as LeadDetail);
      setWoMsg(
        r.ok
          ? { ok: true, text: `Work order sent${r.messageId ? ` (${r.messageId})` : ""}.` }
          : { ok: false, text: `Work order not sent: ${r.error ?? "unknown error"}` },
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't send work order");
    } finally {
      setBusy(null);
    }
  }
  /**
   * Stage D3 — Save to Calendar. Pure client-side helper: builds the event
   * from the on-screen schedule, validates first, then either opens Google /
   * Outlook in a new tab or downloads the .ics file. Never touches lead data.
   */
  async function doCalendar(kind: "google" | "outlook" | "ics") {
    setCalOpen(false);
    setCalErr("");
    setCalMsg("");
    if (generating) return; // double-click protection
    const v = validateSchedule(schedule);
    if (!v.valid) {
      setCalErr(v.error);
      return;
    }
    const ev = buildCalendarEvent({
      id: lead.id,
      name: String(lead.name ?? lead.contact_name ?? lead.company ?? ""),
      address: (lead.address as string | null | undefined) ?? null,
      city: (lead.city as string | null | undefined) ?? null,
      schedule: lead.schedule,
    });
    if (!ev) {
      setCalErr("Couldn't build the calendar event — please try again.");
      return;
    }
    setGenerating(true);
    try {
      if (kind === "google") {
        window.open(googleCalendarUrl(ev), "_blank", "noopener,noreferrer");
      } else if (kind === "outlook") {
        window.open(outlookCalendarUrl(ev), "_blank", "noopener,noreferrer");
      } else {
        const blob = new Blob([buildIcs(ev)], { type: "text/calendar;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = icsFilename(ev);
        document.body.appendChild(a);
        a.click();
        a.remove();
        setTimeout(() => URL.revokeObjectURL(url), 2000);
      }
      setCalMsg(
        `Calendar event created for ${ev.customerName} on ${formatServiceDate(ev.start)}.`,
      );
    } catch {
      setCalErr("Couldn't create the calendar event — please try again.");
    } finally {
      setGenerating(false);
    }
  }

  if (error && !lead)
    return (
      <div className="mx-auto max-w-3xl px-4 py-10">
        <div className="card">
          {error}
          <br />
          <Link to="/admin" className="text-forest-700">
            ← Dashboard
          </Link>
        </div>
      </div>
    );
  if (!lead)
    return (
      <div className="mx-auto max-w-3xl px-4 py-10">
        <div className="card">Loading lead…</div>
      </div>
    );

  const schedule = (lead.schedule ?? null) as JobSchedule | null;
  const sub = normalizeSubcontractor(lead.subcontractor) ?? EMPTY_SUB;
  const equipment = (lead.equipment ?? []) as EquipmentItem[];
  const charges = (lead.service_charges ?? []) as ServiceCharge[];
  const chargesTotal = charges.reduce((a, x) => a + n(x.amount), 0);
  const equipTotal = equipment.reduce((a, x) => a + n(x.cost), 0);
  // Stage D4 — internal-only profit summary (cents-safe, admin-only).
  const summary = computeProfitSummary(lead);
  const patchArray = (key: string, arr: unknown[]) => save({ [key]: arr });
  // Subcontractor edits: keep new fields in state + the unified Save button.
  const patchSub = (patch: Partial<Subcontractor>) => {
    const base = normalizeSubcontractor(lead.subcontractor) ?? EMPTY_SUB;
    setLead({ ...lead, subcontractor: { ...base, ...patch } });
    setDirty(true);
  };
  const who = (sub.name || sub.contact_person || "").trim();
  const assignedAt = sub.assigned_at;
  const checklist = sub.equipment_checklist ?? [];
  const customChecked = checklist.some(
    (k) => k === EQUIPMENT_CHECKLIST_CUSTOM_PREFIX || k.startsWith("custom:"),
  );
  const toggleChecklist = (key: string) => {
    const list = [...checklist];
    if (key === EQUIPMENT_CHECKLIST_CUSTOM_PREFIX) {
      const rest = list.filter((k) => !k.startsWith("custom"));
      if (!customChecked) {
        const label = (sub.equipment_checklist_custom ?? "").trim();
        rest.push(label ? `custom:${label}` : "custom");
      }
      patchSub({ equipment_checklist: rest });
    } else {
      const next = list.includes(key)
        ? list.filter((k) => k !== key)
        : [...list, key];
      patchSub({ equipment_checklist: next });
    }
  };

  const history = (lead.status_history ?? []) as StatusHistoryEntry[];
  const stageIdx = statusStageIndex(lead.status);
  const cancelled = lead.status === "cancelled";
  const depositAmt = n(lead.deposit);

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <Link to="/admin" className="text-sm text-forest-700 hover:underline">
        ← Back to dashboard
      </Link>
      <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold text-forest-900">
            {String(lead.name || lead.contact_name || lead.company || "Lead")}
          </h1>
          <p className="mt-1 text-sm text-charcoal-500">
            {lead.id} · {new Date(lead.created_at).toLocaleString()}
          </p>
        </div>
        <button
          onClick={async () => {
            if (confirm("Delete this lead and its uploaded photos?")) {
              await deleteLead({ data: { id } });
              window.location.href = "/admin";
            }
          }}
          className="btn-charcoal bg-red-800 px-4 py-2 text-sm"
        >
          Delete lead
        </button>
      </div>

      {error && (
        <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </div>
      )}

      {/* ---- Customer status timeline (stage D2) ---- */}
      <section className="card mt-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-display text-xl font-bold text-forest-900">
            Customer Status
          </h2>
          <span
            className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${
              cancelled
                ? "bg-limestone-200 text-charcoal-500 line-through"
                : "bg-forest-700 text-limestone-50"
            }`}
          >
            {STATUS_LABELS[lead.status]}
          </span>
        </div>

        {cancelled && (
          <div className="mt-4 rounded-lg border border-limestone-300 bg-limestone-100 px-4 py-3 text-sm text-charcoal-600">
            This lead is <strong>cancelled</strong> — it sits outside the
            8-stage pipeline. Use the pipeline status dropdown to reopen it if
            needed.
          </div>
        )}

        {/* 8-stage stepper */}
        <ol className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4 xl:grid-cols-8">
          {LEAD_STATUS_STAGES.map((stage, i) => {
            const reached = !cancelled && stageIdx >= i;
            const current = !cancelled && stageIdx === i;
            const ts = stageReachedAt(history, stage, lead.created_at);
            return (
              <li
                key={stage}
                className={`relative rounded-lg border p-3 ${
                  reached
                    ? "border-forest-600 bg-forest-50"
                    : "border-limestone-200 bg-white"
                } ${current ? "ring-2 ring-forest-600" : ""}`}
              >
                <div className="flex items-center gap-2">
                  <span
                    className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                      reached
                        ? "bg-forest-700 text-limestone-50"
                        : "bg-limestone-200 text-charcoal-500"
                    }`}
                  >
                    {reached ? "✓" : i + 1}
                  </span>
                  <span
                    className={`text-sm font-semibold ${
                      reached ? "text-forest-900" : "text-charcoal-500"
                    }`}
                  >
                    {STATUS_LABELS[stage]}
                  </span>
                </div>
                {current && (
                  <span className="mt-2 block rounded bg-forest-700 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-limestone-50">
                    Current
                  </span>
                )}
                <span className="mt-1 block text-[11px] text-charcoal-500">
                  {reached && ts
                    ? new Date(ts).toLocaleString()
                    : reached
                      ? "—"
                      : "Not reached"}
                </span>
              </li>
            );
          })}
        </ol>

        {/* Latest activity + next recommended action */}
        <div className="mt-5 grid gap-4 lg:grid-cols-2">
          <div className="rounded-lg border border-limestone-200 bg-limestone-50 p-4">
            <h3 className="text-xs font-bold uppercase tracking-wide text-charcoal-500">
              Latest activity
            </h3>
            {history.length > 0 ? (
              <ActivityRow entry={history[history.length - 1]} />
            ) : (
              <p className="mt-2 text-sm text-charcoal-600">
                No activity recorded yet — lead created{" "}
                {lead.created_at ? new Date(lead.created_at).toLocaleString() : "—"}.
              </p>
            )}
          </div>
          <div className="rounded-lg border border-forest-200 bg-forest-50 p-4">
            <h3 className="text-xs font-bold uppercase tracking-wide text-forest-800">
              Next recommended action
            </h3>
            <p className="mt-2 text-sm font-medium text-forest-900">
              {nextRecommendedAction(lead.status)}
            </p>
          </div>
        </div>

        {/* Mark buttons (forward-only, server-enforced) */}
        {!cancelled && (
          <div className="mt-5 flex flex-wrap gap-2">
            {stageIdx < statusStageIndex("deposit-paid") && (
              <button
                onClick={() =>
                  mark(
                    "deposit-paid",
                    `Mark deposit paid for ${fmt(lead.deposit)}? This moves the lead to Deposit Paid.`,
                  )
                }
                disabled={marking !== null || stageIdx < statusStageIndex("estimate-accepted") || depositAmt <= 0}
                title={
                  stageIdx < statusStageIndex("estimate-accepted")
                    ? "Mark the estimate as accepted first"
                    : depositAmt <= 0
                      ? "Set a deposit first"
                      : ""
                }
                className="btn-secondary px-4 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-40"
              >
                {marking === "deposit-paid" ? "Saving…" : "Mark Deposit Paid"}
              </button>
            )}
            {stageIdx < statusStageIndex("in-progress") && (
              <button
                onClick={() =>
                  mark("in-progress", "Mark this job as In Progress?")
                }
                disabled={marking !== null || stageIdx < statusStageIndex("scheduled")}
                title={
                  stageIdx < statusStageIndex("scheduled")
                    ? "Schedule the job first"
                    : ""
                }
                className="btn-secondary px-4 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-40"
              >
                {marking === "in-progress" ? "Saving…" : "Mark In Progress"}
              </button>
            )}
            {stageIdx < statusStageIndex("completed") && (
              <button
                onClick={() => mark("completed", "Mark this job as Completed?")}
                disabled={marking !== null || stageIdx < statusStageIndex("in-progress")}
                title={
                  stageIdx < statusStageIndex("in-progress")
                    ? "Mark In Progress first"
                    : ""
                }
                className="btn-secondary px-4 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-40"
              >
                {marking === "completed" ? "Saving…" : "Mark Complete"}
              </button>
            )}
            {stageIdx < statusStageIndex("invoice-paid") && (
              <button
                onClick={() =>
                  mark("invoice-paid", "Mark this job as Invoice Paid?")
                }
                disabled={marking !== null || stageIdx < statusStageIndex("completed")}
                title={
                  stageIdx < statusStageIndex("completed")
                    ? "Mark Complete first"
                    : ""
                }
                className="btn-secondary px-4 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-40"
              >
                {marking === "invoice-paid" ? "Saving…" : "Mark Invoice Paid"}
              </button>
            )}
          </div>
        )}

        {/* Activity log — newest first */}
        <div className="mt-5 border-t border-limestone-200 pt-4">
          <h3 className="text-xs font-bold uppercase tracking-wide text-charcoal-500">
            Activity log
          </h3>
          {history.length === 0 ? (
            <p className="mt-2 text-sm text-charcoal-500">
              No status transitions recorded yet.
            </p>
          ) : (
            <ul className="mt-3 space-y-2">
              {[...history].reverse().map((entry, i) => (
                <li
                  key={i}
                  className="rounded border border-limestone-200 bg-white p-3 text-sm"
                >
                  <ActivityRow entry={entry} />
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      {/* ---- D1 finance card (Save / Send Estimate / fields) ---- */}
      <div className="card mt-6">
        <div className="mb-4 flex flex-wrap justify-end gap-2">
          <button
            onClick={saveAll}
            disabled={saving || !dirty}
            className="btn-primary px-4 py-2 text-sm"
          >
            {saving ? "Saving…" : dirty ? "Save" : "Saved"}
          </button>
          <button
            onClick={estimate}
            disabled={saving || !String(lead.estimate ?? "").trim() || n(lead.deposit) > n(lead.estimate)}
            className="btn-secondary px-4 py-2 text-sm"
          >
            Send Estimate
          </button>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <label className="label">
            Pipeline status
            <select
              className="input mt-1"
              value={lead.status}
              disabled={saving}
              onChange={(e) => {
                setLead({ ...lead, status: e.target.value as LeadStatus });
                setDirty(true);
              }}
            >
              {LEAD_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {STATUS_LABELS[s]}
                </option>
              ))}
            </select>
          </label>
          <label className="label">
            Estimate
            <input
              className="input mt-1"
              inputMode="decimal"
              value={String(lead.estimate ?? "")}
              onChange={(e) => {
                setLead({ ...lead, estimate: e.target.value });
                setDirty(true);
              }}
            />
          </label>
          <label className="label">
            Deposit
            <input
              className="input mt-1"
              inputMode="decimal"
              value={String(lead.deposit ?? "")}
              onChange={(e) => {
                setLead({ ...lead, deposit: e.target.value });
                setDirty(true);
              }}
            />
            <span className="mt-1 block text-xs text-charcoal-500">
              Blank deposit is $0.00.
            </span>
          </label>
          <label className="label">
            Balance
            <input
              readOnly
              className="input mt-1 bg-limestone-100"
              value={fmt(Math.max(0, n(lead.estimate) - n(lead.deposit)))}
            />
            <span className="mt-1 block text-xs text-charcoal-500">
              Calculated automatically from estimate minus deposit.
            </span>
          </label>
        </div>
        {n(lead.deposit) > n(lead.estimate) && (
          <p className="mt-3 text-sm text-red-700">
            Deposit cannot exceed the total estimate.
          </p>
        )}
        {dirty && <p className="mt-2 text-sm text-charcoal-500">Unsaved changes</p>}
      </div>

      <section className="card mt-5">
        <h2 className="font-display text-xl font-bold text-forest-900">Scheduling</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <label className="label">
            Service date
            <input
              type="date"
              className="input mt-1"
              value={schedule?.service_date ?? ""}
              onChange={(e) =>
                setLead({
                  ...lead,
                  schedule: {
                    ...(schedule ?? { arrival_time: null, estimated_duration_hours: null }),
                    service_date: e.target.value || null,
                  },
                })
              }
              onBlur={(e) =>
                save({ schedule: { ...(schedule ?? {}), service_date: e.target.value || null } })
              }
            />
          </label>
          <label className="label">
            Arrival time
            <input
              type="time"
              className="input mt-1"
              value={schedule?.arrival_time ?? ""}
              onChange={(e) =>
                setLead({
                  ...lead,
                  schedule: { ...(schedule ?? {}), arrival_time: e.target.value || null },
                })
              }
              onBlur={(e) =>
                save({ schedule: { ...(schedule ?? {}), arrival_time: e.target.value || null } })
              }
            />
          </label>
          <label className="label">
            Estimated duration (hours)
            <input
              className="input mt-1"
              inputMode="decimal"
              value={schedule?.estimated_duration_hours ?? ""}
              onChange={(e) =>
                setLead({
                  ...lead,
                  schedule: {
                    ...(schedule ?? {}),
                    estimated_duration_hours: e.target.value || null,
                  },
                })
              }
              onBlur={(e) =>
                save({
                  schedule: {
                    ...(schedule ?? {}),
                    estimated_duration_hours: e.target.value || null,
                  },
                })
              }
            />
          </label>
        </div>
        {/* Stage D3 — Save to Calendar (Google / Outlook / .ics) */}
        <div className="mt-5 border-t border-limestone-200 pt-4">
          <div className="relative inline-block">
            <button
              type="button"
              onClick={() => {
                setCalErr("");
                setCalMsg("");
                setCalOpen((o) => !o);
              }}
              disabled={generating}
              className="btn-primary px-4 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-60"
            >
              {generating ? "Generating…" : "Save to Calendar"}
            </button>
            {calOpen && !generating && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setCalOpen(false)}
                  aria-hidden="true"
                />
                <div
                  className="absolute left-0 top-full z-20 mt-2 w-64 rounded-lg border border-limestone-200 bg-white p-1.5 shadow-lg"
                  role="menu"
                  aria-label="Save to calendar options"
                >
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => doCalendar("google")}
                    className="block w-full rounded px-3 py-2 text-left text-sm font-semibold text-forest-800 hover:bg-forest-50"
                  >
                    Add to Google Calendar
                  </button>
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => doCalendar("outlook")}
                    className="block w-full rounded px-3 py-2 text-left text-sm font-semibold text-forest-800 hover:bg-forest-50"
                  >
                    Add to Outlook
                  </button>
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => doCalendar("ics")}
                    className="block w-full rounded px-3 py-2 text-left text-sm font-semibold text-forest-800 hover:bg-forest-50"
                  >
                    Download .ics
                  </button>
                </div>
              </>
            )}
          </div>
          {calErr && (
            <p className="mt-2 text-sm font-medium text-red-700">{calErr}</p>
          )}
          {calMsg && (
            <p className="mt-2 text-sm font-medium text-forest-700">{calMsg}</p>
          )}
        </div>
      </section>

      <section className="card mt-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-display text-xl font-bold text-forest-900">
            Subcontractor & payout
          </h2>
          <div className="flex flex-wrap items-center gap-2">
            {assignedAt ? (
              <span className="rounded-full bg-forest-700 px-3 py-1 text-xs font-bold text-limestone-50">
                Assigned ✓
              </span>
            ) : (
              <span className="rounded-full bg-limestone-200 px-3 py-1 text-xs font-semibold text-charcoal-500">
                Not assigned
              </span>
            )}
            <button
              onClick={doAssign}
              disabled={busy !== null || !who}
              title={who ? "" : "Enter a contractor name or contact person first"}
              className="btn-secondary px-4 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-40"
            >
              {busy === "assign" ? "Assigning…" : assignedAt ? "Re-assign" : "Assign Contractor"}
            </button>
            <button
              onClick={doWorkOrder}
              disabled={busy !== null || !who}
              title={who ? "" : "Enter a contractor name or contact person first"}
              className="btn-primary px-4 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-40"
            >
              {busy === "work-order" ? "Sending…" : "Send Work Order"}
            </button>
          </div>
        </div>
        {woMsg && (
          <p className={`mt-3 rounded-lg border px-3 py-2 text-sm ${woMsg.ok ? "border-forest-200 bg-forest-50 text-forest-900" : "border-red-200 bg-red-50 text-red-800"}`}>
            {woMsg.text}
          </p>
        )}
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <label className="label">
            Name
            <input
              className="input mt-1"
              value={sub.name}
              onChange={(e) => patchSub({ name: e.target.value })}
              onBlur={(e) => save({ subcontractor: { ...sub, name: e.target.value } })}
            />
          </label>
          <label className="label">
            Contact person
            <input
              className="input mt-1"
              value={sub.contact_person}
              onChange={(e) => patchSub({ contact_person: e.target.value })}
              placeholder="Owner / operator name"
            />
          </label>
          <label className="label">
            Service area
            <input
              className="input mt-1"
              value={sub.service_area}
              onChange={(e) => patchSub({ service_area: e.target.value })}
              placeholder="e.g. Kerrville / Fredericksburg"
            />
          </label>
          <label className="label">
            Crew size
            <input
              className="input mt-1"
              inputMode="numeric"
              value={sub.crew_size}
              onChange={(e) => patchSub({ crew_size: e.target.value })}
              placeholder="e.g. 2"
            />
          </label>
          <label className="label">
            Phone
            <input
              className="input mt-1"
              value={sub.phone}
              onChange={(e) => patchSub({ phone: e.target.value })}
              onBlur={(e) => save({ subcontractor: { ...sub, phone: e.target.value } })}
            />
          </label>
          <label className="label">
            Email
            <input
              className="input mt-1"
              type="email"
              value={sub.email}
              onChange={(e) => patchSub({ email: e.target.value })}
              onBlur={(e) => save({ subcontractor: { ...sub, email: e.target.value } })}
            />
          </label>
        </div>
        {/* Insurance */}
        <div className="mt-4 rounded-lg border border-limestone-200 bg-limestone-50 p-4">
          <h3 className="text-xs font-bold uppercase tracking-wide text-charcoal-500">
            Insurance
          </h3>
          <div className="mt-3 flex flex-wrap items-center gap-6">
            <label className="flex items-center gap-2 text-sm font-medium text-charcoal-800">
              <input
                type="checkbox"
                className="h-4 w-4"
                checked={sub.insurance_verified}
                onChange={(e) => patchSub({ insurance_verified: e.target.checked })}
              />
              Insurance verified
            </label>
            <label className="label mb-0">
              Expiration date (optional)
              <input
                type="date"
                className="input mt-1"
                value={sub.insurance_expiration ?? ""}
                onChange={(e) =>
                  patchSub({ insurance_expiration: e.target.value || null })
                }
              />
            </label>
          </div>
        </div>
        {/* Payout */}
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <label className="label">
            Contractor cost
            <input
              className="input mt-1"
              inputMode="decimal"
              value={String(lead.contractor_cost ?? "")}
              onChange={(e) => setLead({ ...lead, contractor_cost: e.target.value })}
              onBlur={(e) => save({ contractor_cost: e.target.value })}
            />
          </label>
          <label className="label">
            Payout status
            <select
              className="input mt-1"
              value={sub.payout_status ?? "unpaid"}
              onChange={(e) => {
                const paid = e.target.value === "paid";
                save({
                  subcontractor: {
                    ...sub,
                    payout_status: paid ? "paid" : "unpaid",
                    payout_paid_at: paid
                      ? sub.payout_paid_at ?? new Date().toISOString()
                      : null,
                  },
                });
              }}
            >
              <option value="unpaid">Unpaid</option>
              <option value="paid">Paid</option>
            </select>
          </label>
          <label className="label">
            Payout method
            <select
              className="input mt-1"
              value={sub.payout_method}
              onChange={(e) => patchSub({ payout_method: e.target.value })}
            >
              <option value="">—</option>
              <option value="Check">Check</option>
              <option value="Venmo">Venmo</option>
              <option value="Zelle">Zelle</option>
              <option value="Cash">Cash</option>
              <option value="ACH">ACH</option>
            </select>
          </label>
          <div className="label">
            Payout paid at
            <p className="input mt-1 flex items-center bg-limestone-50 text-sm text-charcoal-600">
              {sub.payout_paid_at
                ? new Date(sub.payout_paid_at).toLocaleString()
                : "—"}
            </p>
          </div>
        </div>
        {/* Notes */}
        <label className="label mt-4 block">
          Contractor notes
          <textarea
            className="input mt-1 min-h-20"
            value={sub.notes}
            onChange={(e) => patchSub({ notes: e.target.value })}
            placeholder="Access notes, gate codes, payment terms, etc."
          />
        </label>
        {/* Equipment checklist (what the contractor brings; costs stay in the
            Equipment line items card so they keep flowing into the financials) */}
        <div className="mt-4 border-t border-limestone-200 pt-4">
          <h3 className="text-xs font-bold uppercase tracking-wide text-charcoal-500">
            Equipment checklist — contractor brings
          </h3>
          <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {EQUIPMENT_CHECKLIST_ITEMS.map((k) => (
              <label
                key={k}
                className="flex cursor-pointer items-center gap-2 rounded-lg border border-limestone-200 bg-white px-3 py-2 text-sm"
              >
                <input
                  type="checkbox"
                  className="h-4 w-4"
                  checked={checklist.includes(k)}
                  onChange={() => toggleChecklist(k)}
                />
                {EQUIPMENT_CHECKLIST_LABELS[k]}
              </label>
            ))}
            <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-limestone-200 bg-white px-3 py-2 text-sm">
              <input
                type="checkbox"
                className="h-4 w-4"
                checked={customChecked}
                onChange={() => toggleChecklist(EQUIPMENT_CHECKLIST_CUSTOM_PREFIX)}
              />
              Other:
              <input
                className="input ml-1 flex-1"
                value={sub.equipment_checklist_custom}
                onChange={(e) =>
                  patchSub({ equipment_checklist_custom: e.target.value })
                }
                placeholder="e.g. Bobcat 330"
              />
            </label>
          </div>
        </div>
      </section>
      <LineItems
        title="Equipment"
        rows={equipment}
        nameKey="name"
        amountKey="cost"
        addLabel="Add equipment"
        onSave={(arr) => patchArray("equipment", arr)}
        total={equipTotal}
      />
      <LineItems
        title="Additional service charges"
        rows={charges}
        nameKey="description"
        amountKey="amount"
        addLabel="Add charge"
        onSave={(arr) => patchArray("service_charges", arr)}
        total={chargesTotal}
      />

      <section className="card mt-5">
        <h2 className="font-display text-xl font-bold text-forest-900">Internal costs</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <label className="label">
            Company management fee
            <input
              className="input mt-1"
              inputMode="decimal"
              value={String(lead.management_fee ?? "")}
              onChange={(e) => setLead({ ...lead, management_fee: e.target.value })}
              onBlur={(e) => save({ management_fee: e.target.value })}
            />
          </label>
          <label className="label">
            Fuel
            <input
              className="input mt-1"
              inputMode="decimal"
              value={String(lead.fuel ?? "")}
              onChange={(e) => setLead({ ...lead, fuel: e.target.value })}
              onBlur={(e) => save({ fuel: e.target.value })}
            />
          </label>
          <label className="label">
            Disposal
            <input
              className="input mt-1"
              inputMode="decimal"
              value={String(lead.disposal ?? "")}
              onChange={(e) => setLead({ ...lead, disposal: e.target.value })}
              onBlur={(e) => save({ disposal: e.target.value })}
            />
          </label>
          <label className="label">
            Payment processing cost
            <input
              className="input mt-1"
              inputMode="decimal"
              value={String(lead.payment_processing_cost ?? "")}
              onChange={(e) => setLead({ ...lead, payment_processing_cost: e.target.value })}
              onBlur={(e) => save({ payment_processing_cost: e.target.value })}
            />
          </label>
          <label className="label">
            Other internal cost
            <input
              className="input mt-1"
              inputMode="decimal"
              value={String(lead.other_internal_cost ?? "")}
              onChange={(e) => setLead({ ...lead, other_internal_cost: e.target.value })}
              onBlur={(e) => save({ other_internal_cost: e.target.value })}
            />
          </label>
        </div>
      </section>

      <section className="card mt-5">
        <h2 className="font-display text-xl font-bold text-forest-900">
          Profit summary (internal only)
        </h2>
        <p className="mt-1 text-sm text-charcoal-500">
          Admin-only — never rendered on customer-facing pages. Total internal
          cost is one sum (management fee included once); gross profit =
          customer total − total internal cost. Cents-safe integer math.
        </p>
        <div className="mt-5 grid gap-5 sm:grid-cols-3">
          <div className="rounded-lg bg-forest-50 p-4">
            <strong className="text-forest-900">Customer pricing</strong>
            <p>Estimate: {m(summary.estimate)}</p>
            <p>Additional charges: {m(summary.serviceCharges)}</p>
            <p className="mt-2 font-bold">Customer total: {m(summary.customerTotal)}</p>
          </div>
          <div className="rounded-lg bg-earth-100 p-4">
            <strong className="text-earth-800">Total internal cost</strong>
            <p>Contractor: {m(summary.contractorCost)}</p>
            <p>Equipment: {m(summary.equipmentCost)}</p>
            <p>Fuel: {m(summary.fuel)}</p>
            <p>Disposal: {m(summary.disposal)}</p>
            <p>Management fee: {m(summary.managementFee)}</p>
            <p>Payment processing: {m(summary.paymentProcessingCost)}</p>
            <p>Other internal: {m(summary.otherInternalCost)}</p>
            <p className="mt-2 font-bold">Total internal cost: {m(summary.totalInternalCost)}</p>
          </div>
          <div className="rounded-lg bg-limestone-100 p-4">
            <strong>Profit</strong>
            <p className="mt-3 font-bold text-forest-800">
              Gross profit: {m(summary.grossProfit)}
            </p>
            <p className="mt-1 font-bold text-forest-800">
              Margin:{" "}
              {summary.marginPercent === null
                ? "—"
                : `${summary.marginPercent.toFixed(1)}%`}
            </p>
          </div>
        </div>
      </section>

      <section className="card mt-5">
        <h2 className="font-display text-xl font-bold text-forest-900">Email History</h2>
        <div className="mt-3 space-y-2">
          {(Array.isArray(lead.email_history) ? lead.email_history : [])
            .slice()
            .reverse()
            .map((e: any) => (
              <div
                key={e.id}
                className="rounded border border-limestone-200 p-3 text-sm"
              >
                <div className="flex justify-between">
                  <strong>{e.subject}</strong>
                  <span className="rounded bg-forest-100 px-2 py-0.5">
                    {["customer-confirmation", "estimate-sent"].includes(e.type)
                      ? "Customer"
                      : "Internal"}
                  </span>
                  <span className="rounded bg-limestone-100 px-2 py-0.5">{e.status}</span>
                </div>
                <div className="mt-1 text-charcoal-500">
                  {e.recipient} · {new Date(e.sentAt).toLocaleString()} ·{" "}
                  {e.messageId || "No message ID"}
                </div>
              </div>
            ))}
        </div>
      </section>

      {groups.map(([title, keys]) => (
        <section key={title} className="card mt-5">
          <h2 className="font-display text-xl font-bold text-forest-900">{title}</h2>
          <dl className="mt-4 grid gap-x-6 gap-y-3 sm:grid-cols-2">
            {keys.map((k) => (
              <div key={k}>
                <dt className="text-xs font-semibold uppercase tracking-wide text-charcoal-500">
                  {label(k)}
                </dt>
                {k === "customer_email" ? (
                  <input
                    className="input mt-1"
                    defaultValue={String(lead[k] ?? "")}
                    onBlur={(e) => save({ customer_email: e.target.value })}
                  />
                ) : k === "notes" ? (
                  <textarea
                    className="input mt-1 min-h-24"
                    defaultValue={String(lead[k] ?? "")}
                    onBlur={(e) => save({ notes: e.target.value })}
                  />
                ) : (
                  <dd className="mt-1 whitespace-pre-wrap text-charcoal-800">
                    {k === "utm"
                      ? ["source", "medium", "campaign"]
                          .map((x) => `${x}: ${String((lead.utm as any)?.[x] ?? "—")}`)
                          .join(" · ")
                      : String(lead[k] ?? "—")}
                  </dd>
                )}
              </div>
            ))}
          </dl>
        </section>
      ))}

      <section className="card mt-5">
        <h2 className="font-display text-xl font-bold text-forest-900">Uploaded photos</h2>
        {photoUrls.length ? (
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {photoUrls.map((u) => (
              <img
                key={u}
                src={u}
                className="aspect-square rounded-lg object-cover"
                alt="Uploaded stump"
              />
            ))}
          </div>
        ) : (
          <p className="mt-3 text-charcoal-500">No photos uploaded.</p>
        )}
      </section>
    </div>
  );
}

/** One activity-log row: transition + timestamp + source badge. */
function ActivityRow({ entry }: { entry: StatusHistoryEntry }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="font-medium text-charcoal-800">
        {entry.note ??
          (entry.from === entry.to
            ? `New Lead created — ${STATUS_LABELS[entry.to]}`
            : `${STATUS_LABELS[entry.from]} → ${STATUS_LABELS[entry.to]}`)}
      </span>
      <span className="rounded bg-limestone-200 px-1.5 py-0.5 text-[11px] font-semibold text-charcoal-600">
        {entry.source}
      </span>
      <span className="text-xs text-charcoal-500">
        {new Date(entry.at).toLocaleString()}
      </span>
    </div>
  );
}

function LineItems({
  title,
  rows,
  nameKey,
  amountKey,
  addLabel,
  onSave,
  total,
}: {
  title: string;
  rows: Array<any>;
  nameKey: string;
  amountKey: string;
  addLabel: string;
  onSave: (r: any[]) => void;
  total: number;
}) {
  const [items, setItems] = useState(rows);
  useEffect(() => setItems(rows), [rows.length]);
  const update = (i: number, k: string, v: string) =>
    setItems(items.map((x, j) => (j === i ? { ...x, [k]: v } : x)));
  return (
    <section className="card mt-5">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-xl font-bold text-forest-900">{title}</h2>
        <button
          className="btn-secondary px-3 py-1.5 text-sm"
          onClick={() =>
            setItems([...items, { id: crypto.randomUUID(), [nameKey]: "", [amountKey]: "" }])
          }
        >
          + {addLabel}
        </button>
      </div>
      <div className="mt-4 space-y-3">
        {items.map((x, i) => (
          <div className="flex gap-2" key={x.id}>
            <input
              className="input"
              placeholder={nameKey === "name" ? "Equipment name" : "Description"}
              value={x[nameKey]}
              onChange={(e) => update(i, nameKey, e.target.value)}
              onBlur={() => onSave(items)}
            />
            <input
              className="input max-w-40"
              placeholder="Cost"
              inputMode="decimal"
              value={x[amountKey]}
              onChange={(e) => update(i, amountKey, e.target.value)}
              onBlur={() => onSave(items)}
            />
            <button
              className="text-sm text-red-700"
              onClick={() => {
                const next = items.filter((_, j) => j !== i);
                setItems(next);
                onSave(next);
              }}
            >
              Remove
            </button>
          </div>
        ))}
      </div>
      <p className="mt-3 text-right text-sm font-semibold">Total: {fmt(total)}</p>
    </section>
  );
}
