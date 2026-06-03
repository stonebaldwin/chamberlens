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
}: {
  action?: string;
  name?: string;
  defaultValue?: string;
  placeholder?: string;
  size?: "md" | "lg";
  autoFocus?: boolean;
  hiddenFields?: Record<string, string>;
}) {
  return (
    <form action={action} className="flex w-full items-center gap-2">
      {hiddenFields
        ? Object.entries(hiddenFields).map(([k, v]) => (
            <input key={k} type="hidden" name={k} value={v} />
          ))
        : null}
      <div className="relative flex-1">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-subtle" />
        <input
          name={name}
          defaultValue={defaultValue}
          placeholder={placeholder}
          autoFocus={autoFocus}
          aria-label="Search query"
          className={cn(
            "w-full rounded-lg border border-border-strong bg-surface pl-10 pr-3 text-ink shadow-xs",
            "placeholder:text-ink-subtle focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30",
            size === "lg" ? "h-12 text-lg" : "h-11 text-base",
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
      <legend className="mb-1 text-2xs font-semibold uppercase tracking-wide text-ink-subtle">
        {title}
      </legend>
      {options.map((o) => (
        <label key={o.value} className="flex cursor-pointer items-center gap-2 text-sm text-ink">
          <input
            type="checkbox"
            name={name}
            value={o.value}
            defaultChecked={selected.includes(o.value)}
            className="size-4 rounded border-border-strong text-primary focus-visible:ring-2 focus-visible:ring-ring/30"
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
      <span className="tabular-nums text-ink-muted">
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
        <span className="tabular-nums text-ink-muted">
          Page {page} / {pages}
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
