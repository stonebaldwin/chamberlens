import { and, type Database, eq, schema, sql } from "@repo/db";
import type { Platform } from "../types";

export interface SyncRunMeta {
  platformConfigId?: string | null;
  jurisdictionId?: string | null;
  platform?: Platform | null;
  adapterId?: string | null;
}

export interface SyncError {
  message: string;
  context?: string;
}

export interface SyncRunResult {
  recordsSeen: number;
  recordsNew: number;
  recordsUpdated: number;
  errors: SyncError[];
  notes?: string;
}

export interface AnomalyVerdict {
  anomalous: boolean;
  reason?: string;
}

/**
 * Pure anomaly detection over a run's outcome vs. its history. Catches the three
 * failure modes that matter: total failure, error-rate spikes, and a body that
 * used to return results suddenly returning none (platform shape change).
 */
export function detectAnomaly(result: SyncRunResult, priorAvgSeen: number | null): AnomalyVerdict {
  if (result.recordsSeen === 0 && result.errors.length > 0) {
    return { anomalous: true, reason: "all-errors" };
  }
  const errorRate =
    result.recordsSeen > 0
      ? result.errors.length / result.recordsSeen
      : result.errors.length > 0
        ? 1
        : 0;
  if (errorRate >= 0.5) return { anomalous: true, reason: "high-error-rate" };
  if ((priorAvgSeen ?? 0) >= 5 && result.recordsSeen === 0) {
    return { anomalous: true, reason: "zero-results-regression" };
  }
  return { anomalous: false };
}

export type SyncRunRow = typeof schema.syncRuns.$inferSelect;

export interface HealthHooks {
  /** Fired when a run fails or is anomalous (wire to Resend in the app layer). */
  onUnhealthy?(run: SyncRunRow): void | Promise<void>;
}

async function priorAvgSeen(db: Database, meta: SyncRunMeta): Promise<number | null> {
  if (!meta.platformConfigId) return null;
  const rows = await db
    .select({ avg: sql<number>`avg(${schema.syncRuns.recordsSeen})` })
    .from(schema.syncRuns)
    .where(
      and(
        eq(schema.syncRuns.platformConfigId, meta.platformConfigId),
        eq(schema.syncRuns.status, "success"),
      ),
    );
  const avg = rows[0]?.avg;
  return avg == null ? null : Number(avg);
}

/**
 * Run an ingestion function, recording a sync_run with anomaly detection and
 * firing onUnhealthy when something is wrong — so we find out before users do.
 */
export async function runWithSyncTracking(
  db: Database,
  meta: SyncRunMeta,
  hooks: HealthHooks | undefined,
  fn: () => Promise<SyncRunResult>,
): Promise<SyncRunRow> {
  const startedAt = new Date();
  const prior = await priorAvgSeen(db, meta).catch(() => null);

  let result: SyncRunResult;
  let status: "success" | "partial" | "failed";
  try {
    result = await fn();
    status = result.errors.length > 0 ? "partial" : "success";
  } catch (err) {
    result = {
      recordsSeen: 0,
      recordsNew: 0,
      recordsUpdated: 0,
      errors: [{ message: err instanceof Error ? err.message : String(err), context: "run" }],
    };
    status = "failed";
  }

  const finishedAt = new Date();
  const verdict = detectAnomaly(result, prior);
  const inserted = await db
    .insert(schema.syncRuns)
    .values({
      platformConfigId: meta.platformConfigId ?? null,
      jurisdictionId: meta.jurisdictionId ?? null,
      platform: meta.platform ?? null,
      adapterId: meta.adapterId ?? null,
      status,
      startedAt,
      finishedAt,
      durationMs: finishedAt.getTime() - startedAt.getTime(),
      recordsSeen: result.recordsSeen,
      recordsNew: result.recordsNew,
      recordsUpdated: result.recordsUpdated,
      errorCount: result.errors.length,
      anomalous: verdict.anomalous,
      notes: verdict.reason ?? result.notes ?? null,
      errors: result.errors,
    })
    .returning();

  const row = inserted[0];
  if (!row) throw new Error("Failed to record sync_run");
  if ((status === "failed" || verdict.anomalous) && hooks?.onUnhealthy) {
    await hooks.onUnhealthy(row);
  }
  return row;
}
