import { afterEach, describe, expect, test } from "bun:test";
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { logEmail } from "./email";

/**
 * logEmail isolation tests.
 *
 * Production (Vercel serverless) runs with a read-only, ephemeral filesystem —
 * a file-based log can never work there and must never be attempted. The fix
 * routes production logEmail to the function's stdout (Vercel function logs)
 * and never touches the filesystem; the local file log (data/logs/email.log)
 * remains development-only. Either way logEmail must never throw, so it can
 * never block email delivery.
 *
 * Each test runs in a throwaway cwd so no real `data/` directory is created
 * inside the repo, and restores NODE_ENV/cwd/console afterwards.
 */
const ORIGINAL_NODE_ENV = process.env.NODE_ENV;
const ORIGINAL_CWD = process.cwd();
let tmpDir: string | null = null;

function makeTmpCwd(): string {
  tmpDir = mkdtempSync(join(tmpdir(), "hc-email-log-"));
  process.chdir(tmpDir);
  return tmpDir;
}

afterEach(() => {
  if (ORIGINAL_NODE_ENV === undefined) delete process.env.NODE_ENV;
  else process.env.NODE_ENV = ORIGINAL_NODE_ENV;
  process.chdir(ORIGINAL_CWD);
  if (tmpDir) {
    rmSync(tmpDir, { recursive: true, force: true });
    tmpDir = null;
  }
});

describe("logEmail — production: no filesystem access", () => {
  test("logs the structured record to console and never creates any file/dir", async () => {
    process.env.NODE_ENV = "production";
    const cwd = makeTmpCwd();
    const lines: string[] = [];
    const origLog = console.log;
    console.log = (...args: unknown[]) => {
      lines.push(args.map(String).join(" "));
    };
    try {
      await logEmail({ leadId: "l1", event: "success", httpStatus: 200 });
      await logEmail({ leadId: "l2", event: "failed", httpStatus: 422, error: "provider rejected" });
      await logEmail({ leadId: "l3", event: "not-configured" });
    } finally {
      console.log = origLog;
    }
    // The function must not have touched the filesystem at all.
    expect(existsSync(join(cwd, "data"))).toBe(false);
    expect(existsSync(join(cwd, "email.log"))).toBe(false);
    // Every call produced exactly one console line with the [email-log] prefix.
    expect(lines.length).toBe(3);
    expect(lines[0]).toContain("[email-log]");
    expect(lines[0]).toContain('"event":"success"');
    expect(lines[1]).toContain('"event":"failed"');
    expect(lines[2]).toContain('"event":"not-configured"');
  });

  test("resolves (never rejects) even when console output is unavailable", async () => {
    process.env.NODE_ENV = "production";
    makeTmpCwd();
    const origLog = console.log;
    console.log = () => {
      throw new Error("console unavailable");
    };
    try {
      await expect(logEmail({ leadId: "l4" })).resolves.toBeUndefined();
    } finally {
      console.log = origLog;
    }
  });
});

describe("logEmail — development: local file log", () => {
  test("writes the record to data/logs/email.log under the cwd", async () => {
    process.env.NODE_ENV = "development";
    const cwd = makeTmpCwd();
    await logEmail({ leadId: "l5", event: "attempt", httpStatus: 0 });
    const logPath = join(cwd, "data", "logs", "email.log");
    expect(existsSync(logPath)).toBe(true);
    const content = readFileSync(logPath, "utf8");
    expect(content).toContain('"event":"attempt"');
    expect(content).toContain('"leadId":"l5"');
    expect(content.trim().endsWith("}")).toBe(true);
  });

  test("a filesystem failure is isolated — logEmail resolves and logs the failure", async () => {
    process.env.NODE_ENV = "development";
    const cwd = makeTmpCwd();
    // Make the log path unwritable: `data/logs` exists as a FILE, so mkdir
    // (and appendFile) must fail. This simulates the read-only production
    // filesystem for the dev file-logging branch.
    const dataDir = join(cwd, "data");
    mkdirSync(dataDir, { recursive: true });
    writeFileSync(join(dataDir, "logs"), "not a directory");
    const errors: string[] = [];
    const origErr = console.error;
    console.error = (...args: unknown[]) => {
      errors.push(args.map(String).join(" "));
    };
    try {
      await expect(logEmail({ leadId: "l6" })).resolves.toBeUndefined();
    } finally {
      console.error = origErr;
    }
    expect(errors.length).toBe(1);
    expect(errors[0]).toContain("[email] log failed");
  });
});
