import { Link } from "@tanstack/react-router";

import { breadcrumbSchema, faqPageSchema } from "~/lib/seo";
import { HOURS_LABEL, PHONE_DISPLAY, PHONE_TEL, SITE_NAME } from "~/lib/site";

/**
 * Content model for a local-SEO service-area page. Each route file supplies
 * fully unique, city-specific copy; this component only handles layout so the
 * five pages share the site's design system exactly.
 */
export type ServiceAreaContent = {
  /** Display name, e.g. "Fredericksburg". */
  city: string;
  /** URL slug under /service-area/, e.g. "fredericksburg". */
  slug: string;
  /** One-line subhead under the H1. */
  heroSub: string;
  heroImage: string;
  heroImageAlt: string;
  introHeading: string;
  /** 2–3 genuinely local intro paragraphs. */
  intro: string[];
  services: { title: string; desc: string }[];
  expectations: { title: string; desc: string }[];
  nearbyHeading: string;
  nearbyIntro: string;
  /** Surrounding towns, each with direction/context. */
  nearby: string[];
  /** The other four city pages, for internal linking. */
  otherCities: { name: string; path: string }[];
  faqs: { q: string; a: string }[];
};

export function ServiceAreaPage(c: ServiceAreaContent) {
  const cityPath = `/service-area/${c.slug}`;
  const crumbs = [
    { name: "Home", path: "/" },
    { name: `${c.city} Stump Grinding`, path: cityPath },
  ];

  return (
    <>
      {/* Structured data — no reviews, no fabricated history */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema(crumbs)) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqPageSchema(c.faqs)) }}
      />

      {/* Hero */}
      <section className="relative isolate overflow-hidden bg-forest-950">
        <img
          src={c.heroImage}
          width={1440}
          height={960}
          fetchPriority="high"
          alt={c.heroImageAlt}
          className="absolute inset-0 -z-10 h-full w-full object-cover"
        />
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-forest-950/95 via-forest-950/75 to-forest-900/40" />
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
          <p className="mb-5 inline-flex items-center rounded-full bg-forest-800/80 px-3.5 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-limestone-200">
            {SITE_NAME} · {c.city}, Texas
          </p>
          <h1 className="max-w-3xl font-display text-4xl font-bold leading-tight text-white sm:text-5xl">
            Stump Grinding in {c.city}, TX
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-relaxed text-limestone-100 sm:text-xl">
            {c.heroSub}
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link to="/estimate" className="btn-secondary">
              Get Free Estimate
            </Link>
            <a href={`tel:${PHONE_TEL}`} className="btn-outline-light">
              Call Now — {PHONE_DISPLAY}
            </a>
          </div>
        </div>
      </section>

      {/* Local intro */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
        <div className="max-w-3xl">
          <h2 className="section-title">{c.introHeading}</h2>
          {c.intro.map((p, i) => (
            <p
              key={i}
              className="mt-4 text-base leading-relaxed text-charcoal-500 sm:text-lg"
            >
              {p}
            </p>
          ))}
          <p className="mt-6">
            <Link
              to="/estimate"
              className="font-semibold text-forest-700 underline-offset-4 hover:underline"
            >
              Send a few stump photos and get your free estimate →
            </Link>
          </p>
        </div>
      </section>

      {/* Services available there */}
      <section className="bg-white py-16 lg:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl">
            <h2 className="section-title">
              {c.city} stump grinding services
            </h2>
            <p className="section-lead">
              Residential, commercial, and ranch work across {c.city} and the
              surrounding area.
            </p>
          </div>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {c.services.map((s) => (
              <article key={s.title} className="card flex flex-col">
                <h3 className="font-display text-xl font-bold text-forest-900">
                  {s.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-charcoal-500">
                  {s.desc}
                </p>
                <Link
                  to="/estimate"
                  className="mt-auto pt-4 font-semibold text-forest-700 underline-offset-4 hover:underline"
                >
                  Get a free estimate →
                </Link>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* What to expect */}
      <section className="bg-forest-900 py-16 lg:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <h2 className="font-display text-3xl font-bold tracking-tight text-limestone-50 sm:text-4xl">
            What to expect from a stump grinding visit
          </h2>
          <p className="mt-3 max-w-2xl text-lg text-limestone-300">
            Every job is a little different, but here's how we work — honestly
            and up front.
          </p>
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {c.expectations.map((e) => (
              <div
                key={e.title}
                className="rounded-xl border border-forest-800 bg-forest-800/50 p-6"
              >
                <h3 className="font-display text-lg font-bold text-limestone-50">
                  {e.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-limestone-300">
                  {e.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Service area / surrounding towns */}
      <section className="bg-limestone-200 py-16 lg:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <h2 className="section-title">{c.nearbyHeading}</h2>
          <p className="section-lead">{c.nearbyIntro}</p>
          <ul className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {c.nearby.map((town) => (
              <li
                key={town}
                className="rounded-xl border border-forest-700/20 bg-white px-4 py-3 text-sm font-medium text-forest-800"
              >
                {town}
              </li>
            ))}
          </ul>
          <p className="mt-8 max-w-2xl text-sm text-charcoal-500">
            Don't see your neighborhood? We cover a wide radius around the Hill
            Country —{" "}
            <Link
              to="/contact"
              className="font-semibold text-forest-700 underline underline-offset-2"
            >
              contact us
            </Link>{" "}
            and we'll let you know if we can get to you.
          </p>
        </div>
      </section>

      {/* Other city pages — internal linking */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
        <h2 className="section-title">Other Hill Country areas we serve</h2>
        <p className="section-lead">
          Stump grinding across the region — see what's involved in your area.
        </p>
        <ul className="mt-8 flex flex-wrap gap-2.5">
          {c.otherCities.map((oc) => (
            <li key={oc.name}>
              <Link
                to={`/service-area/${oc.path}`}
                className="inline-block rounded-full border border-forest-700/30 bg-white px-4 py-1.5 text-sm font-semibold text-forest-800 transition-colors hover:border-forest-700 hover:bg-forest-50"
              >
                {oc.name}
              </Link>
            </li>
          ))}
        </ul>
        <p className="mt-6 text-sm text-charcoal-500">
          We also serve Comfort, Johnson City, Blanco, Stonewall, Harper, and
          more — call {PHONE_DISPLAY} to ask about your town.
        </p>
      </section>

      {/* Local FAQ */}
      <section className="bg-white py-16 lg:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl">
            <h2 className="section-title">
              Stump grinding in {c.city} — common questions
            </h2>
            <p className="section-lead">
              Straight answers about the kind of stump work our {c.city} area
              customers ask about most.
            </p>
          </div>
          <div className="mt-10 space-y-4">
            {c.faqs.map((f) => (
              <details key={f.q} className="card">
                <summary className="cursor-pointer list-none font-display text-lg font-bold text-forest-900 [&::-webkit-details-marker]:hidden">
                  <span className="flex items-center justify-between gap-4">
                    {f.q}
                    <span
                      aria-hidden="true"
                      className="shrink-0 rounded-full bg-forest-100 px-2.5 py-0.5 text-sm font-bold text-forest-700"
                    >
                      +
                    </span>
                  </span>
                </summary>
                <p className="mt-3 text-sm leading-relaxed text-charcoal-500">
                  {f.a}
                </p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* CTA band */}
      <section className="bg-forest-700 py-16 lg:py-20">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6">
          <h2 className="font-display text-3xl font-bold tracking-tight text-limestone-50 sm:text-4xl">
            Ready to remove that stump in {c.city}?
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-lg text-limestone-200">
            Send us a few photos and get your free estimate — or just call and
            talk it through.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link to="/estimate" className="btn-secondary">
              Get Free Estimate
            </Link>
            <a href={`tel:${PHONE_TEL}`} className="btn-outline-light">
              Call {PHONE_DISPLAY}
            </a>
          </div>
          <p className="mt-6 text-sm text-limestone-200">
            Open {HOURS_LABEL} ·{" "}
            <Link
              to="/contact"
              className="font-semibold underline underline-offset-2 hover:text-white"
            >
              Contact us
            </Link>
          </p>
        </div>
      </section>
    </>
  );
}
