import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";

import { pageHead } from "~/lib/seo";
import { PHONE_DISPLAY, PHONE_TEL, SITE_NAME } from "~/lib/site";

export const Route = createFileRoute("/estimate/thank-you")({
  head: () =>
    pageHead({
      title: `Request Received | ${SITE_NAME} — Texas Hill Country`,
      description:
        "Your free estimate request has been received. Hill Country Stump Co. will get back to you by phone or email.",
      path: "/estimate/thank-you",
    }),
  component: ThankYou,
});

function ThankYou() {
  const [refId, setRefId] = useState<string | null>(null);

  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    const id = p.get("lead");
    if (id) setRefId(id.slice(0, 8).toUpperCase());
  }, []);

  return (
    <div className="mx-auto max-w-2xl px-4 py-16 text-center sm:px-6 lg:py-24">
      <span
        aria-hidden="true"
        className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-forest-700 text-3xl text-limestone-50"
      >
        ✓
      </span>
      <h1 className="mt-6 font-display text-3xl font-bold tracking-tight text-forest-900 sm:text-4xl">
        Your request is in!
      </h1>
      <p className="mt-4 text-lg leading-relaxed text-charcoal-500">
        Thanks for reaching out to {SITE_NAME}. We've received your stump
        details and photos, and we'll get back to you by phone or email to walk
        through your free estimate and answer any questions.
      </p>
      {refId && (
        <p className="mt-4 text-sm font-medium text-charcoal-700">
          Reference: <span className="font-bold">{refId}</span>
        </p>
      )}
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <a href={`tel:${PHONE_TEL}`} className="btn-primary">
          Call {PHONE_DISPLAY}
        </a>
        <Link to="/" className="btn-charcoal">
          Back to Home
        </Link>
      </div>
      <p className="mt-8 text-sm text-charcoal-500">
        Need to add more photos or change a detail? Just reply to our call or
        email — we're happy to update your request.
      </p>
    </div>
  );
}
