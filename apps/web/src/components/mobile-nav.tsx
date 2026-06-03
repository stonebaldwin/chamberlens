"use client";

import * as React from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { SearchBar } from "@repo/ui";

const LINKS = [
  { href: "/search", label: "Search" },
  { href: "/coverage", label: "Coverage" },
  { href: "/pricing", label: "Pricing" },
];

/** Hamburger + disclosure panel so nav + search are reachable below the `sm` breakpoint. */
export function MobileNav() {
  const [open, setOpen] = React.useState(false);

  return (
    <div className="sm:hidden">
      <button
        type="button"
        aria-label={open ? "Close menu" : "Open menu"}
        aria-expanded={open}
        aria-controls="mobile-nav"
        onClick={() => setOpen((v) => !v)}
        className="flex size-9 items-center justify-center rounded-md text-ink-muted transition-colors hover:bg-surface-muted hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        {open ? <X className="size-5" /> : <Menu className="size-5" />}
      </button>
      {open ? (
        <div
          id="mobile-nav"
          className="absolute inset-x-0 top-full border-b border-border bg-paper px-6 py-4 shadow-md"
        >
          <nav className="flex flex-col gap-1" aria-label="Primary">
            {LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="rounded-md px-2 py-2 text-sm font-medium text-ink transition-colors hover:bg-surface-muted"
              >
                {l.label}
              </Link>
            ))}
          </nav>
          <div className="mt-3">
            <SearchBar compact placeholder="Search records…" />
          </div>
        </div>
      ) : null}
    </div>
  );
}
