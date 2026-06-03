import Link from "next/link";
import { Badge, PageHeader } from "@repo/ui";
import { getAdminStore } from "@/lib/data/admin-store";
import { formatDateShort } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function AdminReview() {
  const rows = await getAdminStore().entityReviewQueue();

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="Operator"
        title="Entity-match review"
        description="Meetings the resolver matched with low confidence — confirm the merge or split them out."
      />
      <section className="rounded-lg border border-border bg-surface p-5">
        {rows.length ? (
          <ul className="flex flex-col divide-y divide-border">
            {rows.map((r) => (
              <li key={r.meetingId} className="flex items-center gap-3 py-3">
                <div className="min-w-0 flex-1">
                  <Link
                    href={`/meetings/${r.meetingId}`}
                    className="text-sm font-medium text-ink hover:text-primary"
                  >
                    {r.title}
                  </Link>
                  <div className="text-2xs text-ink-muted">
                    {r.jurisdictionName} · {formatDateShort(r.scheduledAt)}
                  </div>
                </div>
                <Badge variant={r.matchConfidence < 0.8 ? "warning" : "neutral"}>
                  {(r.matchConfidence * 100).toFixed(0)}% match
                </Badge>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-ink-muted">
            Nothing to review — all meeting matches are high-confidence.
          </p>
        )}
      </section>
    </div>
  );
}
