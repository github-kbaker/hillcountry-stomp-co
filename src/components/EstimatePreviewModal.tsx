import { useEffect } from "react";
import { buildPreviewEstimateHtml } from "~/lib/estimate-email";

/**
 * Stage D5a — admin-only Estimate Preview. Renders the EXACT HTML the Send
 * Estimate email would build for this lead (shared builder from
 * ~/lib/estimate-email), with no email ever sent. Close via backdrop click,
 * the Close button, or Escape. Mobile-safe (max-height + scroll).
 */
export function EstimatePreviewModal({
  lead,
  onClose,
}: {
  lead: Record<string, unknown>;
  onClose: () => void;
}) {
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose]);
  const html = buildPreviewEstimateHtml(lead);
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Estimate preview"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-3"
      onClick={onClose}
    >
      <div
        className="max-h-[92vh] w-full max-w-3xl overflow-auto rounded-lg bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-limestone-200 px-4 py-3">
          <h2 className="font-display text-lg font-bold text-forest-900">
            Estimate Preview
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="btn-secondary px-3 py-1 text-sm"
          >
            Close
          </button>
        </div>
        <div className="p-4 sm:p-6" dangerouslySetInnerHTML={{ __html: html }} />
      </div>
    </div>
  );
}
