import { describe, expect, it } from "vitest";
import { classifyDocType, normalizeGovBodyType, parseClockTime, wallTimeToUtc } from "./index";

describe("normalizeGovBodyType", () => {
  it("classifies common body names", () => {
    expect(normalizeGovBodyType("City Council")).toBe("city_council");
    expect(normalizeGovBodyType("Board of County Commissioners")).toBe("county_commission");
    expect(normalizeGovBodyType("Wake County School Board")).toBe("school_board");
    expect(normalizeGovBodyType("Planning Commission")).toBe("planning_commission");
    expect(normalizeGovBodyType("Zoning Board of Adjustment")).toBe("zoning_board");
    expect(normalizeGovBodyType("Finance Committee")).toBe("committee");
    expect(normalizeGovBodyType("Regional Transit Authority")).toBe("special_district");
    expect(normalizeGovBodyType("Some Random Group")).toBe("other");
  });
});

describe("parseClockTime", () => {
  it("parses 12-hour clock strings", () => {
    expect(parseClockTime("9:30 AM")).toEqual({ hour: 9, minute: 30 });
    expect(parseClockTime("6:00 PM")).toEqual({ hour: 18, minute: 0 });
    expect(parseClockTime("12:00 PM")).toEqual({ hour: 12, minute: 0 });
    expect(parseClockTime("12:30 AM")).toEqual({ hour: 0, minute: 30 });
    expect(parseClockTime(null)).toEqual({ hour: 0, minute: 0 });
  });
});

describe("wallTimeToUtc", () => {
  it("resolves local wall time to UTC across DST", () => {
    // May = EDT (UTC-4)
    expect(wallTimeToUtc(2026, 5, 12, 18, 0, "America/New_York").toISOString()).toBe(
      "2026-05-12T22:00:00.000Z",
    );
    // January = EST (UTC-5)
    expect(wallTimeToUtc(2026, 1, 15, 18, 0, "America/New_York").toISOString()).toBe(
      "2026-01-15T23:00:00.000Z",
    );
  });
});

describe("classifyDocType", () => {
  it("classifies by label and url", () => {
    expect(classifyDocType("Agenda")).toBe("agenda");
    expect(classifyDocType("Minutes")).toBe("minutes");
    expect(classifyDocType("Meeting Packet")).toBe("packet");
    expect(classifyDocType(null, "https://x/resolution-31.pdf")).toBe("resolution");
    expect(classifyDocType("Exhibit A")).toBe("attachment");
  });
});
