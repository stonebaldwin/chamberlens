import type { Database } from "@repo/db";
import { getAdapter } from "../adapters/registry";
import type { JurisdictionConfig } from "../adapters/types";
import { type HealthHooks, runWithSyncTracking, type SyncError, type SyncRunRow } from "../health";
import type { SearchIndexer } from "../search/types";
import { persistMeeting } from "./persist";

export interface IngestDeps {
  db: Database;
  indexer?: SearchIndexer;
  hooks?: HealthHooks;
  /** Days to look back before the last success, to catch late edits. */
  lookbackDays?: number;
}

export interface IngestConfigInput extends JurisdictionConfig {
  /** platform_configs.id, if this came from the DB. */
  id?: string | null;
  lastSuccessAt?: Date | null;
}

/**
 * Ingest one jurisdiction's data end-to-end: run its adapter, normalize each
 * record, persist + index, and record a sync_run with anomaly detection. This is
 * the function the cron/queue workers call per platform_config.
 */
export async function ingestConfig(
  config: IngestConfigInput,
  deps: IngestDeps,
): Promise<SyncRunRow> {
  const adapter = getAdapter(config.platform);
  const lookbackMs = (deps.lookbackDays ?? 7) * 86_400_000;
  const since = config.lastSuccessAt
    ? new Date(config.lastSuccessAt.getTime() - lookbackMs)
    : undefined;

  return runWithSyncTracking(
    deps.db,
    {
      platformConfigId: config.id ?? null,
      jurisdictionId: config.jurisdictionId,
      platform: config.platform,
      adapterId: adapter.id,
    },
    deps.hooks,
    async () => {
      const raws = await adapter.fetchRaw(config, since);
      let recordsNew = 0;
      let recordsUpdated = 0;
      const errors: SyncError[] = [];

      for (const raw of raws) {
        try {
          const canonical = adapter.normalize(raw, config);
          const { created } = await persistMeeting(deps.db, config, canonical, deps.indexer);
          if (created) recordsNew++;
          else recordsUpdated++;
        } catch (err) {
          errors.push({
            message: err instanceof Error ? err.message : String(err),
            context: "normalize/persist",
          });
        }
      }

      return { recordsSeen: raws.length, recordsNew, recordsUpdated, errors };
    },
  );
}
