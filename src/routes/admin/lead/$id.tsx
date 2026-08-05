import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { deleteLead, getLead, getLeadPhoto, getSession, updateLead, sendEstimate } from "~/lib/admin";
import { LEAD_STATUSES } from "~/lib/admin-meta";
import type { LeadDetail, LeadStatus } from "~/lib/admin-meta";
import { SITE_NAME } from "~/lib/site";

export const Route = createFileRoute("/admin/lead/$id")({
  head: () => ({ meta: [{ title: `Lead Detail | ${SITE_NAME} Admin` }, { name: "robots", content: "noindex, nofollow" }] }),
  component: LeadDetailPage,
});

const groups: Array<[string, string[]]> = [
  ["Contact", ["name", "contact_name", "company", "phone", "email", "customer_email", "customer_type", "lead_source", "utm"]],
  ["Location", ["address", "city", "zip"]],
  ["Job details", ["num_stumps", "diameter", "height", "species", "grind_depth", "gate_width", "access_width", "utilities", "fence", "cleanup", "preferred_date", "notes"]],
  ["Contractor partnership", ["monthly_volume", "coverage_area", "insurance", "partnership"]],
];
const label = (s: string) => s.replaceAll("_", " ").replace(/\b\w/g, (c) => c.toUpperCase());

function LeadDetailPage() {
  const { id } = Route.useParams();
  const [lead, setLead] = useState<LeadDetail | null>(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [photoUrls, setPhotoUrls] = useState<string[]>([]);
  useEffect(() => { (async () => { try { const s = await getSession(); if (!s.authed) return window.location.replace("/admin/login"); const r = await getLead({ data: { id } }); if (r instanceof Response) return setError("Lead not found."); setLead(r as LeadDetail); } catch { setError("Unable to load lead."); } })(); }, [id]);
  useEffect(() => { if (!lead) return; let alive = true; (async () => { const urls: string[] = []; for (const p of lead.photos ?? []) { const r = await getLeadPhoto({ data: { leadId: id, filename: p.split("/").pop() ?? "" } }); if (r instanceof Response && r.ok) urls.push(URL.createObjectURL(await r.blob())); } if (alive) setPhotoUrls(urls); })(); return () => { alive = false; }; }, [lead, id]);
  async function save(patch: Record<string, unknown>) { if (!lead) return; setSaving(true); setError(""); try { const r = await updateLead({ data: { id, patch } }); if (r instanceof Response) throw new Error("save_failed"); setLead(r.lead as LeadDetail); } catch { setError("Couldn\'t save — please try again"); } finally { setSaving(false); } }
  async function estimate() { if (!lead) return; setError(""); try { const r = await sendEstimate({ data: { id } }); if (r instanceof Response || !r.ok) throw new Error((r as any).error || "Send failed"); setLead(r.lead as LeadDetail); } catch (e) { setError(e instanceof Error ? e.message : "Unable to send estimate"); } }
  async function remove() { if (!confirm("Delete this lead and its uploaded photos? This cannot be undone.")) return; await deleteLead({ data: { id } }); window.location.href = "/admin"; }
  if (error) return <div className="mx-auto max-w-3xl px-4 py-10"><div className="card"><p>{error}</p><Link to="/admin" className="mt-4 inline-block text-forest-700 hover:underline">← Dashboard</Link></div></div>;
  if (!lead) return <div className="mx-auto max-w-3xl px-4 py-10"><div className="card">Loading lead…</div></div>;
  return <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
    <Link to="/admin" className="text-sm text-forest-700 hover:underline">← Back to dashboard</Link>
    <div className="mt-4 flex flex-wrap items-start justify-between gap-4"><div><h1 className="font-display text-3xl font-bold text-forest-900">{String(lead.name || lead.contact_name || lead.company || "Lead")}</h1><p className="mt-1 text-sm text-charcoal-500">{lead.id} · {new Date(lead.created_at).toLocaleString()}</p></div><button onClick={remove} className="btn-charcoal bg-red-800 px-4 py-2 text-sm">Delete lead</button></div>
    {error && <div role="alert" className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-800">{error}</div>}
    <div className="card mt-6"><div className="mb-4 flex justify-end"><button onClick={estimate} className="btn-primary px-4 py-2 text-sm">Send Estimate</button></div><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"><label className="label">Pipeline status<select className="input mt-1" value={lead.status} disabled={saving} onChange={(e) => save({ status: e.target.value as LeadStatus })}>{LEAD_STATUSES.map(s => <option key={s} value={s}>{label(s)}</option>)}</select></label>{["estimate", "deposit", "balance"].map(k => <label key={k} className="label">{label(k)}<input className="input mt-1" inputMode="decimal" value={String(lead[k] ?? "")} onChange={e => setLead({...lead, [k]: e.target.value})} onBlur={e => save({ [k]: e.target.value })} /></label>)}<label className="label">Stripe status<input className="input mt-1" value={String(lead.stripe_status ?? "")} onChange={e => setLead({...lead, stripe_status: e.target.value})} onBlur={e => save({ stripe_status: e.target.value || null })} /></label></div></div>
    {groups.map(([title, keys]) => <section key={title} className="card mt-5"><h2 className="font-display text-xl font-bold text-forest-900">{title}</h2><dl className="mt-4 grid gap-x-6 gap-y-3 sm:grid-cols-2">{keys.map(k => <div key={k}><dt className="text-xs font-semibold uppercase tracking-wide text-charcoal-500">{label(k)}</dt>{k === "customer_email" ? <input className="input mt-1" defaultValue={String(lead[k] ?? "")} onBlur={e => save({ customer_email: e.target.value })} /> : k === "notes" ? <textarea className="input mt-1 min-h-24" defaultValue={String(lead[k] ?? "")} onBlur={e => save({ notes: e.target.value })} /> : <dd className="mt-1 whitespace-pre-wrap text-charcoal-800">{k === "utm" ? ["source", "medium", "campaign"].map(x => `${x}: ${String((lead.utm as Record<string, unknown>)?.[x] ?? "—")}`).join(" · ") : String(lead[k] ?? "—")}</dd>}</div>)}</dl></section>)}
    <section className="card mt-5"><h2 className="font-display text-xl font-bold text-forest-900">Customer-facing email status</h2><div className="mt-3 grid gap-2 text-sm sm:grid-cols-2"><div>Status: <strong>{String((lead.email as Record<string, unknown> | undefined)?.status ?? "pending")}</strong></div><div>Recipient: {String((lead.email as Record<string, unknown> | undefined)?.recipient ?? "—")}</div><div>Subject: {String((lead.email as Record<string, unknown> | undefined)?.subject ?? "—")}</div><div>Message ID: {String((lead.email as Record<string, unknown> | undefined)?.messageId ?? "—")}</div><div>Error: <span className="break-words">{String((lead.email as Record<string, unknown> | undefined)?.error ?? "—")}</span></div><div>Retry count: {String((lead.email as Record<string, unknown> | undefined)?.retryCount ?? 0)}</div><div>Sent: {String((lead.email as Record<string, unknown> | undefined)?.sentAt ?? "—")}</div><div>Last attempt: {String((lead.email as Record<string, unknown> | undefined)?.lastAttemptAt ?? "—")}</div></div></section>
    <section className="card mt-5"><h2 className="font-display text-xl font-bold text-forest-900">Email History</h2><div className="mt-3 space-y-2">{(Array.isArray(lead.email_history) ? lead.email_history : []).slice().reverse().map((e: any) => <div key={e.id} className="rounded border border-limestone-200 p-3 text-sm"><div className="flex justify-between"><strong>{e.subject}</strong><span className="rounded bg-forest-100 px-2 py-0.5">{["customer-confirmation", "estimate-sent"].includes(e.type) ? "Customer" : "Internal"}</span><span className="rounded bg-limestone-100 px-2 py-0.5">{e.status}</span></div><div className="mt-1 text-charcoal-500">{e.recipient} · {new Date(e.sentAt).toLocaleString()} · {e.messageId || "No message ID"}</div></div>)}</div></section>
    <section className="card mt-5"><h2 className="font-display text-xl font-bold text-forest-900">Uploaded photos</h2>{photoUrls.length ? <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">{photoUrls.map(u => <img key={u} src={u} className="aspect-square rounded-lg object-cover" alt="Uploaded stump" />)}</div> : <p className="mt-3 text-charcoal-500">No photos uploaded.</p>}</section>
  </div>;
}
