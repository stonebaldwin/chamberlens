import { describe, expect, it } from "vitest";
import { civicplusAdapter, parseAgendaCenter } from "./civicplus";
import type { JurisdictionConfig } from "./types";

const html = `
<html><body>
  <div class="listing">
    <h2>City Council</h2>
    <p class="catAgendaRow">
      <strong>May 12, 2026</strong>
      <a href="/AgendaCenter/ViewFile/Agenda/_05122026-1234">Agenda</a>
      <a href="/AgendaCenter/ViewFile/Minutes/_05122026-1235">Minutes</a>
    </p>
  </div>
  <div class="listing">
    <h2>Planning Commission</h2>
    <p class="catAgendaRow">
      <strong>May 13, 2026</strong>
      <a href="/AgendaCenter/ViewFile/Agenda/_05132026-2001">Agenda</a>
    </p>
  </div>
  <a href="/SomethingElse/file.pdf">Unrelated link</a>
</body></html>`;

const config: JurisdictionConfig = {
  jurisdictionId: "j1",
  platform: "civicplus",
  client: "https://example.civicplus.com",
  cadence: "daily",
};

describe("parseAgendaCenter", () => {
  it("groups document links into meetings by body + date", () => {
    const raws = parseAgendaCenter(html, "https://example.civicplus.com/AgendaCenter");
    expect(raws).toHaveLength(2);

    const cc = raws.find((r) => r.bodyName === "City Council");
    expect(cc).toBeDefined();
    expect(cc?.year).toBe(2026);
    expect(cc?.month).toBe(5);
    expect(cc?.day).toBe(12);
    expect(cc?.documents.map((d) => d.docType).sort()).toEqual(["agenda", "minutes"]);
    expect(cc?.documents[0]?.url).toContain("https://example.civicplus.com");
  });

  it("ignores non-AgendaCenter links and returns [] for empty pages", () => {
    expect(parseAgendaCenter("<html><body><p>no links</p></body></html>", "https://x")).toEqual([]);
  });
});

describe("civicplusAdapter.normalize", () => {
  it("normalizes a raw meeting to canonical", () => {
    const raws = parseAgendaCenter(html, "https://example.civicplus.com/AgendaCenter");
    const cc = raws.find((r) => r.bodyName === "City Council")!;
    const m = civicplusAdapter.normalize(cc, config);
    expect(m.platform).toBe("civicplus");
    expect(m.govBody.type).toBe("city_council");
    expect(m.externalId).toMatch(/05122026$/);
    expect(m.documents.length).toBe(2);
  });
});
