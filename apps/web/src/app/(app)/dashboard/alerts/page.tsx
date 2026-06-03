import { PageHeader } from "@repo/ui";
import { AlertLogList } from "@/components/alert-log-list";
import { getUserStore } from "@/lib/data/user-store";
import { requireUser } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function AlertsPage() {
  const user = await requireUser();
  const log = await getUserStore().listAlertLog(user.id, 50);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Alert log"
        description="Every match we've delivered, newest first — each links straight to the passage."
      />
      <section className="rounded-lg border border-border bg-surface p-5">
        <AlertLogList items={log} />
      </section>
    </div>
  );
}
