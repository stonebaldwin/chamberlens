import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, Building2 } from "lucide-react";
import { buttonVariants, MeetingRow, PageHeader, Stat, StatRow } from "@repo/ui";
import { getDataSource } from "@/lib/data";
import { formatDateShort } from "@/lib/format";

export const revalidate = 3600;

type Params = { slug: string };

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { slug } = await params;
  const page = await getDataSource().getJurisdictionBySlug(slug);
  if (!page) return { title: "Jurisdiction not found" };
  const { jurisdiction: j } = page;
  return {
    title: `${j.name}, ${j.state}`,
    description: `Meetings, agendas, and minutes for ${j.name}, ${j.state} — ${j.bodyCount} government bodies tracked.`,
  };
}

export default async function JurisdictionPage({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const page = await getDataSource().getJurisdictionBySlug(slug);
  if (!page) notFound();
  const { jurisdiction: j, bodies, recentMeetings, upcomingMeetings } = page;

  return (
    <main className="mx-auto max-w-4xl px-6 py-8">
      <PageHeader
        eyebrow="Jurisdiction"
        title={`${j.name}, ${j.state}`}
        description={<span className="capitalize">{j.type}</span>}
        actions={
          <Link
            href={`/alerts/new?jurisdiction=${j.id}`}
            className={buttonVariants({ variant: "secondary", size: "sm" })}
          >
            Alert me about {j.name}
          </Link>
        }
      />

      <div className="mt-6">
        <StatRow>
          <Stat label="Government bodies" value={j.bodyCount} />
          <Stat label="Meetings indexed" value={j.meetingCount} />
        </StatRow>
      </div>

      <section className="mt-10">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-ink">
          <Building2 className="size-4 text-ink-subtle" /> Government bodies
        </h2>
        <ul className="mt-3 grid gap-2 sm:grid-cols-2">
          {bodies.map((b) => (
            <li key={b.id}>
              <Link
                href={`/jurisdictions/${j.slug}/${b.slug}`}
                className="flex items-center justify-between rounded-lg border border-border bg-surface px-3 py-2.5 hover:border-border-strong"
              >
                <span className="text-sm font-medium text-ink">{b.name}</span>
                <ArrowRight className="size-4 text-ink-subtle" />
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {upcomingMeetings.length ? (
        <section className="mt-10">
          <h2 className="text-sm font-semibold text-ink">Upcoming meetings</h2>
          <div className="mt-3 rounded-lg border border-border bg-surface px-4">
            {upcomingMeetings.map((m) => (
              <MeetingRow
                key={m.id}
                href={`/meetings/${m.id}`}
                title={m.govBodyName}
                body={m.meetingType ?? "Meeting"}
                dateLabel={formatDateShort(m.scheduledAt)}
                status={m.status}
              />
            ))}
          </div>
        </section>
      ) : null}

      <section className="mt-10">
        <h2 className="text-sm font-semibold text-ink">Recent meetings</h2>
        <div className="mt-3 rounded-lg border border-border bg-surface px-4">
          {recentMeetings.length ? (
            recentMeetings.map((m) => (
              <MeetingRow
                key={m.id}
                href={`/meetings/${m.id}`}
                title={m.govBodyName}
                body={m.meetingType ?? "Meeting"}
                dateLabel={formatDateShort(m.scheduledAt)}
              />
            ))
          ) : (
            <p className="py-6 text-sm text-ink-muted">No recent meetings indexed yet.</p>
          )}
        </div>
      </section>
    </main>
  );
}
