import type Stripe from "stripe";
import { createDb, type Database, eq, schema } from "@repo/db";
import { resolveEnv } from "./auth";
import type { Plan } from "./session";
import { getStripe } from "./stripe";

export type BillingInterval = "monthly" | "annual";
export type PaidPlan = "pro" | "business";

function appUrl(): string {
  return (resolveEnv("NEXT_PUBLIC_APP_URL") ?? "http://localhost:3007").replace(/\/$/, "");
}

function db(): Database | null {
  const url = resolveEnv("DATABASE_URL");
  return url ? createDb(url) : null;
}

/** Resolve the configured Stripe price id for a plan + interval. */
export function priceIdFor(plan: PaidPlan, interval: BillingInterval): string | undefined {
  const suffix = interval === "monthly" ? "MONTHLY" : "ANNUAL";
  return resolveEnv(`STRIPE_PRICE_${plan.toUpperCase()}_${suffix}`);
}

export function planForPriceId(priceId: string | null | undefined): Plan {
  if (!priceId) return "free";
  for (const plan of ["pro", "business"] as const) {
    for (const interval of ["monthly", "annual"] as const) {
      if (priceIdFor(plan, interval) === priceId) return plan;
    }
  }
  return "free";
}

/** The user's plan, derived from their subscription row (free if none/inactive). */
export async function getUserPlan(userId: string): Promise<Plan> {
  const d = db();
  if (!d) return "free";
  const sub = await d.query.subscriptions.findFirst({
    where: eq(schema.subscriptions.userId, userId),
  });
  if (!sub) return "free";
  const active = sub.status === "active" || sub.status === "trialing";
  return active ? sub.plan : "free";
}

async function ensureStripeCustomer(
  userId: string,
  email: string,
  name?: string,
): Promise<string | null> {
  const stripe = getStripe();
  const d = db();
  if (!stripe || !d) return null;
  const user = await d.query.users.findFirst({ where: eq(schema.users.id, userId) });
  if (user?.stripeCustomerId) return user.stripeCustomerId;
  const customer = await stripe.customers.create({ email, name, metadata: { userId } });
  await d
    .update(schema.users)
    .set({ stripeCustomerId: customer.id })
    .where(eq(schema.users.id, userId));
  return customer.id;
}

export async function createCheckoutUrl(opts: {
  userId: string;
  email: string;
  name?: string;
  plan: PaidPlan;
  interval: BillingInterval;
}): Promise<string | null> {
  const stripe = getStripe();
  const price = priceIdFor(opts.plan, opts.interval);
  if (!stripe || !price) return null;
  const customer = await ensureStripeCustomer(opts.userId, opts.email, opts.name);
  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: customer ?? undefined,
    line_items: [{ price, quantity: 1 }],
    success_url: `${appUrl()}/dashboard/account?checkout=success`,
    cancel_url: `${appUrl()}/pricing?checkout=cancelled`,
    allow_promotion_codes: true,
    metadata: { userId: opts.userId, plan: opts.plan },
    subscription_data: { metadata: { userId: opts.userId } },
  });
  return session.url;
}

export async function createPortalUrl(userId: string): Promise<string | null> {
  const stripe = getStripe();
  const d = db();
  if (!stripe || !d) return null;
  const user = await d.query.users.findFirst({ where: eq(schema.users.id, userId) });
  if (!user?.stripeCustomerId) return null;
  const session = await stripe.billingPortal.sessions.create({
    customer: user.stripeCustomerId,
    return_url: `${appUrl()}/dashboard/account`,
  });
  return session.url;
}

function periodEnd(sub: Stripe.Subscription): Date | null {
  // Period fields moved between API versions (subscription vs. item); read both.
  const s = sub as unknown as {
    current_period_end?: number;
    items?: { data?: { current_period_end?: number }[] };
  };
  const unix = s.items?.data?.[0]?.current_period_end ?? s.current_period_end;
  return unix ? new Date(unix * 1000) : null;
}

/** Idempotently upsert our subscription row from a Stripe subscription (webhook). */
export async function syncSubscriptionFromStripe(sub: Stripe.Subscription): Promise<void> {
  const d = db();
  // The webhook only calls this when billing is configured, so a missing DB here
  // is a misconfig/outage — THROW so the webhook returns 500 and Stripe retries,
  // rather than silently dropping a paid subscription (it would never retry a 200).
  if (!d) throw new Error("syncSubscriptionFromStripe: DATABASE_URL is not configured");

  const customerId = typeof sub.customer === "string" ? sub.customer : sub.customer.id;
  let userId = (sub.metadata?.userId as string | undefined) ?? null;
  if (!userId) {
    const u = await d.query.users.findFirst({
      where: eq(schema.users.stripeCustomerId, customerId),
    });
    userId = u?.id ?? null;
  }
  if (!userId) {
    // Not retryable — the subscription isn't linked to any user. Log loudly and ack
    // so Stripe doesn't retry forever, but make it visible for reconciliation.
    console.error("[billing] no user for Stripe subscription", sub.id, "customer", customerId);
    return;
  }

  const priceId = sub.items.data[0]?.price.id ?? null;
  const plan = planForPriceId(priceId);

  await d
    .insert(schema.subscriptions)
    .values({
      userId,
      plan,
      status: sub.status,
      stripeCustomerId: customerId,
      stripeSubscriptionId: sub.id,
      stripePriceId: priceId,
      currentPeriodEnd: periodEnd(sub),
      cancelAtPeriodEnd: sub.cancel_at_period_end,
    })
    .onConflictDoUpdate({
      target: schema.subscriptions.stripeSubscriptionId,
      set: {
        plan,
        status: sub.status,
        stripePriceId: priceId,
        currentPeriodEnd: periodEnd(sub),
        cancelAtPeriodEnd: sub.cancel_at_period_end,
      },
    });
}
