import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";

import { submitLead } from "~/lib/lead";
import { pageHead } from "~/lib/seo";
import { PHONE_DISPLAY, PHONE_TEL, SITE_NAME } from "~/lib/site";

export const Route = createFileRoute("/estimate/")({
  head: () =>
    pageHead({
      title: `Free Stump Grinding Estimate | ${SITE_NAME} — Texas Hill Country`,
      description:
        "Get a free stump grinding estimate in minutes. Send up to 6 photos of your stump and we'll get back to you with a quote for Fredericksburg, Kerrville, Boerne, Austin, San Antonio & the Hill Country.",
      path: "/estimate",
    }),
  component: Estimate,
});

const MAX_PHOTOS = 6;
const MAX_PHOTO_BYTES = 8 * 1024 * 1024; // 8 MB
const PHOTO_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
  "image/avif",
  "image/gif",
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

const CUSTOMER_TYPES = [
  "Homeowner",
  "Commercial",
  "Ranch / Farm",
  "Contractor / Tree Company",
];

const GRIND_DEPTHS = [
  "Standard — about 2–3 inches below grade",
  "Flush with the ground",
  "Not sure — recommend one",
];

const CLEANUP_OPTIONS = [
  "Leave the wood chips",
  "Spread the chips over the hole",
  "Haul the chips away",
  "Not sure",
];

type FormValues = Record<string, string>;

function Estimate() {
  const [form, setForm] = useState<FormValues>({});
  const [photos, setPhotos] = useState<{ file: File; url: string }[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [photoErrors, setPhotoErrors] = useState<string[]>([]);
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);
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

  function onFilesSelected(e: ChangeEvent<HTMLInputElement>) {
    const incoming = Array.from(e.target.files ?? []);
    const problems: string[] = [];
    const accepted: { file: File; url: string }[] = [];
    for (const f of incoming) {
      if (photos.length + accepted.length >= MAX_PHOTOS) {
        problems.push(`"${f.name}" skipped — the limit is ${MAX_PHOTOS} photos.`);
        continue;
      }
      if (!PHOTO_TYPES.includes(f.type)) {
        problems.push(`"${f.name}" isn't a supported image type (JPG, PNG, WebP, HEIC).`);
        continue;
      }
      if (f.size > MAX_PHOTO_BYTES) {
        problems.push(`"${f.name}" is larger than 8 MB.`);
        continue;
      }
      accepted.push({ file: f, url: URL.createObjectURL(f) });
    }
    if (accepted.length) {
      setPhotos((prev) => [...prev, ...accepted].slice(0, MAX_PHOTOS));
    }
    setPhotoErrors(problems);
    e.target.value = "";
  }

  function removePhoto(index: number) {
    setPhotos((prev) => {
      const next = [...prev];
      URL.revokeObjectURL(next[index].url);
      next.splice(index, 1);
      return next;
    });
  }

  function validate(v: FormValues): Record<string, string> {
    const errs: Record<string, string> = {};
    if (!v.name?.trim()) errs.name = "Please enter your name.";
    const digits = (v.phone ?? "").replace(/\D/g, "");
    if (digits.length < 7 || digits.length > 15)
      errs.phone = "Please enter a valid phone number.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.email ?? ""))
      errs.email = "Please enter a valid email address.";
    if (!v.address?.trim()) errs.address = "Please enter the service address.";
    if (!v.city?.trim()) errs.city = "Please enter the city.";
    if (!/^\d{5}(-\d{4})?$/.test((v.zip ?? "").trim()))
      errs.zip = "Please enter a valid 5-digit ZIP code.";
    const n = Number(v.num_stumps);
    if (!v.num_stumps?.trim() || !Number.isInteger(n) || n < 1)
      errs.num_stumps = "Enter the number of stumps (1 or more).";
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
      for (const [k, v] of Object.entries(form)) fd.append(k, v ?? "");
      fd.append("utm_source", utm.source);
      fd.append("utm_medium", utm.medium);
      fd.append("utm_campaign", utm.campaign);
      for (const p of photos) fd.append("photos", p.file, p.file.name);
      const data = await submitLead({ data: fd });
      if (data?.ok && data.id) {
        window.location.assign(
          `/estimate/thank-you?lead=${encodeURIComponent(data.id)}`,
        );
        return;
      }
      setFormError(
        "Something went wrong saving your request. Please try again or call us.",
      );
    } catch {
      setFormError(
        "Network error — please try again, or call us directly and we'll take your info over the phone.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
      <h1 className="font-display text-3xl font-bold tracking-tight text-forest-900 sm:text-4xl">
        Get a Free Estimate
      </h1>
      <p className="mt-3 text-lg text-charcoal-500">
        Tell us about your stump — photos help a lot. We'll review it and get
        back to you by phone or email with a free estimate.
      </p>

      {formError && (
        <p
          role="alert"
          className="mt-6 rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm font-medium text-red-800"
        >
          {formError}
        </p>
      )}

      <form onSubmit={handleSubmit} noValidate className="mt-8 space-y-10">
        <fieldset className="space-y-5">
          <legend className="font-display text-xl font-bold text-forest-900">
            Your contact info
          </legend>
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label htmlFor="name" className="label">
                Customer Name <span className="text-red-700">*</span>
              </label>
              <input
                id="name"
                name="name"
                autoComplete="name"
                value={form.name ?? ""}
                onChange={(e) => set("name", e.target.value)}
                className="input"
                aria-invalid={!!errors.name}
                aria-describedby={errors.name ? "name-error" : undefined}
              />
              {errors.name && (
                <p id="name-error" className="field-error">
                  {errors.name}
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
            <div className="sm:col-span-2">
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
          </div>
        </fieldset>

        <fieldset className="space-y-5">
          <legend className="font-display text-xl font-bold text-forest-900">
            Job location
          </legend>
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label htmlFor="address" className="label">
                Service Address <span className="text-red-700">*</span>
              </label>
              <input
                id="address"
                name="address"
                autoComplete="street-address"
                value={form.address ?? ""}
                onChange={(e) => set("address", e.target.value)}
                className="input"
                aria-invalid={!!errors.address}
                aria-describedby={errors.address ? "address-error" : undefined}
              />
              {errors.address && (
                <p id="address-error" className="field-error">
                  {errors.address}
                </p>
              )}
            </div>
            <div>
              <label htmlFor="city" className="label">
                City <span className="text-red-700">*</span>
              </label>
              <input
                id="city"
                name="city"
                autoComplete="address-level2"
                value={form.city ?? ""}
                onChange={(e) => set("city", e.target.value)}
                className="input"
                aria-invalid={!!errors.city}
                aria-describedby={errors.city ? "city-error" : undefined}
              />
              {errors.city && (
                <p id="city-error" className="field-error">
                  {errors.city}
                </p>
              )}
            </div>
            <div>
              <label htmlFor="zip" className="label">
                ZIP Code <span className="text-red-700">*</span>
              </label>
              <input
                id="zip"
                name="zip"
                inputMode="numeric"
                autoComplete="postal-code"
                value={form.zip ?? ""}
                onChange={(e) => set("zip", e.target.value)}
                className="input"
                aria-invalid={!!errors.zip}
                aria-describedby={errors.zip ? "zip-error" : undefined}
              />
              {errors.zip && (
                <p id="zip-error" className="field-error">
                  {errors.zip}
                </p>
              )}
            </div>
          </div>
        </fieldset>

        <fieldset className="space-y-5">
          <legend className="font-display text-xl font-bold text-forest-900">
            About the stump(s)
          </legend>
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label htmlFor="num_stumps" className="label">
                Number of Stumps <span className="text-red-700">*</span>
              </label>
              <input
                id="num_stumps"
                name="num_stumps"
                type="number"
                min={1}
                inputMode="numeric"
                value={form.num_stumps ?? ""}
                onChange={(e) => set("num_stumps", e.target.value)}
                className="input"
                aria-invalid={!!errors.num_stumps}
                aria-describedby={
                  errors.num_stumps ? "num_stumps-error" : undefined
                }
              />
              {errors.num_stumps && (
                <p id="num_stumps-error" className="field-error">
                  {errors.num_stumps}
                </p>
              )}
            </div>
            <div>
              <label htmlFor="diameter" className="label">
                Diameter of Each Stump
              </label>
              <input
                id="diameter"
                name="diameter"
                placeholder="e.g. 24–36 in"
                value={form.diameter ?? ""}
                onChange={(e) => set("diameter", e.target.value)}
                className="input"
              />
            </div>
            <div>
              <label htmlFor="height" className="label">
                Height
              </label>
              <input
                id="height"
                name="height"
                placeholder="e.g. 2 ft above ground"
                value={form.height ?? ""}
                onChange={(e) => set("height", e.target.value)}
                className="input"
              />
            </div>
            <div>
              <label htmlFor="species" className="label">
                Tree Species
              </label>
              <input
                id="species"
                name="species"
                placeholder="e.g. Live oak, cedar, mesquite"
                value={form.species ?? ""}
                onChange={(e) => set("species", e.target.value)}
                className="input"
              />
            </div>
            <div>
              <label htmlFor="grind_depth" className="label">
                Desired Grinding Depth
              </label>
              <select
                id="grind_depth"
                name="grind_depth"
                value={form.grind_depth ?? ""}
                onChange={(e) => set("grind_depth", e.target.value)}
                className="input"
              >
                <option value="">Select one</option>
                {GRIND_DEPTHS.map((o) => (
                  <option key={o} value={o}>
                    {o}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="preferred_date" className="label">
                Preferred Date
              </label>
              <input
                id="preferred_date"
                name="preferred_date"
                type="date"
                value={form.preferred_date ?? ""}
                onChange={(e) => set("preferred_date", e.target.value)}
                className="input"
              />
            </div>
            <div>
              <label htmlFor="gate_width" className="label">
                Gate Width
              </label>
              <input
                id="gate_width"
                name="gate_width"
                placeholder="e.g. 6 ft"
                value={form.gate_width ?? ""}
                onChange={(e) => set("gate_width", e.target.value)}
                className="input"
              />
            </div>
            <div>
              <label htmlFor="access_width" className="label">
                Access Width
              </label>
              <input
                id="access_width"
                name="access_width"
                placeholder="e.g. 4 ft path to the stump"
                value={form.access_width ?? ""}
                onChange={(e) => set("access_width", e.target.value)}
                className="input"
              />
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="utilities" className="label">
                Utility Information
              </label>
              <textarea
                id="utilities"
                name="utilities"
                rows={2}
                placeholder="Flag any known buried lines, sprinklers, drip irrigation, or other hazards near the stump."
                value={form.utilities ?? ""}
                onChange={(e) => set("utilities", e.target.value)}
                className="input"
              />
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="fence" className="label">
                Fence Information
              </label>
              <textarea
                id="fence"
                name="fence"
                rows={2}
                placeholder="Is the stump inside a fenced area? What kind of gate access is there?"
                value={form.fence ?? ""}
                onChange={(e) => set("fence", e.target.value)}
                className="input"
              />
            </div>
            <div>
              <label htmlFor="cleanup" className="label">
                Cleanup Preference
              </label>
              <select
                id="cleanup"
                name="cleanup"
                value={form.cleanup ?? ""}
                onChange={(e) => set("cleanup", e.target.value)}
                className="input"
              >
                <option value="">Select one</option>
                {CLEANUP_OPTIONS.map((o) => (
                  <option key={o} value={o}>
                    {o}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="customer_type" className="label">
                Customer Type
              </label>
              <select
                id="customer_type"
                name="customer_type"
                value={form.customer_type ?? ""}
                onChange={(e) => set("customer_type", e.target.value)}
                className="input"
              >
                <option value="">Select one</option>
                {CUSTOMER_TYPES.map((o) => (
                  <option key={o} value={o}>
                    {o}
                  </option>
                ))}
              </select>
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
          </div>
        </fieldset>

        <fieldset>
          <legend className="font-display text-xl font-bold text-forest-900">
            Stump photos
          </legend>
          <p className="mt-2 text-sm text-charcoal-500">
            Up to {MAX_PHOTOS} photos · JPG, PNG, WebP, or HEIC · 8 MB max each.
            Photos help us quote accurately and aren't shared with anyone.
          </p>
          <label
            htmlFor="photos"
            className="mt-4 flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-limestone-400 bg-white px-6 py-8 text-center transition-colors hover:border-forest-600 hover:bg-forest-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest-600"
          >
            <span className="text-sm font-semibold text-forest-800">
              {photos.length >= MAX_PHOTOS
                ? "Photo limit reached"
                : "Tap to add photos"}
            </span>
            <span className="text-xs text-charcoal-500">
              {photos.length}/{MAX_PHOTOS} added
            </span>
          </label>
          <input
            id="photos"
            name="photos"
            type="file"
            accept="image/jpeg,image/png,image/webp,image/heic,image/heif,image/avif,image/gif"
            multiple
            onChange={onFilesSelected}
            disabled={photos.length >= MAX_PHOTOS}
            className="sr-only"
          />
          {photoErrors.length > 0 && (
            <ul className="mt-3 space-y-1 text-sm text-red-700">
              {photoErrors.map((msg, i) => (
                <li key={i}>{msg}</li>
              ))}
            </ul>
          )}
          {photos.length > 0 && (
            <ul className="mt-4 flex flex-wrap gap-3">
              {photos.map((p, i) => (
                <li key={i} className="relative">
                  <img
                    src={p.url}
                    alt={`Stump photo ${i + 1}`}
                    className="h-24 w-24 rounded-lg border border-limestone-300 object-cover"
                  />
                  <span className="absolute bottom-1 left-1 rounded bg-black/60 px-1 py-0.5 text-[10px] font-medium text-white">
                    {(p.file.size / (1024 * 1024)).toFixed(1)} MB
                  </span>
                  <button
                    type="button"
                    onClick={() => removePhoto(i)}
                    aria-label={`Remove photo ${i + 1}`}
                    className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-charcoal-900 text-sm font-bold text-white hover:bg-red-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-charcoal-900"
                  >
                    ×
                  </button>
                </li>
              ))}
            </ul>
          )}
        </fieldset>

        <fieldset>
          <legend className="font-display text-xl font-bold text-forest-900">
            Anything else?
          </legend>
          <label htmlFor="notes" className="label">
            Additional Notes
          </label>
          <textarea
            id="notes"
            name="notes"
            rows={4}
            placeholder="Anything we should know — how the tree came down, nearby structures, best time to call, etc."
            value={form.notes ?? ""}
            onChange={(e) => set("notes", e.target.value)}
            className="input"
          />
        </fieldset>

        <div className="rounded-xl border border-forest-700/20 bg-forest-50 p-5 text-sm text-charcoal-700">
          <p>
            <strong className="text-forest-900">Prefer to talk it through?</strong>{" "}
            Call us at{" "}
            <a href={`tel:${PHONE_TEL}`} className="font-semibold text-forest-700 underline underline-offset-2">
              {PHONE_DISPLAY}
            </a>
            . We only use your information to prepare your estimate — no spam.
          </p>
        </div>

        <button type="submit" disabled={submitting} className="btn-primary w-full sm:w-auto">
          {submitting ? "Sending…" : "Send My Estimate Request"}
        </button>
      </form>
    </div>
  );
}
