import { and, count, createDb, type Database, desc, eq, gte, schema } from "@repo/db";
import { resolveEnv } from "../auth";

export type AlertFrequency = "instant" | "daily" | "weekly";

export interface SavedSearchFilters {
  jurisdictionIds?: string[];
  govBodyIds?: string[];
  docTypes?: string[];
  dateFrom?: string;
  dateTo?: string;
}

export interface SavedSearchView {
  id: string;
  name: string;
  query: string;
  filters: SavedSearchFilters;
  isAlert: boolean;
  frequency: AlertFrequency;
  scopeSummary: string;
  createdAt: Date;
}

export interface AlertLogItem {
  id: string;
  savedSearchName: string;
  meetingId: string | null;
  title: string;
  jurisdictionName: string | null;
  govBodyName: string | null;
  snippet: string | null;
  deepLink: string | null;
  status: string;
  sentAt: Date;
}

export interface DashboardSummary {
  savedSearchCount: number;
  activeAlertCount: number;
  matchesThisWeek: number;
  recent: AlertLogItem[];
}

export interface CreateSavedSearchInput {
  name: string;
  query: string;
  filters?: SavedSearchFilters;
  isAlert: boolean;
  frequency?: AlertFrequency;
}

export interface UserStore {
  readonly isDemo: boolean;
  dashboardSummary(userId: string): Promise<DashboardSummary>;
  listSavedSearches(userId: string): Promise<SavedSearchView[]>;
  createSavedSearch(userId: string, input: CreateSavedSearchInput): Promise<SavedSearchView>;
  updateSavedSearch(
    userId: string,
    id: string,
    patch: { name?: string; isAlert?: boolean; frequency?: AlertFrequency },
  ): Promise<void>;
  deleteSavedSearch(userId: string, id: string): Promise<void>;
  listAlertLog(userId: string, limit?: number): Promise<AlertLogItem[]>;
}

export function scopeSummary(filters: SavedSearchFilters): string {
  if (filters.govBodyIds?.length) {
    return `${filters.govBodyIds.length} ${filters.govBodyIds.length === 1 ? "body" : "bodies"}`;
  }
  if (filters.jurisdictionIds?.length) {
    return `${filters.jurisdictionIds.length} ${filters.jurisdictionIds.length === 1 ? "jurisdiction" : "jurisdictions"}`;
  }
  return "All covered jurisdictions";
}

// ── Demo store (in-memory, mutable for the session) ──────────────────────────
interface DemoState {
  searches: SavedSearchView[];
  log: AlertLogItem[];
}

function seedState(): DemoState {
  const now = Date.now();
  const searches: SavedSearchView[] = [
    {
      id: "ss-rezoning",
      name: "Rezonings (Triangle)",
      query: "rezoning",
      filters: {},
      isAlert: true,
      frequency: "instant",
      scopeSummary: "All covered jurisdictions",
      createdAt: new Date(now - 20 * 86_400_000),
    },
    {
      id: "ss-housing",
      name: "Affordable housing",
      query: "affordable housing",
      filters: {},
      isAlert: true,
      frequency: "daily",
      scopeSummary: "All covered jurisdictions",
      createdAt: new Date(now - 12 * 86_400_000),
    },
    {
      id: "ss-school",
      name: "School redistricting",
      query: "school redistricting",
      filters: {},
      isAlert: false,
      frequency: "weekly",
      scopeSummary: "All covered jurisdictions",
      createdAt: new Date(now - 5 * 86_400_000),
    },
  ];
  const log: AlertLogItem[] = [
    {
      id: "al-1",
      savedSearchName: "Rezonings (Triangle)",
      meetingId: "mtg_ral_council_0609",
      title: "Raleigh City Council — Jun 9, 2026",
      jurisdictionName: "Raleigh",
      govBodyName: "City Council",
      snippet: "Public hearing on a <mark>rezoning</mark> for a mixed-use infill project.",
      deepLink: "/meetings/mtg_ral_council_0609?q=rezoning",
      status: "sent",
      sentAt: new Date(now - 2 * 86_400_000),
    },
    {
      id: "al-2",
      savedSearchName: "Affordable housing",
      meetingId: "mtg_clt_council_0608",
      title: "Charlotte City Council — Jun 8, 2026",
      jurisdictionName: "Charlotte",
      govBodyName: "City Council",
      snippet: "<mark>Affordable housing</mark> land acquisition near a transit station.",
      deepLink: "/meetings/mtg_clt_council_0608?q=affordable+housing",
      status: "sent",
      sentAt: new Date(now - 3 * 86_400_000),
    },
    {
      id: "al-3",
      savedSearchName: "Rezonings (Triangle)",
      meetingId: "mtg_cary_council_0611",
      title: "Cary Town Council — Jun 11, 2026",
      jurisdictionName: "Cary",
      govBodyName: "Town Council",
      snippet: "<mark>Rezoning</mark> 26-REZ-09: solar and battery storage facility.",
      deepLink: "/meetings/mtg_cary_council_0611?q=rezoning",
      status: "sent",
      sentAt: new Date(now - 4 * 86_400_000),
    },
  ];
  return { searches, log };
}

// Module-level so mutations persist across requests within an isolate (review UX).
const demoState: DemoState = seedState();

class DemoUserStore implements UserStore {
  readonly isDemo = true;

  async dashboardSummary(): Promise<DashboardSummary> {
    const weekAgo = Date.now() - 7 * 86_400_000;
    return {
      savedSearchCount: demoState.searches.length,
      activeAlertCount: demoState.searches.filter((s) => s.isAlert).length,
      matchesThisWeek: demoState.log.filter((a) => a.sentAt.getTime() >= weekAgo).length,
      recent: demoState.log.slice(0, 5),
    };
  }

  async listSavedSearches(): Promise<SavedSearchView[]> {
    return [...demoState.searches].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async createSavedSearch(
    _userId: string,
    input: CreateSavedSearchInput,
  ): Promise<SavedSearchView> {
    const view: SavedSearchView = {
      id: crypto.randomUUID(),
      name: input.name,
      query: input.query,
      filters: input.filters ?? {},
      isAlert: input.isAlert,
      frequency: input.frequency ?? "instant",
      scopeSummary: scopeSummary(input.filters ?? {}),
      createdAt: new Date(),
    };
    demoState.searches.push(view);
    return view;
  }

  async updateSavedSearch(
    _userId: string,
    id: string,
    patch: { name?: string; isAlert?: boolean; frequency?: AlertFrequency },
  ): Promise<void> {
    const s = demoState.searches.find((x) => x.id === id);
    if (!s) return;
    if (patch.name !== undefined) s.name = patch.name;
    if (patch.isAlert !== undefined) s.isAlert = patch.isAlert;
    if (patch.frequency !== undefined) s.frequency = patch.frequency;
  }

  async deleteSavedSearch(_userId: string, id: string): Promise<void> {
    const i = demoState.searches.findIndex((x) => x.id === id);
    if (i >= 0) demoState.searches.splice(i, 1);
  }

  async listAlertLog(_userId: string, limit = 50): Promise<AlertLogItem[]> {
    return demoState.log.slice(0, limit);
  }
}

// ── Postgres store ───────────────────────────────────────────────────────────
class PostgresUserStore implements UserStore {
  readonly isDemo = false;
  constructor(private readonly db: Database) {}

  async listSavedSearches(userId: string): Promise<SavedSearchView[]> {
    const rows = await this.db.query.savedSearches.findMany({
      where: eq(schema.savedSearches.userId, userId),
      with: { alertSubscription: true },
      orderBy: desc(schema.savedSearches.createdAt),
    });
    return rows.map((s) => ({
      id: s.id,
      name: s.name,
      query: s.query,
      filters: s.filters,
      isAlert: s.isAlert,
      frequency: (s.alertSubscription?.frequency ?? "instant") as AlertFrequency,
      scopeSummary: scopeSummary(s.filters),
      createdAt: s.createdAt,
    }));
  }

  async createSavedSearch(userId: string, input: CreateSavedSearchInput): Promise<SavedSearchView> {
    const [row] = await this.db
      .insert(schema.savedSearches)
      .values({
        userId,
        name: input.name,
        query: input.query,
        filters: input.filters ?? {},
        isAlert: input.isAlert,
      })
      .returning();
    if (!row) throw new Error("Failed to create saved search");
    if (input.isAlert) {
      await this.db.insert(schema.alertSubscriptions).values({
        savedSearchId: row.id,
        frequency: input.frequency ?? "instant",
        active: true,
      });
    }
    return {
      id: row.id,
      name: row.name,
      query: row.query,
      filters: row.filters,
      isAlert: row.isAlert,
      frequency: input.frequency ?? "instant",
      scopeSummary: scopeSummary(row.filters),
      createdAt: row.createdAt,
    };
  }

  async updateSavedSearch(
    userId: string,
    id: string,
    patch: { name?: string; isAlert?: boolean; frequency?: AlertFrequency },
  ): Promise<void> {
    const owned = await this.db.query.savedSearches.findFirst({
      where: and(eq(schema.savedSearches.id, id), eq(schema.savedSearches.userId, userId)),
    });
    if (!owned) return;
    if (patch.name !== undefined || patch.isAlert !== undefined) {
      await this.db
        .update(schema.savedSearches)
        .set({
          ...(patch.name !== undefined ? { name: patch.name } : {}),
          ...(patch.isAlert !== undefined ? { isAlert: patch.isAlert } : {}),
        })
        .where(eq(schema.savedSearches.id, id));
    }
    if (patch.isAlert || patch.frequency) {
      await this.db
        .insert(schema.alertSubscriptions)
        .values({
          savedSearchId: id,
          frequency: patch.frequency ?? "instant",
          active: patch.isAlert ?? true,
        })
        .onConflictDoUpdate({
          target: schema.alertSubscriptions.savedSearchId,
          set: {
            active: patch.isAlert ?? true,
            ...(patch.frequency ? { frequency: patch.frequency } : {}),
          },
        });
    } else if (patch.isAlert === false) {
      await this.db
        .update(schema.alertSubscriptions)
        .set({ active: false })
        .where(eq(schema.alertSubscriptions.savedSearchId, id));
    }
  }

  async deleteSavedSearch(userId: string, id: string): Promise<void> {
    await this.db
      .delete(schema.savedSearches)
      .where(and(eq(schema.savedSearches.id, id), eq(schema.savedSearches.userId, userId)));
  }

  async listAlertLog(userId: string, limit = 50): Promise<AlertLogItem[]> {
    const a = schema.alerts;
    const ss = schema.savedSearches;
    const ce = schema.contentEvents;
    const gb = schema.govBodies;
    const j = schema.jurisdictions;
    const rows = await this.db
      .select({
        id: a.id,
        savedSearchName: ss.name,
        meetingId: ce.meetingId,
        title: ce.title,
        govBodyName: gb.name,
        jurisdictionName: j.name,
        snippet: a.snippet,
        deepLink: a.deepLink,
        status: a.status,
        sentAt: a.sentAt,
        createdAt: a.createdAt,
      })
      .from(a)
      .innerJoin(ss, eq(a.savedSearchId, ss.id))
      .leftJoin(ce, eq(a.contentEventId, ce.id))
      .leftJoin(gb, eq(ce.govBodyId, gb.id))
      .leftJoin(j, eq(ce.jurisdictionId, j.id))
      .where(eq(a.userId, userId))
      .orderBy(desc(a.createdAt))
      .limit(limit);

    return rows.map((r) => ({
      id: r.id,
      savedSearchName: r.savedSearchName,
      meetingId: r.meetingId,
      title: r.title ?? "Match",
      jurisdictionName: r.jurisdictionName,
      govBodyName: r.govBodyName,
      snippet: r.snippet,
      deepLink: r.deepLink,
      status: r.status,
      sentAt: r.sentAt ?? r.createdAt,
    }));
  }

  async dashboardSummary(userId: string): Promise<DashboardSummary> {
    const [ssCount] = await this.db
      .select({ c: count() })
      .from(schema.savedSearches)
      .where(eq(schema.savedSearches.userId, userId));
    const [activeCount] = await this.db
      .select({ c: count() })
      .from(schema.savedSearches)
      .innerJoin(
        schema.alertSubscriptions,
        eq(schema.alertSubscriptions.savedSearchId, schema.savedSearches.id),
      )
      .where(
        and(eq(schema.savedSearches.userId, userId), eq(schema.alertSubscriptions.active, true)),
      );
    const weekAgo = new Date(Date.now() - 7 * 86_400_000);
    const [weekCount] = await this.db
      .select({ c: count() })
      .from(schema.alerts)
      .where(and(eq(schema.alerts.userId, userId), gte(schema.alerts.createdAt, weekAgo)));
    const recent = await this.listAlertLog(userId, 5);
    return {
      savedSearchCount: Number(ssCount?.c ?? 0),
      activeAlertCount: Number(activeCount?.c ?? 0),
      matchesThisWeek: Number(weekCount?.c ?? 0),
      recent,
    };
  }
}

let cached: UserStore | undefined;

export function getUserStore(): UserStore {
  if (cached) return cached;
  const url = resolveEnv("DATABASE_URL");
  cached = url ? new PostgresUserStore(createDb(url)) : new DemoUserStore();
  return cached;
}
