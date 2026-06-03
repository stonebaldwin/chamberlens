import { Badge, PageHeader } from "@repo/ui";
import { getAdminStore } from "@/lib/data/admin-store";
import { formatDateShort } from "@/lib/format";

export const dynamic = "force-dynamic";

const STATUS_VARIANT: Record<string, "warning" | "primary" | "success" | "neutral"> = {
  requested: "warning",
  planned: "primary",
  live: "success",
  declined: "neutral",
};

export default async function AdminCoverage() {
  const requests = await getAdminStore().coverageRequests();

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="Operator"
        title="Coverage requests"
        description="Demand-driven roadmap input, sorted by votes."
      />
      <section className="overflow-x-auto rounded-lg border border-border bg-surface">
        {requests.length ? (
          <table className="w-full border-collapse text-left text-sm">
            <thead>
              <tr className="kicker border-b border-border bg-surface-muted/60">
                <th className="px-4 py-2.5 font-medium">Jurisdiction</th>
                <th className="px-4 py-2.5 text-right font-medium">Votes</th>
                <th className="px-4 py-2.5 font-medium">Status</th>
                <th className="px-4 py-2.5 font-medium">Notes</th>
                <th className="px-4 py-2.5 font-medium">Requested</th>
              </tr>
            </thead>
            <tbody>
              {requests.map((r) => (
                <tr key={r.id} className="border-b border-border last:border-0">
                  <td className="px-4 py-2.5 font-medium text-ink">
                    {r.jurisdictionName}
                    {r.state ? `, ${r.state}` : ""}
                  </td>
                  <td className="px-4 py-2.5 text-right font-mono tabular-nums text-ink">{r.votes}</td>
                  <td className="px-4 py-2.5">
                    <Badge variant={STATUS_VARIANT[r.status] ?? "neutral"} className="capitalize">
                      {r.status}
                    </Badge>
                  </td>
                  <td className="px-4 py-2.5 text-2xs text-ink-muted">{r.notes ?? ""}</td>
                  <td className="px-4 py-2.5 font-mono text-2xs text-ink-muted">
                    {formatDateShort(r.createdAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="p-5 text-sm text-ink-muted">No coverage requests yet.</p>
        )}
      </section>
    </div>
  );
}
