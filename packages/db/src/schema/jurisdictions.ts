import {
  boolean,
  doublePrecision,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import {
  cadenceEnum,
  createdAt,
  govBodyTypeEnum,
  ingestMethodEnum,
  jurisdictionTypeEnum,
  platformConfigStatusEnum,
  platformEnum,
  primaryId,
  updatedAt,
} from "./_shared";

export const jurisdictions = pgTable(
  "jurisdictions",
  {
    id: primaryId(),
    name: text("name").notNull(), // "Raleigh"
    slug: text("slug").notNull().unique(), // "raleigh-nc"
    type: jurisdictionTypeEnum("type").notNull(),
    state: text("state").notNull(), // "NC"
    county: text("county"),
    timezone: text("timezone").default("America/New_York").notNull(),
    lat: doublePrecision("lat"),
    lng: doublePrecision("lng"),
    population: integer("population"),
    websiteUrl: text("website_url"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index("jurisdictions_state_idx").on(t.state)],
);

export const govBodies = pgTable(
  "gov_bodies",
  {
    id: primaryId(),
    jurisdictionId: text("jurisdiction_id")
      .notNull()
      .references(() => jurisdictions.id, { onDelete: "cascade" }),
    name: text("name").notNull(), // "City Council"
    slug: text("slug").notNull(),
    type: govBodyTypeEnum("type").notNull(),
    description: text("description"),
    externalId: text("external_id"), // platform body id (e.g. Legistar BodyId)
    isHighValue: boolean("is_high_value").default(false).notNull(), // eager transcription
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    index("gov_bodies_jurisdiction_idx").on(t.jurisdictionId),
    uniqueIndex("gov_bodies_jurisdiction_slug_uniq").on(t.jurisdictionId, t.slug),
  ],
);

// The per-agency JurisdictionConfig: how to ingest one jurisdiction's data.
export const platformConfigs = pgTable(
  "platform_configs",
  {
    id: primaryId(),
    jurisdictionId: text("jurisdiction_id")
      .notNull()
      .references(() => jurisdictions.id, { onDelete: "cascade" }),
    platform: platformEnum("platform").notNull(),
    method: ingestMethodEnum("method").notNull(),
    client: text("client").notNull(), // Legistar {Client} slug OR portal base URL
    apiTokenRef: text("api_token_ref"), // NAME of the env var/secret, never the token
    trackedBodyExternalIds: jsonb("tracked_body_external_ids").$type<string[]>(),
    cadence: cadenceEnum("cadence").default("daily").notNull(),
    isActive: boolean("is_active").default(true).notNull(),
    status: platformConfigStatusEnum("status").default("active").notNull(),
    lastSyncedAt: timestamp("last_synced_at", { withTimezone: true }),
    lastSuccessAt: timestamp("last_success_at", { withTimezone: true }),
    config: jsonb("config").$type<Record<string, unknown>>(), // adapter-specific extras
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    index("platform_configs_jurisdiction_idx").on(t.jurisdictionId),
    index("platform_configs_active_idx").on(t.isActive, t.cadence),
  ],
);
