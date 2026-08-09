/**
 * Admin secret loading for the Hill Country Stump Co. site.
 *
 * Server-only module: imported ONLY by src/lib/admin.ts (which imports it
 * inside the server-function layer, never re-exports it). Nothing in the
 * client bundle may import this file — it uses node:fs/node:path at module
 * scope, so any client import would break the browser build.
 *
 * In production the admin secret MUST come from the ADMIN_SECRET_JSON
 * environment variable (Vercel); when it is missing, empty, or malformed the
 * call throws so authentication fails closed. The gitignored
 * data/admin.secret.json file (created by `bun run admin:password`) is read
 * only in local development.
 */
import { readFile } from "node:fs/promises";
import { join } from "node:path";

export type AdminSecret = {
  passwordHash: string; // hex of scrypt(password, salt, 64)
  passwordSalt: string; // hex
  sessionKey: string; // hex, HMAC key for session tokens
  createdAt: string;
};

const SECRET_PATH = join(process.cwd(), "data", "admin.secret.json");

/**
 * Parse and validate the admin secret JSON. Requires passwordHash,
 * passwordSalt, and sessionKey; throws on invalid JSON or missing fields.
 */
export function parseAdminSecret(raw: string): AdminSecret {
  let parsed: Partial<AdminSecret>;
  try {
    parsed = JSON.parse(raw) as Partial<AdminSecret>;
  } catch {
    throw new Error("admin secret is not valid JSON");
  }
  if (!parsed.passwordHash || !parsed.passwordSalt || !parsed.sessionKey) {
    throw new Error(
      "admin secret is malformed — passwordHash, passwordSalt, and sessionKey are required",
    );
  }
  return parsed as AdminSecret;
}

/**
 * Load the admin secret. Production: ADMIN_SECRET_JSON env var only, failing
 * closed when missing/empty/malformed. Development: data/admin.secret.json
 * fallback. `secretPath` is a test-only override.
 */
export async function loadSecret(
  secretPath: string = SECRET_PATH,
): Promise<AdminSecret> {
  const envJson = process.env.ADMIN_SECRET_JSON;
  if (envJson) {
    return parseAdminSecret(envJson);
  }
  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "admin secret not configured — set ADMIN_SECRET_JSON in the production environment",
    );
  }
  let raw: string;
  try {
    raw = await readFile(secretPath, "utf8");
  } catch {
    throw new Error(
      "admin secret file not found — run `bun run admin:password` to create data/admin.secret.json",
    );
  }
  return parseAdminSecret(raw);
}
