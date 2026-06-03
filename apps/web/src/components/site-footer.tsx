import Link from "next/link";

const col = "flex flex-col gap-1.5 text-sm text-ink-muted";
const link = "hover:text-ink";

export function SiteFooter({ demo }: { demo: boolean }) {
  return (
    <footer className="mt-16 border-t border-border bg-surface">
      <div className="mx-auto max-w-6xl px-6 py-10">
        {demo ? (
          <div className="mb-8 rounded-lg border border-warning/30 bg-warning-tint/60 px-4 py-2.5 text-xs text-ink">
            <span className="font-semibold">Demo data.</span> This instance is serving a small
            bundled sample so the product is reviewable. Set{" "}
            <code className="font-mono">DATABASE_URL</code> and run live ingestion to populate real
            meetings.
          </div>
        ) : null}
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <div className="flex flex-col gap-2">
            <div className="font-semibold tracking-tight text-ink">ChamberLens</div>
            <p className="text-sm text-ink-muted">
              Search and monitor public local-government meetings across jurisdictions.
            </p>
          </div>
          <div className={col}>
            <div className="text-2xs font-semibold uppercase tracking-wide text-ink-subtle">
              Product
            </div>
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
          <div className={col}>
            <div className="text-2xs font-semibold uppercase tracking-wide text-ink-subtle">
              Company
            </div>
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
          <div className={col}>
            <div className="text-2xs font-semibold uppercase tracking-wide text-ink-subtle">
              Attribution
            </div>
            <p className="text-xs leading-relaxed text-ink-subtle">
              ChamberLens aggregates public civic records and always links the official source with
              a retrieval timestamp. AI summaries are labeled as AI-generated and are never the
              authoritative record.
            </p>
          </div>
        </div>
        <div className="mt-8 border-t border-border pt-6 text-2xs text-ink-subtle">
          © {new Date().getUTCFullYear()} ChamberLens. Public-interest civic-records aggregator.
        </div>
      </div>
    </footer>
  );
}
