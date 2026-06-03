import { randomUUID } from "node:crypto";
import { customType, pgEnum, text, timestamp } from "drizzle-orm/pg-core";

// ── ID + timestamp helpers ───────────────────────────────────────────────────
/** Text UUID primary key with a JS-side default (works on Node + Workers). */
export const primaryId = () =>
  text("id")
    .primaryKey()
    .$defaultFn(() => randomUUID());

export const createdAt = () =>
  timestamp("created_at", { withTimezone: true }).defaultNow().notNull();

export const updatedAt = () =>
  timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date());

// ── Postgres full-text search vector custom type ─────────────────────────────
export const tsvector = customType<{ data: string }>({
  dataType() {
    return "tsvector";
  },
});

// ── Enums ────────────────────────────────────────────────────────────────────
export const jurisdictionTypeEnum = pgEnum("jurisdiction_type", [
  "city",
  "county",
  "town",
  "school_district",
  "special_district",
  "state",
  "other",
]);

export const govBodyTypeEnum = pgEnum("gov_body_type", [
  "city_council",
  "county_commission",
  "school_board",
  "planning_commission",
  "zoning_board",
  "special_district",
  "committee",
  "other",
]);

export const platformEnum = pgEnum("platform", [
  "legistar",
  "civicplus",
  "civicclerk",
  "primegov",
  "granicus",
  "csv",
  "browser",
]);

export const ingestMethodEnum = pgEnum("ingest_method", ["api", "html", "browser"]);

export const cadenceEnum = pgEnum("cadence", ["daily", "weekly"]);

export const platformConfigStatusEnum = pgEnum("platform_config_status", [
  "active",
  "paused",
  "blocked",
  "error",
]);

export const meetingStatusEnum = pgEnum("meeting_status", [
  "scheduled",
  "in_progress",
  "completed",
  "cancelled",
  "rescheduled",
]);

export const docTypeEnum = pgEnum("doc_type", [
  "agenda",
  "minutes",
  "packet",
  "attachment",
  "resolution",
  "ordinance",
  "presentation",
  "other",
]);

export const extractionStatusEnum = pgEnum("extraction_status", [
  "pending",
  "extracted",
  "ocr",
  "failed",
  "empty",
]);

export const transcriptSourceEnum = pgEnum("transcript_source", ["published_minutes", "stt"]);

export const sttProviderEnum = pgEnum("stt_provider", [
  "deepgram",
  "assemblyai",
  "whisper",
  "none",
]);

export const searchRefTypeEnum = pgEnum("search_ref_type", [
  "agenda_item",
  "minutes",
  "transcript",
  "document",
  "meeting",
]);

export const contentEventTypeEnum = pgEnum("content_event_type", [
  "new_meeting",
  "new_agenda",
  "new_minutes",
  "new_transcript",
  "new_document",
]);

export const syncStatusEnum = pgEnum("sync_status", ["success", "partial", "failed"]);

export const planEnum = pgEnum("plan", ["free", "pro", "business"]);

export const subscriptionStatusEnum = pgEnum("subscription_status", [
  "active",
  "trialing",
  "past_due",
  "canceled",
  "incomplete",
  "incomplete_expired",
  "unpaid",
  "paused",
]);

export const membershipRoleEnum = pgEnum("membership_role", ["owner", "admin", "member"]);

export const alertFrequencyEnum = pgEnum("alert_frequency", ["instant", "daily", "weekly"]);

export const alertChannelEnum = pgEnum("alert_channel", ["email"]);

export const alertStatusEnum = pgEnum("alert_status", ["pending", "sent", "failed", "skipped"]);

export const coverageStatusEnum = pgEnum("coverage_status", [
  "requested",
  "planned",
  "live",
  "declined",
]);
