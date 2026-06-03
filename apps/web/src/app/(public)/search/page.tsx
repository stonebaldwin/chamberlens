import type { Metadata } from "next";
import Link from "next/link";
import { MapPin, Search } from "lucide-react";
import { Button, EmptyState, FacetGroup, Pagination, ResultCard } from "@repo/ui";
import { getDataSource } from "@/lib/data";
import { formatDateShort } from "@/lib/format";

export const metadata: Metadata = {
  title: "Search",
  description: "Full-text search across local-government agendas, minutes, and transcripts.",
};

// Results reflect the query string, so render dynamically.
export const dynamic = "force-dynamic";

const LIMIT = 20;

const DOC_TYPES = [
  { label: "Agendas", value: "agenda" },
  { label: "Minutes", value: "minutes" },
  { label: "Packets", value: "packet" },
  { label: "Resolutions", value: "resolution" },
  { label: "Ordinances", value: "ordinance" },
  { label: "Attachments", value: "attachment" },
];

const REF_LABEL: Record<string, string> = {
  agenda_item: "agenda item",
  minutes: "minutes",
  transcript: "transcript",
  document: "document",
  meeting: "meeting",
};

function asArray(v: string | string[] | undefined): string[] {
  if (!v) return [];
  return Array.isArray(v) ? v : [v];
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const q = (typeof sp.q === "string" ? sp.q : "").trim();
  const jurisdictionIds = asArray(sp.jurisdiction);
  const govBodyIds = asArray(sp.body);
  const docTypes = asArray(sp.doctype);
  const dateFrom = typeof sp.from === "string" && sp.from ? sp.from : undefined;
  const dateTo = typeof sp.to === "string" && sp.to ? sp.to : undefined;
  const offset = Math.max(
    0,
    Math.trunc(Number(typeof sp.offset === "string" ? sp.offset : 0)) || 0,
  );

  const ds = getDataSource();
  const [jurisdictions, bodies] = await Promise.all([ds.listJurisdictions(), ds.listBodies()]);
  const results = q
    ? await ds.search({
        q,
        jurisdictionIds,
        govBodyIds,
        docTypes,
        dateFrom,
        dateTo,
        limit: LIMIT,
        offset,
      })
    : { hits: [], total: 0 };

  const filterParams = () => {
    const p = new URLSearchParams();
    if (q) p.set("q", q);
    jurisdictionIds.forEach((v) => p.append("jurisdiction", v));
    govBodyIds.forEach((v) => p.append("body", v));
    docTypes.forEach((v) => p.append("doctype", v));
    if (dateFrom) p.set("from", dateFrom);
    if (dateTo) p.set("to", dateTo);
    return p;
  };
  const hrefForOffset = (o: number) => {
    const p = filterParams();
    if (o) p.set("offset", String(o));
    return `/search?${p.toString()}`;
  };
  const alertHref = q ? `/alerts/new?${filterParams().toString()}` : undefined;

  return (
    <main className="mx-auto max-w-6xl px-6 py-8">
      <h1 className="sr-only">Search ChamberLens</h1>
      <form action="/search" className="flex flex-col gap-6">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-ink-subtle" />
            <input
              name="q"
              defaultValue={q}
              aria-label="Search query"
              placeholder="Search agendas, minutes, and transcripts…"
              className="h-11 w-full rounded-md border border-border-strong bg-surface pl-11 pr-3 text-base text-ink shadow-xs placeholder:text-ink-subtle focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30"
            />
          </div>
          <Button type="submit">Search</Button>
        </div>

        <div className="grid gap-8 lg:grid-cols-[250px_1fr]">
          <aside className="flex flex-col gap-6">
            <FacetGroup
              title="Jurisdiction"
              name="jurisdiction"
              selected={jurisdictionIds}
              options={jurisdictions.map((j) => ({
                label: `${j.name}, ${j.state}`,
                value: j.id,
                count: j.meetingCount,
              }))}
            />
            <FacetGroup
              title="Body"
              name="body"
              selected={govBodyIds}
              options={bodies.map((b) => ({
                label: `${b.jurisdictionName} — ${b.name}`,
                value: b.id,
              }))}
            />
            <FacetGroup
              title="Document type"
              name="doctype"
              selected={docTypes}
              options={DOC_TYPES}
            />
            <fieldset className="flex flex-col gap-2">
              <legend className="kicker mb-1.5">Date range</legend>
              <label className="flex items-center justify-between gap-2 text-2xs text-ink-muted">
                From
                <input
                  type="date"
                  name="from"
                  defaultValue={dateFrom}
                  className="rounded-md border border-border-strong bg-surface px-2 py-1 text-xs text-ink"
                />
              </label>
              <label className="flex items-center justify-between gap-2 text-2xs text-ink-muted">
                To
                <input
                  type="date"
                  name="to"
                  defaultValue={dateTo}
                  className="rounded-md border border-border-strong bg-surface px-2 py-1 text-xs text-ink"
                />
              </label>
            </fieldset>
            <Button type="submit" variant="secondary" size="sm">
              Apply filters
            </Button>
          </aside>

          <section className="flex flex-col gap-4">
            {!q ? (
              <EmptyState
                icon={<Search />}
                title="Search local government"
                description="Enter a keyword, project, company, or parcel to search agendas, minutes, and transcripts across every covered jurisdiction."
              />
            ) : results.total === 0 ? (
              <EmptyState
                icon={<MapPin />}
                title={`No results for “${q}”`}
                description="Try a broader term or fewer filters. If the place you care about isn't covered yet, request it and we'll prioritize it."
                action={
                  <Link
                    href={`/coverage?request=${encodeURIComponent(q)}`}
                    className="text-sm font-medium text-primary hover:underline"
                  >
                    Request a jurisdiction →
                  </Link>
                }
              />
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <p className="text-sm text-ink-muted">
                    <span className="font-medium text-ink tabular-nums">{results.total}</span>{" "}
                    result
                    {results.total === 1 ? "" : "s"} for{" "}
                    <span className="font-medium text-ink">“{q}”</span>
                  </p>
                </div>
                {results.hits.map((h, i) => (
                  <ResultCard
                    key={`${h.meeting.id}-${i}`}
                    href={`/meetings/${h.meeting.id}?q=${encodeURIComponent(q)}`}
                    title={`${h.meeting.jurisdictionName} ${h.meeting.govBodyName}`}
                    jurisdiction={h.meeting.meetingType ?? "Meeting"}
                    body={REF_LABEL[h.refType] ?? h.refType}
                    dateLabel={formatDateShort(h.meeting.scheduledAt)}
                    docType={h.docType}
                    snippetHtml={h.snippet}
                    alertHref={alertHref}
                  />
                ))}
                <Pagination
                  total={results.total}
                  limit={LIMIT}
                  offset={offset}
                  hrefFor={hrefForOffset}
                />
              </>
            )}
          </section>
        </div>
      </form>
    </main>
  );
}
