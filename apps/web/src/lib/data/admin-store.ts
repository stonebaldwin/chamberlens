import {
  and,
  count,
  createDb,
  type Database,
  desc,
  eq,
  isNotNull,
  lt,
  schema,
  sql,
} from "@repo/db";
import { resolveEnv } from "../auth";
import { SEED_BODIES, SEED_JURISDICTIONS, SEED_MEETINGS } from "../seed-data";

export interface SyncRunRow {
  id: string;
  platform: string | null;
  jurisdictionName: string | null;
  status: string;
  startedAt: Date;
  recordsSeen: number;
  recordsNew: number;
  recordsUpdated: number;
  errorCount: number;
  anomalous: boolean;
  notes: string | null;
}

export interface CoverageRequestRow {
  id: string;
  jurisdictionName: string;
  state: string | null;
  email: string | null;
  notes: string | null;
  status: string;
  votes: number;
  createdAt: Date;
}

export interface SpendSummary {
  period: string;
  capUsd: number;
  spentUsd: number;
  transcriptCount: number;
}

export interface VolumeMetrics {
  jurisdictions: number;
  bodies: number;
  meetings: number;
  documents: number;
  transcripts: number;
  eventsPending: number;
  eventsProcessed: number;
}

export interface EntityReviewRow {
  meetingId: string;
  title: string;
  jurisdictionName: string;
  matchConfidence: number;
  scheduledAt: Date;
}

export interface AdminStore {
  readonly isDemo: boolean;
  recentSyncRuns(limit?: number): Promise<SyncRunRow[]>;
  coverageRequests(): Promise<CoverageRequestRow[]>;
  spendSummary(): Promise<SpendSummary>;
  volumeMetrics(): Promise<VolumeMetrics>;
  entityReviewQueue(): Promise<EntityReviewRow[]>;
}

function period(): string {
  const d = new Date();
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

class DemoAdminStore implements AdminStore {
  readonly isDemo = true;

  async recentSyncRuns(limit = 20): Promise<SyncRunRow[]> {
    const now = Date.now();
    const rows: SyncRunRow[] = [
      {
        id: "sr-1",
        platform: "legistar",
        jurisdictionName: "Raleigh",
        status: "success",
        startedAt: new Date(now - 2 * 3600_000),
        recordsSeen: 14,
        recordsNew: 2,
        recordsUpdated: 12,
        errorCount: 0,
        anomalous: false,
        notes: null,
      },
      {
        id: "sr-2",
        platform: "legistar",
        jurisdictionName: "Charlotte",
        status: "success",
        startedAt: new Date(now - 2 * 3600_000),
        recordsSeen: 9,
        recordsNew: 1,
        recordsUpdated: 8,
        errorCount: 0,
        anomalous: false,
        notes: null,
      },
      {
        id: "sr-3",
        platform: "civicplus",
        jurisdictionName: "Cary",
        status: "partial",
        startedAt: new Date(now - 5 * 3600_000),
        recordsSeen: 6,
        recordsNew: 0,
        recordsUpdated: 5,
        errorCount: 1,
        anomalous: false,
        notes: "1 document fetch timed out",
      },
      {
        id: "sr-4",
        platform: "primegov",
        jurisdictionName: "Durham",
        status: "failed",
        startedAt: new Date(now - 26 * 3600_000),
        recordsSeen: 0,
        recordsNew: 0,
        recordsUpdated: 0,
        errorCount: 3,
        anomalous: true,
        notes: "zero-results-regression",
      },
    ];
    return rows.slice(0, limit);
  }

  async coverageRequests(): Promise<CoverageRequestRow[]> {
    const now = Date.now();
    return [
      {
        id: "cr-1",
        jurisdictionName: "Greensboro",
        state: "NC",
        email: "j@example.com",
        notes: "Council + Planning",
        status: "requested",
        votes: 7,
        createdAt: new Date(now - 3 * 86_400_000),
      },
      {
        id: "cr-2",
        jurisdictionName: "Asheville",
        state: "NC",
        email: null,
        notes: null,
        status: "planned",
        votes: 4,
        createdAt: new Date(now - 9 * 86_400_000),
      },
      {
        id: "cr-3",
        jurisdictionName: "Chapel Hill",
        state: "NC",
        email: "k@example.com",
        notes: "School board especially",
        status: "requested",
        votes: 3,
        createdAt: new Date(now - 12 * 86_400_000),
      },
    ];
  }

  async spendSummary(): Promise<SpendSummary> {
    return {
      period: period(),
      capUsd: 50,
      spentUsd: 6.42,
      transcriptCount: SEED_MEETINGS.filter((m) => m.transcript).length,
    };
  }

  async volumeMetrics(): Promise<VolumeMetrics> {
    return {
      jurisdictions: SEED_JURISDICTIONS.length,
      bodies: SEED_BODIES.length,
      meetings: SEED_MEETINGS.length,
      documents: SEED_MEETINGS.reduce((n, m) => n + m.documents.length, 0),
      transcripts: SEED_MEETINGS.filter((m) => m.transcript).length,
      eventsPending: 5,
      eventsProcessed: 128,
    };
  }

  async entityReviewQueue(): Promise<EntityReviewRow[]> {
    return [
      {
        meetingId: "mtg_clt_zoning_0518",
        title: "Charlotte Zoning Committee",
        jurisdictionName: "Charlotte",
        matchConfidence: 0.83,
        scheduledAt: new Date("2026-05-18T22:00:00Z"),
      },
      {
        meetingId: "mtg_cary_council_0514",
        title: "Cary Town Council",
        jurisdictionName: "Cary",
        matchConfidence: 0.79,
        scheduledAt: new Date("2026-05-14T22:30:00Z"),
      },
    ];
  }
}

class PostgresAdminStore implements AdminStore {
  readonly isDemo = false;
  constructor(private readonly db: Database) {}

  async recentSyncRuns(limit = 20): Promise<SyncRunRow[]> {
    const rows = await this.db
      .select({
        id: schema.syncRuns.id,
        platform: schema.syncRuns.platform,
        jurisdictionName: schema.jurisdictions.name,
        status: schema.syncRuns.status,
        startedAt: schema.syncRuns.startedAt,
        recordsSeen: schema.syncRuns.recordsSeen,
        recordsNew: schema.syncRuns.recordsNew,
        recordsUpdated: schema.syncRuns.recordsUpdated,
        errorCount: schema.syncRuns.errorCount,
        anomalous: schema.syncRuns.anomalous,
        notes: schema.syncRuns.notes,
      })
      .from(schema.syncRuns)
      .leftJoin(schema.jurisdictions, eq(schema.syncRuns.jurisdictionId, schema.jurisdictions.id))
      .orderBy(desc(schema.syncRuns.startedAt))
      .limit(limit);
    return rows;
  }

  async coverageRequests(): Promise<CoverageRequestRow[]> {
    return this.db
      .select()
      .from(schema.coverageRequests)
      .orderBy(desc(schema.coverageRequests.votes), desc(schema.coverageRequests.createdAt))
      .limit(100);
  }

  async spendSummary(): Promise<SpendSummary> {
    const p = period();
    const [y, m] = p.split("-").map(Number) as [number, number];
    const start = new Date(Date.UTC(y, m - 1, 1));
    const end = new Date(Date.UTC(y, m, 1));
    const rows = await this.db
      .select({
        spent: sql<number>`coalesce(sum(${schema.transcripts.costUsd}), 0)`,
        c: count(),
      })
      .from(schema.transcripts)
      .where(
        sql`${schema.transcripts.createdAt} >= ${start} and ${schema.transcripts.createdAt} < ${end}`,
      );
    return {
      period: p,
      capUsd: Number(resolveEnv("STT_MONTHLY_BUDGET_USD") ?? 50),
      spentUsd: Number(rows[0]?.spent ?? 0),
      transcriptCount: Number(rows[0]?.c ?? 0),
    };
  }

  async volumeMetrics(): Promise<VolumeMetrics> {
    const [j] = await this.db.select({ c: count() }).from(schema.jurisdictions);
    const [b] = await this.db.select({ c: count() }).from(schema.govBodies);
    const [m] = await this.db.select({ c: count() }).from(schema.meetings);
    const [d] = await this.db.select({ c: count() }).from(schema.documents);
    const [t] = await this.db.select({ c: count() }).from(schema.transcripts);
    const [pending] = await this.db
      .select({ c: count() })
      .from(schema.contentEvents)
      .where(eq(schema.contentEvents.processed, false));
    const [processed] = await this.db
      .select({ c: count() })
      .from(schema.contentEvents)
      .where(eq(schema.contentEvents.processed, true));
    return {
      jurisdictions: Number(j?.c ?? 0),
      bodies: Number(b?.c ?? 0),
      meetings: Number(m?.c ?? 0),
      documents: Number(d?.c ?? 0),
      transcripts: Number(t?.c ?? 0),
      eventsPending: Number(pending?.c ?? 0),
      eventsProcessed: Number(processed?.c ?? 0),
    };
  }

  async entityReviewQueue(): Promise<EntityReviewRow[]> {
    const rows = await this.db
      .select({
        meetingId: schema.meetings.id,
        title: schema.meetings.title,
        jurisdictionName: schema.jurisdictions.name,
        matchConfidence: schema.meetings.matchConfidence,
        scheduledAt: schema.meetings.scheduledAt,
      })
      .from(schema.meetings)
      .innerJoin(schema.jurisdictions, eq(schema.meetings.jurisdictionId, schema.jurisdictions.id))
      .where(
        and(isNotNull(schema.meetings.matchConfidence), lt(schema.meetings.matchConfidence, 0.92)),
      )
      .orderBy(desc(schema.meetings.scheduledAt))
      .limit(50);
    return rows.map((r) => ({
      meetingId: r.meetingId,
      title: r.title,
      jurisdictionName: r.jurisdictionName,
      matchConfidence: r.matchConfidence ?? 0,
      scheduledAt: r.scheduledAt,
    }));
  }
}

let cached: AdminStore | undefined;

export function getAdminStore(): AdminStore {
  if (cached) return cached;
  const url = resolveEnv("DATABASE_URL");
  cached = url ? new PostgresAdminStore(createDb(url)) : new DemoAdminStore();
  return cached;
}
