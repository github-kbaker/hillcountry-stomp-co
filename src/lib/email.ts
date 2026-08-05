import { mkdir, appendFile } from "node:fs/promises";
import { join } from "node:path";
import { SITE_URL } from "./site";

export type EmailResult = { ok: boolean; status: number; messageId: string | null; error: string | null };
export type EmailHistoryEntry = { id: string; type: "estimate-sent" | "lead-notification" | "customer-confirmation" | "estimate-approved-notice" | "test" | "other"; subject: string; recipient: string; status: "sent" | "failed" | "not-configured"; messageId?: string | null; error?: string | null; retryCount: number; sentAt: string; attachment?: "pdf" | null };
export type LeadEmail = { id: string; name?: string; company?: string; contact_name?: string; email?: string; customer_email?: string; phone?: string; city?: string; notes?: string; address?: string; kind?: string };
export type EmailState = { status: "sent" | "failed" | "not-configured" | "pending"; recipient: string; subject: string; messageId: string | null; error: string | null; retryCount: number; sentAt: string | null; lastAttemptAt: string | null };

const cfg = () => ({
  key: process.env.RESEND_API_KEY ?? "",
  from: process.env.FROM_EMAIL || "",
  business: process.env.BUSINESS_EMAIL || "",
  replyTo: process.env.REPLY_TO_EMAIL || process.env.BUSINESS_EMAIL || "",
  forward: process.env.FORWARD_EMAIL || "",
});

export async function sendEmail({ to, subject, html, text, body, replyTo, attachments }: { to: string; subject: string; html?: string; text?: string; body?: string; replyTo?: string; attachments?: Array<{ filename: string; content: string }> }): Promise<EmailResult> {
  const { key, from } = cfg();
  if (!key) return { ok: false, status: 0, messageId: null, error: "RESEND_API_KEY not configured" };
  if (!from) return { ok: false, status: 0, messageId: null, error: "FROM_EMAIL not configured" };
  try {
    const r = await fetch("https://api.resend.com/emails", { method: "POST", headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" }, body: JSON.stringify({ from, to: [to], subject, html: html ?? `<p>${body ?? text ?? ""}</p>`, text: text ?? body ?? "", ...(replyTo ? { reply_to: replyTo } : {}), ...(attachments?.length ? { attachments } : {}) }) });
    const raw = await r.text();
    if (!r.ok) return { ok: false, status: r.status, messageId: null, error: raw };
    let parsed: { id?: string } = {};
    try { parsed = JSON.parse(raw); } catch {}
    return { ok: true, status: r.status, messageId: parsed.id ?? null, error: null };
  } catch (e) { return { ok: false, status: 0, messageId: null, error: e instanceof Error ? e.message : String(e) }; }
}

export async function logEmail(entry: Record<string, unknown>) { try { const dir = join(process.cwd(), "data", "logs"); await mkdir(dir, { recursive: true }); await appendFile(join(dir, "email.log"), JSON.stringify({ timestamp: new Date().toISOString(), ...entry }) + "\n"); } catch (e) { console.error("[email] log failed", e); } }

async function attempt(lead: LeadEmail, recipient: string, subject: string, html: string, text: string, replyTo?: string) {
  const customerName = lead.name ?? lead.company ?? lead.contact_name ?? "";
  let retryCount = 0;
  let result = await sendEmail({ to: recipient, subject, html, text, replyTo });
  await logEmail({ leadId: lead.id, customerName, recipient, subject, httpStatus: result.status, messageId: result.messageId, error: result.error, retryCount, event: result.error === "RESEND_API_KEY not configured" ? "not-configured" : "attempt" });
  if (!result.ok && result.error !== "RESEND_API_KEY not configured") {
    retryCount = 1;
    result = await sendEmail({ to: recipient, subject, html, text, replyTo });
    await logEmail({ leadId: lead.id, customerName, recipient, subject, httpStatus: result.status, messageId: result.messageId, error: result.error, retryCount, event: result.ok ? "success" : "failed" });
  } else if (result.ok) await logEmail({ leadId: lead.id, customerName, recipient, subject, httpStatus: result.status, messageId: result.messageId, error: null, retryCount, event: "success" });
  return { result, retryCount };
}

export async function sendEstimateEmails(lead: LeadEmail): Promise<{ business: EmailResult | null; customer: EmailResult | null; businessRetryCount: number; customerRetryCount: number; state: EmailState }> {
  const c = cfg();
  const customerName = lead.name ?? lead.company ?? lead.contact_name ?? "New lead";
  const subject = `New estimate request — ${customerName}`;
  let business: EmailResult | null = null; let br = 0;
  if (c.forward) {
    const adminLink = `${SITE_URL}/admin/lead/${lead.id}`;
    const r = await attempt(lead, c.forward, subject, `<p>New estimate request</p><p>Reference: ${lead.id}<br>Name: ${lead.name ?? ""}<br>Email: ${lead.email ?? ""}<br>Phone: ${lead.phone ?? ""}<br>Town: ${lead.city ?? ""}<br>Service notes: ${lead.notes ?? ""}</p><p><a href="${adminLink}">Open lead in admin</a></p>`, `New estimate request\nReference: ${lead.id}\nName: ${lead.name ?? ""}\nEmail: ${lead.email ?? ""}\nPhone: ${lead.phone ?? ""}\nTown: ${lead.city ?? ""}\nService notes: ${lead.notes ?? ""}\nAdmin lead page: ${adminLink}`, lead.email || c.replyTo);
    business = r.result; br = r.retryCount;
  } else await logEmail({ leadId: lead.id, customerName, recipient: "", subject, httpStatus: 0, messageId: null, error: "FORWARD_EMAIL not configured", retryCount: 0, event: "not-configured" });
  const cs = "We received your estimate request — Hill Country Stump Co.";
  let customer: EmailResult | null = null; let cr = 0;
  if (lead.email) {
    const r = await attempt(lead, lead.email, cs, `<p>Thank you for contacting Hill Country Stump Co.</p><p>Reference: ${lead.id}</p><p>We received your estimate request and we'll get back to you.</p>`, `Thank you for contacting Hill Country Stump Co.\nReference: ${lead.id}\nWe received your estimate request and we'll get back to you.`, c.replyTo);
    customer = r.result; cr = r.retryCount;
  }
  const status = !c.key ? "not-configured" : customer?.ok ? "sent" : "failed";
  return { business, customer, businessRetryCount: br, customerRetryCount: cr, state: { status, recipient: lead.email ?? "", subject: cs, messageId: customer?.messageId ?? null, error: customer?.error ?? (!c.key ? "RESEND_API_KEY not configured" : null), retryCount: cr, sentAt: customer?.ok ? new Date().toISOString() : null, lastAttemptAt: new Date().toISOString() } };
}
