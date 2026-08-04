import { createServerFn } from "@tanstack/react-start";
import { createHmac, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { mkdir, readFile, readdir, rename, rm, writeFile } from "node:fs/promises";
import { basename, join } from "node:path";

import { sql } from "~/db";
import { sendEmail, logEmail } from "./email";
import { DEFAULT_LEAD_STATUS, LEAD_STATUSES } from "./admin-meta";
import type { LeadListResult, LeadRow, LeadStatus } from "./admin-meta";

/**
 * IMPORTANT (build isolation): client components import the shared constants
 * and types from ./admin-meta (a module with zero server-only imports) and
 * import ONLY the server-function stubs from this file. This module itself
 * must never export a plain value that a client component imports — the
 * moment one does, the client bundle pulls in this file's node:* imports and
 * the build breaks (that is the exact failure the previous attempt hit).
 */

/**
 * Admin dashboard — authentication + lead listing for Hill Country Stump Co.
 *
 * Follows the same server-function pattern as src/lib/lead.ts: every bit of
 * server-only code (crypto, the filesystem, the database, the request/response
 * cookie plumbing) lives inside `createServerFn` handlers in this module, and
 * client components only ever import the function stubs from here. Nothing
 * server-only is imported by a route file directly.
 *
 * AUTH: one admin account. The password hash (scrypt, salted) and the session
 * HMAC key are stored in <site>/data/admin.secret.json — a gitignored file that
 * is NEVER committed. Generate it with `bun run admin:password` (or the same
 * script), which prints the one-time plaintext password.
 *
 * SESSION: an httpOnly, Secure, SameSite=Lax cookie (`hcst_admin`) holding
 * `token.expiry.hmac`. The token is 32 random bytes; the HMAC is computed over
 * `token.expiry` with the server-side session key; expiry (30 days) is enforced
 * on every authenticated call. Login/logout return a raw `Response` carrying a
 * `set-cookie` header — TanStack Start's server-function layer passes raw
 * Responses through to the client untouched (x-tss-raw), so the browser stores
 * the cookie on a normal same-origin fetch.
 *
 * LEAD DATA: every function that returns lead data calls `requireAuth()`
 * FIRST and returns HTTP 401 when the session is invalid. There is no
 * client-side-only protection anywhere.
 */

/* ------------------------------------------------------------------ */
/* Server-only helpers (referenced ONLY inside handler bodies)         */
/* ------------------------------------------------------------------ */

const COOKIE_NAME = "hcst_admin";
const SESSION_SECONDS = 30 * 24 * 60 * 60; // 30 days
const SECRET_PATH = join(process.cwd(), "data", "admin.secret.json");
const LEADS_DIR = join(process.cwd(), "data", "leads");

type AdminSecret = {
  passwordHash: string; // hex of scrypt(password, salt, 64)
  passwordSalt: string; // hex
  sessionKey: string; // hex, HMAC key for session tokens
  createdAt: string;
};

async function loadSecret(): Promise<AdminSecret> {
  let raw: string;
  try {
    raw = await readFile(SECRET_PATH, "utf8");
  } catch {
    throw new Error(
      "admin secret file not found — run `bun run admin:password` to create data/admin.secret.json",
    );
  }
  const parsed = JSON.parse(raw) as Partial<AdminSecret>;
  if (!parsed.passwordHash || !parsed.passwordSalt || !parsed.sessionKey) {
    throw new Error("admin secret file is malformed — re-run `bun run admin:password`");
  }
  return parsed as AdminSecret;
}

function parseCookies(header: string | null | undefined): Record<string, string> {
  const out: Record<string, string> = {};
  if (!header) return out;
  for (const part of header.split(";")) {
    const eq = part.indexOf("=");
    if (eq === -1) continue;
    const name = part.slice(0, eq).trim();
    const value = part.slice(eq + 1).trim();
    if (name) out[name] = decodeURIComponent(value);
  }
  return out;
}

/** Serialize a cookie value into a Set-Cookie header string. */
function serializeCookie(
  name: string,
  value: string,
  maxAgeSeconds: number,
): string {
  const parts = [
    `${name}=${encodeURIComponent(value)}`,
    "Path=/",
    "HttpOnly",
    "Secure",
    "SameSite=Lax",
    `Max-Age=${maxAgeSeconds}`,
  ];
  return parts.join("; ");
}

function signSession(sessionKey: string, token: string, exp: number): string {
  return createHmac("sha256", sessionKey).update(`${token}.${exp}`).digest("hex");
}

/** Build the signed cookie value: token.expiry.sig */
function buildSessionValue(sessionKey: string, token: string, exp: number): string {
  return `${token}.${exp}.${signSession(sessionKey, token, exp)}`;
}

function sessionCookieHeader(sessionKey: string, token: string, exp: number): string {
  return serializeCookie(COOKIE_NAME, buildSessionValue(sessionKey, token, exp), SESSION_SECONDS);
}

function expiredCookieHeader(): string {
  return serializeCookie(COOKIE_NAME, "", 0);
}

/**
 * Access the raw incoming Request for the current server-function call.
 *
 * The TanStack Start runtime stores the current h3 event in an
 * AsyncLocalStorage reachable through a stable global symbol (this is the
 * same storage the framework's own request-response helpers use). It is read
 * lazily here so handlers can inspect the httpOnly session cookie that the
 * browser sent with the request. There is no public `getStartContext` export
 * in this TanStack Start version, and per-function middleware does not
 * receive the Request, so this is the one reliable, import-free way to get
 * at it inside a `createServerFn` handler. Runs only server-side — the
 * reference is inside handler bodies, so it never reaches the client bundle.
 */
function currentRequest(): Request | undefined {
  try {
    const storage = (
      globalThis as unknown as Record<symbol, unknown>
    )[Symbol.for("tanstack-start:event-storage")] as
      | { getStore?: () => { h3Event?: { req?: Request } } | undefined }
      | undefined;
    return storage?.getStore?.()?.h3Event?.req;
  } catch {
    return undefined;
  }
}

/**
 * Verify the session cookie for the current request. Returns true only when
 * the cookie parses, the HMAC matches (constant-time), and expiry is in the
 * future. Every authenticated server function calls this first.
 */
async function isAuthenticated(): Promise<boolean> {
  try {
    const { sessionKey } = await loadSecret();
    const cookieValue = parseCookies(currentRequest()?.headers.get("cookie"))[COOKIE_NAME];
    if (!cookieValue) return false;

    const parts = cookieValue.split(".");
    if (parts.length !== 3) return false;
    const [token, expStr, sig] = parts;
    const exp = Number(expStr);
    if (!Number.isFinite(exp) || exp <= Math.floor(Date.now() / 1000)) return false;

    const expected = signSession(sessionKey, token, exp);
    const a = Buffer.from(sig, "utf8");
    const b = Buffer.from(expected, "utf8");
    if (a.length !== b.length) return false;
    return timingSafeEqual(a, b);
  } catch {
    // Missing/malformed secret file, storage errors, etc. — deny by default.
    return false;
  }
}

function unauthorizedResponse(): Response {
  return new Response(JSON.stringify({ error: "unauthorized" }), {
    status: 401,
    headers: { "content-type": "application/json" },
  });
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

/** Normalize a stored lead payload into a display-ready LeadRow. */
function toLeadRow(payload: Record<string, unknown>): LeadRow {
  const utmRaw = (payload.utm ?? {}) as Record<string, unknown>;
  return {
    id: String(payload.id ?? ""),
    kind: String(payload.kind ?? "estimate"),
    status: (LEAD_STATUSES as readonly string[]).includes(String(payload.status))
      ? (payload.status as LeadStatus)
      : DEFAULT_LEAD_STATUS,
    // Contractor inquiries carry company + contact_name; everyone else has name.
    name:
      String(payload.company ?? "") ||
      String(payload.contact_name ?? "") ||
      String(payload.name ?? ""),
    phone: String(payload.phone ?? ""),
    email: String(payload.email ?? ""),
    city: String(payload.city ?? ""),
    lead_source: String(payload.lead_source ?? ""),
    utm: {
      source: String(utmRaw.source ?? ""),
      medium: String(utmRaw.medium ?? ""),
      campaign: String(utmRaw.campaign ?? ""),
    },
    created_at: String(payload.created_at ?? ""),
    num_stumps: String(payload.num_stumps ?? ""),
    email_status: payload.email as LeadRow["email_status"],
  };
}

/**
 * Read every lead — Postgres when DATABASE_URL is set, the data/leads/*.json
 * files otherwise. Same preference order as submitLead in lead.ts.
 */
async function readLeadPayload(id: string): Promise<Record<string, unknown> | null> {
  if (process.env.DATABASE_URL) {
    try {
      const rows = await sql()`select id, payload from leads where id = ${id} limit 1`;
      if (rows[0]) return { ...(rows[0].payload as Record<string, unknown>), id };
    } catch (err) { console.error("[admin] DATABASE detail failed:", err); }
  }
  try { return JSON.parse(await readFile(join(LEADS_DIR, `${id}.json`), "utf8")); }
  catch { return null; }
}

async function writeLeadPayload(id: string, payload: Record<string, unknown>): Promise<void> {
  if (process.env.DATABASE_URL) {
    try { await sql()`update leads set payload = ${JSON.stringify(payload)} where id = ${id}`; return; }
    catch (err) { console.error("[admin] DATABASE update failed, trying file:", err); }
  }
  await mkdir(LEADS_DIR, { recursive: true });
  const target = join(LEADS_DIR, `${id}.json`);
  const temp = `${target}.tmp`;
  await writeFile(temp, JSON.stringify(payload, null, 2));
  await rename(temp, target);
}

const leadWriteQueues = new Map<string, Promise<void>>();

async function readAllLeads(): Promise<LeadRow[]> {
  if (process.env.DATABASE_URL) {
    try {
      const db = sql();
      const rows = await db`select id, payload from leads order by created_at desc`;
      return rows.map((r) =>
        toLeadRow({ ...(r.payload as Record<string, unknown>), id: String(r.id) }),
      );
    } catch (err) {
      console.error("[admin] DATABASE read failed, falling back to files:", err);
    }
  }
  let files: string[];
  try {
    files = await readdir(LEADS_DIR);
  } catch {
    return [];
  }
  const leads: LeadRow[] = [];
  for (const file of files) {
    if (!file.endsWith(".json")) continue;
    try {
      const payload = JSON.parse(
        await readFile(join(LEADS_DIR, file), "utf8"),
      ) as Record<string, unknown>;
      leads.push(toLeadRow(payload));
    } catch (err) {
      console.warn(`[admin] skipping unreadable lead file ${file}:`, err);
    }
  }
  return leads.sort((a, b) => (a.created_at < b.created_at ? 1 : -1));
}

/* ------------------------------------------------------------------ */
/* Server functions (client-visible stubs)                             */
/* ------------------------------------------------------------------ */

/**
 * Log in with the admin password. Constant-time comparison against the salted
 * scrypt hash; the same generic failure is returned whether the password is
 * wrong, the field is missing, or no secret file exists (no field leaking).
 * On success returns a raw Response whose `set-cookie` header installs the
 * session cookie.
 */
export const login = createServerFn({ method: "POST" }).handler(
  async ({ data }: { data: { password?: string } }): Promise<Response> => {
    const attempt = String(data.password ?? "");
    let secret: AdminSecret;
    let storedHash: Buffer;
    try {
      secret = await loadSecret();
      storedHash = Buffer.from(secret.passwordHash, "hex");
    } catch {
      console.error("[admin] login failed: secret file unavailable");
      return jsonResponse({ ok: false, error: "invalid_credentials" }, 401);
    }

    let ok = false;
    try {
      const candidate = scryptSync(attempt, Buffer.from(secret.passwordSalt, "hex"), 64);
      ok =
        candidate.length === storedHash.length && timingSafeEqual(candidate, storedHash);
    } catch {
      ok = false;
    }

    if (!ok) return jsonResponse({ ok: false, error: "invalid_credentials" }, 401);

    const token = randomBytes(32).toString("base64url");
    const exp = Math.floor(Date.now() / 1000) + SESSION_SECONDS;
    const headers = new Headers({ "content-type": "application/json" });
    headers.append("set-cookie", sessionCookieHeader(secret.sessionKey, token, exp));
    return new Response(JSON.stringify({ ok: true }), { status: 200, headers });
  },
);

/** Log out: clear the session cookie (expired immediately). */
export const logout = createServerFn({ method: "POST" }).handler(
  async (): Promise<Response> => {
    const headers = new Headers({ "content-type": "application/json" });
    headers.append("set-cookie", expiredCookieHeader());
    return new Response(JSON.stringify({ ok: true }), { status: 200, headers });
  },
);

/** Lightweight auth check used by the /admin pages to gate navigation. */
export const getSession = createServerFn({ method: "GET" }).handler(async () => {
  return { authed: await isAuthenticated() };
});

export const sendTestEmail = createServerFn({ method: "POST" }).handler(async () => {
  if (!(await isAuthenticated())) return unauthorizedResponse();
  const recipient = process.env.FORWARD_EMAIL || "";
  if (!recipient) return { ok: false, error: "FORWARD_EMAIL not configured", messageId: null };
  const subject = "Hill Country Stump Co Test Email";
  let result = await sendEmail({ to: recipient, subject, body: "This is a test email generated by the production website." });
  await logEmail({ leadId: "test", customerName: "", recipient, subject, httpStatus: result.status, messageId: result.messageId, error: result.error, retryCount: 0, event: result.error === "RESEND_API_KEY not configured" ? "not-configured" : "attempt" });
  if (!result.ok && result.error !== "RESEND_API_KEY not configured") {
    result = await sendEmail({ to: recipient, subject, body: "This is a test email generated by the production website." });
    await logEmail({ leadId: "test", customerName: "", recipient, subject, httpStatus: result.status, messageId: result.messageId, error: result.error, retryCount: 1, event: result.ok ? "success" : "failed" });
  }
  return { ok: result.ok, messageId: result.messageId, error: result.error };
});

/**
 * List leads with pipeline status counts. REQUIRES a valid session — returns
 * HTTP 401 (as a raw Response) when the caller is not authenticated.
 * Filters: `status` (a LEAD_STATUSES value) and `source` (a LEAD_SOURCES
 * value); both optional. Counts reflect the currently selected source so tab
 * numbers always match the visible list.
 */
export const listLeads = createServerFn({ method: "POST" }).handler(
  async ({
    data,
  }: {
    data: { status?: string; source?: string };
  }): Promise<LeadListResult | Response> => {
    if (!(await isAuthenticated())) return unauthorizedResponse();

    const all = await readAllLeads();
    const status = data.status ?? "";
    const source = data.source ?? "";

    const matches = (l: LeadRow) =>
      (!status || l.status === status) && (!source || l.lead_source === source);

    const counts = Object.fromEntries(
      LEAD_STATUSES.map((s) => [
        s,
        all.filter((l) => l.status === s && (!source || l.lead_source === source))
          .length,
      ]),
    ) as Record<LeadStatus, number>;

    return {
      leads: all.filter(matches),
      counts,
      total: all.length,
    };
  },
);

/**
 * Delete a lead (used for lifecycle testing and housekeeping). REQUIRES a
 * valid session; returns 401 when unauthenticated.
 */
export const getLead = createServerFn({ method: "POST" }).handler(
  async ({ data }: { data: { id: string } }) => {
    if (!(await isAuthenticated())) return unauthorizedResponse();
    const payload = await readLeadPayload(String(data.id ?? ""));
    return payload ? { ...(payload as object), id: String(data.id) } : jsonResponse({ error: "not_found" }, 404);
  },
);

export const updateLead = createServerFn({ method: "POST" }).handler(
  async ({ data }: { data: { id: string; patch: Record<string, unknown> } }) => {
    if (!(await isAuthenticated())) return unauthorizedResponse();
    const id = String(data.id ?? "");
    const patch = data.patch ?? {};
    if (patch.status && !(LEAD_STATUSES as readonly string[]).includes(String(patch.status))) return jsonResponse({ error: "invalid_status" }, 400);
    const allowed = ["status", "notes", "estimate", "deposit", "balance", "stripe_status", "email"];
    let result: Record<string, unknown> | null = null;
    let failure: Response | null = null;
    const previous = leadWriteQueues.get(id) ?? Promise.resolve();
    const current = previous.then(async () => {
      const existing = await readLeadPayload(id);
      if (!existing) { failure = jsonResponse({ error: "not_found" }, 404); return; }
      const next = { ...existing };
      for (const key of allowed) if (key in patch) next[key] = patch[key];
      await writeLeadPayload(id, next);
      result = next;
    });
    leadWriteQueues.set(id, current);
    try { await current; } finally {
      if (leadWriteQueues.get(id) === current) leadWriteQueues.delete(id);
    }
    if (failure) return failure;
    return { ok: true, lead: result };
  },
);

export const getLeadPhoto = createServerFn({ method: "POST" }).handler(
  async ({ data }: { data: { leadId: string; filename: string } }): Promise<Response> => {
    if (!(await isAuthenticated())) return unauthorizedResponse();
    const leadId = String(data.leadId ?? "");
    const filename = basename(String(data.filename ?? ""));
    const payload = await readLeadPayload(leadId);
    const photos = Array.isArray(payload?.photos) ? payload.photos.map(String) : [];
    const match = photos.find((p) => basename(p) === filename);
    if (!match) return jsonResponse({ error: "not_found" }, 404);
    try {
      const bytes = await readFile(join(process.cwd(), "data", "uploads", leadId, filename));
      const type = filename.endsWith(".png") ? "image/png" : filename.endsWith(".webp") ? "image/webp" : "image/jpeg";
      return new Response(bytes, { headers: { "content-type": type, "cache-control": "private, no-store" } });
    } catch { return jsonResponse({ error: "not_found" }, 404); }
  },
);

export const deleteLead = createServerFn({ method: "POST" }).handler(
  async ({ data }: { data: { id: string } }): Promise<{ ok: boolean } | Response> => {
    if (!(await isAuthenticated())) return unauthorizedResponse();
    const id = String(data.id ?? "");
    if (!id) return jsonResponse({ error: "missing_id" }, 400);

    if (process.env.DATABASE_URL) {
      try {
        const db = sql();
        await db`delete from leads where id = ${id}`;
        return { ok: true };
      } catch (err) {
        console.error("[admin] DATABASE delete failed, trying file:", err);
      }
    }
    try {
      await rm(join(LEADS_DIR, `${id}.json`), { force: true });
      await rm(join(process.cwd(), "data", "uploads", id), { recursive: true, force: true });
      return { ok: true };
    } catch (err) {
      console.error(`[admin] failed to delete lead ${id}:`, err);
      return jsonResponse({ error: "delete_failed" }, 500);
    }
  },
);
