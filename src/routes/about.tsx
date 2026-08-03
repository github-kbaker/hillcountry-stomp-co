import { createFileRoute, Link } from "@tanstack/react-router";

import { pageHead } from "~/lib/seo";
import { PHONE_DISPLAY, PHONE_TEL, SITE_NAME, CITY_HUB } from "~/lib/site";

export const Route = createFileRoute("/about")({
  head: () =>
    pageHead({
      title: `About Us | ${SITE_NAME} — Locally Owned Hill Country Stump Grinding`,
      description:
        "Hill Country Stump Co. is a locally owned stump grinding service built on reliable scheduling, professional equipment, safe operations, and thorough cleanup — serving the Texas Hill Country.",
      path: "/about",
    }),
  component: About,
});

const VALUES = [
  {
    title: "Locally Focused",
    desc: "We're rooted in the Texas Hill Country and take pride in serving our own communities. A locally owned business answers for its work — we show up, we do the job, and we're here after the dust settles.",
  },
  {
    title: "Reliable Scheduling",
    desc: "We agree on a time, confirm ahead of the visit, and keep you posted if anything changes. Your time is valuable, and so is ours — we treat the schedule like a promise.",
  },
  {
    title: "Professional Equipment",
    desc: "Modern stump grinders sized to the job, from tight residential backyards to wide-open ranch land. The right machine means cleaner results, less disruption, and work that gets done the first time.",
  },
  {
    title: "Safe Operations",
    desc: "Grinders are powerful machines. We operate carefully around people, pets, structures, and buried utilities, and we keep the work area controlled from start to finish.",
  },
  {
    title: "Customer Communication",
    desc: "Before we start, you'll know exactly what we'll do, what we'll leave behind, and what it costs. We'd rather answer ten questions upfront than surprise you later.",
  },
  {
    title: "Property Protection",
    desc: "We protect your lawn, driveways, fences, and landscaping. Equipment is brought in and out with care, and we take the measures needed to keep your property looking good.",
  },
  {
    title: "Professional Cleanup",
    desc: "Grinding leaves wood chips and sawdust — we handle the cleanup the way you prefer, whether that's leaving the chips, spreading them, or hauling them away.",
  },
];

function About() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
      <h1 className="font-display text-3xl font-bold tracking-tight text-forest-900 sm:text-4xl">
        A locally owned Hill Country stump grinding service
      </h1>
      <p className="mt-4 text-lg leading-relaxed text-charcoal-500">
        {SITE_NAME} exists for one reason: to make tree stump removal simple for
        the people who live and work in the Texas Hill Country. We're a young
        business building its reputation one stump at a time — which is exactly
        why we work the way we do.
      </p>

      <div className="mt-10 rounded-xl border border-forest-700/20 bg-forest-50 p-6">
        <h2 className="font-display text-2xl font-bold text-forest-900">
          How we work
        </h2>
        <p className="mt-2 text-charcoal-700">
          We don't have a decades-long story to tell you — we have a way of
          working we're proud of. Here's what you can count on when you call:
        </p>
      </div>

      <div className="mt-8 grid gap-6 sm:grid-cols-2">
        {VALUES.map((v, i) => (
          <article key={v.title} className="card">
            <span className="font-display text-sm font-bold uppercase tracking-widest text-earth-600">
              {String(i + 1).padStart(2, "0")}
            </span>
            <h2 className="mt-1 font-display text-xl font-bold text-forest-900">
              {v.title}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-charcoal-500">
              {v.desc}
            </p>
          </article>
        ))}
      </div>

      <div className="mt-10 rounded-xl border border-limestone-300 bg-white p-6 sm:p-8">
        <h2 className="font-display text-2xl font-bold text-forest-900">
          Straight talk about your stump
        </h2>
        <p className="mt-3 leading-relaxed text-charcoal-500">
          Not every stump grinds the same. Roots, species, access, and what's
          around the stump all affect the job — so the most honest estimate we
          can give starts with a look at yours. That's why we ask for photos:
          they let us give you a real number instead of a guess.
        </p>
        <p className="mt-3 leading-relaxed text-charcoal-500">
          We're based in {CITY_HUB} and travel across the Hill Country to
          homes, businesses, and ranches. If you're not sure whether we can
          reach your property, just ask — we'd rather tell you straight than
          promise what we can't do.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link to="/estimate" className="btn-primary">
            Get Free Estimate
          </Link>
          <a href={`tel:${PHONE_TEL}`} className="btn-charcoal">
            Call {PHONE_DISPLAY}
          </a>
        </div>
      </div>
    </div>
  );
}
