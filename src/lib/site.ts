/**
 * Central business configuration for Hill Country Stump Co.
 *
 * Every page, header, footer, and SEO tag reads phone / email / hours / service
 * area from this file, so there is exactly one place to update them.
 *
 * ⚠️ PLACEHOLDERS — the owner has not provided real values yet:
 *   - PHONE_DISPLAY / PHONE_TEL  : (830) 555-0134 / +18305550134
 *   - EMAIL                      : hello@hillcountrystumpco.com (placeholder domain)
 *   - HOURS_LABEL                : Mon–Sat, 8:00 AM – 6:00 PM
 * Swap in the real values here and they update everywhere on the site.
 */

export const SITE_NAME = "Hill Country Stump Co.";
export const SITE_TAGLINE =
  "Professional stump grinding for the Texas Hill Country";

/** Published preview domain — used as the canonical base URL for SEO tags. */
export const SITE_URL = "https://03018e6f087ad697c7b5bbd1c71cadd6.ctonew.app";

/** PLACEHOLDER — display phone number (owner to confirm). */
export const PHONE_DISPLAY = "(830) 555-0134";
/** PLACEHOLDER — phone in E.164 tel: format (owner to confirm). */
export const PHONE_TEL = "+18305550134";

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
  { href: "/contact", label: "Contact" },
  { href: "/about", label: "About" },
] as const;
