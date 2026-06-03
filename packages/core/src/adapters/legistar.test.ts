import { describe, expect, it } from "vitest";
import type { JurisdictionConfig } from "./types";
import { legistarAdapter, type LegistarEvent } from "./legistar";

const config: JurisdictionConfig = {
  jurisdictionId: "j1",
  platform: "legistar",
  client: "seattle",
  cadence: "daily",
  timezone: "America/Los_Angeles",
};

const event: LegistarEvent = {
  EventId: 1326,
  EventBodyId: 171,
  EventBodyName: "City Council",
  EventDate: "2026-05-12T00:00:00",
  EventTime: "9:30 AM",
  EventLocation: "Council Chamber, City Hall",
  EventAgendaFile: "https://host/agenda.pdf",
  EventMinutesFile: null,
  EventComment: "Regular Meeting",
  EventVideoPath: null,
  EventMedia: "https://video/x",
  EventInSiteURL: "https://seattle.legistar.com/MeetingDetail.aspx?LEGID=1326",
  EventItems: [
    {
      EventItemId: 5,
      EventItemAgendaSequence: 1,
      EventItemAgendaNumber: "1",
      EventItemTitle: "Rezoning of 5th Ave",
      EventItemActionText: null,
      EventItemMatterId: 9,
      EventItemMatterFile: "CB 119876",
      EventItemMatterName: "Rezone",
      EventItemMatterType: "Ordinance",
    },
    {
      EventItemId: 6,
      EventItemAgendaSequence: 2,
      EventItemAgendaNumber: null,
      EventItemTitle: null, // no title/name → filtered out
      EventItemActionText: null,
      EventItemMatterId: null,
      EventItemMatterFile: null,
      EventItemMatterName: null,
      EventItemMatterType: null,
    },
  ],
};

describe("legistarAdapter.normalize", () => {
  it("maps a Legistar event to the canonical shape", () => {
    const m = legistarAdapter.normalize(event, config);
    expect(m.externalId).toBe("1326");
    expect(m.platform).toBe("legistar");
    expect(m.title).toBe("City Council");
    expect(m.govBody.type).toBe("city_council");
    expect(m.govBody.externalId).toBe("171");
    // 9:30 AM PDT (UTC-7) → 16:30 UTC
    expect(m.scheduledAt.toISOString()).toBe("2026-05-12T16:30:00.000Z");
    expect(m.videoUrl).toBe("https://video/x");
    expect(m.documents.find((d) => d.docType === "agenda")?.originalUrl).toBe(
      "https://host/agenda.pdf",
    );
    expect(m.agendaItems).toHaveLength(1);
    expect(m.agendaItems[0]?.title).toBe("Rezoning of 5th Ave");
    expect(m.agendaItems[0]?.itemType).toBe("Ordinance");
  });

  it("handles a broken/empty event without throwing", () => {
    const broken = {
      EventId: 1,
      EventBodyId: 0,
      EventBodyName: "",
      EventDate: "2026-05-12T00:00:00",
      EventTime: null,
      EventLocation: null,
      EventAgendaFile: null,
      EventMinutesFile: null,
      EventComment: null,
      EventVideoPath: null,
      EventMedia: null,
      EventInSiteURL: null,
    } satisfies LegistarEvent;
    const m = legistarAdapter.normalize(broken, config);
    expect(m.documents).toHaveLength(0);
    expect(m.agendaItems).toHaveLength(0);
    expect(m.videoUrl).toBeNull();
    expect(m.sourceUrl).toContain("seattle.legistar.com");
  });
});
