import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import type { FormEvent } from "react";

import { submitLead } from "~/lib/lead";
import { breadcrumbSchema, pageHead } from "~/lib/seo";
import {
  EMAIL,
  PHONE_DISPLAY,
  PHONE_TEL,
  SITE_NAME,
  SITE_URL,
} from "~/lib/site";

export const Route = createFileRoute("/contractors")({
  head: () =>
    pageHead({
      title: `Stump Grinding Contractor Partnerships | ${SITE_NAME}`,
      description:
        "Contractor partnerships for dependable stump grinding: overflow jobs, subcontract work, emergency service, and rural coverage across the Texas Hill Country. Call or send a partnership inquiry.",
      path: "/contractors",
    }),
  component: Contractors,
});

const OFFERS = [
  {
    title: "Overflow Jobs",
    desc: "When your schedule or equipment is already committed, hand the stump-grinding portion of a job to us. Send the address and job details, we confirm timing, and the stump work gets done without pulling your crew off the next job.",
  },
  {
    title: "Subcontract Work",
    desc: "We work as a defined subcontractor on your projects — agreed scope, schedule, price, and cleanup before we start. You set expectations with your client; we handle the grinding and keep you in the loop.",
  },
  {
    title: "Emergency Service",
    desc: "Storm damage and emergency removals leave stumps behind in a hurry. Call us and we'll work urgent stump work into the schedule as capacity allows, and give you a straight answer on timing right away.",
  },
  {
    title: "Rural Service / Outlying Areas",
    desc: "We're based in Fredericksburg and travel beyond town limits — ranches, acreage, and outlying Hill Country communities. If the job is reachable by our equipment, we'll talk through travel and access.",
  },
  {
    title: "Fast Scheduling",
    desc: "Short-turnaround scheduling is part of the deal: we confirm dates quickly, keep you posted if anything changes, and flag any access issue the moment we see it so you can adjust.",
  },
  {
    title: "Complete Cleanup",
    desc: "Every job ends with the area cleaned up the way you asked — chips raked, staged as mulch, or hauled off. The site is left safe and orderly for the next trade or your client.",
  },
];

const TRADE_TYPES = [
  { title: "Tree Companies", desc: "Overflow grinding after removals, so your crew keeps moving." },
  { title: "Landscapers", desc: "Stumps cleared so beds, grading, and planting can proceed." },
  { title: "Builders", desc: "Stump work out of pads, drives, and utility routes before construction." },
  { title: "Fence Contractors", desc: "The line cleared so posts and equipment have room to work." },
  { title: "Irrigation Contractors", desc: "Obstacles removed before trenching and installs." },
  { title: "Property Managers", desc: "One call for stump work across the properties you manage." },
  { title: "Realtors", desc: "Stumps that hurt curb appeal handled before listing or closing." },
  { title: "Land Clearing Companies", desc: "The grinding portion of larger clearing projects." },
];

const STEPS = [
  {
    title: "Send us job details",
    desc: "Share the address, photos, access notes, and your schedule window — by phone, email, or the form below.",
  },
  {
    title: "We confirm schedule & price",
    desc: "We review the details and come back with a clear date and price, so you know exactly what to tell your client.",
  },
  {
    title: "We grind and clean up",
    desc: "We handle the stump work and cleanup to the agreed scope, and flag any issue right away.",
  },
  {
    title: "We invoice your way",
    desc: "We send the invoice the way your business prefers — per job, weekly, or monthly — and you handle your client's billing.",
  },
];

const MONTHLY_VOLUME = [
  "1–4 jobs per month",
  "5–10 jobs per month",
  "11–20 jobs per month",
  "More than 20 jobs per month",
  "Just starting out / not sure yet",
];

const PARTNERSHIP_TYPES = [
  "Overflow Work",
  "Subcontract Work",
  "Emergency Service",
  "Rural Service",
  "Other",
];

const LEAD_SOURCES = [
  "Google Business Profile",
  "Google Search",
  "Google Ads",
  "Facebook",
  "Nextdoor",
  "Tree Company",
  "Landscaper",
  "Builder",
  "Referral",
  "Direct",
  "Other",
];

type FormValues = Record<string, string>;

function Contractors() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(professionalServiceSchema()) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            breadcrumbSchema([
              { name: "Home", path: "/" },
              { name: "Contractor Partnerships", path: "/contractors" },
            ]),
          ),
        }}
      />
      <Hero />
      <Intro />
      <Offers />
      <WhoFor />
      <HowItWorks />
      <PartnerForm />
      <CtaBand />
    </>
  );
}

/** ProfessionalService schema — subcontract/overflow offer, no ratings. */
function professionalServiceSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "ProfessionalService",
    name: `${SITE_NAME} — Contractor Partnerships`,
    description:
      "Stump grinding partnership for trade partners: overflow jobs, subcontract work, emergency service, and rural coverage across the Texas Hill Country.",
    url: `${SITE_URL}/contractors`,
    telephone: PHONE_TEL,
    email: EMAIL,
    priceRange: "$$",
    areaServed: { "@type": "Place", name: "Texas Hill Country" },
    makesOffer: {
      "@type": "Offer",
      itemOffered: {
        "@type": "Service",
        name: "Stump Grinding Subcontract & Overflow Work",
        description:
          "Defined-scope stump grinding for trade partners: overflow grinding, subcontract scope, emergency call-outs, rural service, and complete cleanup.",
      },
    },
  };
}

function Hero() {
  return (
    <section className="relative isolate overflow-hidden bg-forest-950">
      <img
        src="/images/operator-960.webp"
        srcSet="/images/operator-480.webp 480w, /images/operator-960.webp 960w, /images/operator-1440.webp 1440w"
        sizes="100vw"
        width={1440}
        height={960}
        fetchPriority="high"
        alt="Professional operator running a stump grinder on a job site in the Texas Hill Country"
        className="absolute inset-0 -z-10 h-full w-full object-cover"
      />
      <div className="absolute inset-0 -z-10 bg-gradient-to-r from-forest-950/95 via-forest-950/80 to-forest-900/40" />
      <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-28 lg:px-8">
        <p className="mb-5 inline-flex items-center rounded-full bg-forest-800/80 px-3.5 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-limestone-200">
          For trade partners · {SITE_NAME}
        </p>
        <h1 className="max-w-3xl font-display text-4xl font-bold leading-tight text-white sm:text-5xl lg:text-6xl">
          Reliable Stump Grinding Partner
        </h1>
        <p className="mt-5 max-w-2xl text-lg leading-relaxed text-limestone-100 sm:text-xl">
          When a stump stands between your crew and the next task, we're the
          grinding partner that closes it out — on your schedule, at your
          sites, with a clean finish.
        </p>
        <div className="mt-8 flex flex-wrap items-center gap-3">
          <a href={`tel:${PHONE_TEL}`} className="btn-secondary">
            Call {PHONE_DISPLAY}
          </a>
          <a href="#partner-form" className="btn-outline-light">
            Send a Partnership Inquiry
          </a>
        </div>
      </div>
    </section>
  );
}

function Intro() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
      <div className="max-w-2xl">
        <h2 className="section-title">
          A dependable stump grinding crew you can hand work to
        </h2>
        <p className="section-lead">
          Tree companies, landscapers, builders, fence and irrigation
          contractors, property managers, realtors, and land clearing companies
          all run into stumps they don't grind themselves. That's where we come
          in — as an honest, straightforward grinding resource for your
          overflow and subcontract work.
        </p>
      </div>
      <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          "Honest scope and pricing up front",
          "Clear communication before, during, and after each job",
          "Defined cleanup so the site is ready for the next trade",
          "Invoicing the way your business prefers",
        ].map((item) => (
          <li
            key={item}
            className="card flex gap-2 text-sm leading-relaxed text-charcoal-700"
          >
            <span className="font-bold text-forest-700" aria-hidden="true">
              ✓
            </span>
            {item}
          </li>
        ))}
      </ul>
    </section>
  );
}

function Offers() {
  return (
    <section className="bg-limestone-200 py-16 lg:py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <h2 className="section-title">What we offer trade partners</h2>
        <p className="section-lead">
          Each of these is an offer, not a promise about past volume — here's
          what you can expect when you hand us a job.
        </p>
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {OFFERS.map((o) => (
            <article key={o.title} className="card">
              <h3 className="font-display text-xl font-bold text-forest-900">
                {o.title}
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-charcoal-500">
                {o.desc}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function WhoFor() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
      <div className="max-w-2xl">
        <h2 className="section-title">Who this is for</h2>
        <p className="section-lead">
          If your business regularly comes across stumps that aren't part of
          your scope, we can be the grinding arm you call.
        </p>
      </div>
      <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {TRADE_TYPES.map((t) => (
          <li key={t.title} className="card">
            <h3 className="font-display text-lg font-bold text-forest-900">
              {t.title}
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-charcoal-500">
              {t.desc}
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
}

function HowItWorks() {
  return (
    <section className="bg-forest-900 py-16 lg:py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <h2 className="font-display text-3xl font-bold tracking-tight text-limestone-50 sm:text-4xl">
          How partnering works
        </h2>
        <p className="mt-3 max-w-2xl text-lg text-limestone-300">
          No contracts to sign and no minimums — just a simple way to hand us
          work.
        </p>
        <ol className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((s, i) => (
            <li
              key={s.title}
              className="rounded-xl border border-forest-800 bg-forest-800/50 p-6"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-forest-600 font-display text-lg font-bold text-limestone-50">
                {i + 1}
              </span>
              <h3 className="mt-4 font-display text-lg font-bold text-limestone-50">
                {s.title}
              </h3>
              <p className="mt-1.5 text-sm leading-relaxed text-limestone-300">
                {s.desc}
              </p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

function PartnerForm() {
  const [form, setForm] = useState<FormValues>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState<{ id: string } | null>(null);
  const [utm, setUtm] = useState({ source: "", medium: "", campaign: "" });

  // Capture UTM params from the page URL for lead attribution.
  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    setUtm({
      source: p.get("utm_source") ?? "",
      medium: p.get("utm_medium") ?? "",
      campaign: p.get("utm_campaign") ?? "",
    });
  }, []);

  function set(name: string, value: string) {
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  }

  function validate(v: FormValues): Record<string, string> {
    const errs: Record<string, string> = {};
    if (!v.company?.trim()) errs.company = "Please enter your company name.";
    if (!v.contact_person?.trim())
      errs.contact_person = "Please enter a contact person's name.";
    const digits = (v.phone ?? "").replace(/\D/g, "");
    if (digits.length < 7 || digits.length > 15)
      errs.phone = "Please enter a valid phone number.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.email ?? ""))
      errs.email = "Please enter a valid email address.";
    return errs;
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const errs = validate(form);
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      setFormError("");
      return;
    }
    setSubmitting(true);
    setFormError("");
    try {
      const fd = new FormData();
      fd.append("kind", "contractor");
      for (const [k, v] of Object.entries(form)) fd.append(k, v ?? "");
      fd.append("utm_source", utm.source);
      fd.append("utm_medium", utm.medium);
      fd.append("utm_campaign", utm.campaign);
      const data = await submitLead({ data: fd });
      if (data?.ok && data.id) {
        setSubmitted({ id: data.id });
        return;
      }
      setFormError(
        "Something went wrong saving your inquiry. Please try again or call us.",
      );
    } catch {
      setFormError(
        "Network error — please try again, or call us directly and we'll take your details over the phone.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <section id="partner-form" className="bg-limestone-200 py-16 lg:py-20">
        <div className="mx-auto max-w-2xl px-4 text-center sm:px-6">
          <span
            aria-hidden="true"
            className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-forest-700 text-3xl text-limestone-50"
          >
            ✓
          </span>
          <h2 className="mt-6 font-display text-3xl font-bold tracking-tight text-forest-900 sm:text-4xl">
            Your inquiry is in!
          </h2>
          <p className="mt-4 text-lg leading-relaxed text-charcoal-500">
            Thanks for reaching out{form.company ? `, ${form.company}` : ""}.
            We've received your partnership details and will get back to you by
            phone or email to talk through how we can work together.
          </p>
          <p className="mt-4 text-sm font-medium text-charcoal-700">
            Reference:{" "}
            <span className="font-bold">
              {submitted.id.slice(0, 8).toUpperCase()}
            </span>
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <a href={`tel:${PHONE_TEL}`} className="btn-primary">
              Call {PHONE_DISPLAY}
            </a>
            <Link to="/" className="btn-charcoal">
              Back to Home
            </Link>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="partner-form" className="bg-limestone-200 py-16 lg:py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <h2 className="font-display text-3xl font-bold tracking-tight text-forest-900 sm:text-4xl">
              Partner inquiry
            </h2>
            <p className="mt-3 text-lg leading-relaxed text-charcoal-500">
              Tell us a little about your company and the kind of stump work you
              might hand our way. A real person reads every inquiry and will
              get back to you by phone or email.
            </p>
            <ul className="mt-8 space-y-4 text-sm text-charcoal-700">
              <li className="flex gap-3">
                <span aria-hidden="true">📞</span>
                <span>
                  Prefer to talk it through? Call{" "}
                  <a
                    href={`tel:${PHONE_TEL}`}
                    className="font-semibold text-forest-700 underline underline-offset-2"
                  >
                    {PHONE_DISPLAY}
                  </a>
                </span>
              </li>
              <li className="flex gap-3">
                <span aria-hidden="true">✉️</span>
                <span>
                  Or email us at{" "}
                  <a
                    href={`mailto:${EMAIL}`}
                    className="font-semibold text-forest-700 underline underline-offset-2"
                  >
                    {EMAIL}
                  </a>
                </span>
              </li>
              <li className="flex gap-3">
                <span aria-hidden="true">📍</span>
                <span>
                  Based in Fredericksburg, traveling across the Texas Hill
                  Country — including rural and outlying areas.
                </span>
              </li>
            </ul>
          </div>

          <div className="card self-start lg:col-span-3">
            {formError && (
              <p
                role="alert"
                className="mb-5 rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm font-medium text-red-800"
              >
                {formError}
              </p>
            )}
            <form onSubmit={handleSubmit} noValidate className="space-y-5">
              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label htmlFor="company" className="label">
                    Company Name <span className="text-red-700">*</span>
                  </label>
                  <input
                    id="company"
                    name="company"
                    autoComplete="organization"
                    value={form.company ?? ""}
                    onChange={(e) => set("company", e.target.value)}
                    className="input"
                    aria-invalid={!!errors.company}
                    aria-describedby={errors.company ? "company-error" : undefined}
                  />
                  {errors.company && (
                    <p id="company-error" className="field-error">
                      {errors.company}
                    </p>
                  )}
                </div>
                <div>
                  <label htmlFor="contact_person" className="label">
                    Contact Person <span className="text-red-700">*</span>
                  </label>
                  <input
                    id="contact_person"
                    name="contact_person"
                    autoComplete="name"
                    value={form.contact_person ?? ""}
                    onChange={(e) => set("contact_person", e.target.value)}
                    className="input"
                    aria-invalid={!!errors.contact_person}
                    aria-describedby={
                      errors.contact_person ? "contact_person-error" : undefined
                    }
                  />
                  {errors.contact_person && (
                    <p id="contact_person-error" className="field-error">
                      {errors.contact_person}
                    </p>
                  )}
                </div>
                <div>
                  <label htmlFor="phone" className="label">
                    Phone <span className="text-red-700">*</span>
                  </label>
                  <input
                    id="phone"
                    name="phone"
                    type="tel"
                    autoComplete="tel"
                    value={form.phone ?? ""}
                    onChange={(e) => set("phone", e.target.value)}
                    className="input"
                    aria-invalid={!!errors.phone}
                    aria-describedby={errors.phone ? "phone-error" : undefined}
                  />
                  {errors.phone && (
                    <p id="phone-error" className="field-error">
                      {errors.phone}
                    </p>
                  )}
                </div>
                <div>
                  <label htmlFor="email" className="label">
                    Email <span className="text-red-700">*</span>
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    value={form.email ?? ""}
                    onChange={(e) => set("email", e.target.value)}
                    className="input"
                    aria-invalid={!!errors.email}
                    aria-describedby={errors.email ? "email-error" : undefined}
                  />
                  {errors.email && (
                    <p id="email-error" className="field-error">
                      {errors.email}
                    </p>
                  )}
                </div>
                <div>
                  <label htmlFor="monthly_volume" className="label">
                    Monthly Job Volume
                  </label>
                  <select
                    id="monthly_volume"
                    name="monthly_volume"
                    value={form.monthly_volume ?? ""}
                    onChange={(e) => set("monthly_volume", e.target.value)}
                    className="input"
                  >
                    <option value="">Select one</option>
                    {MONTHLY_VOLUME.map((o) => (
                      <option key={o} value={o}>
                        {o}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="partnership" className="label">
                    Preferred Partnership
                  </label>
                  <select
                    id="partnership"
                    name="partnership"
                    value={form.partnership ?? ""}
                    onChange={(e) => set("partnership", e.target.value)}
                    className="input"
                  >
                    <option value="">Select one</option>
                    {PARTNERSHIP_TYPES.map((o) => (
                      <option key={o} value={o}>
                        {o}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="coverage_area" className="label">
                    Coverage Area
                  </label>
                  <input
                    id="coverage_area"
                    name="coverage_area"
                    placeholder="e.g. Fredericksburg, Kerrville, western Gillespie County"
                    value={form.coverage_area ?? ""}
                    onChange={(e) => set("coverage_area", e.target.value)}
                    className="input"
                  />
                </div>
                <div>
                  <label htmlFor="insurance" className="label">
                    Insurance Requirements
                  </label>
                  <input
                    id="insurance"
                    name="insurance"
                    placeholder="e.g. $1M general liability, certificate on file"
                    value={form.insurance ?? ""}
                    onChange={(e) => set("insurance", e.target.value)}
                    className="input"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label htmlFor="lead_source" className="label">
                    How did you hear about us?
                  </label>
                  <select
                    id="lead_source"
                    name="lead_source"
                    value={form.lead_source ?? ""}
                    onChange={(e) => set("lead_source", e.target.value)}
                    className="input"
                  >
                    <option value="">Select one</option>
                    {LEAD_SOURCES.map((o) => (
                      <option key={o} value={o}>
                        {o}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <label htmlFor="notes" className="label">
                    Notes
                  </label>
                  <textarea
                    id="notes"
                    name="notes"
                    rows={4}
                    placeholder="Typical job sizes, areas you cover, scheduling windows, anything else we should know."
                    value={form.notes ?? ""}
                    onChange={(e) => set("notes", e.target.value)}
                    className="input"
                  />
                </div>
              </div>
              <div className="rounded-xl border border-forest-700/20 bg-forest-50 p-5 text-sm text-charcoal-700">
                <p>
                  We only use your information to talk about partnership work —
                  no spam, no sharing your details.
                </p>
              </div>
              <button
                type="submit"
                disabled={submitting}
                className="btn-primary w-full sm:w-auto"
              >
                {submitting ? "Sending…" : "Send Partnership Inquiry"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}

function CtaBand() {
  return (
    <section className="bg-forest-700 py-16 lg:py-20">
      <div className="mx-auto max-w-4xl px-4 text-center sm:px-6">
        <h2 className="font-display text-3xl font-bold tracking-tight text-limestone-50 sm:text-4xl">
          Let's talk stump work
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-lg text-limestone-200">
          Call now to talk through your first job — or send the inquiry form
          above and we'll be in touch.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <a href={`tel:${PHONE_TEL}`} className="btn-secondary">
            Call {PHONE_DISPLAY}
          </a>
          <a href="#partner-form" className="btn-outline-light">
            Send a Partnership Inquiry
          </a>
        </div>
        <p className="mt-6 text-sm text-limestone-200">
          Need a free estimate for a customer's stump? Use our{" "}
          <Link
            to="/estimate"
            className="font-semibold text-limestone-50 underline underline-offset-2 hover:text-white"
          >
            customer estimate form
          </Link>
          .
        </p>
      </div>
    </section>
  );
}
