/**
 * Work-order email content for assigned subcontractors — CLIENT-SAFE module.
 *
 * The work order must contain ONLY what the contractor needs to do the job:
 * customer name, service address/city, service date/arrival/duration, stump
 * count/details, the equipment checklist, and notes. It must NEVER include
 * payment details beyond necessary — no estimate/deposit/balance, no
 * contractor cost, no payout amounts, no management fee, no profit, and no
 * other internal financials. The unit tests (work-order.test.ts) enforce this.
 *
 * This module imports nothing server-only so the tests can run it directly.
 */
import {
  EQUIPMENT_CHECKLIST_LABELS,
  EQUIPMENT_CHECKLIST_CUSTOM_PREFIX,
} from "./admin-meta";
import type { JobSchedule, Subcontractor } from "./admin-meta";

export type WorkOrderLeadInput = {
  id?: unknown;
  name?: unknown;
  contact_name?: unknown;
  company?: unknown;
  phone?: unknown;
  address?: unknown;
  city?: unknown;
  num_stumps?: unknown;
  diameter?: unknown;
  species?: unknown;
  grind_depth?: unknown;
  cleanup?: unknown;
  notes?: unknown;
  schedule?: JobSchedule | null;
  subcontractor?: Subcontractor | null;
};

const str = (v: unknown) => String(v ?? "").trim();

/** Friendly date for "2026-08-20" → "Aug 20, 2026" (deterministic, no TZ). */
export function friendlyServiceDate(value: unknown): string {
  const raw = str(value);
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(raw);
  if (!m) return raw || "—";
  const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const month = MONTHS[Number(m[2]) - 1] ?? m[2];
  return `${month} ${Number(m[3])}, ${m[1]}`;
}

/**
 * Display strings for the checked equipment-checklist items. The custom item
 * is stored as "custom:<label>" (or "custom") and rendered with its label.
 */
export function checkedEquipmentList(sub: Subcontractor | null | undefined): string[] {
  const keys = Array.isArray(sub?.equipment_checklist) ? sub.equipment_checklist : [];
  const customLabel = str(sub?.equipment_checklist_custom);
  return keys.map((k) => {
    if (k === EQUIPMENT_CHECKLIST_CUSTOM_PREFIX) {
      return customLabel ? `Other: ${customLabel}` : "Other";
    }
    if (k.startsWith(`${EQUIPMENT_CHECKLIST_CUSTOM_PREFIX}:`)) {
      const label = str(k.slice(EQUIPMENT_CHECKLIST_CUSTOM_PREFIX.length + 1)) || customLabel;
      return label ? `Other: ${label}` : "Other";
    }
    return EQUIPMENT_CHECKLIST_LABELS[k] ?? k;
  });
}

/** Job facts rows for the email body — no financial values anywhere. */
function jobRows(lead: WorkOrderLeadInput): Array<[string, string]> {
  const rows: Array<[string, string]> = [];
  const customer =
    str(lead.name) || str(lead.contact_name) || str(lead.company) || "Customer";
  rows.push(["Customer", customer]);
  const address = str(lead.address);
  const city = str(lead.city);
  if (address) rows.push(["Service address", city ? `${address}, ${city}` : address]);
  else if (city) rows.push(["Service city", city]);
  if (str(lead.phone)) rows.push(["Customer phone", str(lead.phone)]);
  const schedule = lead.schedule ?? null;
  if (str(schedule?.service_date)) {
    rows.push(["Service date", friendlyServiceDate(schedule?.service_date)]);
  }
  if (str(schedule?.arrival_time)) rows.push(["Arrival time", str(schedule?.arrival_time)]);
  if (str(schedule?.estimated_duration_hours)) {
    rows.push(["Estimated duration", `${str(schedule?.estimated_duration_hours)} hours`]);
  }
  const stumps = str(lead.num_stumps);
  if (stumps) {
    const diameter = str(lead.diameter);
    rows.push(["Stumps to grind", diameter ? `${stumps} (approx. ${diameter} diameter)` : stumps]);
  }
  if (str(lead.species)) rows.push(["Species", str(lead.species)]);
  if (str(lead.grind_depth)) rows.push(["Grind depth", str(lead.grind_depth)]);
  if (str(lead.cleanup)) rows.push(["Cleanup", str(lead.cleanup)]);
  return rows;
}

const esc = (v: unknown) =>
  String(v ?? "").replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c] as string,
  );

function rowsHtml(rows: Array<[string, string]>): string {
  return rows
    .map(
      ([k, v]) =>
        `<tr><td style="padding:6px 14px 6px 0;vertical-align:top;color:#666;white-space:nowrap"><strong>${esc(k)}</strong></td><td style="padding:6px 0;vertical-align:top">${esc(v)}</td></tr>`,
    )
    .join("");
}

function rowsText(rows: Array<[string, string]>): string {
  const width = Math.max(...rows.map(([k]) => k.length), 0);
  return rows.map(([k, v]) => `${k.padEnd(width)}  ${v}`).join("\n");
}

export function buildWorkOrderHtml(lead: WorkOrderLeadInput): string {
  const sub = lead.subcontractor ?? null;
  const checklist = checkedEquipmentList(sub);
  const notes = str(lead.notes);
  const ref = str(lead.id).slice(0, 8);
  const equipmentHtml =
    checklist.length === 0
      ? '<p style="color:#666">None specified — confirm with the office before the job.</p>'
      : `<ul style="margin:0;padding-left:18px">${checklist
          .map((c) => `<li>${esc(c)}</li>`)
          .join("")}</ul>`;
  return `<div style="font-family:Arial,Helvetica,sans-serif;color:#222">
<div style="background:#235b3a;color:#fff;padding:24px 28px">
<strong style="font-size:20px">Hill Country Stump Co. — Work Order</strong><br/>
<span style="font-size:12px">${ref ? `Reference ${esc(ref)}` : ""}</span>
</div>
<div style="padding:28px">
<table style="border-collapse:collapse;font-size:13px">${rowsHtml(jobRows(lead))}</table>
<h3 style="margin:24px 0 8px;font-size:14px">Equipment to bring</h3>
${equipmentHtml}
${notes ? `<h3 style="margin:24px 0 8px;font-size:14px">Job notes</h3><p style="font-size:13px;color:#333;white-space:pre-wrap">${esc(notes)}</p>` : ""}
<p style="margin-top:28px;font-size:12px;color:#777">Questions about this work order? Contact the office before the service date.</p>
</div>
<footer style="color:#777;padding:16px 28px;font-size:11px">Hill Country Stump Co. · hello@hillcountrystumpco.com</footer>
</div>`;
}

export function buildWorkOrderText(lead: WorkOrderLeadInput): string {
  const sub = lead.subcontractor ?? null;
  const checklist = checkedEquipmentList(sub);
  const ref = str(lead.id).slice(0, 8);
  const lines = [
    "Hill Country Stump Co. — WORK ORDER",
    ref ? `Reference: ${ref}` : "",
    "",
    rowsText(jobRows(lead)),
    "",
    "EQUIPMENT TO BRING",
    checklist.length === 0 ? "None specified — confirm with the office before the job." : checklist.map((c) => `- ${c}`).join("\n"),
  ];
  if (str(lead.notes)) lines.push("", "JOB NOTES", str(lead.notes));
  lines.push(
    "",
    "Questions about this work order? Contact the office before the service date.",
    "",
    "Hill Country Stump Co. · hello@hillcountrystumpco.com",
  );
  return lines.filter((l) => l !== "").join("\n");
}
