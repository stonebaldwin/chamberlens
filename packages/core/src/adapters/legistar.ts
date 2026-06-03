import type {
  CanonicalAgendaItem,
  CanonicalBodyRef,
  CanonicalDocument,
  CanonicalMeeting,
} from "../types";
import {
  deriveStatus,
  guessMimeType,
  normalizeGovBodyType,
  parseClockTime,
  wallTimeToUtc,
} from "../normalize";
import { fetchJson, Throttle } from "../util/http";
import { cleanWhitespace } from "../util/text";
import type { JurisdictionConfig, SourceAdapter } from "./types";
import { AdapterError } from "./types";

// ── Legistar Web API record shapes (the fields we consume) ───────────────────
export interface LegistarBody {
  BodyId: number;
  BodyName: string;
  BodyTypeName: string | null;
  BodyActiveFlag: number;
  BodyDescription: string | null;
}

export interface LegistarEventItem {
  EventItemId: number;
  EventItemAgendaSequence: number | null;
  EventItemAgendaNumber: string | null;
  EventItemTitle: string | null;
  EventItemActionText: string | null;
  EventItemMatterId: number | null;
  EventItemMatterFile: string | null;
  EventItemMatterName: string | null;
  EventItemMatterType: string | null;
}

export interface LegistarEvent {
  EventId: number;
  EventBodyId: number;
  EventBodyName: string;
  EventDate: string; // "2026-05-12T00:00:00"
  EventTime: string | null; // "6:00 PM"
  EventLocation: string | null;
  EventAgendaFile: string | null;
  EventMinutesFile: string | null;
  EventComment: string | null;
  EventVideoPath: string | null;
  EventMedia: string | null;
  EventInSiteURL: string | null;
  EventItems?: LegistarEventItem[];
}

const API_HOST = "https://webapi.legistar.com/v1";

function base(client: string): string {
  return `${API_HOST}/${encodeURIComponent(client)}`;
}

function legistarDate(d: Date): string {
  // OData datetime literal without milliseconds/zone.
  return d.toISOString().slice(0, 19);
}

function buildQuery(config: JurisdictionConfig, parts: Record<string, string>): string {
  const qp: string[] = [];
  if (config.apiToken) qp.push(`token=${encodeURIComponent(config.apiToken)}`);
  for (const [k, v] of Object.entries(parts)) qp.push(`${k}=${encodeURIComponent(v)}`);
  return qp.join("&");
}

/**
 * Legistar adapter — the highest-leverage source. Uses the public Web API
 * (webapi.legistar.com/v1/{client}) to pull events, their agenda items, and
 * attachment URLs. Parameterized by `{client}` + optional token.
 */
export const legistarAdapter: SourceAdapter<LegistarEvent> = {
  id: "legistar",
  platform: "legistar",
  method: "api",

  async fetchRaw(config, since) {
    const filters: string[] = [];
    if (since) filters.push(`EventDate ge datetime'${legistarDate(since)}'`);
    if (config.bodyExternalIds?.length) {
      const ors = config.bodyExternalIds.map((id) => `EventBodyId eq ${Number(id)}`).join(" or ");
      filters.push(`(${ors})`);
    }
    const maxEvents = Number(config.options?.maxEvents ?? 100);
    const query = buildQuery(config, {
      ...(filters.length ? { $filter: filters.join(" and ") } : {}),
      $orderby: "EventDate desc",
      $top: String(maxEvents),
    });

    let events: LegistarEvent[];
    try {
      events = await fetchJson<LegistarEvent[]>(`${base(config.client)}/events?${query}`);
    } catch (err) {
      throw new AdapterError(`Legistar events fetch failed for "${config.client}"`, "events", err);
    }

    // Agenda items come from a per-event endpoint (the events list returns []).
    const throttle = new Throttle(250);
    for (const ev of events) {
      await throttle.wait();
      try {
        const itemsQuery = buildQuery(config, { $orderby: "EventItemAgendaSequence" });
        ev.EventItems = await fetchJson<LegistarEventItem[]>(
          `${base(config.client)}/events/${ev.EventId}/eventitems?${itemsQuery}`,
        );
      } catch {
        ev.EventItems = ev.EventItems ?? [];
      }
    }
    return events;
  },

  normalize(ev, config) {
    const tz = config.timezone ?? "America/New_York";
    const [y, mo, d] = ev.EventDate.slice(0, 10).split("-").map(Number) as [number, number, number];
    const { hour, minute } = parseClockTime(ev.EventTime);
    const scheduledAt = wallTimeToUtc(y, mo, d, hour, minute, tz);

    const documents: CanonicalDocument[] = [];
    if (ev.EventAgendaFile)
      documents.push({
        docType: "agenda",
        title: "Agenda",
        originalUrl: ev.EventAgendaFile,
        mimeType: guessMimeType(ev.EventAgendaFile),
      });
    if (ev.EventMinutesFile)
      documents.push({
        docType: "minutes",
        title: "Minutes",
        originalUrl: ev.EventMinutesFile,
        mimeType: guessMimeType(ev.EventMinutesFile),
      });

    const agendaItems: CanonicalAgendaItem[] = (ev.EventItems ?? [])
      .filter((it) => (it.EventItemTitle ?? it.EventItemMatterName)?.trim())
      .map((it, i) => {
        const refParts = [it.EventItemMatterFile, it.EventItemMatterType]
          .filter(Boolean)
          .join(" · ");
        const description = [it.EventItemActionText, refParts].filter(Boolean).join("\n") || null;
        return {
          externalId: String(it.EventItemId),
          order: it.EventItemAgendaSequence ?? i,
          itemNumber: it.EventItemAgendaNumber?.trim() || null,
          title: cleanWhitespace(it.EventItemTitle ?? it.EventItemMatterName ?? "Agenda item"),
          itemType: it.EventItemMatterType ?? null,
          description,
        };
      });

    const govBody: CanonicalBodyRef = {
      externalId: String(ev.EventBodyId),
      name: cleanWhitespace(ev.EventBodyName),
      type: normalizeGovBodyType(ev.EventBodyName),
    };

    const sourceUrl = ev.EventInSiteURL ?? `https://${config.client}.legistar.com/Calendar.aspx`;

    return {
      externalId: String(ev.EventId),
      platform: "legistar",
      title: cleanWhitespace(ev.EventBodyName),
      meetingType: ev.EventComment ? cleanWhitespace(ev.EventComment).slice(0, 120) : null,
      status: deriveStatus(scheduledAt),
      scheduledAt,
      location: ev.EventLocation ? cleanWhitespace(ev.EventLocation) : null,
      videoUrl: ev.EventMedia || ev.EventVideoPath || null,
      sourceUrl,
      govBody,
      agendaItems,
      documents,
    } satisfies CanonicalMeeting;
  },

  async listBodies(config) {
    const query = buildQuery(config, { $orderby: "BodyName" });
    const bodies = await fetchJson<LegistarBody[]>(`${base(config.client)}/bodies?${query}`);
    return bodies
      .filter((b) => b.BodyActiveFlag !== 0)
      .map<CanonicalBodyRef>((b) => ({
        externalId: String(b.BodyId),
        name: cleanWhitespace(b.BodyName),
        type: normalizeGovBodyType(`${b.BodyName} ${b.BodyTypeName ?? ""}`),
      }));
  },
};
