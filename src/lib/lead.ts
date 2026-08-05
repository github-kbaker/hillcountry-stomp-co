import { createServerFn } from "@tanstack/react-start";
import { mkdir, rename, writeFile } from "node:fs/promises";
import { join } from "node:path";

import { sql } from "~/db";
import { sendEstimateEmails } from "./email";

/**
 * Lead capture for the Free Estimate form, the Contact form, and the
 * Contractor Partnerships form, exposed as a POST server function (the
 * API-route convention from older TanStack Start versions isn't available in
 * the installed 1.158.x — server functions are the framework-native
 * replacement).
 *
 * Saves the lead to Postgres (via ~/db) when DATABASE_URL is set; when it is
 * NOT set (owner is still connecting Neon), falls back to writing a JSON file
 * under <site>/data/leads/ so the submission is never lost and the customer
 * always lands on the thank-you page. Each path logs clearly.
 *
 * Photo uploads (up to 6) are always written to <site>/data/uploads/<leadId>/
 * and their paths are stored on the lead record.
 *
 * The form type is set via the hidden `kind` field ("estimate" default,
 * "contact", or "contractor"). Required fields and the stored record shape
 * vary by kind so contractor partnership inquiries land in the same pipeline
 * as customer leads but are clearly distinguishable (kind: "contractor",
 * company + contact_person fields).
 */

const DATA_DIR = join(process.cwd(), "data");
const LEADS_DIR = join(DATA_DIR, "leads");
const UPLOADS_DIR = join(DATA_DIR, "uploads");

const MAX_PHOTOS = 6;
const MAX_PHOTO_BYTES = 8 * 1024 * 1024;
const PHOTO_TYPE_RE = /^image\/(jpeg|png|webp|heic|heif|avif|gif)$/i;

export const submitLead = createServerFn({ method: "POST" }).handler(
  async ({ data }: { data: FormData }) => {
    const get = (k: string) => (data.get(k) as string | null)?.trim() ?? "";
    const kind = get("kind") || "estimate";

    // Required fields vary by form kind — each form posts the same function,
    // so the required check is kept here (the forms also validate client-side).
    const requiredByKind: Record<string, string[]> = {
      estimate: [
        "name",
        "phone",
        "email",
        "address",
        "city",
        "zip",
        "num_stumps",
      ],
      contact: ["name", "phone", "email", "message"],
      contractor: ["company", "contact_person", "phone", "email"],
    };
    const requiredFields = requiredByKind[kind] ?? requiredByKind.estimate;
    if (requiredFields.some((k) => !get(k))) {
      throw new Error("missing_required_fields");
    }

    const id = crypto.randomUUID();

    // Save photo uploads to disk; record their paths on the lead.
    // The upload dir is created lazily, only when a photo is actually written.
    const photos: string[] = [];
    const uploadDir = join(UPLOADS_DIR, id);
    const files = data
      .getAll("photos")
      .filter(
        (f): f is File =>
          typeof File !== "undefined" && f instanceof File && f.size > 0,
      );
    for (let i = 0; i < files.length && i < MAX_PHOTOS; i++) {
      const file = files[i];
      if (!PHOTO_TYPE_RE.test(file.type) || file.size > MAX_PHOTO_BYTES) {
        console.warn(`[lead] ${id} skipping photo ${i}: bad type or over 8 MB`);
        continue;
      }
      const ext = (
        file.name.match(/\.([a-z0-9]{2,5})$/i)?.[1] ?? "img"
      ).toLowerCase();
      try {
        await mkdir(uploadDir, { recursive: true });
        await writeFile(
          join(uploadDir, `${i}.${ext}`),
          Buffer.from(await file.arrayBuffer()),
        );
        photos.push(`/data/uploads/${id}/${i}.${ext}`);
      } catch (err) {
        console.error(`[lead] failed to save photo ${i} for ${id}:`, err);
      }
    }

    // Common fields every lead carries: id, kind, attribution, photos, timestamp.
    const common = {
      id,
      kind,
      lead_source: get("lead_source"),
      utm: {
        source: get("utm_source"),
        medium: get("utm_medium"),
        campaign: get("utm_campaign"),
      },
      photos,
      created_at: new Date().toISOString(),
    };

    // Record shape varies by form kind. Contractor inquiries carry company /
    // partnership fields; estimate and contact leads keep their existing shape.
    const payload =
      kind === "contractor"
        ? {
            ...common,
            company: get("company"),
            contact_name: get("contact_person"),
            phone: get("phone"),
            email: get("email"),
            customer_email: get("email"),
            monthly_volume: get("monthly_volume"),
            coverage_area: get("coverage_area"),
            insurance: get("insurance"),
            partnership: get("partnership"),
            notes: get("notes"),
          }
        : {
            ...common,
            name: get("name"),
            phone: get("phone"),
            email: get("email"),
            customer_email: get("email"),
            address: get("address"),
            city: get("city"),
            zip: get("zip"),
            num_stumps: get("num_stumps"),
            diameter: get("diameter"),
            height: get("height"),
            species: get("species"),
            grind_depth: get("grind_depth"),
            cleanup: get("cleanup"),
            preferred_date: get("preferred_date"),
            gate_width: get("gate_width"),
            access_width: get("access_width"),
            utilities: get("utilities"),
            fence: get("fence"),
            customer_type: get("customer_type"),
            notes: get("notes"),
            message: get("message"),
          };

    // Prefer Postgres; fall back to a JSON file if DATABASE_URL is missing or
    // the write fails. The customer always gets a success response.
    let stored: "database" | "file" = "file";
    if (process.env.DATABASE_URL) {
      try {
        const db = sql();
        await db`
          create table if not exists leads (
            id text primary key,
            payload jsonb not null,
            created_at timestamptz not null default now()
          )
        `;
        await db`
          insert into leads (id, payload, created_at)
          values (${id}, ${JSON.stringify(payload)}, ${payload.created_at})
        `;
        stored = "database";
        console.log(`[lead] ${id} saved to DATABASE`);
      } catch (err) {
        console.error(
          `[lead] DATABASE write failed for ${id}, falling back to file:`,
          err,
        );
        stored = "file";
      }
    } else {
      console.log(
        `[lead] ${id} DATABASE_URL not set — saving lead to FILE (${join(LEADS_DIR, `${id}.json`)})`,
      );
    }

    if (stored === "file") {
      await mkdir(LEADS_DIR, { recursive: true });
      const target = join(LEADS_DIR, `${id}.json`);
      const temp = `${target}.tmp`;
      await writeFile(temp, JSON.stringify(payload, null, 2));
      await rename(temp, target);
    }

    let email;
    try {
      const sent = await sendEstimateEmails(payload);
      email = sent.state;
      const now = new Date().toISOString();
      const history = [
        { id: crypto.randomUUID(), type: "lead-notification", subject: `New estimate request — ${payload.name ?? payload.company ?? payload.contact_name ?? "New lead"}`, recipient: process.env.FORWARD_EMAIL || "", status: !process.env.RESEND_API_KEY ? "not-configured" : sent.business?.ok ? "sent" : "failed", messageId: sent.business?.messageId ?? null, error: sent.business?.error ?? (!process.env.FORWARD_EMAIL ? "FORWARD_EMAIL not configured" : null), retryCount: sent.businessRetryCount, sentAt: now },
        { id: crypto.randomUUID(), type: "customer-confirmation", subject: "We received your estimate request — Hill Country Stump Co.", recipient: payload.customer_email ?? "", status: !process.env.RESEND_API_KEY ? "not-configured" : sent.customer?.ok ? "sent" : "failed", messageId: sent.customer?.messageId ?? null, error: sent.customer?.error ?? null, retryCount: sent.customerRetryCount, sentAt: now },
      ];
      const saved = { ...payload, email, email_history: history };
      if (stored === "database" && process.env.DATABASE_URL) {
        try { const db = sql(); await db`update leads set payload = ${JSON.stringify(saved)} where id = ${id}`; }
        catch (err) { console.error(`[lead] email state database update failed for ${id}:`, err); }
      } else {
        const target = join(LEADS_DIR, `${id}.json`); const temp = `${target}.tmp`;
        await writeFile(temp, JSON.stringify(saved, null, 2)); await rename(temp, target);
      }
    } catch (err) { console.error(`[lead] email flow failed for ${id}:`, err); email = { status: "failed", recipient: payload.customer_email || "", subject: `New estimate request — ${payload.name ?? payload.company ?? payload.contact_name ?? "New lead"}`, messageId: null, error: err instanceof Error ? err.message : String(err), retryCount: 0, sentAt: null, lastAttemptAt: new Date().toISOString() }; }
    return { ok: true, id, stored };
  },
);
