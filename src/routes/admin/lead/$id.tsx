import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect } from "react";

import { getSession } from "~/lib/admin";
import { SITE_NAME } from "~/lib/site";

/**
 * /admin/lead/<id> — STUB for part 2.
 *
 * The full lead detail view (photos, notes, status control) ships in the next
 * delegation. This page only confirms the route exists, carries the noindex
 * robots tag, and bounces unauthenticated visitors to the login page.
 */
export const Route = createFileRoute("/admin/lead/$id")({
  head: () => ({
    meta: [
      { title: `Lead Detail | ${SITE_NAME} Admin` },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: LeadDetailStub,
});

function LeadDetailStub() {
  const { id } = Route.useParams();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const session = await getSession();
        if (!cancelled && !session.authed) window.location.replace("/admin/login");
      } catch {
        // Leave the page as-is; data calls are protected server-side anyway.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <div className="card">
        <p className="text-sm text-charcoal-500">
          <Link to="/admin" className="text-forest-700 hover:underline">
            ← Back to dashboard
          </Link>
        </p>
        <h1 className="mt-3 font-display text-2xl font-bold text-forest-900">
          Lead detail
        </h1>
        <p className="mt-2 text-charcoal-700">
          Lead <code className="rounded bg-limestone-100 px-1.5 py-0.5 font-mono text-sm">{id}</code>
        </p>
        <div className="mt-6 rounded-lg border border-limestone-300 bg-limestone-100 p-4 text-sm text-charcoal-700">
          The full lead detail view — stump photos, notes, and pipeline status
          controls — is coming in the next update.
        </div>
      </div>
    </div>
  );
}
