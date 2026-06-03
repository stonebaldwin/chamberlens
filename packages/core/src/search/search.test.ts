import { describe, expect, it } from "vitest";
import { normalizeSearchInput, toHit } from "./postgres";

describe("normalizeSearchInput", () => {
  it("collapses whitespace and caps length", () => {
    expect(normalizeSearchInput("  rezoning   downtown  ")).toBe("rezoning downtown");
    expect(normalizeSearchInput("x".repeat(300))).toHaveLength(200);
    expect(normalizeSearchInput("   ")).toBe("");
  });

  it("preserves phrase and boolean operators for websearch_to_tsquery", () => {
    expect(normalizeSearchInput('"mixed use" OR rezoning')).toBe('"mixed use" OR rezoning');
  });
});

describe("toHit", () => {
  it("maps a ranked row, keeping the highlighted snippet", () => {
    const hit = toHit({
      refType: "agenda_item",
      refId: "a1",
      meetingId: "m1",
      govBodyId: "b1",
      jurisdictionId: "j1",
      docType: "agenda",
      title: "Rezoning hearing",
      meetingDate: new Date("2026-05-12T22:00:00Z"),
      rank: 0.42,
      snippet: "a <mark>rezoning</mark> matter",
    });
    expect(hit.snippet).toContain("<mark>");
    expect(hit.rank).toBeCloseTo(0.42);
    expect(hit.meetingDate).toBeInstanceOf(Date);
  });

  it("coerces a string date and null snippet", () => {
    const hit = toHit({
      refType: "meeting",
      refId: "m1",
      meetingId: "m1",
      govBodyId: "b1",
      jurisdictionId: "j1",
      docType: null,
      title: null,
      meetingDate: new Date("2026-05-12T22:00:00Z"),
      rank: 1,
      snippet: null,
    });
    expect(hit.snippet).toBe("");
  });
});
