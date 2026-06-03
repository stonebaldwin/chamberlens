import { index, integer, pgTable, real, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";
import {
  createdAt,
  docTypeEnum,
  extractionStatusEnum,
  meetingStatusEnum,
  primaryId,
  sttProviderEnum,
  transcriptSourceEnum,
  updatedAt,
} from "./_shared";
import { govBodies, jurisdictions } from "./jurisdictions";

export const meetings = pgTable(
  "meetings",
  {
    id: primaryId(),
    govBodyId: text("gov_body_id")
      .notNull()
      .references(() => govBodies.id, { onDelete: "cascade" }),
    // denormalized for fast filtered search/browse
    jurisdictionId: text("jurisdiction_id")
      .notNull()
      .references(() => jurisdictions.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    meetingType: text("meeting_type"), // "Regular" | "Special" | "Work Session"
    status: meetingStatusEnum("status").default("scheduled").notNull(),
    scheduledAt: timestamp("scheduled_at", { withTimezone: true }).notNull(),
    location: text("location"),
    videoUrl: text("video_url"),
    sourceUrl: text("source_url").notNull(),
    externalId: text("external_id"), // platform meeting/event id
    platform: text("platform"),
    matchConfidence: real("match_confidence"), // entity-resolution confidence 0..1
    retrievedAt: timestamp("retrieved_at", { withTimezone: true }).defaultNow().notNull(),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    index("meetings_body_idx").on(t.govBodyId, t.scheduledAt),
    index("meetings_jurisdiction_idx").on(t.jurisdictionId, t.scheduledAt),
    index("meetings_scheduled_idx").on(t.scheduledAt),
    uniqueIndex("meetings_platform_external_uniq").on(t.platform, t.externalId),
  ],
);

export const agendaItems = pgTable(
  "agenda_items",
  {
    id: primaryId(),
    meetingId: text("meeting_id")
      .notNull()
      .references(() => meetings.id, { onDelete: "cascade" }),
    order: integer("order").default(0).notNull(),
    itemNumber: text("item_number"), // "5.A"
    title: text("title").notNull(),
    description: text("description"),
    itemType: text("item_type"), // "Resolution" | "Public Hearing" | ...
    externalId: text("external_id"),
    createdAt: createdAt(),
  },
  (t) => [index("agenda_items_meeting_idx").on(t.meetingId, t.order)],
);

export const documents = pgTable(
  "documents",
  {
    id: primaryId(),
    meetingId: text("meeting_id").references(() => meetings.id, { onDelete: "cascade" }),
    agendaItemId: text("agenda_item_id").references(() => agendaItems.id, {
      onDelete: "cascade",
    }),
    docType: docTypeEnum("doc_type").notNull(),
    title: text("title"),
    originalUrl: text("original_url").notNull(),
    mimeType: text("mime_type"),
    textContent: text("text_content"), // extracted clean text
    contentHash: text("content_hash"), // sha256 of original bytes (change detection)
    extractionStatus: extractionStatusEnum("extraction_status").default("pending").notNull(),
    pageCount: integer("page_count"),
    retrievedAt: timestamp("retrieved_at", { withTimezone: true }).defaultNow().notNull(),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    index("documents_meeting_idx").on(t.meetingId),
    index("documents_agenda_item_idx").on(t.agendaItemId),
    index("documents_url_idx").on(t.originalUrl),
  ],
);

export const transcripts = pgTable(
  "transcripts",
  {
    id: primaryId(),
    meetingId: text("meeting_id")
      .notNull()
      .references(() => meetings.id, { onDelete: "cascade" })
      .unique(),
    source: transcriptSourceEnum("source").notNull(),
    provider: sttProviderEnum("provider").default("none").notNull(),
    language: text("language").default("en").notNull(),
    fullText: text("full_text").notNull(),
    durationSeconds: integer("duration_seconds"),
    costUsd: real("cost_usd"), // STT spend for this transcript (budget tracking)
    createdAt: createdAt(),
  },
  (t) => [index("transcripts_meeting_idx").on(t.meetingId)],
);

// Word/segment timestamps so search results deep-link into the video.
export const transcriptSegments = pgTable(
  "transcript_segments",
  {
    id: primaryId(),
    transcriptId: text("transcript_id")
      .notNull()
      .references(() => transcripts.id, { onDelete: "cascade" }),
    meetingId: text("meeting_id")
      .notNull()
      .references(() => meetings.id, { onDelete: "cascade" }),
    order: integer("order").notNull(),
    startMs: integer("start_ms").notNull(),
    endMs: integer("end_ms").notNull(),
    speaker: text("speaker"),
    text: text("text").notNull(),
  },
  (t) => [
    index("transcript_segments_transcript_idx").on(t.transcriptId, t.order),
    index("transcript_segments_time_idx").on(t.meetingId, t.startMs),
  ],
);
