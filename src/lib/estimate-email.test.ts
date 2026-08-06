import { describe, expect, test } from "bun:test";
import {
  buildDepositInvoiceHtml,
  buildDepositInvoiceText,
  buildEstimateHtml,
  buildPreviewEstimateHtml,
} from "./estimate-email";

/** Stage D5a fixture — mirrors the Michonne Baker lead (estimate 350 / deposit
 * 75 / balance 275, stored approval token, no payment link yet). */
const MICHONNE = {
  id: "5fd30b9d-ca8d-4269-8a02-c051ca3743e4",
  name: "Michonne Baker",
  estimate: "350",
  deposit: "75.00",
  balance: "275.00",
  notes: "Leave chips on site. Gate code 1234.",
  approval_token: "573dd253515501f2500e39da6f6d224f4c9c517a4",
  paymentLink: null,
};

describe("deposit invoice — content boundary (stage D5a)", () => {
  const html = buildDepositInvoiceHtml({
    name: "Michonne Baker",
    estimate: "350",
    deposit: "75.00",
  });
  const text = buildDepositInvoiceText({
    name: "Michonne Baker",
    estimate: "350",
    deposit: "75.00",
  });

  test("has deposit amount, estimate total, and balance", () => {
    expect(html).toContain("Deposit invoice");
    expect(html).toContain("$75.00");
    expect(html).toContain("$350.00");
    expect(html).toContain("$275.00");
    expect(html).toContain("Balance remaining after deposit");
  });

  test("has the placeholder payment text, NOT an invented payment URL", () => {
    expect(html).toContain("We'll send a secure payment link once online payments are connected.");
    expect(html).not.toMatch(/href=/); // no clickable link at all
    expect(html).not.toContain("checkout");
    expect(html).not.toContain("stripe");
    expect(html).not.toContain("payment link: http");
    expect(text).toContain("We'll send a secure payment link once online payments are connected.");
    expect(text).not.toMatch(/https?:\/\//);
  });

  test("contains NO internal costs or profit anywhere", () => {
    for (const bad of [
      "contractor",
      "Contractor",
      "management fee",
      "fuel",
      "disposal",
      "equipment",
      "payout",
      "profit",
      "gross",
      "margin",
    ]) {
      expect(html, `html must not contain ${bad}`).not.toContain(bad);
      expect(text, `text must not contain ${bad}`).not.toContain(bad);
    }
  });

  test("text variant carries the same amounts and placeholder", () => {
    expect(text).toContain("$75.00");
    expect(text).toContain("$350.00");
    expect(text).toContain("$275.00");
  });
});

describe("estimate preview — reuses the exact shared builder (stage D5a)", () => {
  test("preview HTML equals the email builder output for the same lead", () => {
    const preview = buildPreviewEstimateHtml(MICHONNE);
    // The email path builds its template from the same lead fields with the
    // same approve URL (SITE_URL + stored token) — so outputs must be identical.
    const email = buildEstimateHtml({
      id: MICHONNE.id,
      name: "Michonne Baker",
      estimate: MICHONNE.estimate,
      deposit: MICHONNE.deposit,
      balance: MICHONNE.balance,
      notes: MICHONNE.notes,
      approveUrl: `https://www.hillcountrystumpco.com/estimate/${MICHONNE.id}?token=${MICHONNE.approval_token}`,
      paymentLink: null,
    });
    expect(preview).toBe(email);
  });

  test("preview is deterministic and carries the customer-facing facts", () => {
    const a = buildPreviewEstimateHtml(MICHONNE);
    const b = buildPreviewEstimateHtml(MICHONNE);
    expect(a).toBe(b);
    expect(a).toContain("Estimate for Michonne Baker");
    expect(a).toContain("$350.00");
    expect(a).toContain("$75.00");
    expect(a).toContain("$275.00");
    expect(a).toContain("Leave chips on site. Gate code 1234.");
    // Approve button present because the lead already has a stored token.
    expect(a).toContain("Approve Estimate");
    // No Pay Online button while paymentLink is null (Stripe not connected).
    expect(a).not.toContain("Pay Online");
  });

  test("preview with no token renders no approve URL (never invents one)", () => {
    const noToken = buildPreviewEstimateHtml({ ...MICHONNE, approval_token: "" });
    expect(noToken).not.toContain("Approve Estimate");
    expect(noToken).not.toContain("?token=");
  });

  test("preview never contains internal financials", () => {
    const preview = buildPreviewEstimateHtml(MICHONNE);
    for (const bad of ["contractor cost", "management fee", "fuel", "profit", "margin"]) {
      expect(preview, `preview must not contain ${bad}`).not.toContain(bad);
    }
  });
});
