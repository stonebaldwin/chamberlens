import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { buttonVariants, MeetingRow, PageHeader } from "@repo/ui";
import { getDataSource } from "@/lib/data";
import { formatDateShort } from "@/lib/format";

export const revalidate = 3600;

type Params = { slug: string; bodySlug: string };

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { slug, bodySlug } = await params;
  const page = await getDataSource().getBodyBySlug(slug, bodySlug);
  if (!page) return { title: "Body not found" };
  const { body: b } = page;
  return {
    title: `${b.name} — ${b.jurisdictionName}, ${b.state}`,
    description: `Meetings, agendas, and minutes for the ${b.name} in ${b.jurisdictionName}, ${b.state}.`,
  };
}

export default async function BodyPage({ params }: { params: Promise<Params> }) {
  const { slug, bodySlug } = await params;
  const page = await getDataSource().getBodyBySlug(slug, bodySlug);
  if (!page) notFound();
  const { body: b, recentMeetings, upcomingMeetings } = page;

  return (
    <main className="mx-auto max-w-4xl px-6 py-8">
      <PageHeader
        eyebrow={
          <Link href={`/jurisdictions/${b.jurisdictionSlug}`} className="hover:text-ink">
            {b.jurisdictionName}, {b.state}
          </Link>
        }
        title={b.name}
        description={<span className="capitalize">{b.type.replace(/_/g, " ")}</span>}
        actions={
          <Link
            href={`/alerts/new?body=${b.id}`}
            className={buttonVariants({ variant: "secondary", size: "sm" })}
          >
            Alert me about this body
          </Link>
        }
      />

      {upcomingMeetings.length ? (
        <section className="mt-8">
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

      <section className="mt-8">
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
