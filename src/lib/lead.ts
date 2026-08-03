import { createServerFn } from "@tanstack/react-start";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";

import { sql } from "~/db";

/**
 * Lead capture for the Free Estimate form and the Contact form, exposed as a
 * POST server function (the API-route convention from older TanStack Start
 * versions isn't available in the installed 1.158.x — server functions are the
 * framework-native replacement).
 *
 * Saves the lead to Postgres (via ~/db) when DATABASE_URL is set; when it is
 * NOT set (owner is still connecting Neon), falls back to writing a JSON file
 * under <site>/data/leads/ so the submission is never lost and the customer
 * always lands on the thank-you page. Each path logs clearly.
 *
 * Photo uploads (up to 6) are always written to <site>/data/uploads/<leadId>/
 * and their paths are stored on the lead record.
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
    const required = {
      name: get("name"),
      phone: get("phone"),
      email: get("email"),
      address: get("address"),
      city: get("city"),
      zip: get("zip"),
      num_stumps: get("num_stumps"),
    };
    if (Object.values(required).some((v) => !v)) {
      throw new Error("missing_required_fields");
    }

    const id = crypto.randomUUID();

    // Save photo uploads to disk; record their paths on the lead.
    const photos: string[] = [];
    const uploadDir = join(UPLOADS_DIR, id);
    await mkdir(uploadDir, { recursive: true });
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
        await writeFile(
          join(uploadDir, `${i}.${ext}`),
          Buffer.from(await file.arrayBuffer()),
        );
        photos.push(`/data/uploads/${id}/${i}.${ext}`);
      } catch (err) {
        console.error(`[lead] failed to save photo ${i} for ${id}:`, err);
      }
    }

    const payload = {
      id,
      kind: get("kind") || "estimate",
      name: required.name,
      phone: required.phone,
      email: required.email,
      address: required.address,
      city: required.city,
      zip: required.zip,
      num_stumps: required.num_stumps,
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
      lead_source: get("lead_source"),
      notes: get("notes"),
      message: get("message"),
      utm: {
        source: get("utm_source"),
        medium: get("utm_medium"),
        campaign: get("utm_campaign"),
      },
      photos,
      created_at: new Date().toISOString(),
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
      await writeFile(
        join(LEADS_DIR, `${id}.json`),
        JSON.stringify(payload, null, 2),
      );
    }

    return { ok: true, id, stored };
  },
);
