"use client";

import { useTransition } from "react";
import { Trash2 } from "lucide-react";
import { Badge, Button, cn, EmptyState, Select } from "@repo/ui";
import {
  removeSavedSearch,
  setFrequency,
  toggleAlert,
} from "@/app/(app)/dashboard/searches/actions";
import type { AlertFrequency, SavedSearchView } from "@/lib/data/user-store";

export function SavedSearchList({
  searches,
  alertsEnabled,
}: {
  searches: SavedSearchView[];
  alertsEnabled: boolean;
}) {
  const [pending, start] = useTransition();

  if (!searches.length) {
    return (
      <EmptyState
        title="No saved searches yet"
        description="Save a search above, or from any search results page, to start monitoring."
      />
    );
  }

  return (
    <ul className={cn("flex flex-col gap-3", pending && "opacity-70")}>
      {searches.map((s) => (
        <li
          key={s.id}
          className="flex flex-col gap-3 rounded-lg border border-border bg-surface p-4 sm:flex-row sm:items-center"
        >
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="font-medium text-ink">{s.name}</span>
              {s.isAlert ? (
                <Badge variant="success">Alert on</Badge>
              ) : (
                <Badge variant="neutral">Paused</Badge>
              )}
            </div>
            <div className="mt-0.5 flex flex-wrap items-center gap-2 text-2xs text-ink-muted">
              <code className="font-mono">{s.query}</code>
              <span aria-hidden>·</span>
              <span>{s.scopeSummary}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Select
              value={s.frequency}
              disabled={!s.isAlert || !alertsEnabled || pending}
              onChange={(e) => start(() => setFrequency(s.id, e.target.value as AlertFrequency))}
              className="w-28"
              aria-label="Alert frequency"
            >
              <option value="instant">Instant</option>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
            </Select>
            <Button
              variant="secondary"
              size="sm"
              disabled={!alertsEnabled || pending}
              onClick={() => start(() => toggleAlert(s.id, !s.isAlert))}
            >
              {s.isAlert ? "Pause" : "Enable"}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Delete saved search"
              disabled={pending}
              onClick={() => start(() => removeSavedSearch(s.id))}
            >
              <Trash2 className="size-4" />
            </Button>
          </div>
        </li>
      ))}
    </ul>
  );
}
