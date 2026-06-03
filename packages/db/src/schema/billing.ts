import {
  boolean,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import {
  createdAt,
  membershipRoleEnum,
  planEnum,
  primaryId,
  subscriptionStatusEnum,
  updatedAt,
} from "./_shared";
import { users } from "./auth";

export const organizations = pgTable("organizations", {
  id: primaryId(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  ownerId: text("owner_id")
    .notNull()
    .references(() => users.id, { onDelete: "restrict" }),
  stripeCustomerId: text("stripe_customer_id"),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

export const memberships = pgTable(
  "memberships",
  {
    id: primaryId(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    role: membershipRoleEnum("role").default("member").notNull(),
    createdAt: createdAt(),
  },
  (t) => [uniqueIndex("memberships_org_user_uniq").on(t.organizationId, t.userId)],
);

// One subscription per billing subject: either an individual user OR an org.
export const subscriptions = pgTable(
  "subscriptions",
  {
    id: primaryId(),
    userId: text("user_id").references(() => users.id, { onDelete: "cascade" }),
    organizationId: text("organization_id").references(() => organizations.id, {
      onDelete: "cascade",
    }),
    plan: planEnum("plan").default("free").notNull(),
    status: subscriptionStatusEnum("status").default("active").notNull(),
    stripeCustomerId: text("stripe_customer_id"),
    stripeSubscriptionId: text("stripe_subscription_id").unique(),
    stripePriceId: text("stripe_price_id"),
    currentPeriodEnd: timestamp("current_period_end", { withTimezone: true }),
    cancelAtPeriodEnd: boolean("cancel_at_period_end").default(false).notNull(),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    index("subscriptions_user_idx").on(t.userId),
    index("subscriptions_org_idx").on(t.organizationId),
  ],
);

// Polymorphic metered usage counters (subjectType = "user" | "organization").
export const usageCounters = pgTable(
  "usage_counters",
  {
    id: primaryId(),
    subjectType: text("subject_type").notNull(),
    subjectId: text("subject_id").notNull(),
    period: text("period").notNull(), // "YYYY-MM"
    metric: text("metric").notNull(), // "alerts_sent" | "api_calls" | ...
    count: integer("count").default(0).notNull(),
    updatedAt: updatedAt(),
  },
  (t) => [uniqueIndex("usage_counters_uniq").on(t.subjectType, t.subjectId, t.period, t.metric)],
);
