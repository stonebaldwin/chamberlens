import Link from "next/link";
import { buttonVariants, SearchBar } from "@repo/ui";
import { ChamberLensWordmark } from "./brand";
import { MobileNav } from "./mobile-nav";

const navLink =
  "text-sm font-medium text-ink-muted underline-offset-[6px] transition-colors hover:text-ink hover:underline decoration-accent decoration-2";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-border bg-paper/85 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center gap-6 px-6 py-3.5">
        <Link href="/" aria-label="ChamberLens home" className="shrink-0">
          <ChamberLensWordmark />
        </Link>
        <nav className="ml-1 hidden items-center gap-6 sm:flex">
          <Link href="/search" className={navLink}>
            Search
          </Link>
          <Link href="/coverage" className={navLink}>
            Coverage
          </Link>
          <Link href="/pricing" className={navLink}>
            Pricing
          </Link>
        </nav>
        <div className="ml-auto flex items-center gap-2">
          <div className="hidden w-64 md:block">
            <SearchBar compact placeholder="Search records…" />
          </div>
          <Link href="/login" className={buttonVariants({ variant: "secondary", size: "sm" })}>
            Sign in
          </Link>
          <MobileNav />
        </div>
      </div>
    </header>
  );
}
