/** Shared, deterministic customer estimate markup used by email and admin preview. */
export type EstimateEmailInput = { id: string; name: string; estimate: unknown; deposit: unknown; balance: unknown; notes?: unknown; approveUrl?: string; paymentLink?: string | null };
const esc = (v: unknown) => String(v ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;", "'":"&#39;"}[c] as string));
const money = (v: unknown) => { const n = Number(String(v ?? "").replace(/[$,]/g, "")); return `$${(Number.isFinite(n) ? n : 0).toFixed(2)}`; };
const cents = (v: unknown): number => { const n = Number(String(v ?? "").replace(/[$,]/g, "")); return Number.isFinite(n) ? Math.round(n * 100) : 0; };
export function buildEstimateHtml(input: EstimateEmailInput): string {
  const approve = input.approveUrl ? `<p><a href="${esc(input.approveUrl)}" style="display:inline-block;background:#235b3a;color:#fff;padding:14px 22px;border-radius:6px;text-decoration:none">Approve Estimate</a></p>` : "";
  const pay = input.paymentLink ? `<p><a href="${esc(input.paymentLink)}" style="display:inline-block;background:#8b5e3c;color:#fff;padding:14px 22px;border-radius:6px;text-decoration:none">Pay Online</a></p>` : "";
  return `<div style="font-family:Arial;color:#222"><div style="background:#235b3a;color:#fff;padding:28px"><strong style="font-size:22px">Hill Country Stump Co.</strong><br/>Stump grinding across the Texas Hill Country</div><div style="padding:28px"><h1>Estimate for ${esc(input.name)}</h1><p style="color:#666;font-size:12px">Reference ${esc(input.id)}</p><table style="width:100%;max-width:500px;border-collapse:collapse"><tr><td>Estimate amount</td><td>${money(input.estimate)}</td></tr><tr><td>Deposit<br/>due</td><td>${money(input.deposit)}</td></tr><tr><td>Balance due</td><td>${money(input.balance)}</td></tr></table>${input.notes ? `<p><strong>Notes</strong><br/>${esc(input.notes)}</p>` : ""}${approve}${pay}<p>Questions? Reply to this email and we'll get right back to you.</p></div><footer style="color:#777;padding:20px">Hill Country Stump Co. · hello@hillcountrystumpco.com</footer></div>`;
}
export function buildEstimateText(input: EstimateEmailInput): string { return `Estimate for ${input.name}\nReference: ${input.id}\nEstimate amount: ${money(input.estimate)}\nDeposit due: ${money(input.deposit)}\nBalance due: ${money(input.balance)}${input.notes ? `\nNotes: ${input.notes}` : ""}${input.approveUrl ? `\nApprove Estimate: ${input.approveUrl}` : ""}${input.paymentLink ? `\nPay Online: ${input.paymentLink}` : ""}\nQuestions? Reply to this email and we'll get right back to you.`; }
/** Admin preview — the EXACT HTML the Send Estimate email would build for this
 * lead, using the lead's stored approval token when one exists (a fresh token
 * is only minted at send time). Never sends email. */
export function buildPreviewEstimateHtml(lead: Record<string, unknown>): string {
  const id = String(lead.id ?? "");
  const token = String(lead.approval_token ?? "");
  return buildEstimateHtml({
    id,
    name: String(lead.name ?? lead.company ?? lead.contact_name ?? "Customer"),
    estimate: lead.estimate,
    deposit: lead.deposit,
    balance: lead.balance,
    notes: lead.notes,
    approveUrl: token && id ? `${lead.approval_base ?? "https://www.hillcountrystumpco.com"}/estimate/${id}?token=${token}` : "",
    paymentLink: lead.paymentLink ?? null,
  });
}
/** Deposit invoice — customer-facing: deposit amount, estimate total, balance.
 * Explicitly NO payment URL until online payments are connected. */
export type DepositInvoiceInput = { name: string; estimate: unknown; deposit: unknown };
export function buildDepositInvoiceHtml(input: DepositInvoiceInput): string {
  const depositAmount = money(input.deposit); const estimateAmount = money(input.estimate);
  const balanceAmount = money((cents(input.estimate) - cents(input.deposit)) / 100);
  return `<div style="font-family:Arial;color:#222"><div style="background:#235b3a;color:#fff;padding:28px"><strong style="font-size:22px">Hill Country Stump Co.</strong></div><div style="padding:28px"><h1>Deposit invoice</h1><p>Hello ${esc(input.name)},</p><p>Your deposit invoice is <strong>${depositAmount}</strong>.</p><p>Estimate total: ${estimateAmount}<br/>Balance remaining after deposit: ${balanceAmount}</p><p>We'll send a secure payment link once online payments are connected.</p><p>Questions? Reply to this email and we'll get right back to you.</p></div><footer style="color:#777;padding:20px">Hill Country Stump Co. · hello@hillcountrystumpco.com</footer></div>`;
}
export function buildDepositInvoiceText(input: DepositInvoiceInput): string {
  const depositAmount = money(input.deposit); const estimateAmount = money(input.estimate);
  const balanceAmount = money((cents(input.estimate) - cents(input.deposit)) / 100);
  return `Hello ${input.name},\n\nDeposit invoice: ${depositAmount}\nEstimate total: ${estimateAmount}\nBalance remaining after deposit: ${balanceAmount}\n\nWe'll send a secure payment link once online payments are connected.\nQuestions? Reply to this email and we'll get right back to you.`;
}
