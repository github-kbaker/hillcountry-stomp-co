/**
 * Admin password management for the Hill Country Stump Co. site.
 *
 *   bun run admin:password        # create/rotate data/admin.secret.json and print the new password
 *
 * Writes a salted scrypt hash of a fresh random password plus a random session
 * HMAC key to <site>/data/admin.secret.json (gitignored — never committed).
 * Prints the one-time plaintext password to stdout; the owner should save it
 * in a password manager. The existing session key is preserved when the file
 * already exists so rotating the password doesn't log out the current session.
 */
import { randomBytes, scryptSync } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";

const SECRET_PATH = join(process.cwd(), "data", "admin.secret.json");

type AdminSecret = {
  passwordHash: string;
  passwordSalt: string;
  sessionKey: string;
  createdAt: string;
};

const password = randomBytes(12).toString("base64url"); // 16 chars, URL-safe
const salt = randomBytes(16);
const hash = scryptSync(password, salt, 64);

let sessionKey = randomBytes(32).toString("hex");
try {
  const existing = JSON.parse(await readFile(SECRET_PATH, "utf8")) as Partial<AdminSecret>;
  if (existing.sessionKey) sessionKey = existing.sessionKey;
} catch {
  // no existing secret — fresh key is fine
}

const secret: AdminSecret = {
  passwordHash: hash.toString("hex"),
  passwordSalt: salt.toString("hex"),
  sessionKey,
  createdAt: new Date().toISOString(),
};

await mkdir(join(process.cwd(), "data"), { recursive: true });
await writeFile(SECRET_PATH, JSON.stringify(secret, null, 2), { mode: 0o600 });

console.log("Wrote data/admin.secret.json (gitignored).");
console.log("");
console.log("ADMIN PASSWORD (one-time, save it now):");
console.log(password);
console.log("");
