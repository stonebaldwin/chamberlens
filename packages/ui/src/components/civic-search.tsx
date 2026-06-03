import * as React from "react";
import { Search } from "lucide-react";
import { cn } from "../lib/cn";
import { buttonVariants } from "./button";

/** GET-form search bar — works without JavaScript. */
export function SearchBar({
  action = "/search",
  name = "q",
  defaultValue = "",
  placeholder = "Search agendas, minutes, and transcripts…",
  size = "md",
  autoFocus,
  hiddenFields,
  compact = false,
}: {
  action?: string;
  name?: string;
  defaultValue?: string;
  placeholder?: string;
  size?: "md" | "lg";
  autoFocus?: boolean;
  hiddenFields?: Record<string, string>;
  /** Single-field inline search (no button) — for the header masthead. */
  compact?: boolean;
}) {
  const hidden = hiddenFields
    ? Object.entries(hiddenFields).map(([k, v]) => <input key={k} type="hidden" name={k} value={v} />)
    : null;

  if (compact) {
    return (
      <form action={action} className="relative w-full">
        {hidden}
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-subtle" />
        <input
          name={name}
          defaultValue={defaultValue}
          placeholder={placeholder}
          aria-label="Search query"
          className={cn(
            "h-9 w-full rounded-md border border-border-strong bg-surface pl-9 pr-3 text-sm text-ink",
            "placeholder:text-ink-subtle focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/25",
          )}
        />
      </form>
    );
  }

  return (
    <form action={action} className="flex w-full items-center gap-2">
      {hidden}
      <div className="relative flex-1">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-ink-subtle" />
        <input
          name={name}
          defaultValue={defaultValue}
          placeholder={placeholder}
          autoFocus={autoFocus}
          aria-label="Search query"
          className={cn(
            "w-full rounded-md border border-border-strong bg-surface pl-11 pr-3 text-ink shadow-xs",
            "placeholder:text-ink-subtle focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30",
            size === "lg" ? "h-13 text-lg" : "h-11 text-base",
          )}
        />
      </div>
      <button type="submit" className={buttonVariants({ size: size === "lg" ? "lg" : "md" })}>
        Search
      </button>
    </form>
  );
}

export interface FacetOption {
  label: string;
  value: string;
  count?: number;
}

/** Checkbox facet group — rendered inside the search form, submitted via GET. */
export function FacetGroup({
  title,
  name,
  options,
  selected,
}: {
  title: string;
  name: string;
  options: FacetOption[];
  selected: string[];
}) {
  if (!options.length) return null;
  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="kicker mb-1.5">{title}</legend>
      {options.map((o) => (
        <label
          key={o.value}
          className="group flex cursor-pointer items-center gap-2 text-sm text-ink-muted transition-colors hover:text-ink"
        >
          <input
            type="checkbox"
            name={name}
            value={o.value}
            defaultChecked={selected.includes(o.value)}
            className="size-4 rounded-[3px] border-border-strong text-primary focus-visible:ring-2 focus-visible:ring-ring/30"
          />
          <span className="flex-1">{o.label}</span>
          {o.count != null ? (
            <span className="font-mono text-2xs text-ink-subtle">{o.count}</span>
          ) : null}
        </label>
      ))}
    </fieldset>
  );
}

/** Prev/next pager. `hrefFor(offset)` builds the link for a given offset. */
export function Pagination({
  total,
  limit,
  offset,
  hrefFor,
}: {
  total: number;
  limit: number;
  offset: number;
  hrefFor: (offset: number) => string;
}) {
  const pages = Math.max(1, Math.ceil(total / limit));
  const page = Math.floor(offset / limit) + 1;
  if (pages <= 1) return null;
  const disabled = "pointer-events-none opacity-40";
  return (
    <nav className="flex items-center justify-between text-sm">
      <span className="font-mono text-2xs text-ink-subtle">
        {offset + 1}–{Math.min(offset + limit, total)} of {total}
      </span>
      <div className="flex items-center gap-2">
        <a
          href={hrefFor(Math.max(0, offset - limit))}
          className={cn(
            buttonVariants({ variant: "secondary", size: "sm" }),
            offset <= 0 && disabled,
          )}
        >
          Previous
        </a>
        <span className="font-mono text-2xs text-ink-subtle">
          {page} / {pages}
        </span>
        <a
          href={hrefFor(offset + limit)}
          className={cn(
            buttonVariants({ variant: "secondary", size: "sm" }),
            page >= pages && disabled,
          )}
        >
          Next
        </a>
      </div>
    </nav>
  );
}
