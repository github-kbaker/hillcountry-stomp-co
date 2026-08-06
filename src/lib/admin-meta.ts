/**
 * Admin dashboard shared constants and types — CLIENT-SAFE module.
 *
 * This file must never import anything server-only (no node:* modules, no
 * database, no crypto): client components import these constants and types
 * directly, and anything server-only here would be pulled into the client
 * bundle and break the build. The server functions themselves live in
 * src/lib/admin.ts (which imports the constants from here).
 *
 * STATUS MODEL (stage D2 — owner's canonical pipeline):
 * The happy-path pipeline is exactly 8 ordered stages:
 *   new → estimate-sent → estimate-accepted → deposit-paid → scheduled →
 *   in-progress → completed → invoice-paid
 * `cancelled` is a terminal status OUTSIDE the 8-stage timeline: it stays a
 * valid LeadStatus value so existing cancelled leads survive, but it is not
 * part of the ordered progression. Legacy statuses from the pre-D2 model map
 * into this model via LEGACY_STATUS_MAP (see migrate-status-history script).
 */

export const LEAD_STATUS_STAGES = [
  "new",
  "estimate-sent",
  "estimate-accepted",
  "deposit-paid",
  "scheduled",
  "in-progress",
  "completed",
  "invoice-paid",
] as const;
export type LeadStatusStage = (typeof LEAD_STATUS_STAGES)[number];

/** All allowed status values: the 8-stage timeline plus the terminal cancelled. */
export const LEAD_STATUSES = [...LEAD_STATUS_STAGES, "cancelled"] as const;
export type LeadStatus = (typeof LEAD_STATUSES)[number];

/** Owner-specified display labels. */
export const STATUS_LABELS: Record<LeadStatus, string> = {
  new: "New Lead",
  "estimate-sent": "Estimate Sent",
  "estimate-accepted": "Estimate Accepted",
  "deposit-paid": "Deposit Paid",
  scheduled: "Scheduled",
  "in-progress": "In Progress",
  completed: "Completed",
  "invoice-paid": "Invoice Paid",
  cancelled: "Cancelled",
};

/**
 * Legacy (pre-D2) status → canonical status mapping. Every legacy value maps
 * cleanly with no conflicts; the migration script (scripts/migrate-status-history.ts)
 * and read-time normalization (toLeadRow / getLead) both use this.
 */
export const LEGACY_STATUS_MAP: Record<string, LeadStatus> = {
  new: "new",
  "pending-estimate": "new",
  "estimate-sent": "estimate-sent",
  approved: "estimate-accepted",
  "deposit-pending": "estimate-accepted",
  "deposit-paid": "deposit-paid",
  scheduled: "scheduled",
  completed: "completed",
  "final-payment-pending": "completed",
  paid: "invoice-paid",
  cancelled: "cancelled",
};

/** Map any stored/legacy/unknown status string to a canonical LeadStatus. */
export function canonicalizeStatus(value: unknown): LeadStatus {
  const s = String(value ?? "");
  if ((LEAD_STATUSES as readonly string[]).includes(s)) return s as LeadStatus;
  if (s in LEGACY_STATUS_MAP) return LEGACY_STATUS_MAP[s];
  return "new";
}

/**
 * Position of a status in the 8-stage timeline (0-based). Returns -1 for
 * `cancelled` and any unknown value — those are outside the progression.
 */
export function statusStageIndex(status: LeadStatus | string): number {
  const idx = LEAD_STATUS_STAGES.indexOf(canonicalizeStatus(status) as LeadStatusStage);
  return idx;
}

/**
 * One recorded status transition. `from`/`to` are canonical statuses;
 * `source` is what triggered the transition ("admin", "customer-approval",
 * "estimate-email", "deposit", "system", ...). Stored as `status_history` on
 * the lead record, appended chronologically.
 */
export type StatusHistoryEntry = {
  at: string; // ISO timestamp
  from: LeadStatus;
  to: LeadStatus;
  source: string;
  note?: string; // optional human-readable detail (e.g. "Contractor assigned: X")
};

/**
 * Server-side transition rule applied by AUTOMATIC flows only (estimate
 * email success, customer approval, schedule save, mark buttons). Monotonic
 * along the 8-stage order: never moves a lead backward, never re-records an
 * unchanged status, never moves a cancelled lead back into the timeline, and
 * never lets an automatic flow set `cancelled`. Admin manual changes bypass
 * this (applyAdminStatusChange) — the admin status <select> may still move a
 * lead to any allowed status.
 *
 * Mutates `payload` in place: sets `payload.status` (canonical) and appends a
 * `status_history` entry when a transition happens. Returns true when a
 * transition was applied.
 */
export function applyStatusTransition(
  payload: Record<string, unknown>,
  to: LeadStatus,
  source: string,
): boolean {
  const from = canonicalizeStatus(payload.status);
  const target = canonicalizeStatus(to);
  if (from === "cancelled") return false; // terminal — automatic flows stop here
  if (target === "cancelled") return false; // automatic flows never cancel
  const fromIdx = statusStageIndex(from);
  const toIdx = statusStageIndex(target);
  if (toIdx < 0 || toIdx <= fromIdx) return false; // backward or no-op
  payload.status = target;
  const history = Array.isArray(payload.status_history)
    ? (payload.status_history as StatusHistoryEntry[])
    : [];
  history.push({ at: new Date().toISOString(), from, to: target, source });
  payload.status_history = history;
  return true;
}

/**
 * Admin manual status change (the pipeline <select> + Save). Records a
 * status_history entry with source "admin" for ANY status change — including
 * backward moves and to/from cancelled — but skips no-ops. Mutates `payload`
 * in place. Returns true when a change was applied.
 */
export function applyAdminStatusChange(
  payload: Record<string, unknown>,
  to: LeadStatus,
): boolean {
  const from = canonicalizeStatus(payload.status);
  const target = canonicalizeStatus(to);
  if (from === target) return false;
  payload.status = target;
  const history = Array.isArray(payload.status_history)
    ? (payload.status_history as StatusHistoryEntry[])
    : [];
  history.push({ at: new Date().toISOString(), from, to: target, source: "admin" });
  payload.status_history = history;
  return true;
}

/**
 * Timestamp at which a timeline stage was reached, for the timeline UI.
 * - "new" → the lead's created_at.
 * - later stages → the last status_history entry whose `to` is that stage.
 * Returns null when not derivable (stage not reached or no recorded entry).
 */
export function stageReachedAt(
  history: StatusHistoryEntry[] | undefined,
  stage: LeadStatusStage,
  created_at: string | undefined,
): string | null {
  if (stage === "new") return created_at ?? null;
  const entries = Array.isArray(history) ? history : [];
  for (let i = entries.length - 1; i >= 0; i--) {
    if (entries[i].to === stage) return entries[i].at;
  }
  return null;
}

/**
 * Next recommended action hint, derived from the canonical stage. Shared by
 * the lead detail page (and usable server-side); no per-page duplicated logic.
 */
export function nextRecommendedAction(status: LeadStatus | string): string {
  switch (canonicalizeStatus(status)) {
    case "new":
      return "Prepare and send the estimate.";
    case "estimate-sent":
      return "Wait for the customer to approve — or follow up by phone.";
    case "estimate-accepted":
      return "Collect the deposit — send a deposit invoice or request payment.";
    case "deposit-paid":
      return "Schedule the job — set a service date and arrival time.";
    case "scheduled":
      return "Mark In Progress on the service day.";
    case "in-progress":
      return "Mark Complete when the job is finished.";
    case "completed":
      return "Collect the balance — mark Invoice Paid once payment clears.";
    case "invoice-paid":
      return "Job fully paid — nothing left to do.";
    case "cancelled":
      return "Lead cancelled — no further action.";
  }
}

export const LEAD_SOURCES = [
  "Google Business Profile",
  "Google Search",
  "Google Ads",
  "Facebook",
  "Nextdoor",
  "Tree Company",
  "Landscaper",
  "Builder",
  "Referral",
  "Direct",
  "Contractor",
  "Other",
] as const;
export type LeadSource = (typeof LEAD_SOURCES)[number];

export const DEFAULT_LEAD_STATUS: LeadStatus = "new";

/** One row in the dashboard list — a lean, display-ready summary of a lead. */
export type JobSchedule = { service_date: string | null; arrival_time: string | null; estimated_duration_hours: string | null };
/**
 * Subcontractor record (stage D4). All fields optional-safe: legacy leads that
 * predate a field simply read as the default via normalizeSubcontractor().
 * Equipment checklist is a string[] of checked item keys; the custom "other"
 * item is stored as "custom:<label>" (or "custom" with no label), with the
 * free-text label kept separately in equipment_checklist_custom so it survives
 * toggling.
 */
export type Subcontractor = {
  name: string;
  contact_person: string;
  phone: string;
  email: string;
  service_area: string;
  insurance_verified: boolean;
  insurance_expiration: string | null; // yyyy-mm-dd (optional)
  crew_size: string;
  payout_status: "unpaid" | "paid" | null;
  payout_paid_at: string | null;
  payout_method: string; // Check | Venmo | Zelle | Cash | ACH | ""
  notes: string;
  equipment_checklist: string[];
  equipment_checklist_custom: string;
  assigned_at: string | null; // first "Assign Contractor" timestamp
};

/** Standard equipment-checklist items (keys) for the subcontractor card. */
export const EQUIPMENT_CHECKLIST_ITEMS = [
  "grinder",
  "trailer",
  "chainsaw",
  "mini skid steer",
  "rake",
  "safety gear",
] as const;
/** Display labels for the standard checklist items. */
export const EQUIPMENT_CHECKLIST_LABELS: Record<string, string> = {
  grinder: "Stump grinder",
  trailer: "Trailer",
  chainsaw: "Chainsaw",
  "mini skid steer": "Mini skid steer",
  rake: "Rake / cleanup tools",
  "safety gear": "Safety gear (PPE)",
};
/** Prefix used inside equipment_checklist for the checked custom item. */
export const EQUIPMENT_CHECKLIST_CUSTOM_PREFIX = "custom";

/**
 * Normalize any stored subcontractor value (including legacy shapes and null)
 * into the full D4 Subcontractor shape. Returns null when the record has no
 * subcontractor at all. Used server-side on every save (recomputeJobFinancials)
 * and by the dry-run migration report.
 */
export function normalizeSubcontractor(sub: unknown): Subcontractor | null {
  if (!sub || typeof sub !== "object") return null;
  const s = sub as Record<string, unknown>;
  return {
    name: String(s.name ?? ""),
    contact_person: String(s.contact_person ?? ""),
    phone: String(s.phone ?? ""),
    email: String(s.email ?? ""),
    service_area: String(s.service_area ?? ""),
    insurance_verified: s.insurance_verified === true || s.insurance_verified === "true",
    insurance_expiration: s.insurance_expiration ? String(s.insurance_expiration) : null,
    crew_size: String(s.crew_size ?? ""),
    payout_status: s.payout_status === "paid" ? "paid" : "unpaid",
    payout_paid_at: s.payout_paid_at ? String(s.payout_paid_at) : null,
    payout_method: String(s.payout_method ?? ""),
    notes: String(s.notes ?? ""),
    equipment_checklist: Array.isArray(s.equipment_checklist)
      ? s.equipment_checklist.map(String)
      : [],
    equipment_checklist_custom: String(s.equipment_checklist_custom ?? ""),
    assigned_at: s.assigned_at ? String(s.assigned_at) : null,
  };
}
export type EquipmentItem = { id: string; name: string; cost: string };
export type ServiceCharge = { id: string; description: string; amount: string };

export type LeadRow = {
  id: string;
  kind: string;
  status: LeadStatus;
  name: string;
  phone: string;
  email: string;
  customer_email?: string;
  city: string;
  lead_source: string;
  utm: { source: string; medium: string; campaign: string };
  created_at: string;
  num_stumps: string;
  email_status?: { status?: string; recipient?: string; subject?: string; messageId?: string | null; error?: string | null; retryCount?: number; sentAt?: string | null; lastAttemptAt?: string | null };
  schedule?: JobSchedule | null;
  customer_total?: string;
};

export type LeadListResult = {
  leads: LeadRow[];
  counts: Record<LeadStatus, number>;
  total: number;
};

export type LeadDetail = Record<string, unknown> & {
  id: string;
  schedule?: JobSchedule | null;
  subcontractor?: Subcontractor | null;
  contractor_cost?: string | null;
  equipment?: EquipmentItem[];
  service_charges?: ServiceCharge[];
  management_fee?: string | null;
  fuel?: string | null;
  disposal?: string | null;
  payment_processing_cost?: string | null;
  other_internal_cost?: string | null;
  customer_total?: string;
  costs_total?: string;
  profit?: string;
  kind: string;
  status: LeadStatus;
  created_at: string;
  photos: string[];
  status_history?: StatusHistoryEntry[];
  email_history?: Array<{
    id: string;
    subject: string;
    recipient: string;
    status?: string;
    messageId?: string;
    error?: string;
    retryCount?: number;
    event?: string;
    sentAt?: string;
    type?: string;
  }>;
};

/* ------------------------------------------------------------------ */
/* Stage D4 — cents-safe profit summary (CLIENT-SAFE)                 */
/* ------------------------------------------------------------------ */

/** Parse any money-ish input ("350", "75.00", "$1,234.56") into integer cents. */
export function parseCents(v: unknown): number {
  const n = Number(String(v ?? "").replace(/[$,]/g, ""));
  return Number.isFinite(n) ? Math.round(n * 100) : 0;
}

/** Format integer cents as "$-less" money "1234.56" (matches existing money()). */
export function moneyFromCents(c: number): string {
  return ((Number.isFinite(c) ? c : 0) / 100).toFixed(2);
}

/**
 * The internal-only profit summary. Everything is integer cents — no float
 * money math anywhere. Management fee is included EXACTLY ONCE (inside
 * totalInternalCost); gross profit = customer total − total internal cost,
 * so the fee is never double-subtracted. Margin % = gross profit / customer
 * total when the denominator is > 0, else null (renders as "—").
 */
export type ProfitSummary = {
  estimate: number; // cents
  serviceCharges: number; // cents
  customerTotal: number; // cents (estimate + additional service charges)
  contractorCost: number; // cents
  equipmentCost: number; // cents
  fuel: number; // cents
  disposal: number; // cents
  managementFee: number; // cents
  paymentProcessingCost: number; // cents
  otherInternalCost: number; // cents
  totalInternalCost: number; // cents — the ONE sum of all internal costs
  grossProfit: number; // cents
  marginPercent: number | null; // 0–100, null when customerTotal <= 0
};

export function computeProfitSummary(lead: Record<string, unknown>): ProfitSummary {
  const charges = Array.isArray(lead.service_charges)
    ? (lead.service_charges as Array<Record<string, unknown>>)
    : [];
  const equipment = Array.isArray(lead.equipment)
    ? (lead.equipment as Array<Record<string, unknown>>)
    : [];
  const estimate = parseCents(lead.estimate);
  const serviceCharges = charges.reduce((s, x) => s + parseCents(x.amount), 0);
  const customerTotal = estimate + serviceCharges;
  const contractorCost = parseCents(lead.contractor_cost);
  const equipmentCost = equipment.reduce((s, x) => s + parseCents(x.cost), 0);
  const fuel = parseCents(lead.fuel);
  const disposal = parseCents(lead.disposal);
  const managementFee = parseCents(lead.management_fee);
  const paymentProcessingCost = parseCents(lead.payment_processing_cost);
  const otherInternalCost = parseCents(lead.other_internal_cost);
  const totalInternalCost =
    contractorCost +
    equipmentCost +
    fuel +
    disposal +
    managementFee +
    paymentProcessingCost +
    otherInternalCost;
  const grossProfit = customerTotal - totalInternalCost;
  const marginPercent = customerTotal > 0 ? (grossProfit / customerTotal) * 100 : null;
  return {
    estimate,
    serviceCharges,
    customerTotal,
    contractorCost,
    equipmentCost,
    fuel,
    disposal,
    managementFee,
    paymentProcessingCost,
    otherInternalCost,
    totalInternalCost,
    grossProfit,
    marginPercent,
  };
}
