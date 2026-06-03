import Stripe from "stripe";
import { resolveEnv } from "./auth";

let cached: Stripe | undefined;

export function stripeConfigured(): boolean {
  return Boolean(resolveEnv("STRIPE_SECRET_KEY"));
}

/** Lazily-built Stripe client, or null when no key is configured. */
export function getStripe(): Stripe | null {
  const key = resolveEnv("STRIPE_SECRET_KEY");
  if (!key) return null;
  cached ??= new Stripe(key);
  return cached;
}
