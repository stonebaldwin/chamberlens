import type { DocType, GovBodyType, MeetingStatus } from "../types";

/** Map a body's display name to a canonical type via keyword heuristics. */
export function normalizeGovBodyType(name: string): GovBodyType {
  const n = name.toLowerCase();
  if (/school board|board of education/.test(n)) return "school_board";
  if (
    /county commission|board of (county )?commissioners|board of supervisors|county board/.test(n)
  )
    return "county_commission";
  if (/city council|common council|town council|board of aldermen|village board/.test(n))
    return "city_council";
  if (/planning/.test(n)) return "planning_commission";
  if (/zoning|board of adjustment|\badjustment\b/.test(n)) return "zoning_board";
  if (/water|sewer|utilit|transit|housing authority|special district|\bdistrict\b/.test(n))
    return "special_district";
  if (/committee|subcommittee|commission/.test(n)) return "committee";
  return "other";
}

/** Classify a document by its label and/or URL. */
export function classifyDocType(label?: string | null, url?: string | null): DocType {
  const s = `${label ?? ""} ${url ?? ""}`.toLowerCase();
  if (/minutes/.test(s)) return "minutes";
  if (/agenda/.test(s)) return "agenda";
  if (/packet/.test(s)) return "packet";
  if (/resolution|\breso\b/.test(s)) return "resolution";
  if (/ordinance/.test(s)) return "ordinance";
  if (/presentation|slides|powerpoint|\.pptx?(\b|$)/.test(s)) return "presentation";
  return "attachment";
}

export function guessMimeType(url: string): string | null {
  const u = (url.toLowerCase().split("?")[0] ?? "").trim();
  if (u.endsWith(".pdf")) return "application/pdf";
  if (u.endsWith(".html") || u.endsWith(".htm")) return "text/html";
  if (u.endsWith(".docx"))
    return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
  if (u.endsWith(".doc")) return "application/msword";
  if (u.endsWith(".txt")) return "text/plain";
  return null;
}

const CLOCK_RE = /(\d{1,2}):(\d{2})\s*([ap]\.?m\.?)?/i;

/** Parse a clock string like "9:30 AM" → { hour, minute } (24h). */
export function parseClockTime(time?: string | null): { hour: number; minute: number } {
  if (!time) return { hour: 0, minute: 0 };
  const m = CLOCK_RE.exec(time);
  if (!m) return { hour: 0, minute: 0 };
  let hour = Number(m[1]);
  const minute = Number(m[2]);
  const ap = m[3]?.toLowerCase().replace(/\./g, "");
  if (ap === "pm" && hour < 12) hour += 12;
  if (ap === "am" && hour === 12) hour = 0;
  return { hour, minute };
}

/** Offset (ms) of `timeZone` from UTC at the given instant. */
export function tzOffsetMs(date: Date, timeZone: string): number {
  const dtf = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  const parts = dtf.formatToParts(date);
  const get = (t: string) => Number(parts.find((p) => p.type === t)?.value ?? 0);
  let hour = get("hour");
  if (hour === 24) hour = 0;
  const asUtc = Date.UTC(
    get("year"),
    get("month") - 1,
    get("day"),
    hour,
    get("minute"),
    get("second"),
  );
  return asUtc - date.getTime();
}

/**
 * Convert a wall-clock local time in `timeZone` to an absolute UTC instant.
 * Dependency-free (Intl offset technique); good across DST except the ~1hr/yr
 * ambiguous fold, which is acceptable for meeting times.
 */
export function wallTimeToUtc(
  y: number,
  mo: number,
  d: number,
  h: number,
  mi: number,
  timeZone: string,
): Date {
  const guess = Date.UTC(y, mo - 1, d, h, mi);
  const offset = tzOffsetMs(new Date(guess), timeZone);
  return new Date(guess - offset);
}

export function deriveStatus(scheduledAt: Date, now: Date = new Date()): MeetingStatus {
  return scheduledAt.getTime() > now.getTime() ? "scheduled" : "completed";
}
