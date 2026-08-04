import { Link } from "@tanstack/react-router";

import { BUSINESS_PHONE, HAS_PHONE, PHONE_TEL } from "~/lib/site";

/**
 * Business phone call CTA. When a phone number is configured (HAS_PHONE) it
 * renders a tel: link; with no phone configured it renders a "Get Free
 * Estimate" link to /estimate styled with the SAME className, so a call button
 * never appears without a real number behind it. This is the single place the
 * call-CTA fallback is defined.
 */
export function PhoneCta({ className }: { className?: string }) {
  if (!HAS_PHONE) {
    return (
      <Link to="/estimate" className={className}>
        Get Free Estimate
      </Link>
    );
  }
  return (
    <a href={`tel:${PHONE_TEL}`} className={className}>
      Call {BUSINESS_PHONE}
    </a>
  );
}
