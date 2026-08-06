/**
 * Save-to-Calendar helpers (stage D3) — CLIENT-SAFE pure module.
 *
 * Builds calendar events for a scheduled lead: wall-clock timezone math
 * (America/Chicago), Google Calendar + Outlook.com compose URLs, and a
 * valid RFC 5545 iCalendar (.ics) document.
 *
 * RULES (owner spec):
 * - End time = arrival time + estimated duration, computed on the wall-clock
 *   components (no UTC / DST drift — the date math below uses Date.UTC only
 *   as a calendar-arithmetic scratchpad, never for rendering).
 * - The event is customer-facing: SUMMARY, DESCRIPTION and LOCATION contain
 *   ONLY the customer's name, the lead reference id, the business name, and
 *   the lead's address/city. NO estimate/deposit/balance, costs, profit,
 *   management fee, contractor payout, or API data.
 *
 * This module must never import server-only code (no node:* modules) — it is
 * imported by the admin lead detail page (client) and by unit tests.
 */

export const CALENDAR_TZ = "America/Chicago";

/** The three scheduling fields stored on a lead (JobSchedule shape). */
export type ScheduleInput = {
  service_date?: string | null;
  arrival_time?: string | null;
  estimated_duration_hours?: string | null;
};

/** A wall-clock instant in the America/Chicago timezone. */
export type WallClock = {
  year: number;
  month: number; // 1-12
  day: number;
  hour: number; // 0-23
  minute: number; // 0-59
};

/** A fully-resolved, customer-facing calendar event. */
export type CalendarEvent = {
  uid: string;
  summary: string;
  description: string;
  location: string | null;
  start: WallClock;
  end: WallClock;
  serviceDate: string; // YYYY-MM-DD (wall-clock)
  customerName: string;
  leadId: string;
};

export type ValidationResult =
  | { valid: true }
  | { valid: false; error: string };

/**
 * Validate the scheduling inputs before any calendar action runs. All three
 * fields are required and the duration must be a positive number.
 */
export function validateSchedule(s?: ScheduleInput | null): ValidationResult {
  const date = String(s?.service_date ?? "").trim();
  const time = String(s?.arrival_time ?? "").trim();
  const dur = String(s?.estimated_duration_hours ?? "").trim();
  if (!date || !time || !dur) {
    return { valid: false, error: "Service date, arrival time, and duration are required." };
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return { valid: false, error: "Service date is invalid." };
  }
  const tm = /^(\d{2}):(\d{2})$/.exec(time);
  if (!tm || Number(tm[1]) > 23 || Number(tm[2]) > 59) {
    return { valid: false, error: "Arrival time is invalid." };
  }
  const hours = Number(dur);
  if (!Number.isFinite(hours) || hours <= 0) {
    return { valid: false, error: "Duration must be greater than 0." };
  }
  return { valid: true };
}

/** Parse "YYYY-MM-DD" + "HH:MM" into a wall-clock instant, or null if malformed. */
export function parseStart(dateStr: string, timeStr: string): WallClock | null {
  const dm = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateStr.trim());
  const tm = /^(\d{2}):(\d{2})$/.exec(timeStr.trim());
  if (!dm || !tm) return null;
  const year = Number(dm[1]);
  const month = Number(dm[2]);
  const day = Number(dm[3]);
  const hour = Number(tm[1]);
  const minute = Number(tm[2]);
  if (month < 1 || month > 12 || day < 1 || day > 31 || hour > 23 || minute > 59) {
    return null;
  }
  return { year, month, day, hour, minute };
}

/**
 * End = start + durationHours, computed purely on wall-clock components.
 * Uses Date.UTC only as a calendar-arithmetic scratchpad so day/month/year
 * carry works without any local-timezone or DST drift.
 */
export function computeEnd(start: WallClock, durationHours: number): WallClock {
  const totalMinutes = start.hour * 60 + start.minute + Math.round(durationHours * 60);
  const day = new Date(Date.UTC(start.year, start.month - 1, start.day));
  day.setUTCDate(day.getUTCDate() + Math.floor(totalMinutes / 1440));
  const rem = ((totalMinutes % 1440) + 1440) % 1440;
  return {
    year: day.getUTCFullYear(),
    month: day.getUTCMonth() + 1,
    day: day.getUTCDate(),
    hour: Math.floor(rem / 60),
    minute: rem % 60,
  };
}

/** Minimal lead shape the calendar builder needs. */
export type CalendarLeadInput = {
  id?: string | null;
  name?: string | null;
  address?: string | null;
  city?: string | null;
  schedule?: ScheduleInput | null;
};

/**
 * Build a customer-facing calendar event from a lead + its schedule.
 * Returns null when the schedule is missing/invalid (callers should surface
 * the validateSchedule() message instead).
 */
export function buildCalendarEvent(lead: CalendarLeadInput): CalendarEvent | null {
  const v = validateSchedule(lead.schedule);
  if (!v.valid) return null;
  const s = lead.schedule as ScheduleInput;
  const date = String(s.service_date ?? "").trim();
  const time = String(s.arrival_time ?? "").trim();
  const duration = Number(String(s.estimated_duration_hours ?? "").trim());
  const start = parseStart(date, time);
  if (!start) return null;
  const end = computeEnd(start, duration);
  const id = String(lead.id ?? "").trim();
  const name = String(lead.name ?? "").trim() || "Customer";
  const addr = String(lead.address ?? "").trim();
  const city = String(lead.city ?? "").trim();
  const location = [addr, city].filter(Boolean).join(", ") || null;
  return {
    uid: `hillcountrystumpco-${id}@hillcountrystumpco.com`,
    summary: `Stump Grinding — ${name}`,
    description: [
      "Stump grinding appointment with Hill Country Stump Co.",
      `Reference: ${id || "—"}`,
      `https://www.hillcountrystumpco.com/admin/lead/${id}`,
    ].join("\n"),
    location,
    start,
    end,
    serviceDate: date,
    customerName: name,
    leadId: id,
  };
}

const p2 = (n: number) => String(n).padStart(2, "0");

/** 2026-08-20 08:00 → "20260820T080000" (Google / ICS compact form). */
export function compactDateTime(wc: WallClock): string {
  return `${wc.year}${p2(wc.month)}${p2(wc.day)}T${p2(wc.hour)}${p2(wc.minute)}00`;
}

/** 2026-08-20 08:00 → "2026-08-20T08:00:00" (Outlook compose form). */
export function isoDateTime(wc: WallClock): string {
  return `${wc.year}-${p2(wc.month)}-${p2(wc.day)}T${p2(wc.hour)}:${p2(wc.minute)}:00`;
}

/**
 * Google Calendar "add event" URL (action=TEMPLATE). Times are the compact
 * form with an explicit ctz so Google renders them in America/Chicago.
 */
export function googleCalendarUrl(event: CalendarEvent): string {
  const q = new URLSearchParams();
  q.set("action", "TEMPLATE");
  q.set("text", event.summary);
  q.set("dates", `${compactDateTime(event.start)}/${compactDateTime(event.end)}`);
  q.set("details", event.description);
  if (event.location) q.set("location", event.location);
  q.set("ctz", CALENDAR_TZ);
  return `https://calendar.google.com/calendar/render?${q.toString()}`;
}

/**
 * Outlook.com compose URL. Same event data; wall-clock datetimes in the
 * standard Outlook web compose format (allday=false).
 */
export function outlookCalendarUrl(event: CalendarEvent): string {
  const q = new URLSearchParams();
  q.set("path", "/calendar/action/compose");
  q.set("rru", "addevent");
  q.set("startdt", isoDateTime(event.start));
  q.set("enddt", isoDateTime(event.end));
  q.set("subject", event.summary);
  q.set("body", event.description);
  if (event.location) q.set("location", event.location);
  q.set("allday", "false");
  return `https://outlook.live.com/calendar/0/action/compose?${q.toString()}`;
}

/** Escape text values per RFC 5545 (backslash, semicolon, comma, newline). */
function escapeText(value: string): string {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\r?\n/g, "\\n");
}

/** RFC 5545 content-line folding: break long lines at 74 code points. */
function foldLine(line: string): string {
  const chars = Array.from(line);
  if (chars.length <= 75) return line;
  const chunks: string[] = [];
  for (let i = 0; i < chars.length; i += 74) {
    chunks.push(chars.slice(i, i + 74).join(""));
  }
  return chunks.join("\r\n ");
}

/** DTSTAMP in UTC: "20260806T120000Z". `stamp` is injectable for tests. */
export function formatStamp(stamp: Date): string {
  return stamp.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
}

const VTIMEZONE_CHICAGO = [
  "BEGIN:VTIMEZONE",
  "TZID:America/Chicago",
  "BEGIN:STANDARD",
  "DTSTART:19701101T020000",
  "RRULE:FREQ=YEARLY;BYMONTH=11;BYDAY=2SU",
  "TZOFFSETFROM:-0500",
  "TZOFFSETTO:-0600",
  "END:STANDARD",
  "BEGIN:DAYLIGHT",
  "DTSTART:19700308T020000",
  "RRULE:FREQ=YEARLY;BYMONTH=3;BYDAY=2SU",
  "TZOFFSETFROM:-0600",
  "TZOFFSETTO:-0500",
  "END:DAYLIGHT",
  "END:VTIMEZONE",
];

/**
 * Build a complete RFC 5545 iCalendar document (CRLF line endings, explicit
 * America/Chicago VTIMEZONE, STATUS:CONFIRMED). Customer-facing content only.
 */
export function buildIcs(event: CalendarEvent, stamp?: Date): string {
  const lines: string[] = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Hill Country Stump Co.//Stump Grinding//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    ...VTIMEZONE_CHICAGO,
    "BEGIN:VEVENT",
    `UID:${event.uid}`,
    `DTSTAMP:${formatStamp(stamp ?? new Date())}`,
    `DTSTART;TZID=${CALENDAR_TZ}:${compactDateTime(event.start)}`,
    `DTEND;TZID=${CALENDAR_TZ}:${compactDateTime(event.end)}`,
    `SUMMARY:${escapeText(event.summary)}`,
    `DESCRIPTION:${escapeText(event.description)}`,
  ];
  if (event.location) lines.push(`LOCATION:${escapeText(event.location)}`);
  lines.push("STATUS:CONFIRMED", "END:VEVENT", "END:VCALENDAR");
  return lines.map(foldLine).join("\r\n") + "\r\n";
}

/** Filesystem-safe slug of a customer name (lowercase, hyphens). */
export function slugify(name: string): string {
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return slug || "customer";
}

/** Download filename: hill-country-stump-co-<name>-<date>.ics */
export function icsFilename(event: CalendarEvent): string {
  return `hill-country-stump-co-${slugify(event.customerName)}-${event.serviceDate}.ics`;
}

/** Human-friendly service date for the confirmation message. */
export function formatServiceDate(start: WallClock): string {
  // Local-noon construction keeps the calendar day stable across timezones.
  const d = new Date(start.year, start.month - 1, start.day, 12);
  return d.toLocaleDateString(undefined, {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}
