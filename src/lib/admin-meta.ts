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
  "estimate-sent",
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
export type JobSchedule = { service_date: string | null; arrival_time: string | null; estimated_duration_hours: string | null };
export type Subcontractor = { name: string; phone: string; email: string; payout_status: "unpaid" | "paid" | null; payout_paid_at: string | null };
export type EquipmentItem = { id: string; name: string; cost: string };
export type ServiceCharge = { id: string; description: string; amount: string };

export type LeadRow = {
  id: string;
  kind: string;
  status: LeadStatus;
  name: string;
  phone: string;
  email: string;
  customer_email?: string;
  city: string;
  lead_source: string;
  utm: { source: string; medium: string; campaign: string };
  created_at: string;
  num_stumps: string;
  email_status?: { status?: string; recipient?: string; subject?: string; messageId?: string | null; error?: string | null; retryCount?: number; sentAt?: string | null; lastAttemptAt?: string | null };
  schedule?: JobSchedule | null;
  customer_total?: string;
};

export type LeadListResult = {
  leads: LeadRow[];
  counts: Record<LeadStatus, number>;
  total: number;
};

export type LeadDetail = Record<string, unknown> & {
  id: string;
  schedule?: JobSchedule | null;
  subcontractor?: Subcontractor | null;
  contractor_cost?: string | null;
  equipment?: EquipmentItem[];
  service_charges?: ServiceCharge[];
  management_fee?: string | null;
  fuel?: string | null;
  disposal?: string | null;
  payment_processing_cost?: string | null;
  other_internal_cost?: string | null;
  customer_total?: string;
  costs_total?: string;
  profit?: string;
  kind: string;
  status: LeadStatus;
  created_at: string;
  photos: string[];
  email_history?: Array<{
    id: string;
    subject: string;
    recipient: string;
    status?: string;
    messageId?: string;
    error?: string;
    retryCount?: number;
    event?: string;
    sentAt?: string;
    type?: string;
  }>;
};
