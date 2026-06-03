import Link from "next/link";
import { Gavel } from "lucide-react";
import { buttonVariants, SearchBar } from "@repo/ui";

const navLink =
  "rounded-md px-2.5 py-1.5 text-sm text-ink-muted transition-colors hover:bg-surface-muted hover:text-ink";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-border bg-paper/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center gap-3 px-6 py-3">
        <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight text-ink">
          <span className="flex size-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <Gavel className="size-4" />
          </span>
          ChamberLens
        </Link>
        <nav className="ml-1 hidden items-center sm:flex">
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
        <div className="ml-auto hidden w-72 md:block">
          <SearchBar />
        </div>
        <Link href="/login" className={buttonVariants({ variant: "secondary", size: "sm" })}>
          Sign in
        </Link>
      </div>
    </header>
  );
}
