import { and, count, type Database, desc, eq, inArray, schema } from "@repo/db";
import { PostgresSearchProvider } from "@repo/core/search";
import type {
  BodyPage,
  CoverageRequestInput,
  CoverageStats,
  DataSource,
  DocType,
  GovBodyLite,
  GovBodyType,
  JurisdictionLite,
  JurisdictionPage,
  MeetingDetail,
  MeetingLite,
  SearchParams,
  SearchResponse,
} from "./types";

type MeetingWithRefs = typeof schema.meetings.$inferSelect & {
  govBody: typeof schema.govBodies.$inferSelect;
  jurisdiction: typeof schema.jurisdictions.$inferSelect;
};

function rowToLite(r: MeetingWithRefs): MeetingLite {
  return {
    id: r.id,
    title: r.title,
    govBodyId: r.govBodyId,
    govBodyName: r.govBody.name,
    govBodyType: r.govBody.type as GovBodyType,
    jurisdictionId: r.jurisdictionId,
    jurisdictionName: r.jurisdiction.name,
    jurisdictionSlug: r.jurisdiction.slug,
    state: r.jurisdiction.state,
    meetingType: r.meetingType,
    status: r.status,
    scheduledAt: r.scheduledAt,
    location: r.location,
    videoUrl: r.videoUrl,
    sourceUrl: r.sourceUrl,
    retrievedAt: r.retrievedAt,
  };
}

export class PostgresDataSource implements DataSource {
  readonly isDemo = false;
  private readonly searchProvider: PostgresSearchProvider;

  constructor(private readonly db: Database) {
    this.searchProvider = new PostgresSearchProvider(db);
  }

  private async loadMeetingLites(ids: string[]): Promise<Map<string, MeetingLite>> {
    if (!ids.length) return new Map();
    const rows = (await this.db.query.meetings.findMany({
      where: inArray(schema.meetings.id, ids),
      with: { govBody: true, jurisdiction: true },
    })) as MeetingWithRefs[];
    return new Map(rows.map((r) => [r.id, rowToLite(r)]));
  }

  async search(params: SearchParams): Promise<SearchResponse> {
    const limit = params.limit ?? 20;
    const res = await this.searchProvider.search({
      q: params.q,
      filters: {
        jurisdictionIds: params.jurisdictionIds,
        govBodyIds: params.govBodyIds,
        docTypes: params.docTypes,
        dateFrom: params.dateFrom,
        dateTo: params.dateTo,
      },
      limit: limit * 3, // over-fetch, then collapse to one hit per meeting
      offset: params.offset ?? 0,
    });

    const byMeeting = new Map<string, (typeof res.hits)[number]>();
    for (const h of res.hits) if (!byMeeting.has(h.meetingId)) byMeeting.set(h.meetingId, h);
    const ids = [...byMeeting.keys()].slice(0, limit);
    const lites = await this.loadMeetingLites(ids);

    const hits = ids
      .map((id) => {
        const h = byMeeting.get(id);
        const meeting = lites.get(id);
        if (!h || !meeting) return null;
        return {
          meeting,
          refType: h.refType,
          docType: (h.docType as DocType | null) ?? null,
          snippet: h.snippet,
          rank: h.rank,
        };
      })
      .filter((x): x is NonNullable<typeof x> => x !== null);

    return { hits, total: res.total };
  }

  async listJurisdictions(): Promise<JurisdictionLite[]> {
    const [jurs, bodyCounts, meetCounts] = await Promise.all([
      this.db.select().from(schema.jurisdictions),
      this.db
        .select({ jid: schema.govBodies.jurisdictionId, c: count() })
        .from(schema.govBodies)
        .groupBy(schema.govBodies.jurisdictionId),
      this.db
        .select({ jid: schema.meetings.jurisdictionId, c: count() })
        .from(schema.meetings)
        .groupBy(schema.meetings.jurisdictionId),
    ]);
    const bc = new Map(bodyCounts.map((r) => [r.jid, Number(r.c)]));
    const mc = new Map(meetCounts.map((r) => [r.jid, Number(r.c)]));
    return jurs
      .map((j) => ({
        id: j.id,
        slug: j.slug,
        name: j.name,
        state: j.state,
        type: j.type,
        lat: j.lat,
        lng: j.lng,
        bodyCount: bc.get(j.id) ?? 0,
        meetingCount: mc.get(j.id) ?? 0,
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  async listBodies(): Promise<GovBodyLite[]> {
    const rows = await this.db.query.govBodies.findMany({ with: { jurisdiction: true } });
    return rows
      .map((b) => this.bodyLite(b, b.jurisdiction))
      .sort(
        (a, b) =>
          a.jurisdictionName.localeCompare(b.jurisdictionName) || a.name.localeCompare(b.name),
      );
  }

  private bodyLite(
    b: typeof schema.govBodies.$inferSelect,
    j: typeof schema.jurisdictions.$inferSelect,
  ): GovBodyLite {
    return {
      id: b.id,
      slug: b.slug,
      name: b.name,
      type: b.type as GovBodyType,
      jurisdictionId: j.id,
      jurisdictionName: j.name,
      jurisdictionSlug: j.slug,
      state: j.state,
    };
  }

  private async meetingsForScope(
    where: ReturnType<typeof eq>,
    splitAt: Date,
  ): Promise<{ recent: MeetingLite[]; upcoming: MeetingLite[] }> {
    const rows = (await this.db.query.meetings.findMany({
      where,
      with: { govBody: true, jurisdiction: true },
      orderBy: desc(schema.meetings.scheduledAt),
      limit: 50,
    })) as MeetingWithRefs[];
    const lites = rows.map(rowToLite);
    return {
      recent: lites.filter((m) => m.scheduledAt <= splitAt).slice(0, 10),
      upcoming: lites
        .filter((m) => m.scheduledAt > splitAt)
        .sort((a, b) => a.scheduledAt.getTime() - b.scheduledAt.getTime())
        .slice(0, 10),
    };
  }

  async getJurisdictionBySlug(slug: string): Promise<JurisdictionPage | null> {
    const j = await this.db.query.jurisdictions.findFirst({
      where: eq(schema.jurisdictions.slug, slug),
      with: { govBodies: true },
    });
    if (!j) return null;
    // Scope the counts to THIS jurisdiction (index-backed) instead of running the
    // global cross-jurisdiction aggregation; parallelize with the meeting scope.
    const [[bodyCount], [meetCount], scope] = await Promise.all([
      this.db
        .select({ c: count() })
        .from(schema.govBodies)
        .where(eq(schema.govBodies.jurisdictionId, j.id)),
      this.db
        .select({ c: count() })
        .from(schema.meetings)
        .where(eq(schema.meetings.jurisdictionId, j.id)),
      this.meetingsForScope(eq(schema.meetings.jurisdictionId, j.id), new Date()),
    ]);
    const lite: JurisdictionLite = {
      id: j.id,
      slug: j.slug,
      name: j.name,
      state: j.state,
      type: j.type,
      lat: j.lat,
      lng: j.lng,
      bodyCount: Number(bodyCount?.c ?? 0),
      meetingCount: Number(meetCount?.c ?? 0),
    };
    const { recent, upcoming } = scope;
    return {
      jurisdiction: lite,
      bodies: j.govBodies.map((b) => this.bodyLite(b, j)),
      recentMeetings: recent,
      upcomingMeetings: upcoming,
    };
  }

  async getBodyBySlug(jurisdictionSlug: string, bodySlug: string): Promise<BodyPage | null> {
    const j = await this.db.query.jurisdictions.findFirst({
      where: eq(schema.jurisdictions.slug, jurisdictionSlug),
    });
    if (!j) return null;
    const b = await this.db.query.govBodies.findFirst({
      where: and(eq(schema.govBodies.jurisdictionId, j.id), eq(schema.govBodies.slug, bodySlug)),
    });
    if (!b) return null;
    const { recent, upcoming } = await this.meetingsForScope(
      eq(schema.meetings.govBodyId, b.id),
      new Date(),
    );
    return { body: this.bodyLite(b, j), recentMeetings: recent, upcomingMeetings: upcoming };
  }

  async getMeetingById(id: string): Promise<MeetingDetail | null> {
    const m = await this.db.query.meetings.findFirst({
      where: eq(schema.meetings.id, id),
      with: {
        govBody: true,
        jurisdiction: true,
        agendaItems: { orderBy: schema.agendaItems.order },
        documents: true,
        transcript: { with: { segments: { orderBy: schema.transcriptSegments.order } } },
      },
    });
    if (!m) return null;
    const lite = rowToLite(m as unknown as MeetingWithRefs);
    const transcript = m.transcript
      ? {
          source: m.transcript.source,
          provider: m.transcript.provider,
          fullText: m.transcript.fullText,
          segments: m.transcript.segments.map((s) => ({
            startMs: s.startMs,
            endMs: s.endMs,
            text: s.text,
            speaker: s.speaker,
          })),
        }
      : null;
    return {
      ...lite,
      agendaItems: m.agendaItems.map((it) => ({
        id: it.id,
        order: it.order,
        itemNumber: it.itemNumber,
        title: it.title,
        description: it.description,
      })),
      documents: m.documents.map((d) => ({
        id: d.id,
        docType: d.docType,
        title: d.title,
        originalUrl: d.originalUrl,
        textContent: d.textContent,
      })),
      transcript,
      aiSummary: null,
    };
  }

  async recentMeetings(limit = 8): Promise<MeetingLite[]> {
    const rows = (await this.db.query.meetings.findMany({
      with: { govBody: true, jurisdiction: true },
      orderBy: desc(schema.meetings.scheduledAt),
      limit,
    })) as MeetingWithRefs[];
    return rows.map(rowToLite);
  }

  async stats(): Promise<CoverageStats> {
    // Independent counts — run them in parallel (one wall-clock RTT, not four).
    const [[j], [b], [m], [d]] = await Promise.all([
      this.db.select({ c: count() }).from(schema.jurisdictions),
      this.db.select({ c: count() }).from(schema.govBodies),
      this.db.select({ c: count() }).from(schema.meetings),
      this.db.select({ c: count() }).from(schema.documents),
    ]);
    return {
      jurisdictions: Number(j?.c ?? 0),
      bodies: Number(b?.c ?? 0),
      meetings: Number(m?.c ?? 0),
      documents: Number(d?.c ?? 0),
    };
  }

  async allMeetingIds(): Promise<string[]> {
    const rows = await this.db.select({ id: schema.meetings.id }).from(schema.meetings).limit(5000);
    return rows.map((r) => r.id);
  }

  async createCoverageRequest(input: CoverageRequestInput): Promise<void> {
    await this.db.insert(schema.coverageRequests).values({
      jurisdictionName: input.jurisdictionName,
      state: input.state ?? null,
      email: input.email ?? null,
      notes: input.notes ?? null,
    });
  }
}
