import Link from "next/link";
import { ArrowUpRight, Sparkles } from "lucide-react";
import { buttonVariants, PageHeader, Stat, StatRow } from "@repo/ui";
import { AlertLogList } from "@/components/alert-log-list";
import { getUserStore } from "@/lib/data/user-store";
import { getEntitlements } from "@/lib/entitlements";
import { requireUser } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function DashboardHome() {
  const user = await requireUser();
  const store = getUserStore();
  const summary = await store.dashboardSummary(user.id);
  const ent = getEntitlements(user.plan);

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Overview"
        description={
          summary.matchesThisWeek > 0
            ? `${summary.matchesThisWeek} new ${summary.matchesThisWeek === 1 ? "match" : "matches"} this week across your watched areas.`
            : "No new matches this week — we'll email you the moment something lands."
        }
        actions={
          <Link href="/search" className={buttonVariants({ size: "sm" })}>
            New search
          </Link>
        }
      />

      <StatRow>
        <Stat label="Saved searches" value={summary.savedSearchCount} />
        <Stat label="Active alerts" value={summary.activeAlertCount} />
        <Stat label="Matches this week" value={summary.matchesThisWeek} />
      </StatRow>

      {!ent.alertsEnabled ? (
        <div className="flex flex-wrap items-center gap-3 rounded-lg border border-primary/30 bg-primary-tint/60 px-4 py-3">
          <Sparkles className="size-4 text-primary" />
          <p className="flex-1 text-sm text-ink">
            You&rsquo;re on the Free plan — alerts are weekly-digest only. Upgrade to Pro for
            real-time keyword alerts.
          </p>
          <Link
            href="/dashboard/account"
            className={buttonVariants({ variant: "primary", size: "sm" })}
          >
            Upgrade
          </Link>
        </div>
      ) : null}

      <section className="rounded-lg border border-border bg-surface p-5">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-ink">Recent matches</h2>
          <Link
            href="/dashboard/alerts"
            className="inline-flex items-center gap-0.5 text-xs font-medium text-primary hover:underline"
          >
            View all <ArrowUpRight className="size-3.5" />
          </Link>
        </div>
        <div className="mt-2">
          <AlertLogList items={summary.recent} />
        </div>
      </section>
    </div>
  );
}
