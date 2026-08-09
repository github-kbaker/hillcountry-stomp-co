/**
 * Unit tests for the admin secret-loading path in src/lib/admin-secret.ts
 * (Vercel admin auth via ADMIN_SECRET_JSON).
 * Run: bun test src/lib/admin-auth.test.ts
 *
 * All values in this file are SYNTHETIC test fixtures — no real credentials.
 */
import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { loadSecret, parseAdminSecret } from "./admin-secret";

/** Synthetic fixtures (hex strings, not real secrets). */
const HASH = "aa".repeat(64);
const SALT = "bb".repeat(16);
const KEY = "cc".repeat(32);
const FAKE_SECRET = { passwordHash: HASH, passwordSalt: SALT, sessionKey: KEY };

let clean: { admin: string | undefined; nodeEnv: string | undefined };
let dir: string;

beforeEach(async () => {
  clean = { admin: process.env.ADMIN_SECRET_JSON, nodeEnv: process.env.NODE_ENV };
  dir = await mkdtemp(join(tmpdir(), "admin-secret-test-"));
});

afterEach(async () => {
  await rm(dir, { recursive: true, force: true });
  if (clean.admin === undefined) delete process.env.ADMIN_SECRET_JSON;
  else process.env.ADMIN_SECRET_JSON = clean.admin;
  if (clean.nodeEnv === undefined) delete process.env.NODE_ENV;
  else process.env.NODE_ENV = clean.nodeEnv;
});

describe("parseAdminSecret", () => {
  test("accepts a valid secret JSON", () => {
    const parsed = parseAdminSecret(JSON.stringify(FAKE_SECRET));
    expect(parsed.passwordHash).toBe(HASH);
    expect(parsed.passwordSalt).toBe(SALT);
    expect(parsed.sessionKey).toBe(KEY);
  });

  test("rejects invalid JSON", () => {
    expect(() => parseAdminSecret("{not json")).toThrow(/not valid JSON/);
  });

  test("rejects JSON missing a required field", () => {
    const { sessionKey: _omit, ...rest } = FAKE_SECRET;
    expect(() => parseAdminSecret(JSON.stringify(rest))).toThrow(/malformed/);
    expect(() => parseAdminSecret('{"passwordHash":"aa"}')).toThrow(/malformed/);
  });

  test("rejects empty required fields", () => {
    expect(() =>
      parseAdminSecret(
        JSON.stringify({ passwordHash: "", passwordSalt: SALT, sessionKey: KEY }),
      ),
    ).toThrow(/malformed/);
  });
});

describe("loadSecret — ADMIN_SECRET_JSON", () => {
  test("succeeds with a valid env secret in production", async () => {
    process.env.NODE_ENV = "production";
    process.env.ADMIN_SECRET_JSON = JSON.stringify(FAKE_SECRET);
    const secret = await loadSecret();
    expect(secret).toEqual(FAKE_SECRET);
  });

  test("fails closed on malformed JSON in production", async () => {
    process.env.NODE_ENV = "production";
    process.env.ADMIN_SECRET_JSON = "{oops";
    await expect(loadSecret()).rejects.toThrow(/not valid JSON/);
  });

  test("fails closed on a missing field in production", async () => {
    process.env.NODE_ENV = "production";
    process.env.ADMIN_SECRET_JSON = JSON.stringify({ passwordHash: HASH });
    await expect(loadSecret()).rejects.toThrow(/malformed/);
  });

  test("fails closed when the env var is missing in production", async () => {
    process.env.NODE_ENV = "production";
    delete process.env.ADMIN_SECRET_JSON;
    await expect(loadSecret()).rejects.toThrow(/ADMIN_SECRET_JSON/);
  });

  test("fails closed when the env var is empty in production", async () => {
    process.env.NODE_ENV = "production";
    process.env.ADMIN_SECRET_JSON = "";
    await expect(loadSecret()).rejects.toThrow(/ADMIN_SECRET_JSON/);
  });
});

describe("loadSecret — local development fallback", () => {
  test("reads data/admin.secret.json when the env var is unset in dev", async () => {
    process.env.NODE_ENV = "development";
    delete process.env.ADMIN_SECRET_JSON;
    const secretFile = join(dir, "admin.secret.json");
    await writeFile(secretFile, JSON.stringify(FAKE_SECRET, null, 2), { mode: 0o600 });
    const secret = await loadSecret(secretFile);
    expect(secret).toEqual(FAKE_SECRET);
  });

  test("throws when the local file is missing in dev", async () => {
    process.env.NODE_ENV = "development";
    delete process.env.ADMIN_SECRET_JSON;
    await expect(loadSecret(join(dir, "missing.json"))).rejects.toThrow(/file not found/);
  });
});
