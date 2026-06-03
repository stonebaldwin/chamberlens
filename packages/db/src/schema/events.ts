import { boolean, index, integer, jsonb, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import {
  contentEventTypeEnum,
  createdAt,
  platformEnum,
  primaryId,
  syncStatusEnum,
} from "./_shared";
import { govBodies, jurisdictions, platformConfigs } from "./jurisdictions";
import { meetings } from "./meetings";

// Emitted whenever new ingestible content appears; feeds the alert pipeline.
export const contentEvents = pgTable(
  "content_events",
  {
    id: primaryId(),
    type: contentEventTypeEnum("type").notNull(),
    meetingId: text("meeting_id").references(() => meetings.id, { onDelete: "cascade" }),
    govBodyId: text("gov_body_id").references(() => govBodies.id, { onDelete: "cascade" }),
    jurisdictionId: text("jurisdiction_id").references(() => jurisdictions.id, {
      onDelete: "cascade",
    }),
    refType: text("ref_type"),
    refId: text("ref_id"),
    title: text("title"),
    snippet: text("snippet"),
    processed: boolean("processed").default(false).notNull(),
    processedAt: timestamp("processed_at", { withTimezone: true }),
    createdAt: createdAt(),
  },
  (t) => [
    index("content_events_processed_idx").on(t.processed, t.createdAt),
    index("content_events_meeting_idx").on(t.meetingId),
  ],
);

// Ingestion health: one row per adapter run, with anomaly detection.
export const syncRuns = pgTable(
  "sync_runs",
  {
    id: primaryId(),
    platformConfigId: text("platform_config_id").references(() => platformConfigs.id, {
      onDelete: "set null",
    }),
    jurisdictionId: text("jurisdiction_id").references(() => jurisdictions.id, {
      onDelete: "set null",
    }),
    platform: platformEnum("platform"),
    adapterId: text("adapter_id"),
    status: syncStatusEnum("status").notNull(),
    startedAt: timestamp("started_at", { withTimezone: true }).notNull(),
    finishedAt: timestamp("finished_at", { withTimezone: true }),
    durationMs: integer("duration_ms"),
    recordsSeen: integer("records_seen").default(0).notNull(),
    recordsNew: integer("records_new").default(0).notNull(),
    recordsUpdated: integer("records_updated").default(0).notNull(),
    errorCount: integer("error_count").default(0).notNull(),
    anomalous: boolean("anomalous").default(false).notNull(),
    notes: text("notes"),
    errors: jsonb("errors").$type<{ message: string; context?: string }[]>(),
    createdAt: createdAt(),
  },
  (t) => [
    index("sync_runs_config_idx").on(t.platformConfigId, t.startedAt),
    index("sync_runs_status_idx").on(t.status, t.startedAt),
  ],
);
