import { describe, expect, it } from "vitest";
import { jaroWinkler, resolveMeetingIdentity, type MeetingCandidate } from "./index";

describe("jaroWinkler", () => {
  it("scores identical, similar, and dissimilar", () => {
    expect(jaroWinkler("city council", "city council")).toBe(1);
    expect(jaroWinkler("city council", "city councl")).toBeGreaterThan(0.9);
    expect(jaroWinkler("city council", "school board")).toBeLessThan(0.6);
  });
});

describe("resolveMeetingIdentity", () => {
  const day = new Date("2026-05-12T22:00:00Z");
  const candidates: MeetingCandidate[] = [
    { id: "m1", externalId: "1326", bodyName: "City Council", scheduledAt: day },
  ];

  it("matches an exact platform id with confidence 1", () => {
    const r = resolveMeetingIdentity(
      { externalId: "1326", bodyName: "anything", scheduledAt: new Date("2020-01-01") },
      candidates,
    );
    expect(r).toEqual({ matchId: "m1", confidence: 1, ambiguous: false });
  });

  it("fuzzy-matches a same-day body", () => {
    const r = resolveMeetingIdentity(
      { externalId: null, bodyName: "City Council", scheduledAt: day },
      candidates,
    );
    expect(r.matchId).toBe("m1");
    expect(r.confidence).toBeGreaterThan(0.9);
  });

  it("flags ambiguous matches in the review band", () => {
    const r = resolveMeetingIdentity(
      { externalId: null, bodyName: "City Council Committee", scheduledAt: day },
      candidates,
      { merge: 0.99, review: 0.5 },
    );
    expect(r.ambiguous).toBe(true);
    expect(r.matchId).toBe("m1");
  });

  it("returns no match on a different day", () => {
    const r = resolveMeetingIdentity(
      { externalId: null, bodyName: "City Council", scheduledAt: new Date("2026-06-01T22:00:00Z") },
      candidates,
    );
    expect(r.matchId).toBeNull();
  });
});
