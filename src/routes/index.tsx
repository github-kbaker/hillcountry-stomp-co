import { createFileRoute, Link } from "@tanstack/react-router";

import { PhoneCta } from "~/components/PhoneCta";
import { pageHead } from "~/lib/seo";
import {
  CITY_HUB,
  EMAIL,
  HAS_PHONE,
  HOURS_LABEL,
  PHONE_TEL,
  SERVICE_AREA,
  SERVICE_AREA_PAGES,
  SITE_NAME,
  SITE_URL,
} from "~/lib/site";

export const Route = createFileRoute("/")({
  head: () =>
    pageHead({
      title: `${SITE_NAME} | Stump Grinding in Fredericksburg, Kerrville, Boerne & the Texas Hill Country`,
      description:
        "Professional tree stump grinding for homeowners, ranchers, and contractors across the Texas Hill Country — Fredericksburg, Kerrville, Boerne, Austin, San Antonio and more. Send photos and get a free estimate.",
      path: "/",
    }),
  component: Home,
});

const SERVICES = [
  {
    title: "Residential",
    img: "/images/operator-960.webp",
    imgSrcSet:
      "/images/operator-480.webp 480w, /images/operator-960.webp 960w, /images/operator-1440.webp 1440w",
    imgAlt:
      "Professional operator running a stump grinder at a residential property in the Hill Country",
    desc: "One stump or a whole yard — we grind tree stumps out of lawns, backyards, driveways, and garden beds so you can mow, plant, or build where the tree used to stand.",
  },
  {
    title: "Commercial",
    img: "/images/hero-960.webp",
    imgSrcSet:
      "/images/hero-480.webp 480w, /images/hero-960.webp 960w, /images/hero-1440.webp 1440w",
    imgAlt: "Stump grinder at work in a Texas Hill Country field",
    desc: "HOAs, shopping centers, churches, schools, and municipal grounds. We work around schedules and leave parking lots and common areas clean and safe.",
  },
  {
    title: "Ranch",
    img: "/images/live-oaks-960.webp",
    imgSrcSet:
      "/images/live-oaks-480.webp 480w, /images/live-oaks-960.webp 960w, /images/live-oaks-1440.webp 1440w",
    imgAlt: "Live oak trees and golden grass on a Texas Hill Country ranch",
    desc: "Pastures, fence lines, windbreaks, and ranch roads. Our equipment reaches where tractors can't, clearing stumps across large acreage efficiently.",
  },
];

const WHO_WE_HELP = [
  {
    title: "Tree Companies",
    desc: "We handle the stump grinding after removals, so your crew can move on to the next job.",
  },
  {
    title: "Landscapers",
    desc: "We clear stumps so you can grade, plant, or install without fighting leftover wood.",
  },
  {
    title: "Builders",
    desc: "Site prep — we remove stumps from building pads, driveways, and utility runs before construction.",
  },
  {
    title: "Property Managers",
    desc: "Multi-property maintenance: one call for stump grinding across the properties you manage.",
  },
];

const STEPS = [
  {
    n: 1,
    title: "Upload stump photos",
    desc: "Snap a few photos of the stump and its surroundings from your phone.",
  },
  {
    n: 2,
    title: "Receive estimate",
    desc: "We review size, access, and location, then send you a free estimate.",
  },
  {
    n: 3,
    title: "Approve quote",
    desc: "Accept the quote when you're ready — no pressure, no obligation.",
  },
  {
    n: 4,
    title: "Pay deposit",
    desc: "Secure your spot on the schedule with a small deposit.",
  },
  {
    n: 5,
    title: "Schedule service",
    desc: "Pick a time that works for you. We confirm ahead of the visit.",
  },
  {
    n: 6,
    title: "Complete grinding",
    desc: "We grind the stump well below grade and clean up the area.",
  },
  {
    n: 7,
    title: "Pay remaining balance",
    desc: "Pay the balance after the work is done to your satisfaction.",
  },
];

function Home() {
  return (
    <>
      {/* LocalBusiness schema — no reviews, no fabricated history */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessSchema()) }}
      />

      <Hero />
      <Services />
      <WhoWeHelp />
      <HowItWorks />
      <ServiceArea />
      <CtaBand />
    </>
  );
}

function localBusinessSchema() {
  return {
    "@context": "https://schema.org",
    "@type": ["LandscapingBusiness", "LocalBusiness"],
    name: SITE_NAME,
    description:
      "Professional stump grinding service for the Texas Hill Country — residential, commercial, and ranch.",
    url: SITE_URL,
    ...(HAS_PHONE ? { telephone: PHONE_TEL } : {}),
    email: EMAIL,
    priceRange: "$$",
    openingHoursSpecification: [
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: [
          "Monday",
          "Tuesday",
          "Wednesday",
          "Thursday",
          "Friday",
          "Saturday",
        ],
        opens: "08:00",
        closes: "18:00",
      },
    ],
    areaServed: SERVICE_AREA.map((city) => ({ "@type": "City", name: city })),
  };
}

function Hero() {
  return (
    <section className="relative isolate overflow-hidden bg-forest-950">
      <img
        src="/images/hero-960.webp"
        srcSet="/images/hero-480.webp 480w, /images/hero-960.webp 960w, /images/hero-1440.webp 1440w"
        sizes="100vw"
        width={1440}
        height={960}
        fetchPriority="high"
        alt="Stump grinder at work in a Texas Hill Country field with live oak trees and rolling hills"
        className="absolute inset-0 -z-10 h-full w-full object-cover"
      />
      <div className="absolute inset-0 -z-10 bg-gradient-to-r from-forest-950/95 via-forest-950/75 to-forest-900/40" />
      <div className="mx-auto max-w-6xl px-4 py-24 sm:px-6 sm:py-32 lg:px-8">
        <p className="mb-5 inline-flex items-center rounded-full bg-forest-800/80 px-3.5 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-limestone-200">
          {SITE_NAME} · {CITY_HUB}
        </p>
        <h1 className="max-w-3xl font-display text-4xl font-bold leading-tight text-white sm:text-5xl lg:text-6xl">
          Remove That Stump. Reclaim Your Property.
        </h1>
        <p className="mt-5 max-w-2xl text-lg leading-relaxed text-limestone-100 sm:text-xl">
          Professional stump grinding serving Fredericksburg, Kerrville, Boerne,
          Austin, San Antonio, and the Texas Hill Country.
        </p>
        <div className="mt-8 flex flex-wrap items-center gap-3">
          <Link to="/estimate" className="btn-primary">
            Get Free Estimate
          </Link>
          {HAS_PHONE && <PhoneCta className="btn-secondary" />}
        </div>
        <p className="mt-6 text-sm text-limestone-200">
          Locally owned and operated · Free estimates · Backyards to ranch land
        </p>
      </div>
    </section>
  );
}

function Services() {
  return (
    <section id="services" className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
      <div className="max-w-2xl">
        <h2 className="section-title">Stump grinding for every property</h2>
        <p className="section-lead">
          Whether it's a single live oak stump in the yard or a clearing full of
          mesquite on the ranch, we bring the right equipment and do the job
          right.
        </p>
      </div>
      <div className="mt-10 grid gap-6 md:grid-cols-3">
        {SERVICES.map((s) => (
          <article key={s.title} className="card overflow-hidden p-0">
            <img
              src={s.img}
              srcSet={s.imgSrcSet}
              sizes="(min-width: 768px) 33vw, 100vw"
              width={960}
              height={640}
              loading="lazy"
              alt={s.imgAlt}
              className="aspect-[3/2] w-full object-cover"
            />
            <div className="p-6">
              <h3 className="font-display text-xl font-bold text-forest-900">
                {s.title} Services
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-charcoal-500">
                {s.desc}
              </p>
              <Link
                to={`/services/${s.title.toLowerCase() === "residential" ? "residential-stump-grinding" : s.title.toLowerCase() === "commercial" ? "commercial-stump-grinding" : "ranch-cleanup"}`}
                className="mt-4 inline-block font-semibold text-forest-700 underline-offset-4 hover:underline"
              >
                Get a free estimate →
              </Link>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function WhoWeHelp() {
  return (
    <section className="bg-forest-900 py-16 lg:py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <h2 className="font-display text-3xl font-bold tracking-tight text-limestone-50 sm:text-4xl">
          Who we help
        </h2>
        <p className="mt-3 max-w-2xl text-lg text-limestone-300">
          Beyond homeowners, we work with the crews and companies who keep the
          Hill Country growing.
        </p>
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {WHO_WE_HELP.map((w) => (
            <div key={w.title} className="rounded-xl border border-forest-800 bg-forest-800/50 p-6">
              <h3 className="font-display text-lg font-bold text-limestone-50">
                {w.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-limestone-300">
                {w.desc}
              </p>
            </div>
          ))}
        </div>
        <p className="mt-8 text-sm text-limestone-300">
          Are you a tree company, landscaper, builder, or property manager?{" "}
          <Link
            to="/contractors"
            className="font-semibold text-limestone-100 underline underline-offset-4 hover:text-white"
          >
            See how contractor partnerships work →
          </Link>
        </p>
      </div>
    </section>
  );
}

function HowItWorks() {
  return (
    <section id="how-it-works" className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
      <div className="max-w-2xl">
        <h2 className="section-title">How it works</h2>
        <p className="section-lead">
          From first photo to finished yard — seven straightforward steps.
        </p>
      </div>
      <ol className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {STEPS.map((s) => (
          <li key={s.n} className="card flex flex-col">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-forest-700 font-display text-lg font-bold text-limestone-50">
              {s.n}
            </span>
            <h3 className="mt-4 font-display text-lg font-bold text-forest-900">
              {s.title}
            </h3>
            <p className="mt-1.5 text-sm leading-relaxed text-charcoal-500">
              {s.desc}
            </p>
          </li>
        ))}
      </ol>
    </section>
  );
}

function ServiceArea() {
  return (
    <section id="service-area" className="bg-limestone-200 py-16 lg:py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <h2 className="section-title">Proudly serving the Texas Hill Country</h2>
        <p className="section-lead">
          Based in {CITY_HUB}, we travel to homes, businesses, and ranches
          across the region.
        </p>
        <ul className="mt-8 flex flex-wrap gap-2.5">
          {SERVICE_AREA.map((city) => {
            const slug = SERVICE_AREA_PAGES[city];
            return slug ? (
              <li key={city}>
                <Link
                  to={`/service-area/${slug}`}
                  className="inline-block rounded-full border border-forest-700/30 bg-white px-4 py-1.5 text-sm font-semibold text-forest-800 transition-colors hover:border-forest-700 hover:bg-forest-50"
                >
                  {city}
                </Link>
              </li>
            ) : (
              <li
                key={city}
                className="rounded-full border border-forest-700/30 bg-white px-4 py-1.5 text-sm font-semibold text-forest-800"
              >
                {city}
              </li>
            );
          })}
        </ul>
        <p className="mt-8 max-w-2xl text-sm text-charcoal-500">
          Don't see your town? We cover a wide radius around the Hill Country —{" "}
          <Link
            to="/estimate"
            className="font-semibold text-forest-700 underline underline-offset-2"
          >
            request a free estimate
          </Link>{" "}
          and we'll let you know if we can get to you.
        </p>
      </div>
    </section>
  );
}

function CtaBand() {
  return (
    <section className="bg-forest-700 py-16 lg:py-20">
      <div className="mx-auto max-w-4xl px-4 text-center sm:px-6">
        <h2 className="font-display text-3xl font-bold tracking-tight text-limestone-50 sm:text-4xl">
          Ready to remove that stump?
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-lg text-limestone-200">
          Send us a few photos and get your free estimate — we'll get back to
          you quickly.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link to="/estimate" className="btn-secondary">
            Get Free Estimate
          </Link>
          <PhoneCta className="btn-outline-light" />
        </div>
        <p className="mt-6 text-sm text-limestone-200">
          Open {HOURS_LABEL}
        </p>
      </div>
    </section>
  );
}
