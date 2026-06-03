CREATE TYPE "public"."alert_channel" AS ENUM('email');--> statement-breakpoint
CREATE TYPE "public"."alert_frequency" AS ENUM('instant', 'daily', 'weekly');--> statement-breakpoint
CREATE TYPE "public"."alert_status" AS ENUM('pending', 'sent', 'failed', 'skipped');--> statement-breakpoint
CREATE TYPE "public"."cadence" AS ENUM('daily', 'weekly');--> statement-breakpoint
CREATE TYPE "public"."content_event_type" AS ENUM('new_meeting', 'new_agenda', 'new_minutes', 'new_transcript', 'new_document');--> statement-breakpoint
CREATE TYPE "public"."coverage_status" AS ENUM('requested', 'planned', 'live', 'declined');--> statement-breakpoint
CREATE TYPE "public"."doc_type" AS ENUM('agenda', 'minutes', 'packet', 'attachment', 'resolution', 'ordinance', 'presentation', 'other');--> statement-breakpoint
CREATE TYPE "public"."extraction_status" AS ENUM('pending', 'extracted', 'ocr', 'failed', 'empty');--> statement-breakpoint
CREATE TYPE "public"."gov_body_type" AS ENUM('city_council', 'county_commission', 'school_board', 'planning_commission', 'zoning_board', 'special_district', 'committee', 'other');--> statement-breakpoint
CREATE TYPE "public"."ingest_method" AS ENUM('api', 'html', 'browser');--> statement-breakpoint
CREATE TYPE "public"."jurisdiction_type" AS ENUM('city', 'county', 'town', 'school_district', 'special_district', 'state', 'other');--> statement-breakpoint
CREATE TYPE "public"."meeting_status" AS ENUM('scheduled', 'in_progress', 'completed', 'cancelled', 'rescheduled');--> statement-breakpoint
CREATE TYPE "public"."membership_role" AS ENUM('owner', 'admin', 'member');--> statement-breakpoint
CREATE TYPE "public"."plan" AS ENUM('free', 'pro', 'business');--> statement-breakpoint
CREATE TYPE "public"."platform_config_status" AS ENUM('active', 'paused', 'blocked', 'error');--> statement-breakpoint
CREATE TYPE "public"."platform" AS ENUM('legistar', 'civicplus', 'civicclerk', 'primegov', 'granicus', 'csv', 'browser');--> statement-breakpoint
CREATE TYPE "public"."search_ref_type" AS ENUM('agenda_item', 'minutes', 'transcript', 'document', 'meeting');--> statement-breakpoint
CREATE TYPE "public"."stt_provider" AS ENUM('deepgram', 'assemblyai', 'whisper', 'none');--> statement-breakpoint
CREATE TYPE "public"."subscription_status" AS ENUM('active', 'trialing', 'past_due', 'canceled', 'incomplete', 'incomplete_expired', 'unpaid', 'paused');--> statement-breakpoint
CREATE TYPE "public"."sync_status" AS ENUM('success', 'partial', 'failed');--> statement-breakpoint
CREATE TYPE "public"."transcript_source" AS ENUM('published_minutes', 'stt');--> statement-breakpoint
CREATE TABLE "account" (
	"id" text PRIMARY KEY NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"user_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp with time zone,
	"refresh_token_expires_at" timestamp with time zone,
	"scope" text,
	"password" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "session" (
	"id" text PRIMARY KEY NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"token" text NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"user_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "session_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"image" text,
	"role" text DEFAULT 'user' NOT NULL,
	"stripe_customer_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "verification" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "memberships" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"user_id" text NOT NULL,
	"role" "membership_role" DEFAULT 'member' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "organizations" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"owner_id" text NOT NULL,
	"stripe_customer_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "organizations_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "subscriptions" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text,
	"organization_id" text,
	"plan" "plan" DEFAULT 'free' NOT NULL,
	"status" "subscription_status" DEFAULT 'active' NOT NULL,
	"stripe_customer_id" text,
	"stripe_subscription_id" text,
	"stripe_price_id" text,
	"current_period_end" timestamp with time zone,
	"cancel_at_period_end" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "subscriptions_stripe_subscription_id_unique" UNIQUE("stripe_subscription_id")
);
--> statement-breakpoint
CREATE TABLE "usage_counters" (
	"id" text PRIMARY KEY NOT NULL,
	"subject_type" text NOT NULL,
	"subject_id" text NOT NULL,
	"period" text NOT NULL,
	"metric" text NOT NULL,
	"count" integer DEFAULT 0 NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "gov_bodies" (
	"id" text PRIMARY KEY NOT NULL,
	"jurisdiction_id" text NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"type" "gov_body_type" NOT NULL,
	"description" text,
	"external_id" text,
	"is_high_value" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "jurisdictions" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"type" "jurisdiction_type" NOT NULL,
	"state" text NOT NULL,
	"county" text,
	"timezone" text DEFAULT 'America/New_York' NOT NULL,
	"lat" double precision,
	"lng" double precision,
	"population" integer,
	"website_url" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "jurisdictions_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "platform_configs" (
	"id" text PRIMARY KEY NOT NULL,
	"jurisdiction_id" text NOT NULL,
	"platform" "platform" NOT NULL,
	"method" "ingest_method" NOT NULL,
	"client" text NOT NULL,
	"api_token_ref" text,
	"tracked_body_external_ids" jsonb,
	"cadence" "cadence" DEFAULT 'daily' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"status" "platform_config_status" DEFAULT 'active' NOT NULL,
	"last_synced_at" timestamp with time zone,
	"last_success_at" timestamp with time zone,
	"config" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "agenda_items" (
	"id" text PRIMARY KEY NOT NULL,
	"meeting_id" text NOT NULL,
	"order" integer DEFAULT 0 NOT NULL,
	"item_number" text,
	"title" text NOT NULL,
	"description" text,
	"item_type" text,
	"external_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "documents" (
	"id" text PRIMARY KEY NOT NULL,
	"meeting_id" text,
	"agenda_item_id" text,
	"doc_type" "doc_type" NOT NULL,
	"title" text,
	"original_url" text NOT NULL,
	"mime_type" text,
	"text_content" text,
	"content_hash" text,
	"extraction_status" "extraction_status" DEFAULT 'pending' NOT NULL,
	"page_count" integer,
	"retrieved_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "meetings" (
	"id" text PRIMARY KEY NOT NULL,
	"gov_body_id" text NOT NULL,
	"jurisdiction_id" text NOT NULL,
	"title" text NOT NULL,
	"meeting_type" text,
	"status" "meeting_status" DEFAULT 'scheduled' NOT NULL,
	"scheduled_at" timestamp with time zone NOT NULL,
	"location" text,
	"video_url" text,
	"source_url" text NOT NULL,
	"external_id" text,
	"platform" text,
	"match_confidence" real,
	"retrieved_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "transcript_segments" (
	"id" text PRIMARY KEY NOT NULL,
	"transcript_id" text NOT NULL,
	"meeting_id" text NOT NULL,
	"order" integer NOT NULL,
	"start_ms" integer NOT NULL,
	"end_ms" integer NOT NULL,
	"speaker" text,
	"text" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "transcripts" (
	"id" text PRIMARY KEY NOT NULL,
	"meeting_id" text NOT NULL,
	"source" "transcript_source" NOT NULL,
	"provider" "stt_provider" DEFAULT 'none' NOT NULL,
	"language" text DEFAULT 'en' NOT NULL,
	"full_text" text NOT NULL,
	"duration_seconds" integer,
	"cost_usd" real,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "transcripts_meeting_id_unique" UNIQUE("meeting_id")
);
--> statement-breakpoint
CREATE TABLE "search_documents" (
	"id" text PRIMARY KEY NOT NULL,
	"ref_type" "search_ref_type" NOT NULL,
	"ref_id" text NOT NULL,
	"meeting_id" text NOT NULL,
	"gov_body_id" text NOT NULL,
	"jurisdiction_id" text NOT NULL,
	"doc_type" "doc_type",
	"title" text,
	"body" text NOT NULL,
	"meeting_date" timestamp with time zone NOT NULL,
	"tsv" "tsvector" GENERATED ALWAYS AS (setweight(to_tsvector('english', coalesce(title, '')), 'A') || setweight(to_tsvector('english', body), 'B')) STORED,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "content_events" (
	"id" text PRIMARY KEY NOT NULL,
	"type" "content_event_type" NOT NULL,
	"meeting_id" text,
	"gov_body_id" text,
	"jurisdiction_id" text,
	"ref_type" text,
	"ref_id" text,
	"title" text,
	"snippet" text,
	"processed" boolean DEFAULT false NOT NULL,
	"processed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sync_runs" (
	"id" text PRIMARY KEY NOT NULL,
	"platform_config_id" text,
	"jurisdiction_id" text,
	"platform" "platform",
	"adapter_id" text,
	"status" "sync_status" NOT NULL,
	"started_at" timestamp with time zone NOT NULL,
	"finished_at" timestamp with time zone,
	"duration_ms" integer,
	"records_seen" integer DEFAULT 0 NOT NULL,
	"records_new" integer DEFAULT 0 NOT NULL,
	"records_updated" integer DEFAULT 0 NOT NULL,
	"error_count" integer DEFAULT 0 NOT NULL,
	"anomalous" boolean DEFAULT false NOT NULL,
	"notes" text,
	"errors" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "alert_subscriptions" (
	"id" text PRIMARY KEY NOT NULL,
	"saved_search_id" text NOT NULL,
	"frequency" "alert_frequency" DEFAULT 'instant' NOT NULL,
	"channel" "alert_channel" DEFAULT 'email' NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"geo_lat" double precision,
	"geo_lng" double precision,
	"geo_radius_miles" real,
	"last_notified_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "alert_subscriptions_saved_search_id_unique" UNIQUE("saved_search_id")
);
--> statement-breakpoint
CREATE TABLE "alerts" (
	"id" text PRIMARY KEY NOT NULL,
	"saved_search_id" text NOT NULL,
	"content_event_id" text NOT NULL,
	"user_id" text NOT NULL,
	"channel" "alert_channel" DEFAULT 'email' NOT NULL,
	"status" "alert_status" DEFAULT 'pending' NOT NULL,
	"snippet" text,
	"deep_link" text,
	"sent_at" timestamp with time zone,
	"error" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "coverage_requests" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text,
	"jurisdiction_name" text NOT NULL,
	"state" text,
	"email" text,
	"notes" text,
	"status" "coverage_status" DEFAULT 'requested' NOT NULL,
	"votes" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "saved_searches" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"organization_id" text,
	"name" text NOT NULL,
	"query" text NOT NULL,
	"filters" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"is_alert" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "memberships" ADD CONSTRAINT "memberships_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "memberships" ADD CONSTRAINT "memberships_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organizations" ADD CONSTRAINT "organizations_owner_id_user_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."user"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gov_bodies" ADD CONSTRAINT "gov_bodies_jurisdiction_id_jurisdictions_id_fk" FOREIGN KEY ("jurisdiction_id") REFERENCES "public"."jurisdictions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "platform_configs" ADD CONSTRAINT "platform_configs_jurisdiction_id_jurisdictions_id_fk" FOREIGN KEY ("jurisdiction_id") REFERENCES "public"."jurisdictions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agenda_items" ADD CONSTRAINT "agenda_items_meeting_id_meetings_id_fk" FOREIGN KEY ("meeting_id") REFERENCES "public"."meetings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "documents" ADD CONSTRAINT "documents_meeting_id_meetings_id_fk" FOREIGN KEY ("meeting_id") REFERENCES "public"."meetings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "documents" ADD CONSTRAINT "documents_agenda_item_id_agenda_items_id_fk" FOREIGN KEY ("agenda_item_id") REFERENCES "public"."agenda_items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "meetings" ADD CONSTRAINT "meetings_gov_body_id_gov_bodies_id_fk" FOREIGN KEY ("gov_body_id") REFERENCES "public"."gov_bodies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "meetings" ADD CONSTRAINT "meetings_jurisdiction_id_jurisdictions_id_fk" FOREIGN KEY ("jurisdiction_id") REFERENCES "public"."jurisdictions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transcript_segments" ADD CONSTRAINT "transcript_segments_transcript_id_transcripts_id_fk" FOREIGN KEY ("transcript_id") REFERENCES "public"."transcripts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transcript_segments" ADD CONSTRAINT "transcript_segments_meeting_id_meetings_id_fk" FOREIGN KEY ("meeting_id") REFERENCES "public"."meetings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transcripts" ADD CONSTRAINT "transcripts_meeting_id_meetings_id_fk" FOREIGN KEY ("meeting_id") REFERENCES "public"."meetings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "search_documents" ADD CONSTRAINT "search_documents_meeting_id_meetings_id_fk" FOREIGN KEY ("meeting_id") REFERENCES "public"."meetings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "search_documents" ADD CONSTRAINT "search_documents_gov_body_id_gov_bodies_id_fk" FOREIGN KEY ("gov_body_id") REFERENCES "public"."gov_bodies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "search_documents" ADD CONSTRAINT "search_documents_jurisdiction_id_jurisdictions_id_fk" FOREIGN KEY ("jurisdiction_id") REFERENCES "public"."jurisdictions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "content_events" ADD CONSTRAINT "content_events_meeting_id_meetings_id_fk" FOREIGN KEY ("meeting_id") REFERENCES "public"."meetings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "content_events" ADD CONSTRAINT "content_events_gov_body_id_gov_bodies_id_fk" FOREIGN KEY ("gov_body_id") REFERENCES "public"."gov_bodies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "content_events" ADD CONSTRAINT "content_events_jurisdiction_id_jurisdictions_id_fk" FOREIGN KEY ("jurisdiction_id") REFERENCES "public"."jurisdictions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sync_runs" ADD CONSTRAINT "sync_runs_platform_config_id_platform_configs_id_fk" FOREIGN KEY ("platform_config_id") REFERENCES "public"."platform_configs"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sync_runs" ADD CONSTRAINT "sync_runs_jurisdiction_id_jurisdictions_id_fk" FOREIGN KEY ("jurisdiction_id") REFERENCES "public"."jurisdictions"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "alert_subscriptions" ADD CONSTRAINT "alert_subscriptions_saved_search_id_saved_searches_id_fk" FOREIGN KEY ("saved_search_id") REFERENCES "public"."saved_searches"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "alerts" ADD CONSTRAINT "alerts_saved_search_id_saved_searches_id_fk" FOREIGN KEY ("saved_search_id") REFERENCES "public"."saved_searches"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "alerts" ADD CONSTRAINT "alerts_content_event_id_content_events_id_fk" FOREIGN KEY ("content_event_id") REFERENCES "public"."content_events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "alerts" ADD CONSTRAINT "alerts_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "coverage_requests" ADD CONSTRAINT "coverage_requests_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "saved_searches" ADD CONSTRAINT "saved_searches_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "saved_searches" ADD CONSTRAINT "saved_searches_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "memberships_org_user_uniq" ON "memberships" USING btree ("organization_id","user_id");--> statement-breakpoint
CREATE INDEX "subscriptions_user_idx" ON "subscriptions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "subscriptions_org_idx" ON "subscriptions" USING btree ("organization_id");--> statement-breakpoint
CREATE UNIQUE INDEX "usage_counters_uniq" ON "usage_counters" USING btree ("subject_type","subject_id","period","metric");--> statement-breakpoint
CREATE INDEX "gov_bodies_jurisdiction_idx" ON "gov_bodies" USING btree ("jurisdiction_id");--> statement-breakpoint
CREATE UNIQUE INDEX "gov_bodies_jurisdiction_slug_uniq" ON "gov_bodies" USING btree ("jurisdiction_id","slug");--> statement-breakpoint
CREATE INDEX "jurisdictions_state_idx" ON "jurisdictions" USING btree ("state");--> statement-breakpoint
CREATE INDEX "platform_configs_jurisdiction_idx" ON "platform_configs" USING btree ("jurisdiction_id");--> statement-breakpoint
CREATE INDEX "platform_configs_active_idx" ON "platform_configs" USING btree ("is_active","cadence");--> statement-breakpoint
CREATE INDEX "agenda_items_meeting_idx" ON "agenda_items" USING btree ("meeting_id","order");--> statement-breakpoint
CREATE INDEX "documents_meeting_idx" ON "documents" USING btree ("meeting_id");--> statement-breakpoint
CREATE INDEX "documents_agenda_item_idx" ON "documents" USING btree ("agenda_item_id");--> statement-breakpoint
CREATE INDEX "documents_url_idx" ON "documents" USING btree ("original_url");--> statement-breakpoint
CREATE INDEX "meetings_body_idx" ON "meetings" USING btree ("gov_body_id","scheduled_at");--> statement-breakpoint
CREATE INDEX "meetings_jurisdiction_idx" ON "meetings" USING btree ("jurisdiction_id","scheduled_at");--> statement-breakpoint
CREATE INDEX "meetings_scheduled_idx" ON "meetings" USING btree ("scheduled_at");--> statement-breakpoint
CREATE UNIQUE INDEX "meetings_platform_external_uniq" ON "meetings" USING btree ("platform","external_id");--> statement-breakpoint
CREATE INDEX "transcript_segments_transcript_idx" ON "transcript_segments" USING btree ("transcript_id","order");--> statement-breakpoint
CREATE INDEX "transcript_segments_time_idx" ON "transcript_segments" USING btree ("meeting_id","start_ms");--> statement-breakpoint
CREATE INDEX "transcripts_meeting_idx" ON "transcripts" USING btree ("meeting_id");--> statement-breakpoint
CREATE INDEX "search_documents_tsv_idx" ON "search_documents" USING gin ("tsv");--> statement-breakpoint
CREATE INDEX "search_documents_jurisdiction_idx" ON "search_documents" USING btree ("jurisdiction_id");--> statement-breakpoint
CREATE INDEX "search_documents_body_idx" ON "search_documents" USING btree ("gov_body_id");--> statement-breakpoint
CREATE INDEX "search_documents_date_idx" ON "search_documents" USING btree ("meeting_date");--> statement-breakpoint
CREATE INDEX "search_documents_doc_type_idx" ON "search_documents" USING btree ("doc_type");--> statement-breakpoint
CREATE UNIQUE INDEX "search_documents_ref_uniq" ON "search_documents" USING btree ("ref_type","ref_id");--> statement-breakpoint
CREATE INDEX "content_events_processed_idx" ON "content_events" USING btree ("processed","created_at");--> statement-breakpoint
CREATE INDEX "content_events_meeting_idx" ON "content_events" USING btree ("meeting_id");--> statement-breakpoint
CREATE INDEX "sync_runs_config_idx" ON "sync_runs" USING btree ("platform_config_id","started_at");--> statement-breakpoint
CREATE INDEX "sync_runs_status_idx" ON "sync_runs" USING btree ("status","started_at");--> statement-breakpoint
CREATE INDEX "alert_subscriptions_active_idx" ON "alert_subscriptions" USING btree ("active");--> statement-breakpoint
CREATE UNIQUE INDEX "alerts_dedupe_uniq" ON "alerts" USING btree ("saved_search_id","content_event_id");--> statement-breakpoint
CREATE INDEX "alerts_user_idx" ON "alerts" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "coverage_requests_status_idx" ON "coverage_requests" USING btree ("status");--> statement-breakpoint
CREATE INDEX "saved_searches_user_idx" ON "saved_searches" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "saved_searches_alert_idx" ON "saved_searches" USING btree ("is_alert");