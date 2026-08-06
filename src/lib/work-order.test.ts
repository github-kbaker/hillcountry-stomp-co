import { describe, expect, test } from "bun:test";
import {
  buildWorkOrderHtml,
  buildWorkOrderText,
  checkedEquipmentList,
  friendlyServiceDate,
} from "./work-order";
import type { WorkOrderLeadInput } from "./work-order";

/**
 * Stage D4 — work-order email content. The email must contain ONLY what the
 * contractor needs to do the job and NEVER any payment/internal financials
 * (estimate/deposit/balance, contractor cost, payout amounts, management fee,
 * profit, fuel/disposal costs, ...). These tests enforce the boundary.
 */

const MICHONNE: WorkOrderLeadInput = {
  id: "5fd30b9d-ca8d-4269-8a02-c051ca3743e4",
  name: "Michonne Baker",
  phone: "214-555-6683",
  address: "791 Eichen Strasse",
  city: "Fredericksburg",
  num_stumps: "1",
  diameter: "25in",
  species: "Oak",
  notes: "Leave chips on site. Gate code 1234.",
  schedule: {
    service_date: "2026-08-20",
    arrival_time: "08:00",
    estimated_duration_hours: "3",
  },
  subcontractor: {
    name: "Juan's Stump Works",
    contact_person: "Juan",
    phone: "830-555-0100",
    email: "juan@example.com",
    service_area: "Kerrville / Fredericksburg",
    insurance_verified: true,
    insurance_expiration: "2027-03-01",
    crew_size: "2",
    payout_status: "unpaid",
    payout_paid_at: null,
    payout_method: "Zelle",
    notes: "",
    equipment_checklist: ["grinder", "trailer", "custom:Bobcat 330"],
    equipment_checklist_custom: "Bobcat 330",
    assigned_at: "2026-08-06T12:00:00.000Z",
  },
};

/** A lead with every internal-financial field set to non-zero values. */
const FINANCIALLY_LOADED = {
  id: "abc123",
  name: "Rich Customer",
  address: "1 Money Ln",
  city: "Boerne",
  schedule: null,
  subcontractor: { ...(MICHONNE.subcontractor as NonNullable<WorkOrderLeadInput["subcontractor"]>), equipment_checklist: [], equipment_checklist_custom: "" },
  estimate: "9999.99",
  deposit: "5000",
  balance: "4999.99",
  contractor_cost: "8000",
  management_fee: "1000",
  fuel: "300",
  disposal: "200",
  payment_processing_cost: "150.50",
  other_internal_cost: "90",
  payout: "paid",
  payout_amount: "8000",
  profit: "123.45",
  costs_total: "9740.50",
  customer_total: "9999.99",
} as WorkOrderLeadInput;

describe("buildWorkOrderHtml", () => {
  test("contains the job facts the contractor needs", () => {
    const html = buildWorkOrderHtml(MICHONNE);
    expect(html).toContain("Work Order");
    expect(html).toContain("Michonne Baker");
    expect(html).toContain("791 Eichen Strasse, Fredericksburg");
    expect(html).toContain("Aug 20, 2026");
    expect(html).toContain("08:00");
    expect(html).toContain("3 hours");
    expect(html).toContain("1 (approx. 25in diameter)");
    expect(html).toContain("Oak");
    expect(html).toContain("Stump grinder");
    expect(html).toContain("Trailer");
    expect(html).toContain("Other: Bobcat 330");
    expect(html).toContain("Leave chips on site. Gate code 1234.");
    expect(html).toContain("5fd30b9d");
  });

  test("NEVER contains payment or internal financial details", () => {
    const html = buildWorkOrderHtml(FINANCIALLY_LOADED);
    const text = buildWorkOrderText(FINANCIALLY_LOADED);
    const haystacks = [html, text].map((x) => x.toLowerCase());
    for (const bad of [
      "$",
      "estimate",
      "deposit",
      "balance",
      "contractor cost",
      "contractor_cost",
      "payout",
      "management",
      "profit",
      "fee",
      "fuel",
      "disposal",
      "processing",
      "internal cost",
      "costs total",
      "customer total",
      "cost",
    ]) {
      expect(haystacks[0]).not.toContain(bad);
      expect(haystacks[1]).not.toContain(bad);
    }
  });

  test("empty checklist renders 'None specified'", () => {
    const html = buildWorkOrderHtml({ ...MICHONNE, subcontractor: { ...(MICHONNE.subcontractor as NonNullable<WorkOrderLeadInput["subcontractor"]>), equipment_checklist: [], equipment_checklist_custom: "" } });
    expect(html).toContain("None specified");
  });

  test("escapes HTML in notes", () => {
    const html = buildWorkOrderHtml({
      ...MICHONNE,
      name: "A & B",
      notes: "<script>alert(1)</script>",
    });
    expect(html).toContain("A &amp; B");
    expect(html).not.toContain("<script>");
  });
});

describe("buildWorkOrderText", () => {
  test("plain-text variant carries the same job facts", () => {
    const text = buildWorkOrderText(MICHONNE);
    expect(text).toContain("Michonne Baker");
    expect(text).toContain("791 Eichen Strasse, Fredericksburg");
    expect(text).toContain("Aug 20, 2026");
    expect(text).toContain("08:00");
    expect(text).toContain("3 hours");
    expect(text).toContain("- Stump grinder");
    expect(text).toContain("- Other: Bobcat 330");
    expect(text).toContain("Leave chips on site. Gate code 1234.");
  });
});

describe("checkedEquipmentList", () => {
  test("maps standard keys to labels", () => {
    expect(
      checkedEquipmentList({
        ...(MICHONNE.subcontractor as NonNullable<WorkOrderLeadInput["subcontractor"]>),
        equipment_checklist: ["grinder", "chainsaw", "safety gear"],
        equipment_checklist_custom: "",
      }),
    ).toEqual(["Stump grinder", "Chainsaw", "Safety gear (PPE)"]);
  });

  test("custom item uses its label (embedded key or separate field)", () => {
    expect(
      checkedEquipmentList({
        ...(MICHONNE.subcontractor as NonNullable<WorkOrderLeadInput["subcontractor"]>),
        equipment_checklist: ["custom:Bobcat 330"],
        equipment_checklist_custom: "",
      }),
    ).toEqual(["Other: Bobcat 330"]);
    expect(
      checkedEquipmentList({
        ...(MICHONNE.subcontractor as NonNullable<WorkOrderLeadInput["subcontractor"]>),
        equipment_checklist: ["custom"],
        equipment_checklist_custom: "Skid steer",
      }),
    ).toEqual(["Other: Skid steer"]);
  });

  test("null / undefined subcontractor → empty list", () => {
    expect(checkedEquipmentList(null)).toEqual([]);
    expect(checkedEquipmentList(undefined)).toEqual([]);
  });
});

describe("friendlyServiceDate", () => {
  test("ISO date → friendly", () => {
    expect(friendlyServiceDate("2026-08-20")).toBe("Aug 20, 2026");
    expect(friendlyServiceDate("2026-01-05")).toBe("Jan 5, 2026");
  });
  test("non-date passthrough (empty → em dash, missing dates render as —)", () => {
    expect(friendlyServiceDate("")).toBe("—");
    expect(friendlyServiceDate("soon")).toBe("soon");
  });
});
