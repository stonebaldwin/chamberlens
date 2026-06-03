import { KeyRound } from "lucide-react";
import { PageHeader } from "@repo/ui";
import { UpgradeGate } from "@/components/upgrade-gate";
import { getEntitlements } from "@/lib/entitlements";
import { requireUser } from "@/lib/session";

export const dynamic = "force-dynamic";

const DEMO_KEY = "chamberlens_demo_readonly_key";

export default async function ApiPage() {
  const user = await requireUser();
  const ent = getEntitlements(user.plan);

  if (!ent.apiAccess) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader title="API access" />
        <UpgradeGate feature="API access" need="Business" />
      </div>
    );
  }

  const key = user.isDemo ? DEMO_KEY : "•••••••••••• (generate a key)";

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="API access"
        description="A simple authed read API over search. Send your key as a Bearer token."
      />
      <section className="rounded-lg border border-border bg-surface p-5">
        <div className="flex items-center gap-2 text-sm font-semibold text-ink">
          <KeyRound className="size-4 text-primary" /> Your API key
        </div>
        <code className="mt-2 block rounded-md border border-border bg-surface-muted px-3 py-2 font-mono text-xs text-ink">
          {key}
        </code>
        <p className="mt-2 text-2xs text-ink-subtle">
          Keep this secret. Regenerating invalidates the old key. Requests are rate-limited per
          plan.
        </p>
      </section>
      <section className="rounded-lg border border-border bg-surface p-5">
        <h2 className="text-sm font-semibold text-ink">Example</h2>
        <pre className="mt-2 overflow-x-auto rounded-md bg-ink px-3 py-3 text-xs leading-relaxed text-paper">
          <code>{`curl "https://your-app.workers.dev/api/v1/search?q=rezoning" \\
  -H "Authorization: Bearer ${key}"`}</code>
        </pre>
        <p className="mt-2 text-2xs text-ink-subtle">
          Returns JSON: <code className="font-mono">total</code> and{" "}
          <code className="font-mono">hits</code> (meeting id, title, date, snippet, url).
        </p>
      </section>
    </div>
  );
}
