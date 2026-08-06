/**
 * Unit tests for src/lib/calendar.ts (stage D3 — Save to Calendar).
 * Run: bun test src/lib/calendar.test.ts
 */
import { describe, expect, test } from "bun:test";
import {
  buildCalendarEvent,
  buildIcs,
  CALENDAR_TZ,
  compactDateTime,
  computeEnd,
  formatServiceDate,
  formatStamp,
  googleCalendarUrl,
  icsFilename,
  isoDateTime,
  outlookCalendarUrl,
  parseStart,
  slugify,
  validateSchedule,
} from "./calendar";
import type { CalendarEvent, WallClock } from "./calendar";

const MICHONNE = {
  id: "5fd30b9d-ca8d-4269-8a02-c051ca3743e4",
  name: "Michonne Baker",
  address: "791 Eichen Strasse",
  city: "Fredericksburg",
  schedule: {
    service_date: "2026-08-20",
    arrival_time: "08:00",
    estimated_duration_hours: "3",
  },
};

function event(): CalendarEvent {
  const ev = buildCalendarEvent(MICHONNE);
  if (!ev) throw new Error("fixture event should build");
  return ev;
}

describe("validateSchedule", () => {
  test("all three fields required", () => {
    expect(validateSchedule(null)).toEqual({
      valid: false,
      error: "Service date, arrival time, and duration are required.",
    });
    expect(validateSchedule({})).toMatchObject({ valid: false });
    expect(validateSchedule({ service_date: "2026-08-20" })).toMatchObject({ valid: false });
    expect(validateSchedule({ service_date: "2026-08-20", arrival_time: "08:00" })).toMatchObject({
      valid: false,
    });
    const e = validateSchedule({ service_date: "2026-08-20", arrival_time: "08:00", estimated_duration_hours: "" });
    expect(e).toEqual({
      valid: false,
      error: "Service date, arrival time, and duration are required.",
    });
  });

  test("duration must be greater than 0", () => {
    for (const bad of ["0", "-1", "abc", "0.0"]) {
      const r = validateSchedule({
        service_date: "2026-08-20",
        arrival_time: "08:00",
        estimated_duration_hours: bad,
      });
      expect(r.valid).toBe(false);
      if (!r.valid) expect(r.error).toBe("Duration must be greater than 0.");
    }
  });

  test("invalid date / time shapes rejected", () => {
    expect(validateSchedule({ service_date: "20/08/2026", arrival_time: "08:00", estimated_duration_hours: "3" }).valid).toBe(false);
    expect(validateSchedule({ service_date: "2026-08-20", arrival_time: "25:00", estimated_duration_hours: "3" }).valid).toBe(false);
    expect(validateSchedule({ service_date: "2026-08-20", arrival_time: "8:00", estimated_duration_hours: "3" }).valid).toBe(false);
  });

  test("valid schedule passes", () => {
    expect(validateSchedule(MICHONNE.schedule)).toEqual({ valid: true });
    expect(validateSchedule({ service_date: "2026-08-20", arrival_time: "08:00", estimated_duration_hours: "2.5" })).toEqual({ valid: true });
  });
});

describe("end-time wall-clock math", () => {
  test("08:00 + 3h = 11:00 same day", () => {
    const start = parseStart("2026-08-20", "08:00") as WallClock;
    expect(computeEnd(start, 3)).toEqual({ year: 2026, month: 8, day: 20, hour: 11, minute: 0 });
  });

  test("fractional duration: 08:30 + 2.5h = 11:00", () => {
    const start = parseStart("2026-08-20", "08:30") as WallClock;
    expect(computeEnd(start, 2.5)).toEqual({ year: 2026, month: 8, day: 20, hour: 11, minute: 0 });
  });

  test("minute carry: 08:45 + 0.5h = 09:15", () => {
    const start = parseStart("2026-08-20", "08:45") as WallClock;
    expect(computeEnd(start, 0.5)).toEqual({ year: 2026, month: 8, day: 20, hour: 9, minute: 15 });
  });

  test("day carry: 22:00 + 3h = 01:00 next day", () => {
    const start = parseStart("2026-08-20", "22:00") as WallClock;
    expect(computeEnd(start, 3)).toEqual({ year: 2026, month: 8, day: 21, hour: 1, minute: 0 });
  });

  test("month carry: Jan 31 23:00 + 2h = Feb 1 01:00", () => {
    const start = parseStart("2026-01-31", "23:00") as WallClock;
    expect(computeEnd(start, 2)).toEqual({ year: 2026, month: 2, day: 1, hour: 1, minute: 0 });
  });

  test("year carry: Dec 31 23:00 + 2h = Jan 1 01:00 next year", () => {
    const start = parseStart("2026-12-31", "23:00") as WallClock;
    expect(computeEnd(start, 2)).toEqual({ year: 2027, month: 1, day: 1, hour: 1, minute: 0 });
  });

  test("fixture event end = 2026-08-20 11:00", () => {
    const ev = event();
    expect(ev.start).toEqual({ year: 2026, month: 8, day: 20, hour: 8, minute: 0 });
    expect(ev.end).toEqual({ year: 2026, month: 8, day: 20, hour: 11, minute: 0 });
  });
});

describe("buildCalendarEvent", () => {
  test("summary / uid / location from the lead", () => {
    const ev = event();
    expect(ev.summary).toBe("Stump Grinding — Michonne Baker");
    expect(ev.uid).toBe("hillcountrystumpco-5fd30b9d-ca8d-4269-8a02-c051ca3743e4@hillcountrystumpco.com");
    expect(ev.location).toBe("791 Eichen Strasse, Fredericksburg");
    expect(ev.serviceDate).toBe("2026-08-20");
  });

  test("location omitted when no address/city", () => {
    const ev = buildCalendarEvent({ id: "x", name: "A", schedule: MICHONNE.schedule });
    expect(ev?.location).toBeNull();
  });

  test("null when schedule invalid", () => {
    expect(buildCalendarEvent({ ...MICHONNE, schedule: null })).toBeNull();
    expect(buildCalendarEvent({ ...MICHONNE, schedule: { service_date: "2026-08-20", arrival_time: "08:00", estimated_duration_hours: "0" } })).toBeNull();
  });

  test("customer-facing description contains reference + business, nothing else", () => {
    const ev = event();
    expect(ev.description).toContain("Hill Country Stump Co.");
    expect(ev.description).toContain("Reference: 5fd30b9d-ca8d-4269-8a02-c051ca3743e4");
    for (const bad of ["$", "estimate", "profit", "deposit", "balance", "contractor", "management", "payout"]) {
      expect(ev.description.toLowerCase()).not.toContain(bad);
    }
  });
});

describe("Google Calendar URL", () => {
  test("correct host, action and compact dates with ctz", () => {
    const u = new URL(googleCalendarUrl(event()));
    expect(u.origin + u.pathname).toBe("https://calendar.google.com/calendar/render");
    expect(u.searchParams.get("action")).toBe("TEMPLATE");
    expect(u.searchParams.get("dates")).toBe("20260820T080000/20260820T110000");
    expect(u.searchParams.get("ctz")).toBe("America/Chicago");
  });

  test("text / details / location correctly encoded", () => {
    const ev = event();
    const u = new URL(googleCalendarUrl(ev));
    expect(u.searchParams.get("text")).toBe("Stump Grinding — Michonne Baker");
    expect(u.searchParams.get("location")).toBe("791 Eichen Strasse, Fredericksburg");
    const details = u.searchParams.get("details") ?? "";
    expect(details).toContain("Hill Country Stump Co.");
    expect(details).toContain("Reference: 5fd30b9d-ca8d-4269-8a02-c051ca3743e4");
    for (const bad of ["$", "estimate", "profit", "deposit", "balance", "contractor", "management", "payout"]) {
      expect(details.toLowerCase()).not.toContain(bad);
    }
  });
});

describe("Outlook.com URL", () => {
  test("host, path and rru params", () => {
    const u = new URL(outlookCalendarUrl(event()));
    expect(u.origin + u.pathname).toBe("https://outlook.live.com/calendar/0/action/compose");
    expect(u.searchParams.get("path")).toBe("/calendar/action/compose");
    expect(u.searchParams.get("rru")).toBe("addevent");
    expect(u.searchParams.get("allday")).toBe("false");
  });

  test("iso start/end and encoded subject/body/location", () => {
    const ev = event();
    const u = new URL(outlookCalendarUrl(ev));
    expect(u.searchParams.get("startdt")).toBe("2026-08-20T08:00:00");
    expect(u.searchParams.get("enddt")).toBe("2026-08-20T11:00:00");
    expect(u.searchParams.get("subject")).toBe("Stump Grinding — Michonne Baker");
    expect(u.searchParams.get("location")).toBe("791 Eichen Strasse, Fredericksburg");
    const body = u.searchParams.get("body") ?? "";
    expect(body).toContain("Reference: 5fd30b9d-ca8d-4269-8a02-c051ca3743e4");
    for (const bad of ["$", "estimate", "profit", "deposit", "balance", "contractor", "management", "payout"]) {
      expect(body.toLowerCase()).not.toContain(bad);
    }
  });
});

/** Remove RFC 5545 line folding (CRLF + space) so assertions can match whole lines. */
function unfold(ics: string): string {
  return ics.replace(/\r\n /g, "");
}

describe("ICS document", () => {
  const FIXED_STAMP = new Date("2026-08-06T12:00:00.000Z");

  test("valid RFC 5545 structure", () => {
    const ics = buildIcs(event(), FIXED_STAMP);
    expect(ics.endsWith("\r\n")).toBe(true);
    expect(ics).toContain("BEGIN:VCALENDAR\r\n");
    expect(ics).toContain("VERSION:2.0\r\n");
    expect(ics).toContain("PRODID:-//Hill Country Stump Co.//Stump Grinding//EN");
    expect(ics).toContain("BEGIN:VEVENT\r\n");
    expect(ics).toContain("END:VEVENT\r\n");
    expect(ics).toContain("END:VCALENDAR\r\n");
  });

  test("UID, DTSTAMP, DTSTART/DTEND with TZID and STATUS", () => {
    const ics = unfold(buildIcs(event(), FIXED_STAMP));
    expect(ics).toContain("UID:hillcountrystumpco-5fd30b9d-ca8d-4269-8a02-c051ca3743e4@hillcountrystumpco.com\r\n");
    expect(ics).toContain("DTSTAMP:20260806T120000Z\r\n");
    expect(ics).toContain("DTSTART;TZID=America/Chicago:20260820T080000\r\n");
    expect(ics).toContain("DTEND;TZID=America/Chicago:20260820T110000\r\n");
    expect(ics).toContain("STATUS:CONFIRMED\r\n");
  });

  test("explicit America/Chicago VTIMEZONE block", () => {
    const ics = buildIcs(event(), FIXED_STAMP);
    expect(ics).toContain("BEGIN:VTIMEZONE\r\n");
    expect(ics).toContain("TZID:America/Chicago\r\n");
    expect(ics).toContain("TZOFFSETFROM:-0500\r\nTZOFFSETTO:-0600\r\n");
    expect(ics).toContain("TZOFFSETFROM:-0600\r\nTZOFFSETTO:-0500\r\n");
    expect(ics).toContain("RRULE:FREQ=YEARLY;BYMONTH=11;BYDAY=2SU");
    expect(ics).toContain("RRULE:FREQ=YEARLY;BYMONTH=3;BYDAY=2SU");
  });

  test("SUMMARY / LOCATION / description are customer-facing", () => {
    const ics = unfold(buildIcs(event(), FIXED_STAMP));
    expect(ics).toContain("SUMMARY:Stump Grinding — Michonne Baker\r\n");
    expect(ics).toContain("LOCATION:791 Eichen Strasse\\, Fredericksburg\r\n");
    expect(ics).toContain("Hill Country Stump Co.");
    expect(ics).toContain("Reference: 5fd30b9d-ca8d-4269-8a02-c051ca3743e4");
  });

  test("NO costs / internal fields anywhere in the body", () => {
    const ics = buildIcs(event(), FIXED_STAMP);
    const lower = ics.toLowerCase();
    for (const bad of ["$", "estimate", "profit", "deposit", "balance", "contractor", "management", "payout", "fee", "api"]) {
      expect(lower).not.toContain(bad);
    }
  });

  test("LOCATION omitted when the lead has no address/city", () => {
    const ev = buildCalendarEvent({ id: "x", name: "A", schedule: MICHONNE.schedule });
    const ics = buildIcs(ev as CalendarEvent, FIXED_STAMP);
    expect(ics).not.toContain("LOCATION:");
  });

  test("content lines folded to <= 75 chars", () => {
    const ics = buildIcs(event(), FIXED_STAMP);
    for (const line of ics.split("\r\n")) {
      expect(line.length).toBeLessThanOrEqual(75);
    }
  });

  test("stamp formatting is UTC", () => {
    expect(formatStamp(FIXED_STAMP)).toBe("20260806T120000Z");
  });
});

describe("filename slug", () => {
  test("filename for Michonne Baker", () => {
    expect(icsFilename(event())).toBe("hill-country-stump-co-michonne-baker-2026-08-20.ics");
  });

  test("slugify handles apostrophes, punctuation, whitespace", () => {
    expect(slugify("Michonne Baker-O'Neil")).toBe("michonne-baker-o-neil");
    expect(slugify("  Juan  García  ")).toBe("juan-garc-a");
    expect(slugify("!!!")).toBe("customer");
    expect(slugify("")).toBe("customer");
  });

  test("compact / iso date-time helpers", () => {
    const wc = { year: 2026, month: 8, day: 20, hour: 8, minute: 0 };
    expect(compactDateTime(wc)).toBe("20260820T080000");
    expect(isoDateTime(wc)).toBe("2026-08-20T08:00:00");
    expect(CALENDAR_TZ).toBe("America/Chicago");
  });
});

describe("formatServiceDate", () => {
  test("renders a friendly date containing the year", () => {
    const ev = event();
    const s = formatServiceDate(ev.start);
    expect(s).toContain("2026");
    expect(s.length).toBeGreaterThan(10);
  });
});
