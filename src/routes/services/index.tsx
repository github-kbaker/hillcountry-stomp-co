import { createFileRoute, Link } from "@tanstack/react-router";
import { pageHead } from "~/lib/seo";
import { SERVICES } from "~/lib/services";
import { SITE_NAME } from "~/lib/site";

export const Route = createFileRoute("/services/")({
  head: () =>
    pageHead({
      title: `Stump Grinding Services | ${SITE_NAME}`,
      description:
        "Explore residential, commercial, ranch, contractor, cleanup, and specialty stump grinding services across the Texas Hill Country.",
      path: "/services",
    }),
  component: ServicesIndex,
});

function ServicesIndex() {
  return (
    <>
      <section className="bg-forest-950 py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <p className="text-sm font-semibold uppercase tracking-[.18em] text-limestone-200">
            {SITE_NAME} · Services
          </p>
          <h1 className="mt-4 max-w-3xl font-display text-4xl font-bold text-white sm:text-5xl">
            Stump grinding services for the Hill Country
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-relaxed text-limestone-100">
            From one backyard stump to a defined ranch or construction scope,
            explore what we can discuss and request a free estimate.
          </p>
        </div>
      </section>
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {SERVICES.map((s) => (
            <article className="card flex flex-col" key={s.slug}>
              <h2 className="font-display text-xl font-bold text-forest-900">
                {s.title}
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-charcoal-500">
                {s.short}
              </p>
              <Link
                to={`/services/${s.slug}`}
                className="mt-auto pt-5 font-semibold text-forest-700 hover:underline"
              >
                Learn about {s.title.toLowerCase()} →
              </Link>
            </article>
          ))}
        </div>
        <div className="mt-14 rounded-2xl bg-limestone-200 p-8 text-center">
          <h2 className="font-display text-2xl font-bold text-forest-900">
            Not sure which service fits?
          </h2>
          <p className="mt-2 text-charcoal-500">
            Send photos and a few details. We'll help clarify the scope in your
            estimate.
          </p>
          <Link to="/estimate" className="btn-primary mt-5 inline-flex">
            Get Free Estimate
          </Link>
        </div>
      </section>
    </>
  );
}
