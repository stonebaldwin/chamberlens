import Link from "next/link";
import type { AlertLogItem } from "@/lib/data/user-store";
import { formatDateShort } from "@/lib/format";

export function AlertLogList({ items }: { items: AlertLogItem[] }) {
  if (!items.length) {
    return <p className="py-6 text-sm text-ink-muted">No matches delivered yet.</p>;
  }
  return (
    <ul className="flex flex-col divide-y divide-border">
      {items.map((a) => (
        <li key={a.id} className="flex flex-col gap-1 py-3">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-2xs text-ink-muted">
            <span className="font-medium text-ink">{a.savedSearchName}</span>
            {a.jurisdictionName ? (
              <>
                <span aria-hidden>·</span>
                <span>
                  {a.jurisdictionName} · {a.govBodyName}
                </span>
              </>
            ) : null}
            <span className="ml-auto font-mono">{formatDateShort(a.sentAt)}</span>
          </div>
          <Link
            href={a.deepLink ?? (a.meetingId ? `/meetings/${a.meetingId}` : "#")}
            className="text-sm font-medium text-ink hover:text-primary"
          >
            {a.title}
          </Link>
          {a.snippet ? (
            <p
              className="text-sm text-ink-muted [&_mark]:rounded-sm [&_mark]:bg-warning-tint [&_mark]:px-0.5 [&_mark]:text-ink"
              dangerouslySetInnerHTML={{ __html: a.snippet }}
            />
          ) : null}
        </li>
      ))}
    </ul>
  );
}
