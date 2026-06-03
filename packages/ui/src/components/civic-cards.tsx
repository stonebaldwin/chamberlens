import * as React from "react";
import { ArrowRight, Bell, Check, ExternalLink, Sparkles } from "lucide-react";
import { cn } from "../lib/cn";
import { Badge } from "./badge";
import { buttonVariants } from "./button";

const markStyles = "[&_mark]:rounded-sm [&_mark]:bg-warning-tint [&_mark]:px-0.5 [&_mark]:text-ink";

/** A search result card with highlighted snippet and an "alert" CTA. */
export function ResultCard({
  href,
  title,
  jurisdiction,
  body,
  dateLabel,
  docType,
  snippetHtml,
  alertHref,
}: {
  href: string;
  title: string;
  jurisdiction: string;
  body: string;
  dateLabel: string;
  docType?: string | null;
  snippetHtml?: string | null;
  alertHref?: string | null;
}) {
  return (
    <article className="rounded-lg border border-border bg-surface p-4 transition-colors hover:border-border-strong">
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-2xs text-ink-muted">
        <span className="font-medium text-ink">{jurisdiction}</span>
        <span aria-hidden>·</span>
        <span>{body}</span>
        {docType ? (
          <Badge variant="neutral" className="ml-1 capitalize">
            {docType}
          </Badge>
        ) : null}
        <span className="ml-auto font-mono">{dateLabel}</span>
      </div>
      <a
        href={href}
        className="mt-1.5 block text-base font-semibold tracking-tight text-ink hover:text-primary"
      >
        {title}
      </a>
      {snippetHtml ? (
        <p
          className={cn("mt-1 text-sm leading-relaxed text-ink-muted", markStyles)}
          // Snippet HTML is server-generated (ts_headline / demo highlighter), only <mark>.
          dangerouslySetInnerHTML={{ __html: snippetHtml }}
        />
      ) : null}
      {alertHref ? (
        <div className="mt-2.5">
          <a
            href={alertHref}
            className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
          >
            <Bell className="size-3.5" /> Set an alert for this search
          </a>
        </div>
      ) : null}
    </article>
  );
}

/** Compact meeting row for jurisdiction/body listings. */
export function MeetingRow({
  href,
  title,
  body,
  dateLabel,
  status,
  badges,
}: {
  href: string;
  title: string;
  body: string;
  dateLabel: string;
  status?: string;
  badges?: React.ReactNode;
}) {
  return (
    <a
      href={href}
      className="flex items-center gap-3 border-b border-border py-3 last:border-0 hover:bg-surface-muted/40"
    >
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-medium text-ink">{title}</div>
        <div className="text-2xs text-ink-muted">{body}</div>
      </div>
      {badges}
      {status ? <span className="text-2xs capitalize text-ink-subtle">{status}</span> : null}
      <span className="shrink-0 font-mono text-2xs text-ink-muted">{dateLabel}</span>
    </a>
  );
}

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow?: React.ReactNode;
  title: string;
  description?: React.ReactNode;
  actions?: React.ReactNode;
}) {
  return (
    <header className="flex flex-col gap-3 border-b border-border pb-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-col gap-1.5">
          {eyebrow ? (
            <div className="text-2xs font-semibold uppercase tracking-wide text-ink-subtle">
              {eyebrow}
            </div>
          ) : null}
          <h1 className="text-2xl font-semibold tracking-tight text-ink">{title}</h1>
          {description ? <div className="text-sm text-ink-muted">{description}</div> : null}
        </div>
        {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
      </div>
    </header>
  );
}

export function Stat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5">
      <div className="text-2xl font-semibold tracking-tight text-ink tabular-nums">{value}</div>
      <div className="text-2xs uppercase tracking-wide text-ink-subtle">{label}</div>
    </div>
  );
}

export function StatRow({ children }: { children: React.ReactNode }) {
  return <div className="flex flex-wrap gap-8">{children}</div>;
}

/** Source attribution + retrieval timestamp — present on every record. */
export function SourceMeta({
  sourceUrl,
  retrievedLabel,
}: {
  sourceUrl: string;
  retrievedLabel: string;
}) {
  return (
    <p className="text-2xs text-ink-subtle">
      Source:{" "}
      <a
        href={sourceUrl}
        target="_blank"
        rel="noreferrer"
        className="inline-flex items-center gap-0.5 underline hover:text-ink"
      >
        official record <ExternalLink className="size-3" />
      </a>{" "}
      · Retrieved {retrievedLabel}
    </p>
  );
}

/** AI summary block — always labeled, never presented as authoritative. */
export function AiSummary({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-info/30 bg-info-tint/60 p-4">
      <div className="flex items-center gap-1.5 text-2xs font-semibold uppercase tracking-wide text-info">
        <Sparkles className="size-3.5" /> AI-generated summary
      </div>
      <p className="mt-1.5 text-sm text-ink">{children}</p>
      <p className="mt-2 text-2xs text-ink-subtle">
        AI-generated — not the authoritative record. Verify against the primary documents below.
      </p>
    </div>
  );
}

export interface CoverageItem {
  name: string;
  state: string;
  href: string;
  bodyCount?: number;
  meetingCount?: number;
}

export function CoverageList({ items }: { items: CoverageItem[] }) {
  return (
    <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((it) => (
        <li key={it.href}>
          <a
            href={it.href}
            className="flex items-center justify-between rounded-lg border border-border bg-surface px-3 py-2.5 transition-colors hover:border-border-strong"
          >
            <span className="flex flex-col">
              <span className="text-sm font-medium text-ink">
                {it.name}, {it.state}
              </span>
              {it.bodyCount != null ? (
                <span className="text-2xs text-ink-subtle">
                  {it.bodyCount} bodies · {it.meetingCount ?? 0} meetings
                </span>
              ) : null}
            </span>
            <ArrowRight className="size-4 text-ink-subtle" />
          </a>
        </li>
      ))}
    </ul>
  );
}

export interface PricingTierProps {
  name: string;
  price: string;
  cadence?: string;
  description: string;
  features: string[];
  ctaLabel: string;
  ctaHref: string;
  highlighted?: boolean;
}

export function PricingTier({
  name,
  price,
  cadence,
  description,
  features,
  ctaLabel,
  ctaHref,
  highlighted,
}: PricingTierProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-4 rounded-xl border bg-surface p-6",
        highlighted ? "border-primary shadow-md" : "border-border",
      )}
    >
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-semibold tracking-tight text-ink">{name}</h3>
          {highlighted ? <Badge variant="primary">Popular</Badge> : null}
        </div>
        <p className="text-sm text-ink-muted">{description}</p>
      </div>
      <div className="flex items-baseline gap-1">
        <span className="text-3xl font-semibold tracking-tight text-ink">{price}</span>
        {cadence ? <span className="text-sm text-ink-subtle">{cadence}</span> : null}
      </div>
      <a
        href={ctaHref}
        className={buttonVariants({ variant: highlighted ? "primary" : "secondary" })}
      >
        {ctaLabel}
      </a>
      <ul className="flex flex-col gap-2">
        {features.map((f) => (
          <li key={f} className="flex items-start gap-2 text-sm text-ink-muted">
            <Check className="mt-0.5 size-4 shrink-0 text-success" />
            {f}
          </li>
        ))}
      </ul>
    </div>
  );
}
