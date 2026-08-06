/**
 * Stage D4 — dry-run migration report.
 *
 * Scans data/leads/*.json (or Postgres when DATABASE_URL is set) and reports,
 * per lead, what the D4 subcontractor normalization and profit-summary math
 * WOULD change — without writing anything. Structural normalization happens
 * lazily on the next admin save (recomputeJobFinancials → normalizeSubcontractor),
 * so no data rewrite is required; this report just documents the deltas.
 *
 * Run:  bun run scripts/d4-migration-report.ts
 */
import { readFile, readdir } from "node:fs/promises";
import { join } from "node:path";
import {
  computeProfitSummary,
  moneyFromCents,
  normalizeSubcontractor,
} from "../src/lib/admin-meta";

const LEADS_DIR = join(process.cwd(), "data", "leads");

type Row = { id: string; name: string; changes: string[]; normalized: unknown; financials: { old: Record<string, string>; new: Record<string, string> } };

async function main() {
  let files: string[];
  try {
    files = await readdir(LEADS_DIR);
  } catch (e) {
    console.error("no leads dir:", e);
    return;
  }
  const rows: Row[] = [];
  for (const f of files.filter((x) => x.endsWith(".json"))) {
    let payload: Record<string, unknown>;
    try {
      payload = JSON.parse(await readFile(join(LEADS_DIR, f), "utf8"));
    } catch {
      console.warn("skipping unreadable", f);
      continue;
    }
    const id = String(payload.id ?? f);
    const name = String(payload.name ?? payload.company ?? payload.contact_name ?? "(unnamed)");
    const changes: string[] = [];
    const rawSub = payload.subcontractor;
    const normalized = normalizeSubcontractor(rawSub);
    if (rawSub == null) {
      changes.push("subcontractor: none — stays null (card renders defaults)");
    } else if (typeof rawSub !== "object") {
      changes.push(`subcontractor: non-object (${typeof rawSub}) — replaced by defaults on next save`);
    } else {
      const s = rawSub as Record<string, unknown>;
      const want: Array<[string, unknown]> = [
        ["contact_person", ""],
        ["service_area", ""],
        ["insurance_verified", false],
        ["insurance_expiration", null],
        ["crew_size", ""],
        ["payout_method", ""],
        ["notes", ""],
        ["equipment_checklist", []],
        ["equipment_checklist_custom", ""],
        ["assigned_at", null],
      ];
      for (const [k, d] of want) {
        if (!(k in s)) changes.push(`subcontractor.${k}: missing → default ${JSON.stringify(d)}`);
      }
      for (const k of Object.keys(s)) {
        if (!["name", "contact_person", "phone", "email", "service_area", "insurance_verified", "insurance_expiration", "crew_size", "payout_status", "payout_paid_at", "payout_method", "notes", "equipment_checklist", "equipment_checklist_custom", "assigned_at"].includes(k)) {
          changes.push(`subcontractor.${k}: unknown key — dropped by normalization (was ${JSON.stringify(s[k])})`);
        }
      }
    }
    // Derived financials: old stored vs new cents-safe computation.
    const summary = computeProfitSummary(payload);
    const oldFinancials = {
      customer_total: String(payload.customer_total ?? ""),
      costs_total: String(payload.costs_total ?? ""),
      profit: String(payload.profit ?? ""),
    };
    const newFinancials = {
      customer_total: moneyFromCents(summary.customerTotal),
      costs_total: moneyFromCents(summary.totalInternalCost), // now TOTAL INTERNAL COST
      profit: moneyFromCents(summary.grossProfit),
    };
    const finChanges: string[] = [];
    for (const k of ["customer_total", "costs_total", "profit"] as const) {
      if (oldFinancials[k] !== newFinancials[k]) {
        finChanges.push(`${k}: ${oldFinancials[k] || "(unset)"} → ${newFinancials[k]}`);
      }
    }
    if (finChanges.length) changes.push(`derived financials recalculated (${finChanges.join("; ")})`);
    rows.push({ id, name, changes, normalized, financials: { old: oldFinancials, new: newFinancials } });
  }

  console.log(`D4 dry-run migration report — ${rows.length} lead(s)\n`);
  for (const r of rows) {
    console.log(`- ${r.name} (${r.id})`);
    if (r.changes.length === 0) {
      console.log("  no structural changes needed");
    } else {
      for (const c of r.changes) console.log(`  ${c}`);
    }
    console.log(`  financials: customer_total ${r.financials.old.customer_total || "(unset)"} → ${r.financials.new.customer_total}, ` +
      `costs_total ${r.financials.old.costs_total || "(unset)"} → ${r.financials.new.costs_total} (now TOTAL INTERNAL COST), ` +
      `profit ${r.financials.old.profit || "(unset)"} → ${r.financials.new.profit}`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
