import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  Bell,
  Building2,
  FileSearch,
  Landmark,
  Megaphone,
  Newspaper,
  Save,
  Users,
} from "lucide-react";
import { Badge, CoverageList, MeetingRow, SearchBar, Stat, StatRow } from "@repo/ui";
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
    body: "Monitor rezonings, permits, and budgets that affect a parcel or market.",
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
      <section className="border-b border-border">
        <div className="mx-auto flex max-w-4xl flex-col items-center gap-6 px-6 py-20 text-center">
          <Badge variant="primary">Cross-jurisdiction civic search & alerts</Badge>
          <h1 className="max-w-3xl text-4xl font-semibold leading-tight tracking-tight text-ink sm:text-5xl">
            Search and monitor what your local governments are doing.
          </h1>
          <p className="max-w-2xl text-lg text-ink-muted">
            ChamberLens aggregates public meeting agendas, minutes, and video across jurisdictions
            and vendor platforms, makes them full-text searchable, and emails you the moment a topic
            you care about comes up — in any covered government.
          </p>
          <div className="w-full max-w-2xl">
            <SearchBar size="lg" autoFocus />
          </div>
          <div className="flex flex-wrap items-center justify-center gap-2 text-sm text-ink-muted">
            <span>Try:</span>
            {EXAMPLE_QUERIES.map((q) => (
              <Link
                key={q}
                href={`/search?q=${encodeURIComponent(q)}`}
                className="rounded-full border border-border bg-surface px-3 py-1 text-ink hover:border-border-strong"
              >
                {q}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-b border-border bg-surface">
        <div className="mx-auto max-w-6xl px-6 py-8">
          <StatRow>
            <Stat label="Jurisdictions" value={stats.jurisdictions} />
            <Stat label="Government bodies" value={stats.bodies} />
            <Stat label="Meetings indexed" value={stats.meetings} />
            <Stat label="Documents" value={stats.documents} />
          </StatRow>
        </div>
      </section>

      {/* How it works */}
      <section className="mx-auto max-w-6xl px-6 py-16">
        <h2 className="text-xl font-semibold tracking-tight text-ink">How it works</h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          {[
            {
              icon: FileSearch,
              title: "Search",
              body: "Full-text search across agendas, minutes, and transcripts from many governments at once.",
            },
            {
              icon: Save,
              title: "Save",
              body: "Save a search — a keyword, a project, a company, a parcel — scoped to the places you care about.",
            },
            {
              icon: Bell,
              title: "Get alerted",
              body: "We email you the moment a new agenda, minutes, or transcript matches — with a deep link to the passage.",
            },
          ].map((s, i) => (
            <div
              key={s.title}
              className="flex flex-col gap-2 rounded-lg border border-border bg-surface p-5"
            >
              <div className="flex items-center gap-2">
                <span className="flex size-7 items-center justify-center rounded-md bg-primary-tint text-primary">
                  <s.icon className="size-4" />
                </span>
                <span className="font-mono text-2xs text-ink-subtle">0{i + 1}</span>
              </div>
              <h3 className="text-base font-semibold text-ink">{s.title}</h3>
              <p className="text-sm text-ink-muted">{s.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Killer use case */}
      <section className="border-y border-border bg-primary text-primary-foreground">
        <div className="mx-auto flex max-w-4xl flex-col items-start gap-4 px-6 py-14">
          <Bell className="size-6 opacity-80" />
          <h2 className="text-2xl font-semibold tracking-tight">
            Get alerted whenever any government near you mentions a keyword.
          </h2>
          <p className="max-w-2xl text-primary-foreground/80">
            The incumbents make you watch one city at a time. ChamberLens watches every covered body
            for your terms at once — a parcel number, a company name, &ldquo;data center,&rdquo;
            &ldquo;rezoning,&rdquo; &ldquo;short-term rental&rdquo; — and tells you the instant it
            surfaces.
          </p>
          <Link
            href="/pricing"
            className="mt-1 inline-flex items-center gap-1 rounded-md bg-surface px-4 py-2 text-sm font-medium text-ink hover:bg-surface-muted"
          >
            See plans <ArrowRight className="size-4" />
          </Link>
        </div>
      </section>

      {/* Coverage teaser */}
      <section className="mx-auto max-w-6xl px-6 py-16">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold tracking-tight text-ink">Covered jurisdictions</h2>
          <Link href="/coverage" className="text-sm font-medium text-primary hover:underline">
            View all & request coverage →
          </Link>
        </div>
        <div className="mt-5">
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
        <div className="mx-auto max-w-6xl px-6 py-16">
          <h2 className="text-xl font-semibold tracking-tight text-ink">Built for the long tail</h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {AUDIENCES.map((a) => (
              <div key={a.title} className="flex flex-col gap-2">
                <a.icon className="size-5 text-primary" />
                <h3 className="text-sm font-semibold text-ink">{a.title}</h3>
                <p className="text-sm text-ink-muted">{a.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Recent activity */}
      <section className="mx-auto max-w-6xl px-6 py-16">
        <div className="flex items-center gap-2">
          <Landmark className="size-5 text-ink-subtle" />
          <h2 className="text-xl font-semibold tracking-tight text-ink">Recent meetings</h2>
        </div>
        <div className="mt-4 rounded-lg border border-border bg-surface px-4">
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
