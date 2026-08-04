/**
 * Central business configuration for Hill Country Stump Co.
 *
 * Every page, header, footer, and SEO tag reads phone / email / hours / service
 * area from this file, so there is exactly one place to update them.
 *
 * BUSINESS_PHONE — the owner's phone number and the ONLY phone setting to edit.
 * It defaults to EMPTY, which turns the phone OFF across the whole site: no
 * number text, no tel: links, and no call CTAs anywhere. Every call button
 * becomes a "Get Free Estimate" link, and LocalBusiness JSON-LD omits the
 * `telephone` property.
 *
 * Set BUSINESS_PHONE to the real number (e.g. "(###) ###-####") and the number
 * automatically lights up in the header, footer, Contact page, and hero, tel:
 * links start working, and `telephone` is added to the LocalBusiness schema on
 * the Home and Contractor Partnerships pages. No other file needs to change.
 *
 * EMAIL and HOURS_LABEL are still placeholders the owner will confirm; they are
 * outside the scope of the phone rollout.
 */

export const SITE_NAME = "Hill Country Stump Co.";
export const SITE_TAGLINE =
  "Professional stump grinding for the Texas Hill Country";

/** Published preview domain — used as the canonical base URL for SEO tags. */
export const SITE_URL = "https://03018e6f087ad697c7b5bbd1c71cadd6.ctonew.app";

/**
 * The business phone number exactly as it should be displayed, e.g. "(###) ###-####".
 * Defaults to "" — while empty, no phone number, tel: link, or call CTA appears
 * anywhere on the site, and every call button shows "Get Free Estimate" instead.
 */
export const BUSINESS_PHONE = "";

/**
 * True when a real phone number is configured. This is the single condition
 * every consumer uses to decide whether to show phone UI or the estimate flow.
 */
export const HAS_PHONE = BUSINESS_PHONE.trim().length > 0;

/**
 * Derive an E.164 href (for tel: links) from a display phone number: strip all
 * non-digits, and prefix the US country code when the result is a 10-digit
 * number. Returns "" for empty or unparseable input so a tel: link is never
 * emitted without a configured number.
 */
function toE164(display: string): string {
  const digits = display.replace(/\D/g, "");
  return digits.length === 10 ? `+1${digits}` : "";
}

/** Phone in E.164 format for tel: links — "" when no phone is configured. */
export const PHONE_TEL = toE164(BUSINESS_PHONE);

/** PLACEHOLDER — email (owner to confirm). */
export const EMAIL = "hello@hillcountrystumpco.com";

/** PLACEHOLDER — business hours (owner to confirm). */
export const HOURS_LABEL = "Mon–Sat, 8:00 AM – 6:00 PM";

/** Anchor town used for the map embed and local SEO. */
export const CITY_HUB = "Fredericksburg, Texas";

/** Cities and towns served across the Texas Hill Country. */
export const SERVICE_AREA = [
  "Fredericksburg",
  "Kerrville",
  "Boerne",
  "Comfort",
  "Johnson City",
  "Blanco",
  "Stonewall",
  "Harper",
  "Mason",
  "Llano",
  "Dripping Springs",
  "Austin",
  "San Antonio",
] as const;

/**
 * Cities with their own local-SEO service-area pages. Key is the city name as
 * it appears in SERVICE_AREA; value is the URL slug under /service-area/.
 * Cities not listed here are served but have no dedicated page yet.
 */
export const SERVICE_AREA_PAGES: Record<string, string> = {
  Fredericksburg: "fredericksburg",
  Kerrville: "kerrville",
  Boerne: "boerne",
  Austin: "austin",
  "San Antonio": "san-antonio",
};

export const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/estimate", label: "Free Estimate" },
  { href: "/services", label: "Services" },
  { href: "/contact", label: "Contact" },
  { href: "/about", label: "About" },
] as const;
