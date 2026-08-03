/**
 * Admin dashboard shared constants and types — CLIENT-SAFE module.
 *
 * This file must never import anything server-only (no node:* modules, no
 * database, no crypto): client components import these constants and types
 * directly, and anything server-only here would be pulled into the client
 * bundle and break the build. The server functions themselves live in
 * src/lib/admin.ts (which imports the constants from here).
 */

export const LEAD_STATUSES = [
  "new",
  "pending-estimate",
  "approved",
  "deposit-pending",
  "deposit-paid",
  "scheduled",
  "completed",
  "final-payment-pending",
  "paid",
  "cancelled",
] as const;
export type LeadStatus = (typeof LEAD_STATUSES)[number];

export const LEAD_SOURCES = [
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
  "Contractor",
  "Other",
] as const;
export type LeadSource = (typeof LEAD_SOURCES)[number];

export const DEFAULT_LEAD_STATUS: LeadStatus = "new";

/** One row in the dashboard list — a lean, display-ready summary of a lead. */
export type LeadRow = {
  id: string;
  kind: string;
  status: LeadStatus;
  name: string;
  phone: string;
  email: string;
  city: string;
  lead_source: string;
  utm: { source: string; medium: string; campaign: string };
  created_at: string;
  num_stumps: string;
};

export type LeadListResult = {
  leads: LeadRow[];
  counts: Record<LeadStatus, number>;
  total: number;
};
