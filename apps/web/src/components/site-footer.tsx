import Link from "next/link";
import { cn } from "@repo/ui";
import { ChamberLensWordmark } from "./brand";

const col = "flex flex-col gap-2 text-sm text-ink-muted";
const link = "transition-colors hover:text-ink";

export function SiteFooter({ demo }: { demo: boolean }) {
  return (
    <footer className="mt-20 border-t border-border bg-surface">
      <div className="mx-auto max-w-6xl px-6 py-12">
        {demo ? (
          <div className="mb-10 flex flex-wrap items-baseline gap-x-1.5 gap-y-1 rounded-md border border-accent/40 bg-accent-tint/50 px-4 py-3 text-xs text-ink">
            <span className="kicker text-accent">Demo data</span>
            <span className="text-ink-muted">
              — serving a small bundled sample so the product is reviewable. Set{" "}
              <code className="font-mono text-ink">DATABASE_URL</code> and run live ingestion to
              populate real meetings.
            </span>
          </div>
        ) : null}
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-12">
          <div className="flex flex-col gap-3 lg:col-span-5">
            <ChamberLensWordmark subtle />
            <p className="max-w-xs text-sm text-ink-muted">
              One lens on every chamber. Search and monitor public local-government meetings across
              jurisdictions and vendor platforms.
            </p>
          </div>
          <div className={cn(col, "lg:col-span-2")}>
            <div className="kicker mb-1">Product</div>
            <Link href="/search" className={link}>
              Search
            </Link>
            <Link href="/coverage" className={link}>
              Coverage
            </Link>
            <Link href="/pricing" className={link}>
              Pricing
            </Link>
          </div>
          <div className={cn(col, "lg:col-span-2")}>
            <div className="kicker mb-1">Company</div>
            <Link href="/about" className={link}>
              About
            </Link>
            <Link href="/terms" className={link}>
              Terms
            </Link>
            <Link href="/privacy" className={link}>
              Privacy
            </Link>
            <Link href="/contact" className={link}>
              Contact &amp; corrections
            </Link>
          </div>
          <div className="flex flex-col gap-2 lg:col-span-3">
            <div className="kicker mb-1">Attribution</div>
            <p className="text-xs leading-relaxed text-ink-subtle">
              ChamberLens aggregates public civic records and always links the official source with a
              retrieval timestamp. AI summaries are labeled as AI-generated and are never the
              authoritative record.
            </p>
          </div>
        </div>
        <div className="mt-10 flex flex-col gap-1.5 border-t border-border pt-6 text-2xs text-ink-subtle sm:flex-row sm:items-center sm:justify-between">
          <span className="font-mono">
            © {new Date().getUTCFullYear()} ChamberLens · Public-interest civic-records aggregator
          </span>
          <span className="kicker">Public record · Always attributed</span>
        </div>
      </div>
    </footer>
  );
}
