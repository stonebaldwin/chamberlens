import { parse } from "node-html-parser";
import type { CanonicalDocument, CanonicalMeeting, DocType } from "../types";
import { classifyDocType, deriveStatus, normalizeGovBodyType, wallTimeToUtc } from "../normalize";
import { fetchText } from "../util/http";
import { cleanWhitespace, slugify } from "../util/text";
import type { SourceAdapter } from "./types";
import { AdapterError } from "./types";

/**
 * CivicPlus "Agenda Center" adapter (structured HTML). Ported from the
 * civic-scraper blueprint: document links follow the stable pattern
 * `/AgendaCenter/ViewFile/{Agenda|Minutes|Packet}/_MMDDYYYY-{id}`, and the
 * owning body is the nearest preceding section header. The parser is a pure
 * function so it is unit-tested against fixtures; live wiring is Phase 6.
 */
const VIEWFILE_RE =
  /\/AgendaCenter\/ViewFile\/(Agenda|Minutes|Packet|Attachment)\/_(\d{2})(\d{2})(\d{4})-(\d+)/i;

export interface CivicPlusRawMeeting {
  bodyName: string;
  year: number;
  month: number;
  day: number;
  documents: { docType: DocType; url: string; label: string }[];
  detailUrl: string;
}

function absolutize(href: string, baseUrl: string): string {
  try {
    return new URL(href, baseUrl).toString();
  } catch {
    return href;
  }
}

export function parseAgendaCenter(html: string, baseUrl: string): CivicPlusRawMeeting[] {
  const root = parse(html);
  const groups = new Map<string, CivicPlusRawMeeting>();
  let currentBody = "Meetings";

  // querySelectorAll returns matches in document order, so a header seen before
  // an anchor is that anchor's owning body.
  for (const el of root.querySelectorAll("h1, h2, h3, h4, a")) {
    const tag = el.rawTagName?.toLowerCase() ?? "";
    if (/^h[1-4]$/.test(tag)) {
      const t = cleanWhitespace(el.text);
      if (t) currentBody = t;
      continue;
    }
    const href = el.getAttribute("href") ?? "";
    const m = VIEWFILE_RE.exec(href);
    if (!m) continue;
    const docType = classifyDocType(m[1]);
    const month = Number(m[2]);
    const day = Number(m[3]);
    const year = Number(m[4]);
    const key = `${slugify(currentBody)}|${year}-${month}-${day}`;
    let g = groups.get(key);
    if (!g) {
      g = { bodyName: currentBody, year, month, day, documents: [], detailUrl: baseUrl };
      groups.set(key, g);
    }
    g.documents.push({
      docType,
      url: absolutize(href, baseUrl),
      label: cleanWhitespace(el.text) || (m[1] ?? "Document"),
    });
  }
  return [...groups.values()];
}

export const civicplusAdapter: SourceAdapter<CivicPlusRawMeeting> = {
  id: "civicplus",
  platform: "civicplus",
  method: "html",

  async fetchRaw(config) {
    const url = `${config.client.replace(/\/$/, "")}/AgendaCenter`;
    let html: string;
    try {
      html = await fetchText(url, { headers: { accept: "text/html" } });
    } catch (err) {
      throw new AdapterError(`CivicPlus fetch failed for ${url}`, "fetch", err);
    }
    return parseAgendaCenter(html, url);
  },

  normalize(raw, config) {
    const tz = config.timezone ?? "America/New_York";
    const hour = Number(config.options?.defaultMeetingHour ?? 0);
    const scheduledAt = wallTimeToUtc(raw.year, raw.month, raw.day, hour, 0, tz);
    const documents: CanonicalDocument[] = raw.documents.map((doc) => ({
      docType: doc.docType,
      title: doc.label,
      originalUrl: doc.url,
      mimeType: "application/pdf",
    }));
    const mmddyyyy = `${String(raw.month).padStart(2, "0")}${String(raw.day).padStart(2, "0")}${raw.year}`;

    return {
      externalId: `${slugify(raw.bodyName)}-${mmddyyyy}`,
      platform: "civicplus",
      title: cleanWhitespace(raw.bodyName),
      meetingType: null,
      status: deriveStatus(scheduledAt),
      scheduledAt,
      location: null,
      videoUrl: null,
      sourceUrl: raw.detailUrl,
      govBody: {
        externalId: null,
        name: cleanWhitespace(raw.bodyName),
        type: normalizeGovBodyType(raw.bodyName),
      },
      agendaItems: [],
      documents,
    } satisfies CanonicalMeeting;
  },
};
