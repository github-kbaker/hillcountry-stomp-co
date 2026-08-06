/**
 * One-time lead status migration — stage D2 (customer status timeline).
 *
 * Maps every lead's stored status onto the canonical 8-stage model and
 * backfills a `status_history` array (activity log) with derivable entries:
 *   - new                → { at: created_at, from: new, to: new, source: "system" }
 *   - estimate-sent      → timestamp from the latest estimate-sent email entry
 *   - estimate-accepted  → timestamp from approved_at (falls back to the
 *                          estimate-sent entry, then created_at)
 *   - later stages       → per-stage *_at fields when present, else the
 *                          previous entry's timestamp (carried forward so the
 *                          timeline stays ordered), source "system"
 *
 * IDEMPOTENT: leads that already have a non-empty status_history are only
 * normalized (status rewritten to canonical) — no new entries are added.
 *
 * SAFE BY DEFAULT — dry-run only. Pass --apply to write:
 *   bun run scripts/migrate-status-history.ts            # dry run (report)
 *   bun run scripts/migrate-status-history.ts --apply    # write files
 *
 * Runs against the file store (data/leads/*.json). DATABASE_URL/Neon is not
 * wired yet; when it is, extend this script to also update the DB payloads.
 */
import { mkdir, readdir, readFile, rename, writeFile } from "node:fs/promises";
import { join } from "node:path";
import {
  LEAD_STATUS_STAGES,
  LEGACY_STATUS_MAP,
  STATUS_LABELS,
  canonicalizeStatus,
  statusStageIndex,
} from "../src/lib/admin-meta";
import type { LeadStatus, StatusHistoryEntry } from "../src/lib/admin-meta";

const APPLY = process.argv.includes("--apply");
const LEADS_DIR = join(process.cwd(), "data", "leads");

type ReportRow = {
  id: string;
  name: string;
  oldStatus: string;
  newStatus: LeadStatus;
  historyAdded: number;
  notes: string[];
};

/** Best-derivable ISO timestamp for a stage, walking known sources. */
function deriveTimestamp(
  payload: Record<string, unknown>,
  stage: LeadStatus,
  fallback: string,
  lastTs: string,
): string {
  if (stage === "new") return String(payload.created_at ?? fallback);
  if (stage === "estimate-sent") {
    const history = Array.isArray(payload.email_history)
      ? (payload.email_history as Array<Record<string, unknown>>)
      : [];
    for (let i = history.length - 1; i >= 0; i--) {
      if (history[i].type === "estimate-sent" && history[i].sentAt) {
        return String(history[i].sentAt);
      }
    }
  }
  if (stage === "estimate-accepted" && payload.approved_at) {
    return String(payload.approved_at);
  }
  // Legacy *_at fields that D3+ stages may have stamped; carry forward otherwise.
  const field = {
    "deposit-paid": "deposit_paid_at",
    scheduled: "scheduled_at",
    "in-progress": "in_progress_at",
    completed: "completed_at",
    "invoice-paid": "paid_at",
  }[stage];
  if (field && payload[field]) return String(payload[field]);
  return lastTs;
}

async function main() {
  await mkdir(LEADS_DIR, { recursive: true });
  const files = (await readdir(LEADS_DIR)).filter((f) => f.endsWith(".json")).sort();
  const report: ReportRow[] = [];
  let changed = 0;

  for (const file of files) {
    const path = join(LEADS_DIR, file);
    const payload = JSON.parse(await readFile(path, "utf8")) as Record<string, unknown>;
    const id = String(payload.id ?? file.replace(/\.json$/, ""));
    const name = String(payload.name ?? payload.company ?? payload.contact_name ?? "—");
    const rawStatus = payload.status === undefined ? "" : String(payload.status);
    const newStatus = canonicalizeStatus(rawStatus);
    const notes: string[] = [];
    const history = Array.isArray(payload.status_history)
      ? (payload.status_history as StatusHistoryEntry[])
      : [];

    let historyAdded = 0;
    if (history.length === 0) {
      // Backfill the chain up to the lead's current canonical stage as real
      // transitions: [new→new (created), new→estimate-sent, ...].
      const targetIdx = statusStageIndex(newStatus);
      const entries: StatusHistoryEntry[] = [];
      let lastTs = String(payload.created_at ?? new Date().toISOString());
      if (targetIdx >= 0) {
        entries.push({ at: lastTs, from: "new", to: "new", source: "system" });
        for (let i = 1; i <= targetIdx; i++) {
          const from = LEAD_STATUS_STAGES[i - 1];
          const to = LEAD_STATUS_STAGES[i];
          const at = deriveTimestamp(payload, to, lastTs, lastTs);
          const source =
            to === "estimate-sent"
              ? "estimate-email"
              : to === "estimate-accepted"
                ? "customer-approval"
                : "system";
          entries.push({ at, from, to, source });
          lastTs = at;
        }
        payload.status_history = entries;
        historyAdded = entries.length;
      }
      if (entries.length === 0) {
        notes.push("no timeline target (cancelled/unknown) — history left empty");
      }
    } else {
      notes.push("status_history already present — left intact");
    }

    if (rawStatus && rawStatus !== newStatus) {
      notes.push(`status rewritten: ${rawStatus} → ${newStatus} (${STATUS_LABELS[newStatus]})`);
    } else if (!rawStatus) {
      notes.push(`no status field — normalized to ${newStatus}`);
    }
    payload.status = newStatus;

    if (APPLY && (historyAdded > 0 || String(payload.status) !== rawStatus)) {
      const target = join(LEADS_DIR, file);
      const temp = `${target}.tmp`;
      await writeFile(temp, JSON.stringify(payload, null, 2));
      await rename(temp, target);
      changed++;
    }
    report.push({ id: id.slice(0, 8), name: name.slice(0, 40), oldStatus: rawStatus || "(missing)", newStatus, historyAdded, notes });
  }

  // ---- Report ----
  console.log(`\n=== STATUS MIGRATION DRY-RUN REPORT${APPLY ? " (APPLIED)" : " (dry-run — no files written; add --apply to write)"} ===`);
  console.log(`Leads found: ${report.length}\n`);
  for (const r of report) {
    console.log(`• ${r.id}  ${r.name}`);
    console.log(`    old: ${r.oldStatus}  →  new: ${r.newStatus}`);
    console.log(`    status_history entries added: ${r.historyAdded}`);
    for (const note of r.notes) console.log(`    note: ${note}`);
  }
  console.log(`\nLeads rewritten: ${changed}`);
  console.log("Mapping used (legacy → canonical):");
  for (const [k, v] of Object.entries(LEGACY_STATUS_MAP)) {
    console.log(`    ${k} → ${v}`);
  }
}

main().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
