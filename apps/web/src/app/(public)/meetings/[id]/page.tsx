import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CalendarClock, FileText, MapPin, Video } from "lucide-react";
import {
  AiSummary,
  Badge,
  buttonVariants,
  PageHeader,
  SourceMeta,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  TranscriptViewer,
  type TranscriptSegmentView,
} from "@repo/ui";
import { getDataSource } from "@/lib/data";
import { formatDate, formatDateTime, relativeLabel } from "@/lib/format";

export const revalidate = 3600;

type Params = { id: string };
type Search = { q?: string; t?: string };

const STATUS_VARIANT: Record<string, "primary" | "neutral" | "warning" | "danger" | "success"> = {
  scheduled: "primary",
  in_progress: "warning",
  completed: "neutral",
  cancelled: "danger",
  rescheduled: "warning",
};

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { id } = await params;
  const meeting = await getDataSource().getMeetingById(id);
  if (!meeting) return { title: "Meeting not found" };
  const title = `${meeting.jurisdictionName} ${meeting.govBodyName} — ${formatDate(meeting.scheduledAt)}`;
  return {
    title,
    description: `Agenda, documents${meeting.transcript ? ", and transcript" : ""} for the ${meeting.govBodyName} meeting on ${formatDate(meeting.scheduledAt)}.`,
  };
}

export default async function MeetingPage({
  params,
  searchParams,
}: {
  params: Promise<Params>;
  searchParams: Promise<Search>;
}) {
  const { id } = await params;
  const { q, t } = await searchParams;
  const meeting = await getDataSource().getMeetingById(id);
  if (!meeting) notFound();

  const seekMs = t ? Number(t) : null;
  const segments: TranscriptSegmentView[] = meeting.transcript?.segments ?? [];

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Event",
    name: `${meeting.govBodyName} — ${meeting.jurisdictionName}, ${meeting.state}`,
    startDate: meeting.scheduledAt.toISOString(),
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    location: meeting.location
      ? { "@type": "Place", name: meeting.location }
      : { "@type": "VirtualLocation", url: meeting.sourceUrl },
    organizer: {
      "@type": "GovernmentOrganization",
      name: `${meeting.jurisdictionName} ${meeting.govBodyName}`,
    },
    url: meeting.sourceUrl,
  };

  return (
    <main className="mx-auto max-w-4xl px-6 py-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <PageHeader
        eyebrow={
          <span className="flex flex-wrap items-center gap-1">
            <Link href={`/jurisdictions/${meeting.jurisdictionSlug}`} className="hover:text-ink">
              {meeting.jurisdictionName}, {meeting.state}
            </Link>
            <span aria-hidden>·</span>
            <span>{meeting.govBodyName}</span>
          </span>
        }
        title={`${meeting.govBodyName} — ${formatDate(meeting.scheduledAt)}`}
        description={
          <span className="flex flex-wrap items-center gap-2">
            <Badge variant={STATUS_VARIANT[meeting.status] ?? "neutral"} className="capitalize">
              {meeting.status.replace("_", " ")}
            </Badge>
            {meeting.meetingType ? <span>{meeting.meetingType}</span> : null}
            <span className="inline-flex items-center gap-1 text-ink-subtle">
              <CalendarClock className="size-3.5" /> {formatDateTime(meeting.scheduledAt)}
            </span>
            {meeting.location ? (
              <span className="inline-flex items-center gap-1 text-ink-subtle">
                <MapPin className="size-3.5" /> {meeting.location}
              </span>
            ) : null}
          </span>
        }
        actions={
          <Link
            href={`/alerts/new?body=${meeting.govBodyId}`}
            className={buttonVariants({ variant: "secondary", size: "sm" })}
          >
            Alert me about this body
          </Link>
        }
      />

      <div className="mt-4">
        <SourceMeta
          sourceUrl={meeting.sourceUrl}
          retrievedLabel={relativeLabel(meeting.retrievedAt)}
        />
      </div>

      {meeting.aiSummary ? (
        <div className="mt-6">
          <AiSummary>{meeting.aiSummary}</AiSummary>
        </div>
      ) : null}

      <div className="mt-8">
        <Tabs defaultValue={seekMs != null && segments.length ? "transcript" : "agenda"}>
          <TabsList>
            <TabsTrigger value="agenda">Agenda ({meeting.agendaItems.length})</TabsTrigger>
            <TabsTrigger value="documents">Documents ({meeting.documents.length})</TabsTrigger>
            <TabsTrigger value="transcript">
              {segments.length ? "Transcript & video" : meeting.videoUrl ? "Video" : "Transcript"}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="agenda">
            {meeting.agendaItems.length ? (
              <ol className="flex flex-col divide-y divide-border">
                {meeting.agendaItems.map((it) => (
                  <li key={it.id} className="flex gap-3 py-3">
                    {it.itemNumber ? (
                      <span className="w-10 shrink-0 font-mono text-2xs text-ink-subtle">
                        {it.itemNumber}
                      </span>
                    ) : null}
                    <div className="flex flex-col gap-1">
                      <div className="text-sm font-medium text-ink">{it.title}</div>
                      {it.description ? (
                        <p className="text-sm text-ink-muted">{it.description}</p>
                      ) : null}
                    </div>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="py-6 text-sm text-ink-muted">
                No agenda items recorded for this meeting.
              </p>
            )}
          </TabsContent>

          <TabsContent value="documents">
            {meeting.documents.length ? (
              <div className="flex flex-col gap-4">
                {meeting.documents.map((d) => (
                  <article key={d.id} className="rounded-lg border border-border bg-surface p-4">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <FileText className="size-4 text-ink-subtle" />
                        <span className="text-sm font-medium text-ink">
                          {d.title ?? "Document"}
                        </span>
                        <Badge variant="neutral" className="capitalize">
                          {d.docType}
                        </Badge>
                      </div>
                      <a
                        href={d.originalUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs font-medium text-primary hover:underline"
                      >
                        View original →
                      </a>
                    </div>
                    {d.textContent ? (
                      <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-ink-muted">
                        {d.textContent}
                      </p>
                    ) : null}
                  </article>
                ))}
              </div>
            ) : (
              <p className="py-6 text-sm text-ink-muted">No documents attached yet.</p>
            )}
          </TabsContent>

          <TabsContent value="transcript">
            {segments.length ? (
              <div className="flex flex-col gap-3">
                <p className="text-2xs text-ink-subtle">
                  Transcript via {meeting.transcript?.provider}. Click any line to jump the video to
                  that moment.
                </p>
                <TranscriptViewer
                  segments={segments}
                  videoUrl={meeting.videoUrl}
                  query={q}
                  initialSeekMs={seekMs}
                />
              </div>
            ) : meeting.videoUrl ? (
              <div className="flex flex-col gap-3">
                <video
                  controls
                  preload="metadata"
                  src={meeting.videoUrl}
                  className="aspect-video w-full rounded-lg border border-border bg-ink"
                />
                <p className="inline-flex items-center gap-1 text-2xs text-ink-subtle">
                  <Video className="size-3.5" /> No transcript yet — transcription runs lazily for
                  high-value bodies and on demand.
                </p>
              </div>
            ) : (
              <p className="py-6 text-sm text-ink-muted">
                No transcript or video is available for this meeting.
              </p>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </main>
  );
}
