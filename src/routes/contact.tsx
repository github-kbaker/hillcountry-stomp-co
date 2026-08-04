import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import type { FormEvent } from "react";

import { submitLead } from "~/lib/lead";
import { pageHead } from "~/lib/seo";
import {
  BUSINESS_PHONE,
  CITY_HUB,
  EMAIL,
  HAS_PHONE,
  HOURS_LABEL,
  PHONE_TEL,
  SERVICE_AREA,
  SITE_NAME,
} from "~/lib/site";

export const Route = createFileRoute("/contact")({
  head: () =>
    pageHead({
      title: `Contact Us | ${SITE_NAME} — Stump Grinding in the Texas Hill Country`,
      description:
        "Contact Hill Country Stump Co. for professional stump grinding across the Texas Hill Country. Request a free estimate, email us, or send a message — serving Fredericksburg, Kerrville, Boerne & more.",
      path: "/contact",
    }),
  component: Contact,
});

function Contact() {
  const [form, setForm] = useState({ name: "", phone: "", email: "", message: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<"idle" | "sending" | "error">("idle");

  function set(name: keyof typeof form, value: string) {
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (!form.name.trim()) errs.name = "Please enter your name.";
    if ((form.phone.trim() ?? "").replace(/\D/g, "").length < 7)
      errs.phone = "Please enter a valid phone number.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(form.email))
      errs.email = "Please enter a valid email address.";
    if (!form.message.trim()) errs.message = "Please enter a message.";
    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }
    setStatus("sending");
    try {
      const fd = new FormData();
      fd.append("kind", "contact");
      fd.append("name", form.name);
      fd.append("phone", form.phone);
      fd.append("email", form.email);
      fd.append("message", form.message);
      const data = await submitLead({ data: fd });
      if (data?.ok && data.id) {
        window.location.assign(`/estimate/thank-you?lead=${encodeURIComponent(data.id)}`);
        return;
      }
      setStatus("error");
    } catch {
      setStatus("error");
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
      <h1 className="font-display text-3xl font-bold tracking-tight text-forest-900 sm:text-4xl">
        Contact {SITE_NAME}
      </h1>
      <p className="mt-3 max-w-2xl text-lg text-charcoal-500">
        Questions, scheduling, or a stump that needs to go — we're here to
        help. The fastest way to a quote is the{" "}
        <Link to="/estimate" className="font-semibold text-forest-700 underline underline-offset-2">
          free estimate form
        </Link>{" "}
        with a few photos.
      </p>

      <div className="mt-10 grid gap-10 lg:grid-cols-2">
        <div className="space-y-6">
          <div className="card">
            <h2 className="font-display text-xl font-bold text-forest-900">
              {HAS_PHONE ? "Call or email" : "Email us"}
            </h2>
            <ul className="mt-4 space-y-3 text-lg">
              {HAS_PHONE && (
                <li>
                  <a
                    href={`tel:${PHONE_TEL}`}
                    className="inline-flex items-center gap-3 font-semibold text-forest-700 underline-offset-4 hover:underline"
                  >
                    <span aria-hidden="true">📞</span> {BUSINESS_PHONE}
                  </a>
                </li>
              )}
              <li>
                <a
                  href={`mailto:${EMAIL}`}
                  className="inline-flex items-center gap-3 font-semibold text-forest-700 underline-offset-4 hover:underline"
                >
                  <span aria-hidden="true">✉️</span> {EMAIL}
                </a>
              </li>
            </ul>
          </div>

          <div className="card">
            <h2 className="font-display text-xl font-bold text-forest-900">
              Business hours
            </h2>
            <p className="mt-2 text-charcoal-500">{HOURS_LABEL}</p>
            <p className="mt-2 text-sm text-charcoal-500">
              After-hours? Send the estimate form or leave a message — we'll
              get back to you.
            </p>
          </div>

          <div className="card">
            <h2 className="font-display text-xl font-bold text-forest-900">
              Service area
            </h2>
            <p className="mt-2 text-sm text-charcoal-500">
              Serving the Texas Hill Country, anchored in {CITY_HUB}:
            </p>
            <ul className="mt-3 flex flex-wrap gap-2">
              {SERVICE_AREA.map((city) => (
                <li
                  key={city}
                  className="rounded-full bg-limestone-200 px-3 py-1 text-xs font-semibold text-forest-800"
                >
                  {city}
                </li>
              ))}
            </ul>
          </div>

          <div className="card overflow-hidden p-0">
            <iframe
              title="Map of the Texas Hill Country centered on Fredericksburg"
              src="https://www.google.com/maps?q=Fredericksburg,+Texas&z=8&output=embed"
              className="h-72 w-full border-0"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              allowFullScreen
            />
            <p className="px-5 py-3 text-xs text-charcoal-500">
              Map centered on {CITY_HUB}. This shows the general region we
              serve, not a physical office — we travel to your property.
            </p>
          </div>
        </div>

        <div className="card self-start">
          <h2 className="font-display text-xl font-bold text-forest-900">
            Send us a message
          </h2>
          <p className="mt-2 text-sm text-charcoal-500">
            We'll reply by phone or email — usually the same day.
          </p>
          {status === "error" && (
            <p
              role="alert"
              className="mt-4 rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm font-medium text-red-800"
            >
              {HAS_PHONE ? (
                <>
                  Something went wrong sending your message. Please try again,
                  or call us at {BUSINESS_PHONE}.
                </>
              ) : (
                <>
                  Something went wrong sending your message. Please try again,
                  or email us at{" "}
                  <a href={`mailto:${EMAIL}`} className="underline">
                    {EMAIL}
                  </a>
                  .
                </>
              )}
            </p>
          )}
          <form onSubmit={handleSubmit} noValidate className="mt-5 space-y-4">
            <div>
              <label htmlFor="c-name" className="label">
                Name <span className="text-red-700">*</span>
              </label>
              <input
                id="c-name"
                value={form.name}
                onChange={(e) => set("name", e.target.value)}
                autoComplete="name"
                className="input"
                aria-invalid={!!errors.name}
              />
              {errors.name && <p className="field-error">{errors.name}</p>}
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="c-phone" className="label">
                  Phone <span className="text-red-700">*</span>
                </label>
                <input
                  id="c-phone"
                  type="tel"
                  value={form.phone}
                  onChange={(e) => set("phone", e.target.value)}
                  autoComplete="tel"
                  className="input"
                  aria-invalid={!!errors.phone}
                />
                {errors.phone && <p className="field-error">{errors.phone}</p>}
              </div>
              <div>
                <label htmlFor="c-email" className="label">
                  Email <span className="text-red-700">*</span>
                </label>
                <input
                  id="c-email"
                  type="email"
                  value={form.email}
                  onChange={(e) => set("email", e.target.value)}
                  autoComplete="email"
                  className="input"
                  aria-invalid={!!errors.email}
                />
                {errors.email && <p className="field-error">{errors.email}</p>}
              </div>
            </div>
            <div>
              <label htmlFor="c-message" className="label">
                Message <span className="text-red-700">*</span>
              </label>
              <textarea
                id="c-message"
                rows={5}
                value={form.message}
                onChange={(e) => set("message", e.target.value)}
                placeholder="How can we help? Stump details, timing, location…"
                className="input"
                aria-invalid={!!errors.message}
              />
              {errors.message && <p className="field-error">{errors.message}</p>}
            </div>
            <button
              type="submit"
              disabled={status === "sending"}
              className="btn-primary w-full"
            >
              {status === "sending" ? "Sending…" : "Send Message"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
