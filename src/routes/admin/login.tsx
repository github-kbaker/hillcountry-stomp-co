import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import type { FormEvent } from "react";

import { login } from "~/lib/admin";
import { SITE_NAME } from "~/lib/site";

/**
 * /admin/login — the admin login page.
 *
 * Submits the password to the `login` server function, which verifies it
 * server-side against the salted scrypt hash and, on success, returns a raw
 * Response whose `set-cookie` header installs the httpOnly session cookie.
 * The page then navigates to /admin. Wrong passwords get the same generic
 * error as any other failure — nothing reveals which field was wrong.
 *
 * noindex — the admin area must never appear in search results.
 */
export const Route = createFileRoute("/admin/login")({
  head: () => ({
    meta: [
      { title: `Admin Login | ${SITE_NAME}` },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AdminLogin,
});

function AdminLogin() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const res = await login({ data: { password } });
      if (res.ok) {
        window.location.href = "/admin";
        return;
      }
      setError("Incorrect password. Please try again.");
    } catch {
      setError("Sign-in failed. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-[70vh] w-full max-w-md flex-col justify-center px-4 py-16 sm:px-6">
      <div className="card">
        <div className="mb-6 text-center">
          <h1 className="font-display text-2xl font-bold text-forest-900">
            {SITE_NAME}
          </h1>
          <p className="mt-1 text-sm font-semibold uppercase tracking-[0.2em] text-charcoal-500">
            Admin Sign In
          </p>
        </div>
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label htmlFor="password" className="label">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input"
              placeholder="Enter the admin password"
            />
          </div>
          {error && (
            <p role="alert" className="field-error">
              {error}
            </p>
          )}
          <button type="submit" disabled={busy} className="btn-primary w-full">
            {busy ? "Signing in…" : "Sign In"}
          </button>
        </form>
      </div>
      <p className="mt-6 text-center text-sm text-charcoal-500">
        Authorized personnel only. All access is logged and verified
        server-side.
      </p>
    </div>
  );
}
