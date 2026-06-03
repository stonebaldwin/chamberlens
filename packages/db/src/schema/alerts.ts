import {
  boolean,
  doublePrecision,
  index,
  integer,
  jsonb,
  pgTable,
  real,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import {
  alertChannelEnum,
  alertFrequencyEnum,
  alertStatusEnum,
  coverageStatusEnum,
  createdAt,
  primaryId,
  updatedAt,
} from "./_shared";
import { users } from "./auth";
import { organizations } from "./billing";
import { contentEvents } from "./events";

export interface SearchFilters {
  jurisdictionIds?: string[];
  govBodyIds?: string[];
  docTypes?: string[];
  dateFrom?: string; // ISO date
  dateTo?: string; // ISO date
}

export const savedSearches = pgTable(
  "saved_searches",
  {
    id: primaryId(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    organizationId: text("organization_id").references(() => organizations.id, {
      onDelete: "cascade",
    }),
    name: text("name").notNull(),
    query: text("query").notNull(),
    filters: jsonb("filters").$type<SearchFilters>().default({}).notNull(),
    isAlert: boolean("is_alert").default(false).notNull(),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    index("saved_searches_user_idx").on(t.userId),
    index("saved_searches_alert_idx").on(t.isAlert),
  ],
);

export const alertSubscriptions = pgTable(
  "alert_subscriptions",
  {
    id: primaryId(),
    savedSearchId: text("saved_search_id")
      .notNull()
      .references(() => savedSearches.id, { onDelete: "cascade" })
      .unique(),
    frequency: alertFrequencyEnum("frequency").default("instant").notNull(),
    channel: alertChannelEnum("channel").default("email").notNull(),
    active: boolean("active").default(true).notNull(),
    // Geo-radius alert: keyword within N miles of a point (uses jurisdiction lat/lng).
    geoLat: doublePrecision("geo_lat"),
    geoLng: doublePrecision("geo_lng"),
    geoRadiusMiles: real("geo_radius_miles"),
    lastNotifiedAt: timestamp("last_notified_at", { withTimezone: true }),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index("alert_subscriptions_active_idx").on(t.active)],
);

// Delivery log. The (saved_search, content_event) unique index dedupes so a user
// never gets the same match twice.
export const alerts = pgTable(
  "alerts",
  {
    id: primaryId(),
    savedSearchId: text("saved_search_id")
      .notNull()
      .references(() => savedSearches.id, { onDelete: "cascade" }),
    contentEventId: text("content_event_id")
      .notNull()
      .references(() => contentEvents.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    channel: alertChannelEnum("channel").default("email").notNull(),
    status: alertStatusEnum("status").default("pending").notNull(),
    snippet: text("snippet"),
    deepLink: text("deep_link"),
    sentAt: timestamp("sent_at", { withTimezone: true }),
    error: text("error"),
    createdAt: createdAt(),
  },
  (t) => [
    uniqueIndex("alerts_dedupe_uniq").on(t.savedSearchId, t.contentEventId),
    index("alerts_user_idx").on(t.userId, t.createdAt),
  ],
);

export const coverageRequests = pgTable(
  "coverage_requests",
  {
    id: primaryId(),
    userId: text("user_id").references(() => users.id, { onDelete: "set null" }),
    jurisdictionName: text("jurisdiction_name").notNull(),
    state: text("state"),
    email: text("email"),
    notes: text("notes"),
    status: coverageStatusEnum("status").default("requested").notNull(),
    votes: integer("votes").default(1).notNull(),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index("coverage_requests_status_idx").on(t.status)],
);
