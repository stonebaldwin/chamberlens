import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@repo/ui";
import { NewAlertClient } from "@/components/new-alert-client";
import { getDataSource } from "@/lib/data";

export const metadata: Metadata = { title: "New alert" };
export const dynamic = "force-dynamic";

function asArray(v: string | string[] | undefined): string[] {
  if (!v) return [];
  return Array.isArray(v) ? v : [v];
}

export default async function NewAlertPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q : "";
  const jIds = asArray(sp.jurisdiction);
  const bIds = asArray(sp.body);

  const ds = getDataSource();
  let scope = "Across all covered jurisdictions";
  if (bIds.length) {
    const bodies = await ds.listBodies();
    const names = bodies
      .filter((b) => bIds.includes(b.id))
      .map((b) => `${b.jurisdictionName} ${b.name}`);
    if (names.length) scope = names.join(", ");
  } else if (jIds.length) {
    const jurs = await ds.listJurisdictions();
    const names = jurs.filter((j) => jIds.includes(j.id)).map((j) => j.name);
    if (names.length) scope = `In ${names.join(", ")}`;
  }

  return (
    <main className="mx-auto max-w-lg px-6 py-12">
      <PageHeader
        title="New keyword alert"
        description="We'll email you the moment a new agenda, minutes, or transcript matches."
      />
      <div className="mt-6">
        <NewAlertClient query={q} scopeSummary={scope} />
      </div>
      <p className="mt-4 text-center text-sm text-ink-muted">
        Alerts require a free account.{" "}
        <Link href="/login?intent=signup" className="font-medium text-primary hover:underline">
          Sign up
        </Link>{" "}
        to enable them.
      </p>
    </main>
  );
}
