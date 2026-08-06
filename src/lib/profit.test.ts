import { describe, expect, test } from "bun:test";
import {
  computeProfitSummary,
  normalizeSubcontractor,
  parseCents,
  moneyFromCents,
} from "./admin-meta";

/**
 * Stage D4 — profit-summary math. All money is integer cents; management fee
 * is included exactly once; margin % uses customer total as the denominator
 * and is null when the denominator is 0.
 */

/** The owner fixture (Michonne Baker): estimate 350.00, deposit 75.00, balance 275.00. */
const MICHONNE: Record<string, unknown> = {
  estimate: "350",
  deposit: "75.00",
  service_charges: [],
  equipment: [],
  contractor_cost: "",
  fuel: null,
  disposal: null,
  management_fee: "",
  payment_processing_cost: null,
  other_internal_cost: null,
};

describe("computeProfitSummary — Michonne Baker fixture (estimate 350.00, deposit 75.00, balance 275.00)", () => {
  test("empty costs → gross profit 350.00, margin 100%", () => {
    const s = computeProfitSummary(MICHONNE);
    expect(s.estimate).toBe(35000);
    expect(s.serviceCharges).toBe(0);
    expect(s.customerTotal).toBe(35000);
    expect(s.totalInternalCost).toBe(0);
    expect(s.grossProfit).toBe(35000);
    expect(s.marginPercent).toBeCloseTo(100, 5);
  });

  test("full internal costs → one sum, correct profit and margin", () => {
    const s = computeProfitSummary({
      ...MICHONNE,
      contractor_cost: "200.00",
      equipment: [{ id: "e1", name: "Grinder", cost: "50.00" }],
      fuel: "20",
      disposal: "15",
      management_fee: "25.00",
      payment_processing_cost: "10.50",
      other_internal_cost: "5.00",
    });
    // total internal = 200 + 50 + 20 + 15 + 25 + 10.50 + 5 = 325.50
    expect(s.totalInternalCost).toBe(32550);
    expect(s.grossProfit).toBe(35000 - 32550); // 24.50
    expect(moneyFromCents(s.grossProfit)).toBe("24.50");
    expect(s.marginPercent).toBeCloseTo((24.5 / 350) * 100, 5); // 7.0%
  });

  test("management fee is NOT double-subtracted", () => {
    // If the fee were subtracted again in the profit line, grossProfit would
    // read 0 instead of 2000.
    const s = computeProfitSummary({
      estimate: "100.00",
      contractor_cost: "60.00",
      management_fee: "20.00",
    });
    expect(s.totalInternalCost).toBe(8000); // 60 + 20
    expect(s.grossProfit).toBe(2000); // 100 − 80 — fee counted once
    expect(s.marginPercent).toBe(20);
  });

  test("additional service charges add to customer total and margin denominator", () => {
    const s = computeProfitSummary({
      estimate: "100.00",
      service_charges: [
        { id: "s1", description: "Extra hauling", amount: "25.50" },
      ],
      contractor_cost: "75",
    });
    expect(s.customerTotal).toBe(12550);
    expect(s.grossProfit).toBe(12550 - 7500); // 50.50
    expect(s.marginPercent).toBeCloseTo((5050 / 12550) * 100, 5);
  });

  test("margin is null when customer total is 0 (no estimate)", () => {
    const s = computeProfitSummary({});
    expect(s.customerTotal).toBe(0);
    expect(s.grossProfit).toBe(0);
    expect(s.marginPercent).toBeNull();
  });

  test("negative/absent fields parse to zero, never NaN", () => {
    const s = computeProfitSummary({
      estimate: undefined,
      contractor_cost: "abc",
      fuel: "$5",
      disposal: "0.1",
    });
    expect(s.estimate).toBe(0);
    expect(s.contractorCost).toBe(0);
    expect(s.fuel).toBe(500);
    expect(s.disposal).toBe(10);
    expect(Number.isNaN(s.totalInternalCost)).toBe(false);
    expect(s.marginPercent).toBeNull();
  });
});

describe("parseCents / moneyFromCents — no float money math", () => {
  test("strings and dollar amounts", () => {
    expect(parseCents("350")).toBe(35000);
    expect(parseCents("75.00")).toBe(7500);
    expect(parseCents("$1,234.56")).toBe(123456);
    expect(parseCents(" 10.50 ")).toBe(1050);
    expect(parseCents("0.1")).toBe(10); // 0.1*100=10.000…2 → rounds to 10
    expect(parseCents(0.1)).toBe(10);
  });
  test("empty / garbage / missing → 0", () => {
    expect(parseCents("")).toBe(0);
    expect(parseCents(null)).toBe(0);
    expect(parseCents(undefined)).toBe(0);
    expect(parseCents("abc")).toBe(0);
  });
  test("rounding is to the nearest cent", () => {
    expect(parseCents("1.006")).toBe(101); // rounds up
    expect(parseCents("1.004")).toBe(100); // rounds down
    expect(parseCents("12.345")).toBe(1235);
  });
  test("moneyFromCents round-trips", () => {
    expect(moneyFromCents(123456)).toBe("1234.56");
    expect(moneyFromCents(0)).toBe("0.00");
    expect(moneyFromCents(-500)).toBe("-5.00");
  });
});

describe("normalizeSubcontractor — legacy shapes load with defaults", () => {
  test("legacy D1/D2 shape → full D4 shape with defaults", () => {
    const n = normalizeSubcontractor({
      name: "Juan's Stump Works",
      phone: "830-555-0100",
      email: "juan@example.com",
      payout_status: "paid",
      payout_paid_at: "2026-08-01T12:00:00.000Z",
    });
    expect(n).toEqual({
      name: "Juan's Stump Works",
      contact_person: "",
      phone: "830-555-0100",
      email: "juan@example.com",
      service_area: "",
      insurance_verified: false,
      insurance_expiration: null,
      crew_size: "",
      payout_status: "paid",
      payout_paid_at: "2026-08-01T12:00:00.000Z",
      payout_method: "",
      notes: "",
      equipment_checklist: [],
      equipment_checklist_custom: "",
      assigned_at: null,
    });
  });

  test("null / missing subcontractor → null (legacy leads keep working)", () => {
    expect(normalizeSubcontractor(null)).toBeNull();
    expect(normalizeSubcontractor(undefined)).toBeNull();
    expect(normalizeSubcontractor("nope")).toBeNull();
  });

  test("boolean and string 'true' insurance both normalize to true", () => {
    expect(normalizeSubcontractor({ insurance_verified: true })?.insurance_verified).toBe(true);
    expect(normalizeSubcontractor({ insurance_verified: "true" })?.insurance_verified).toBe(true);
    expect(normalizeSubcontractor({})?.insurance_verified).toBe(false);
  });

  test("equipment checklist array is preserved (strings coerced)", () => {
    const n = normalizeSubcontractor({
      equipment_checklist: ["grinder", "custom:Bobcat 330"],
      equipment_checklist_custom: "Bobcat 330",
    });
    expect(n?.equipment_checklist).toEqual(["grinder", "custom:Bobcat 330"]);
    expect(n?.equipment_checklist_custom).toBe("Bobcat 330");
  });
});
