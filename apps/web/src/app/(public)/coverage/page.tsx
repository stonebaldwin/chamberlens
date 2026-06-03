import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Button, CoverageList, PageHeader } from "@repo/ui";
import { getDataSource } from "@/lib/data";

export const metadata: Metadata = {
  title: "Coverage",
  description: "The jurisdictions ChamberLens currently indexes — and how to request a new one.",
};

export const dynamic = "force-dynamic";

const inputCls =
  "h-10 rounded-md border border-border-strong bg-surface px-3 text-sm text-ink placeholder:text-ink-subtle focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30";

async function requestCoverage(formData: FormData) {
  "use server";
  const jurisdictionName = String(formData.get("jurisdictionName") ?? "").trim();
  if (!jurisdictionName) return;
  await getDataSource().createCoverageRequest({
    jurisdictionName,
    state: String(formData.get("state") ?? "").trim() || undefined,
    email: String(formData.get("email") ?? "").trim() || undefined,
    notes: String(formData.get("notes") ?? "").trim() || undefined,
  });
  redirect("/coverage?requested=1");
}

export default async function CoveragePage({
  searchParams,
}: {
  searchParams: Promise<{ request?: string; requested?: string }>;
}) {
  const sp = await searchParams;
  const jurisdictions = await getDataSource().listJurisdictions();

  return (
    <main className="mx-auto max-w-4xl px-6 py-8">
      <PageHeader
        eyebrow="Coverage"
        title="Where ChamberLens is watching"
        description={`${jurisdictions.length} jurisdictions and growing. Coverage expands one vendor-platform adapter at a time, so new cities are largely a configuration task.`}
      />

      <div className="mt-6">
        <CoverageList
          items={jurisdictions.map((j) => ({
            name: j.name,
            state: j.state,
            href: `/jurisdictions/${j.slug}`,
            bodyCount: j.bodyCount,
            meetingCount: j.meetingCount,
          }))}
        />
      </div>

      <section className="mt-12 rounded-xl border border-border bg-surface p-6">
        <h2 className="font-serif text-2xl font-semibold tracking-tight text-ink">
          Request a jurisdiction
        </h2>
        <p className="mt-1 text-sm text-ink-muted">
          Tell us which government to add. Demand is a major input to our roadmap.
        </p>
        {sp.requested ? (
          <div className="mt-3 rounded-md border border-success/40 bg-success-tint px-3 py-2 text-sm text-success">
            Thanks — your request was logged. Popular requests get prioritized.
          </div>
        ) : null}
        <form action={requestCoverage} className="mt-4 grid gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-1.5 sm:col-span-2">
            <span className="text-sm font-medium text-ink">Jurisdiction</span>
            <input
              name="jurisdictionName"
              required
              defaultValue={sp.request ?? ""}
              placeholder="e.g. Greensboro"
              className={inputCls}
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-ink">State</span>
            <input name="state" placeholder="NC" className={inputCls} />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-ink">Email (optional)</span>
            <input name="email" type="email" placeholder="you@example.com" className={inputCls} />
          </label>
          <label className="flex flex-col gap-1.5 sm:col-span-2">
            <span className="text-sm font-medium text-ink">Notes (optional)</span>
            <textarea
              name="notes"
              rows={3}
              placeholder="Which bodies matter most? Any portal links?"
              className="rounded-md border border-border-strong bg-surface px-3 py-2 text-sm text-ink placeholder:text-ink-subtle focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30"
            />
          </label>
          <div className="sm:col-span-2">
            <Button type="submit">Submit request</Button>
          </div>
        </form>
      </section>
    </main>
  );
}
