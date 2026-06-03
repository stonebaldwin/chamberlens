import Link from "next/link";
import { AlertTriangle, CheckCircle2 } from "lucide-react";
import { Badge, PageHeader, Stat, StatRow } from "@repo/ui";
import { getAdminStore } from "@/lib/data/admin-store";
import { formatDateTime } from "@/lib/format";

export const dynamic = "force-dynamic";

const STATUS_VARIANT: Record<string, "success" | "warning" | "danger" | "neutral"> = {
  success: "success",
  partial: "warning",
  failed: "danger",
};

export default async function AdminHome() {
  const store = getAdminStore();
  const [runs, volume, spend] = await Promise.all([
    store.recentSyncRuns(20),
    store.volumeMetrics(),
    store.spendSummary(),
  ]);
  const unhealthy = runs.filter((r) => r.anomalous || r.status === "failed").length;
  const spendPct = Math.min(100, Math.round((spend.spentUsd / spend.capUsd) * 100));

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        eyebrow="Operator"
        title="Ingestion cockpit"
        description="Health, volume, and spend across every platform and jurisdiction."
        actions={
          <div className="flex gap-2">
            <Link
              href="/admin/coverage"
              className="text-sm font-medium text-primary hover:underline"
            >
              Coverage requests
            </Link>
            <span className="text-ink-subtle">·</span>
            <Link href="/admin/review" className="text-sm font-medium text-primary hover:underline">
              Review queue
            </Link>
          </div>
        }
      />

      {unhealthy > 0 ? (
        <div className="flex items-center gap-2 rounded-lg border border-danger/30 bg-danger-tint px-4 py-3 text-sm text-danger">
          <AlertTriangle className="size-4" />
          {unhealthy} adapter {unhealthy === 1 ? "run needs" : "runs need"} attention.
        </div>
      ) : (
        <div className="flex items-center gap-2 rounded-lg border border-success/30 bg-success-tint px-4 py-3 text-sm text-success">
          <CheckCircle2 className="size-4" /> All recent adapter runs are healthy.
        </div>
      )}

      <StatRow>
        <Stat label="Meetings" value={volume.meetings} />
        <Stat label="Documents" value={volume.documents} />
        <Stat label="Transcripts" value={volume.transcripts} />
        <Stat label="Events pending" value={volume.eventsPending} />
      </StatRow>

      <section className="rounded-lg border border-border bg-surface p-5">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-ink">Transcription spend · {spend.period}</h2>
          <span className="font-mono text-sm text-ink">
            ${spend.spentUsd.toFixed(2)} / ${spend.capUsd.toFixed(2)}
          </span>
        </div>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-surface-muted">
          <div
            className={spendPct > 80 ? "h-full bg-danger" : "h-full bg-primary"}
            style={{ width: `${spendPct}%` }}
          />
        </div>
        <p className="mt-1.5 text-2xs text-ink-subtle">
          {spend.transcriptCount} transcripts this period. Hard cap enforced by the budget guard.
        </p>
      </section>

      <section>
        <h2 className="text-sm font-semibold text-ink">Recent adapter runs</h2>
        <div className="mt-3 overflow-x-auto rounded-lg border border-border">
          <table className="w-full border-collapse text-left text-sm">
            <thead>
              <tr className="kicker border-b border-border bg-surface-muted/60">
                <th className="px-3 py-2 font-medium">Platform</th>
                <th className="px-3 py-2 font-medium">Jurisdiction</th>
                <th className="px-3 py-2 font-medium">Status</th>
                <th className="px-3 py-2 text-right font-medium">Seen / New / Upd</th>
                <th className="px-3 py-2 font-medium">When</th>
                <th className="px-3 py-2 font-medium">Notes</th>
              </tr>
            </thead>
            <tbody>
              {runs.map((r) => (
                <tr key={r.id} className="border-b border-border last:border-0">
                  <td className="px-3 py-2 font-mono text-2xs text-ink-muted">{r.platform}</td>
                  <td className="px-3 py-2 text-ink">{r.jurisdictionName ?? "—"}</td>
                  <td className="px-3 py-2">
                    <Badge variant={STATUS_VARIANT[r.status] ?? "neutral"} className="capitalize">
                      {r.status}
                    </Badge>
                    {r.anomalous ? (
                      <Badge variant="warning" className="ml-1">
                        anomaly
                      </Badge>
                    ) : null}
                  </td>
                  <td className="px-3 py-2 text-right font-mono text-2xs tabular-nums text-ink-muted">
                    {r.recordsSeen} / {r.recordsNew} / {r.recordsUpdated}
                  </td>
                  <td className="px-3 py-2 font-mono text-2xs text-ink-muted">
                    {formatDateTime(r.startedAt)}
                  </td>
                  <td className="px-3 py-2 text-2xs text-ink-muted">{r.notes ?? ""}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
