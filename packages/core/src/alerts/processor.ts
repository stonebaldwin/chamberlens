import { and, type Database, eq, inArray, schema, sql } from "@repo/db";
import { sanitizeSnippet } from "../util/text";

export interface AlertNotification {
  alertId: string;
  userId: string;
  savedSearchName: string;
  query: string;
  meetingId: string | null;
  title: string;
  snippet: string;
  deepLink: string;
}

export type Notifier = (n: AlertNotification) => Promise<{ ok: boolean; error?: string }>;

export interface ProcessAlertsDeps {
  db: Database;
  appUrl: string;
  notify: Notifier;
  batchSize?: number;
  now?: () => Date;
}

interface ScopeFilters {
  jurisdictionIds?: string[];
  govBodyIds?: string[];
}

/** Precise match: does this meeting's indexed text satisfy the alert query (+scope)? */
async function meetingMatches(
  db: Database,
  meetingId: string,
  query: string,
  filters: ScopeFilters,
): Promise<{ matched: boolean; snippet: string }> {
  const sd = schema.searchDocuments;
  const tsq = sql`websearch_to_tsquery('english', ${query})`;
  const conds = [eq(sd.meetingId, meetingId), sql`${sd.tsv} @@ ${tsq}`];
  if (filters.jurisdictionIds?.length)
    conds.push(inArray(sd.jurisdictionId, filters.jurisdictionIds));
  if (filters.govBodyIds?.length) conds.push(inArray(sd.govBodyId, filters.govBodyIds));
  const rows = await db
    .select({
      snippet: sql<string>`ts_headline('english', ${sd.body}, ${tsq}, 'StartSel=<mark>, StopSel=</mark>, MaxFragments=1, MinWords=5, MaxWords=18')`,
    })
    .from(sd)
    .where(and(...conds))
    .limit(1);
  return { matched: rows.length > 0, snippet: rows[0]?.snippet ?? "" };
}

async function markProcessed(db: Database, id: string, now: Date): Promise<void> {
  await db
    .update(schema.contentEvents)
    .set({ processed: true, processedAt: now })
    .where(eq(schema.contentEvents.id, id));
}

/**
 * Instant alert pipeline: for each unprocessed content_event, evaluate it against
 * active instant alert saved-searches, send matches via `notify`, write an alerts
 * row, and mark the event processed. The (saved_search, content_event) unique
 * index dedupes so a user never gets the same match twice.
 */
export async function processInstantAlerts(
  deps: ProcessAlertsDeps,
): Promise<{ processed: number; sent: number; failed: number }> {
  const { db, notify, appUrl } = deps;
  const now = deps.now ?? (() => new Date());
  const batchSize = deps.batchSize ?? 100;

  const events = await db
    .select()
    .from(schema.contentEvents)
    .where(eq(schema.contentEvents.processed, false))
    .orderBy(schema.contentEvents.createdAt)
    .limit(batchSize);
  if (!events.length) return { processed: 0, sent: 0, failed: 0 };

  const alertRows = await db
    .select({ ss: schema.savedSearches, sub: schema.alertSubscriptions })
    .from(schema.savedSearches)
    .innerJoin(
      schema.alertSubscriptions,
      eq(schema.alertSubscriptions.savedSearchId, schema.savedSearches.id),
    )
    .where(
      and(
        eq(schema.savedSearches.isAlert, true),
        eq(schema.alertSubscriptions.active, true),
        eq(schema.alertSubscriptions.frequency, "instant"),
      ),
    );

  let sent = 0;
  let failed = 0;

  for (const ev of events) {
    if (!ev.meetingId) {
      await markProcessed(db, ev.id, now());
      continue;
    }
    for (const { ss } of alertRows) {
      if (ss.organizationId) continue; // org alerts handled separately
      const { matched, snippet } = await meetingMatches(db, ev.meetingId, ss.query, ss.filters);
      if (!matched) continue;

      const deepLink = `${appUrl}/meetings/${ev.meetingId}?q=${encodeURIComponent(ss.query)}`;
      const inserted = await db
        .insert(schema.alerts)
        .values({
          savedSearchId: ss.id,
          contentEventId: ev.id,
          userId: ss.userId,
          channel: "email",
          status: "pending",
          snippet: sanitizeSnippet(snippet || ev.snippet),
          deepLink,
        })
        .onConflictDoNothing()
        .returning({ id: schema.alerts.id });
      const alertRow = inserted[0];
      if (!alertRow) continue; // already delivered (deduped)

      const result = await notify({
        alertId: alertRow.id,
        userId: ss.userId,
        savedSearchName: ss.name,
        query: ss.query,
        meetingId: ev.meetingId,
        title: ev.title ?? "New match",
        snippet: sanitizeSnippet(snippet || ev.snippet || ""),
        deepLink,
      });
      await db
        .update(schema.alerts)
        .set({
          status: result.ok ? "sent" : "failed",
          sentAt: result.ok ? now() : null,
          error: result.error ?? null,
        })
        .where(eq(schema.alerts.id, alertRow.id));
      if (result.ok) sent += 1;
      else failed += 1;
    }
    await markProcessed(db, ev.id, now());
  }

  return { processed: events.length, sent, failed };
}
