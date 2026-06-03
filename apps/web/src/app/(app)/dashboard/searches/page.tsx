import { Button, PageHeader } from "@repo/ui";
import { SavedSearchList } from "@/components/saved-search-list";
import { getUserStore } from "@/lib/data/user-store";
import { getEntitlements } from "@/lib/entitlements";
import { requireUser } from "@/lib/session";
import { createSavedSearchAction } from "./actions";

export const dynamic = "force-dynamic";

const inputCls =
  "h-10 rounded-md border border-border-strong bg-surface px-3 text-sm text-ink placeholder:text-ink-subtle focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30";

export default async function SearchesPage() {
  const user = await requireUser();
  const ent = getEntitlements(user.plan);
  const searches = await getUserStore().listSavedSearches(user.id);
  const limitReached = ent.maxSavedSearches >= 0 && searches.length >= ent.maxSavedSearches;

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Searches & alerts"
        description="Save a search, then turn alerts on to be notified when new records match."
      />

      <section className="rounded-lg border border-border bg-surface p-5">
        <h2 className="text-sm font-semibold text-ink">New saved search</h2>
        {limitReached ? (
          <p className="mt-2 text-sm text-ink-muted">
            You&rsquo;ve reached the {ent.maxSavedSearches}-search limit on the {user.plan} plan.{" "}
            <a className="text-primary underline" href="/dashboard/account">
              Upgrade
            </a>{" "}
            for unlimited.
          </p>
        ) : (
          <form action={createSavedSearchAction} className="mt-3 grid gap-3 sm:grid-cols-2">
            <input name="name" required placeholder="Alert name" className={inputCls} />
            <input
              name="query"
              required
              placeholder={'Keyword or phrase, e.g. "data center"'}
              className={inputCls}
            />
            <label className="flex items-center gap-2 text-sm text-ink">
              <input
                type="checkbox"
                name="isAlert"
                defaultChecked={ent.alertsEnabled}
                disabled={!ent.alertsEnabled}
                className="size-4 rounded border-border-strong text-primary focus-visible:ring-2 focus-visible:ring-ring/30"
              />
              Email me on new matches {ent.alertsEnabled ? "" : "(Pro+)"}
            </label>
            <select name="frequency" disabled={!ent.alertsEnabled} className={inputCls}>
              <option value="instant">Instant</option>
              <option value="daily">Daily digest</option>
              <option value="weekly">Weekly digest</option>
            </select>
            <div className="sm:col-span-2">
              <Button type="submit">Save search</Button>
            </div>
          </form>
        )}
      </section>

      <section>
        <h2 className="text-sm font-semibold text-ink">
          Your saved searches ({searches.length}
          {ent.maxSavedSearches >= 0 ? ` / ${ent.maxSavedSearches}` : ""})
        </h2>
        <div className="mt-3">
          <SavedSearchList searches={searches} alertsEnabled={ent.alertsEnabled} />
        </div>
      </section>
    </div>
  );
}
