import { PageHeader } from "@repo/ui";
import { UpgradeGate } from "@/components/upgrade-gate";
import { getEntitlements } from "@/lib/entitlements";
import { requireUser } from "@/lib/session";

export const dynamic = "force-dynamic";

const inputCls =
  "h-10 rounded-md border border-border-strong bg-surface px-3 text-sm text-ink placeholder:text-ink-subtle focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30";

export default async function WatchlistsPage() {
  const user = await requireUser();
  const ent = getEntitlements(user.plan);

  if (!ent.apiAccess || user.plan !== "business") {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader title="Watchlists" />
        <UpgradeGate feature="Watchlists" need="Business" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Watchlists"
        description="Group bodies and jurisdictions into a single watchlist, and bulk-add by pasting a list."
      />
      <section className="rounded-lg border border-border bg-surface p-5">
        <h2 className="text-sm font-semibold text-ink">New watchlist</h2>
        <div className="mt-3 grid gap-3">
          <input placeholder="Watchlist name, e.g. Triangle development" className={inputCls} />
          <textarea
            rows={3}
            placeholder="Paste body or jurisdiction names, one per line, to bulk-add."
            className="rounded-md border border-border-strong bg-surface px-3 py-2 text-sm text-ink"
          />
        </div>
      </section>
      <section className="rounded-lg border border-border bg-surface p-5">
        <h2 className="text-sm font-semibold text-ink">Triangle development</h2>
        <p className="mt-1 text-2xs text-ink-subtle">4 bodies · Raleigh, Cary, Wake County</p>
      </section>
    </div>
  );
}
