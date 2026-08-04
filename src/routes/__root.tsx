import { createRootRoute, HeadContent, Link, Outlet, Scripts } from "@tanstack/react-router";
import type { ReactNode } from "react";

import appCss from "~/styles/app.css?url";
import {
  BUSINESS_PHONE,
  EMAIL,
  HAS_PHONE,
  HOURS_LABEL,
  NAV_LINKS,
  PHONE_TEL,
  SITE_NAME,
  SITE_TAGLINE,
} from "~/lib/site";

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { name: "theme-color", content: "#1b3d27" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "icon", href: "/favicon.svg", type: "image/svg+xml" },
    ],
  }),
  component: RootComponent,
});

function RootComponent() {
  return (
    <RootDocument>
      <Outlet />
    </RootDocument>
  );
}

function RootDocument({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[60] focus:rounded-lg focus:bg-forest-800 focus:px-4 focus:py-2 focus:text-limestone-50"
        >
          Skip to content
        </a>
        <div className="flex min-h-dvh flex-col bg-limestone-100">
          <Header />
          <main id="main" className="flex-1">
            {children}
          </main>
          <Footer />
        </div>
        <MobileCtaBar />
        <Scripts />
      </body>
    </html>
  );
}

function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-forest-800 bg-forest-900/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl flex-col px-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
        <div className="flex items-center justify-between py-3">
          <Link to="/" aria-label={`${SITE_NAME} — home`} className="flex items-center gap-2.5 rounded-md focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-limestone-300">
            <StumpLogo className="h-10 w-10 shrink-0" />
            <span className="leading-tight">
              <span className="block font-display text-lg font-bold text-limestone-50">
                Hill Country
              </span>
              <span className="block text-[0.68rem] font-semibold uppercase tracking-[0.24em] text-limestone-300">
                Stump Co.
              </span>
            </span>
          </Link>
          {HAS_PHONE && (
            <a
              href={`tel:${PHONE_TEL}`}
              className="btn-primary ml-auto px-3.5 py-2 text-sm lg:hidden"
            >
              Call Now
            </a>
          )}
        </div>
        <nav aria-label="Main" className="flex items-center gap-1 pb-3 text-sm lg:pb-0">
          {NAV_LINKS.map((l) => (
            <Link
              key={l.href}
              to={l.href}
              className="rounded-md px-2.5 py-1.5 font-medium text-limestone-100 transition-colors hover:bg-forest-800 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-limestone-300 [&.active]:bg-forest-800 [&.active]:text-white"
            >
              {l.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}

function Footer() {
  return (
    <footer className="bg-forest-950 pb-24 pt-12 text-limestone-200 md:pb-10">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 sm:px-6 md:grid-cols-2 lg:grid-cols-4 lg:px-8">
        <div>
          <div className="flex items-center gap-2">
            <StumpLogo className="h-9 w-9" />
            <span className="font-display text-lg font-bold text-limestone-50">
              Hill Country Stump Co.
            </span>
          </div>
          <p className="mt-3 text-sm leading-relaxed text-limestone-300">
            {SITE_TAGLINE}. Locally owned and operated — free estimates, honest
            work, and a clean job site.
          </p>
        </div>
        <div>
          <h2 className="text-sm font-bold uppercase tracking-widest text-limestone-400">
            Explore
          </h2>
          <ul className="mt-3 space-y-2 text-sm">
            {NAV_LINKS.map((l) => (
              <li key={l.href}>
                <Link to={l.href} className="text-limestone-200 hover:text-white">
                  {l.label}
                </Link>
              </li>
            ))}
            <li>
              <Link
                to="/contractors"
                className="text-limestone-200 hover:text-white"
              >
                Contractor Partnerships
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <h2 className="text-sm font-bold uppercase tracking-widest text-limestone-400">
            Services
          </h2>
          <ul className="mt-3 space-y-2 text-sm text-limestone-200">
            <li>Residential stump grinding</li>
            <li>Commercial stump grinding</li>
            <li>Ranch &amp; acreage clearing</li>
            <li>Grinding depth options</li>
          </ul>
        </div>
        <div>
          <h2 className="text-sm font-bold uppercase tracking-widest text-limestone-400">
            Contact
          </h2>
          <ul className="mt-3 space-y-2 text-sm">
            {HAS_PHONE && (
              <li>
                <a href={`tel:${PHONE_TEL}`} className="font-semibold text-limestone-50 hover:text-white">
                  {BUSINESS_PHONE}
                </a>
              </li>
            )}
            <li>
              <a href={`mailto:${EMAIL}`} className="text-limestone-200 hover:text-white">
                {EMAIL}
              </a>
            </li>
            <li>{HOURS_LABEL}</li>
          </ul>
          <Link to="/estimate" className="btn-primary mt-4 px-4 py-2 text-sm">
            Get Free Estimate
          </Link>
        </div>
      </div>
      <div className="mx-auto mt-10 max-w-6xl border-t border-forest-800 px-4 pt-6 text-xs text-limestone-400 sm:px-6 lg:px-8">
        <p>
          © {new Date().getFullYear()} {SITE_NAME}. All rights reserved. Serving
          the Texas Hill Country.
        </p>
      </div>
    </footer>
  );
}

/** Sticky call/estimate bar — visible on every page at mobile widths. */
function MobileCtaBar() {
  return (
    <div className="fixed inset-x-0 bottom-0 z-50 border-t border-forest-800 bg-forest-900 md:hidden">
      <div className={HAS_PHONE ? "grid grid-cols-2" : "grid grid-cols-1"}>
        {HAS_PHONE && (
          <a
            href={`tel:${PHONE_TEL}`}
            className="flex items-center justify-center gap-2 py-3.5 text-sm font-bold text-limestone-50 transition-colors active:bg-forest-800"
          >
            <PhoneIcon className="h-4 w-4" aria-hidden="true" />
            Call Now
          </a>
        )}
        <Link
          to="/estimate"
          className="flex items-center justify-center gap-2 bg-forest-600 py-3.5 text-sm font-bold text-white transition-colors active:bg-forest-700"
        >
          Get Free Estimate
        </Link>
      </div>
    </div>
  );
}

function StumpLogo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" fill="none" className={className} aria-hidden="true">
      <rect width="64" height="64" rx="14" fill="#1b3d27" />
      <path d="M20 52v-20h24v20z" fill="#8a6749" />
      <ellipse cx="32" cy="31" rx="14" ry="7" fill="#c4b28d" />
      <ellipse cx="32" cy="27" rx="14" ry="7" fill="#3c8152" />
      <circle cx="26" cy="25" r="2.1" fill="#15301f" />
      <circle cx="32" cy="23" r="2.1" fill="#15301f" />
      <circle cx="38" cy="25" r="2.1" fill="#15301f" />
    </svg>
  );
}

function PhoneIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className={className} aria-hidden="true">
      <path
        fillRule="evenodd"
        d="M2 3.5A1.5 1.5 0 0 1 3.5 2h1.148a1.5 1.5 0 0 1 1.465 1.175l.716 3.223a1.5 1.5 0 0 1-1.052 1.767l-.933.267c-.41.117-.643.55-.48.95a11.542 11.542 0 0 0 6.254 6.254c.395.163.833-.07.95-.48l.267-.933a1.5 1.5 0 0 1 1.767-1.052l3.223.716A1.5 1.5 0 0 1 18 15.352V16.5a1.5 1.5 0 0 1-1.5 1.5H15c-1.149 0-2.263-.15-3.326-.43A13.022 13.022 0 0 1 2.43 8.326 13.019 13.019 0 0 1 2 5V3.5Z"
        clipRule="evenodd"
      />
    </svg>
  );
}
