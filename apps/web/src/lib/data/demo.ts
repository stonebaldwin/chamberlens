import { SEED_BODIES, SEED_JURISDICTIONS, SEED_MEETINGS, type SeedMeeting } from "../seed-data";
import type {
  BodyPage,
  CoverageRequestInput,
  CoverageStats,
  DataSource,
  DocType,
  GovBodyLite,
  JurisdictionLite,
  JurisdictionPage,
  MeetingDetail,
  MeetingLite,
  SearchParams,
  SearchResponse,
  SearchResultItem,
  TranscriptLite,
} from "./types";

const STOP = new Set(["the", "and", "for", "with", "from", "any", "all", "near", "what", "when"]);

function tokenize(q: string): string[] {
  return q
    .toLowerCase()
    .replace(/["'()]/g, " ")
    .split(/\s+/)
    .map((t) => t.trim())
    .filter((t) => t.length > 2 && !STOP.has(t));
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/** Window around the first match and wrap every term occurrence in <mark>. */
function highlight(body: string, terms: string[], maxLen = 260): string {
  const text = body.replace(/\s+/g, " ").trim();
  const lower = text.toLowerCase();
  let first = -1;
  for (const t of terms) {
    const i = lower.indexOf(t);
    if (i >= 0 && (first < 0 || i < first)) first = i;
  }
  const start = first < 0 ? 0 : Math.max(0, first - 60);
  let slice = text.slice(start, start + maxLen);
  if (start > 0) slice = "… " + slice;
  if (start + maxLen < text.length) slice = slice + " …";
  let out = escapeHtml(slice);
  for (const t of terms) {
    out = out.replace(
      new RegExp(`(${t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi"),
      "<mark>$1</mark>",
    );
  }
  return out;
}

interface Unit {
  meetingId: string;
  refType: "meeting" | "agenda_item" | "minutes" | "document" | "transcript";
  docType: DocType | null;
  title: string | null;
  body: string;
}

export class DemoDataSource implements DataSource {
  readonly isDemo = true;

  private readonly jurById = new Map(SEED_JURISDICTIONS.map((j) => [j.id, j]));
  private readonly bodyById = new Map(SEED_BODIES.map((b) => [b.id, b]));
  private readonly meetingById = new Map(SEED_MEETINGS.map((m) => [m.id, m]));
  private readonly units: Unit[] = this.buildUnits();

  private buildUnits(): Unit[] {
    const units: Unit[] = [];
    for (const m of SEED_MEETINGS) {
      units.push({
        meetingId: m.id,
        refType: "meeting",
        docType: null,
        title: m.title,
        body: m.title,
      });
      for (const it of m.agendaItems) {
        units.push({
          meetingId: m.id,
          refType: "agenda_item",
          docType: null,
          title: it.title,
          body: [it.title, it.description].filter(Boolean).join(". "),
        });
      }
      for (const d of m.documents) {
        units.push({
          meetingId: m.id,
          refType: d.docType === "minutes" ? "minutes" : "document",
          docType: d.docType,
          title: d.title,
          body: [d.title, d.textContent].filter(Boolean).join(". "),
        });
      }
      if (m.transcript) {
        units.push({
          meetingId: m.id,
          refType: "transcript",
          docType: null,
          title: "Transcript",
          body: m.transcript.segments.map((s) => s.text).join(" "),
        });
      }
    }
    return units;
  }

  private toMeetingLite(m: SeedMeeting): MeetingLite {
    const body = this.bodyById.get(m.bodyId)!;
    const jur = this.jurById.get(body.jurisdictionId)!;
    return {
      id: m.id,
      title: m.title,
      govBodyId: body.id,
      govBodyName: body.name,
      govBodyType: body.type,
      jurisdictionId: jur.id,
      jurisdictionName: jur.name,
      jurisdictionSlug: jur.slug,
      state: jur.state,
      meetingType: m.meetingType ?? null,
      status: m.status,
      scheduledAt: new Date(m.scheduledAt),
      location: m.location ?? null,
      videoUrl: m.videoUrl ?? null,
      sourceUrl: m.sourceUrl,
      retrievedAt: new Date(m.scheduledAt),
    };
  }

  async search(params: SearchParams): Promise<SearchResponse> {
    const terms = tokenize(params.q);
    if (!terms.length) return { hits: [], total: 0 };

    const best = new Map<string, SearchResultItem>();
    for (const unit of this.units) {
      const m = this.meetingById.get(unit.meetingId);
      if (!m) continue;
      const lite = this.toMeetingLite(m);
      if (params.jurisdictionIds?.length && !params.jurisdictionIds.includes(lite.jurisdictionId))
        continue;
      if (params.govBodyIds?.length && !params.govBodyIds.includes(lite.govBodyId)) continue;
      if (params.docTypes?.length && (!unit.docType || !params.docTypes.includes(unit.docType)))
        continue;
      if (params.dateFrom && lite.scheduledAt < new Date(params.dateFrom)) continue;
      if (params.dateTo && lite.scheduledAt > new Date(params.dateTo)) continue;

      const hay = `${unit.title ?? ""} ${unit.body}`.toLowerCase();
      let score = 0;
      for (const t of terms) {
        const matches = hay.split(t).length - 1;
        if (matches > 0)
          score += matches + (unit.refType === "meeting" || unit.refType === "agenda_item" ? 1 : 0);
      }
      if (score === 0) continue;

      const item: SearchResultItem = {
        meeting: lite,
        refType: unit.refType,
        docType: unit.docType,
        snippet: highlight(unit.body, terms),
        rank: score,
      };
      const prev = best.get(m.id);
      if (!prev || item.rank > prev.rank) best.set(m.id, item);
    }

    const all = [...best.values()].sort(
      (a, b) =>
        b.rank - a.rank || b.meeting.scheduledAt.getTime() - a.meeting.scheduledAt.getTime(),
    );
    const offset = params.offset ?? 0;
    const limit = params.limit ?? 20;
    return { hits: all.slice(offset, offset + limit), total: all.length };
  }

  async listJurisdictions(): Promise<JurisdictionLite[]> {
    return SEED_JURISDICTIONS.map((j) => {
      const bodies = SEED_BODIES.filter((b) => b.jurisdictionId === j.id);
      const bodyIds = new Set(bodies.map((b) => b.id));
      const meetingCount = SEED_MEETINGS.filter((m) => bodyIds.has(m.bodyId)).length;
      return {
        id: j.id,
        slug: j.slug,
        name: j.name,
        state: j.state,
        type: j.type,
        lat: j.lat,
        lng: j.lng,
        bodyCount: bodies.length,
        meetingCount,
      };
    }).sort((a, b) => a.name.localeCompare(b.name));
  }

  async listBodies(): Promise<GovBodyLite[]> {
    return SEED_BODIES.map((b) => this.bodyLite(b.id)).sort(
      (a, b) =>
        a.jurisdictionName.localeCompare(b.jurisdictionName) || a.name.localeCompare(b.name),
    );
  }

  private bodyLite(bodyId: string): GovBodyLite {
    const b = this.bodyById.get(bodyId)!;
    const j = this.jurById.get(b.jurisdictionId)!;
    return {
      id: b.id,
      slug: b.slug,
      name: b.name,
      type: b.type,
      jurisdictionId: j.id,
      jurisdictionName: j.name,
      jurisdictionSlug: j.slug,
      state: j.state,
    };
  }

  private meetingsForBody(bodyId: string) {
    const now = Date.now();
    const all = SEED_MEETINGS.filter((m) => m.bodyId === bodyId).map((m) => this.toMeetingLite(m));
    return {
      recent: all
        .filter((m) => m.scheduledAt.getTime() <= now)
        .sort((a, b) => b.scheduledAt.getTime() - a.scheduledAt.getTime()),
      upcoming: all
        .filter((m) => m.scheduledAt.getTime() > now)
        .sort((a, b) => a.scheduledAt.getTime() - b.scheduledAt.getTime()),
    };
  }

  async getJurisdictionBySlug(slug: string): Promise<JurisdictionPage | null> {
    const j = SEED_JURISDICTIONS.find((x) => x.slug === slug);
    if (!j) return null;
    const bodies = SEED_BODIES.filter((b) => b.jurisdictionId === j.id);
    const bodyIds = new Set(bodies.map((b) => b.id));
    const now = Date.now();
    const meetings = SEED_MEETINGS.filter((m) => bodyIds.has(m.bodyId)).map((m) =>
      this.toMeetingLite(m),
    );
    const list = await this.listJurisdictions();
    const lite = list.find((x) => x.id === j.id)!;
    return {
      jurisdiction: lite,
      bodies: bodies.map((b) => this.bodyLite(b.id)),
      recentMeetings: meetings
        .filter((m) => m.scheduledAt.getTime() <= now)
        .sort((a, b) => b.scheduledAt.getTime() - a.scheduledAt.getTime())
        .slice(0, 10),
      upcomingMeetings: meetings
        .filter((m) => m.scheduledAt.getTime() > now)
        .sort((a, b) => a.scheduledAt.getTime() - b.scheduledAt.getTime())
        .slice(0, 10),
    };
  }

  async getBodyBySlug(jurisdictionSlug: string, bodySlug: string): Promise<BodyPage | null> {
    const j = SEED_JURISDICTIONS.find((x) => x.slug === jurisdictionSlug);
    if (!j) return null;
    const b = SEED_BODIES.find((x) => x.jurisdictionId === j.id && x.slug === bodySlug);
    if (!b) return null;
    const { recent, upcoming } = this.meetingsForBody(b.id);
    return { body: this.bodyLite(b.id), recentMeetings: recent, upcomingMeetings: upcoming };
  }

  async getMeetingById(id: string): Promise<MeetingDetail | null> {
    const m = this.meetingById.get(id);
    if (!m) return null;
    const lite = this.toMeetingLite(m);
    const transcript: TranscriptLite | null = m.transcript
      ? {
          source: "stt",
          provider: m.transcript.provider,
          segments: m.transcript.segments,
          fullText: m.transcript.segments.map((s) => s.text).join("\n"),
        }
      : null;
    const hasRecord = m.documents.some((d) => d.docType === "minutes") || transcript;
    const aiSummary = hasRecord
      ? `This meeting covered ${m.agendaItems
          .slice(0, 3)
          .map((i) => i.title.replace(/^(Rezoning|Public hearing)[:\s-]*/i, "").toLowerCase())
          .join("; ")}.`
      : null;
    return {
      ...lite,
      agendaItems: m.agendaItems.map((it, i) => ({
        id: `${m.id}-item-${i}`,
        order: i,
        itemNumber: it.itemNumber ?? null,
        title: it.title,
        description: it.description ?? null,
      })),
      documents: m.documents.map((d, i) => ({
        id: `${m.id}-doc-${i}`,
        docType: d.docType,
        title: d.title,
        originalUrl: d.originalUrl,
        textContent: d.textContent ?? null,
      })),
      transcript,
      aiSummary,
    };
  }

  async recentMeetings(limit = 8): Promise<MeetingLite[]> {
    return SEED_MEETINGS.map((m) => this.toMeetingLite(m))
      .sort((a, b) => b.scheduledAt.getTime() - a.scheduledAt.getTime())
      .slice(0, limit);
  }

  async stats(): Promise<CoverageStats> {
    return {
      jurisdictions: SEED_JURISDICTIONS.length,
      bodies: SEED_BODIES.length,
      meetings: SEED_MEETINGS.length,
      documents: SEED_MEETINGS.reduce((n, m) => n + m.documents.length, 0),
    };
  }

  async allMeetingIds(): Promise<string[]> {
    return SEED_MEETINGS.map((m) => m.id);
  }

  async createCoverageRequest(input: CoverageRequestInput): Promise<void> {
    console.log("[demo] coverage request:", input.jurisdictionName, input.state ?? "");
  }
}
