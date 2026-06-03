import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  Bell,
  Building2,
  FileSearch,
  Megaphone,
  Newspaper,
  Save,
  Users,
} from "lucide-react";
import { CoverageList, MeetingRow, SearchBar, Stat, StatRow } from "@repo/ui";
import { getDataSource } from "@/lib/data";
import { formatDateShort } from "@/lib/format";

export const metadata: Metadata = {
  description:
    "Search public local-government meeting agendas, minutes, and video across jurisdictions — and get alerted whenever a topic, project, company, or parcel you care about comes up.",
};

export const revalidate = 3600;

const EXAMPLE_QUERIES = [
  "rezoning",
  "affordable housing",
  "body cameras",
  "school redistricting",
  "solar",
];

const STEPS = [
  {
    icon: FileSearch,
    title: "Search the record",
    body: "Full-text search across agendas, minutes, and transcripts from many governments at once — ranked, with the matching passage highlighted.",
  },
  {
    icon: Save,
    title: "Save what matters",
    body: "Save a search — a keyword, a project, a company, a parcel — scoped to the jurisdictions and bodies you care about.",
  },
  {
    icon: Bell,
    title: "Get alerted first",
    body: "We email you the moment a new agenda, minutes, or transcript matches — with a deep link straight to the passage.",
  },
];

const AUDIENCES = [
  {
    icon: Megaphone,
    title: "Government affairs & lobbying",
    body: "Track every body that touches your clients' issues across a whole region at once.",
  },
  {
    icon: Newspaper,
    title: "Journalists & watchdogs",
    body: "Catch the agenda item before the meeting — not after the vote.",
  },
  {
    icon: Building2,
    title: "Developers & businesses",
    body: "Monitor rezonings, permits, and budgets that affect a parcel or a market.",
  },
  {
    icon: Users,
    title: "Engaged residents",
    body: "Know when your neighborhood comes up — without sitting through every meeting.",
  },
];

export default async function HomePage() {
  const ds = getDataSource();
  const [stats, jurisdictions, recent] = await Promise.all([
    ds.stats(),
    ds.listJurisdictions(),
    ds.recentMeetings(5),
  ]);

  return (
    <main>
      {/* Hero */}
      <section className="relative border-b border-border bg-dotgrid">
        <div className="mx-auto flex max-w-4xl flex-col items-center gap-6 px-6 py-24 text-center">
          <div className="flex items-center gap-2.5">
            <span aria-hidden className="h-px w-8 bg-border-strong" />
            <span className="kicker">Cross-jurisdiction civic search &amp; alerts</span>
            <span aria-hidden className="h-px w-8 bg-border-strong" />
          </div>
          <h1 className="font-serif text-[2.75rem] font-semibold leading-[1.05] tracking-tight text-ink sm:text-6xl">
            Search what your local governments are <span className="italic">actually</span> doing.
          </h1>
          <p className="max-w-2xl text-lg leading-relaxed text-ink-muted">
            ChamberLens aggregates public meeting agendas, minutes, and video across jurisdictions
            and vendor platforms, makes them full-text searchable, and emails you the moment a topic
            you care about comes up.
          </p>
          <div className="mt-2 w-full max-w-2xl">
            <SearchBar size="lg" autoFocus />
          </div>
          <div className="flex flex-wrap items-center justify-center gap-2">
            <span className="kicker mr-1">Try</span>
            {EXAMPLE_QUERIES.map((q) => (
              <Link
                key={q}
                href={`/search?q=${encodeURIComponent(q)}`}
                className="rounded-sm border border-border bg-surface px-2.5 py-1 text-sm text-ink-muted transition-colors hover:border-border-strong hover:text-ink"
              >
                {q}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Ledger stat bar */}
      <section className="border-b border-border bg-surface">
        <div className="mx-auto max-w-6xl px-6 py-10">
          <StatRow>
            <Stat label="Jurisdictions" value={stats.jurisdictions} />
            <Stat label="Government bodies" value={stats.bodies} />
            <Stat label="Meetings indexed" value={stats.meetings} />
            <Stat label="Documents" value={stats.documents} />
          </StatRow>
        </div>
      </section>

      {/* How it works */}
      <section className="mx-auto max-w-6xl px-6 py-20">
        <div className="flex items-center gap-3">
          <span className="kicker">How it works</span>
          <span className="filing-rule flex-1" />
        </div>
        <h2 className="mt-3 max-w-2xl font-serif text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
          From a keyword to an alert in your inbox.
        </h2>
        <div className="mt-8 grid gap-px overflow-hidden rounded-lg border border-border bg-border sm:grid-cols-3">
          {STEPS.map((s, i) => (
            <div key={s.title} className="flex flex-col gap-3 bg-surface p-6">
              <div className="flex items-center justify-between">
                <span className="flex size-9 items-center justify-center rounded-md bg-primary-tint text-primary">
                  <s.icon className="size-5" />
                </span>
                <span className="font-mono text-2xl font-semibold text-border-strong">
                  0{i + 1}
                </span>
              </div>
              <h3 className="font-serif text-lg font-semibold text-ink">{s.title}</h3>
              <p className="text-sm leading-relaxed text-ink-muted">{s.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Killer use case */}
      <section className="border-y border-border bg-primary text-primary-foreground">
        <div className="mx-auto grid max-w-6xl gap-8 px-6 py-16 md:grid-cols-[1.6fr_1fr] md:items-center">
          <div className="flex flex-col gap-4">
            <span className="kicker text-primary-foreground/70">The feature that pays for itself</span>
            <h2 className="font-serif text-3xl font-semibold tracking-tight">
              Get alerted whenever any government near you mentions a keyword.
            </h2>
            <p className="max-w-2xl leading-relaxed text-primary-foreground/80">
              The incumbents make you watch one city at a time. ChamberLens watches every covered
              body for your terms at once — a parcel number, a company name, &ldquo;data center,&rdquo;
              &ldquo;rezoning,&rdquo; &ldquo;short-term rental&rdquo; — and tells you the instant it
              surfaces.
            </p>
          </div>
          <div className="flex md:justify-end">
            <Link
              href="/pricing"
              className="inline-flex items-center gap-1.5 rounded-md bg-accent px-5 py-2.5 text-sm font-medium text-accent-foreground transition-colors hover:bg-accent-hover"
            >
              See plans <ArrowRight className="size-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Coverage teaser */}
      <section className="mx-auto max-w-6xl px-6 py-20">
        <div className="flex items-end justify-between gap-4">
          <div>
            <span className="kicker">Coverage</span>
            <h2 className="mt-3 font-serif text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
              Covered jurisdictions
            </h2>
          </div>
          <Link
            href="/coverage"
            className="shrink-0 text-sm font-medium text-primary underline-offset-4 hover:underline"
          >
            View all &amp; request coverage →
          </Link>
        </div>
        <div className="mt-6">
          <CoverageList
            items={jurisdictions.slice(0, 6).map((j) => ({
              name: j.name,
              state: j.state,
              href: `/jurisdictions/${j.slug}`,
              bodyCount: j.bodyCount,
              meetingCount: j.meetingCount,
            }))}
          />
        </div>
      </section>

      {/* Audiences */}
      <section className="border-t border-border bg-surface">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <span className="kicker">Who uses it</span>
          <h2 className="mt-3 max-w-2xl font-serif text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
            Built for the long tail of public oversight.
          </h2>
          <div className="mt-8 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {AUDIENCES.map((a) => (
              <div key={a.title} className="flex flex-col gap-2.5">
                <span className="flex size-9 items-center justify-center rounded-md border border-border bg-paper text-primary">
                  <a.icon className="size-5" />
                </span>
                <h3 className="text-sm font-semibold text-ink">{a.title}</h3>
                <p className="text-sm leading-relaxed text-ink-muted">{a.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Recent activity */}
      <section className="mx-auto max-w-6xl px-6 py-20">
        <div className="flex items-center gap-3">
          <span className="kicker">Latest activity</span>
          <span className="filing-rule flex-1" />
        </div>
        <h2 className="mt-3 font-serif text-2xl font-semibold tracking-tight text-ink">
          Recently indexed meetings
        </h2>
        <div className="mt-5 rounded-lg border border-border bg-surface px-4">
          {recent.map((m) => (
            <MeetingRow
              key={m.id}
              href={`/meetings/${m.id}`}
              title={`${m.jurisdictionName} — ${m.govBodyName}`}
              body={m.meetingType ?? "Meeting"}
              dateLabel={formatDateShort(m.scheduledAt)}
            />
          ))}
        </div>
      </section>
    </main>
  );
}
