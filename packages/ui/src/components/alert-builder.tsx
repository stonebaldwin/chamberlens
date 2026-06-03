"use client";

import * as React from "react";
import { Bell } from "lucide-react";
import { cn } from "../lib/cn";
import { Button, buttonVariants } from "./button";
import { Input } from "./input";

export type AlertFrequency = "instant" | "daily" | "weekly";

export interface AlertConfig {
  name: string;
  query: string;
  frequency: AlertFrequency;
}

/**
 * Presentational alert builder. The search page routes anonymous users here via
 * signup; the dashboard (Phase 4) wires `onCreate` to a server action.
 */
export function AlertBuilder({
  query,
  defaultName,
  scopeSummary,
  submitting,
  onCreate,
}: {
  query: string;
  defaultName?: string;
  scopeSummary?: string;
  submitting?: boolean;
  onCreate?: (config: AlertConfig) => void;
}) {
  const [name, setName] = React.useState(defaultName ?? query);
  const [frequency, setFrequency] = React.useState<AlertFrequency>("instant");

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onCreate?.({ name: name.trim() || query, query, frequency });
      }}
      className="flex flex-col gap-4 rounded-lg border border-border bg-surface p-5"
    >
      <div className="flex items-center gap-2 text-sm font-semibold text-ink">
        <Bell className="size-4 text-primary" /> New keyword alert
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="alert-name" className="text-sm font-medium text-ink">
          Alert name
        </label>
        <Input id="alert-name" value={name} onChange={(e) => setName(e.target.value)} />
      </div>

      <div className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-ink">Matches</span>
        <div className="rounded-md border border-border bg-surface-muted px-3 py-2 font-mono text-xs text-ink-muted">
          {query || "—"}
        </div>
        {scopeSummary ? <p className="text-2xs text-ink-subtle">{scopeSummary}</p> : null}
      </div>

      <div className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-ink">Frequency</span>
        <div className="flex gap-2">
          {(["instant", "daily", "weekly"] as const).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFrequency(f)}
              className={cn(
                buttonVariants({ variant: frequency === f ? "primary" : "secondary", size: "sm" }),
                "capitalize",
              )}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <Button type="submit" disabled={submitting}>
        {submitting ? "Creating…" : "Create alert"}
      </Button>
    </form>
  );
}
