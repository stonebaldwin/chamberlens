import Link from "next/link";
import { Check } from "lucide-react";
import { Badge, buttonVariants, cn, PageHeader } from "@repo/ui";
import { getEntitlements, planLabel } from "@/lib/entitlements";
import { requireUser } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const user = await requireUser();
  const ent = getEntitlements(user.plan);
  const features = [
    { label: "Real-time keyword alerts", on: ent.alertsEnabled },
    { label: "Unlimited saved searches", on: ent.maxSavedSearches < 0 },
    { label: "Geo-radius alerts", on: ent.geoRadiusAlerts },
    { label: "Team seats", on: ent.teamSeats > 1 },
    { label: "API access", on: ent.apiAccess },
    { label: "Exports & reports", on: ent.exports },
  ];

  return (
    <div className="flex flex-col gap-8">
      <PageHeader title="Account & billing" description={user.email} />

      <section className="rounded-lg border border-border bg-surface p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="kicker">Current plan</div>
            <div className="mt-0.5 flex items-center gap-2 text-xl font-semibold text-ink">
              {planLabel(user.plan)}
              {user.plan !== "free" ? <Badge variant="success">Active</Badge> : null}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/pricing"
              className={buttonVariants({
                variant: user.plan === "free" ? "primary" : "secondary",
                size: "sm",
              })}
            >
              {user.plan === "free" ? "Upgrade" : "Change plan"}
            </Link>
            {user.plan !== "free" && !user.isDemo ? (
              <Link
                href="/billing/portal"
                className={buttonVariants({ variant: "ghost", size: "sm" })}
              >
                Manage billing
              </Link>
            ) : null}
          </div>
        </div>
      </section>

      <section className="rounded-lg border border-border bg-surface p-5">
        <h2 className="text-sm font-semibold text-ink">What&rsquo;s included</h2>
        <ul className="mt-3 grid gap-2 sm:grid-cols-2">
          {features.map((f) => (
            <li
              key={f.label}
              className={cn(
                "flex items-center gap-2 text-sm",
                f.on ? "text-ink" : "text-ink-subtle line-through",
              )}
            >
              <Check className={cn("size-4", f.on ? "text-success" : "text-ink-subtle/40")} />
              {f.label}
            </li>
          ))}
        </ul>
      </section>

      <p className="text-2xs text-ink-subtle">
        Billing runs through Stripe self-serve in production — Checkout to upgrade and the customer
        portal to manage or cancel.
      </p>
    </div>
  );
}
