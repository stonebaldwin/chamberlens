import type { ReactNode } from "react";
import Link from "next/link";
import { Badge } from "@repo/ui";
import { ChamberLensWordmark } from "@/components/brand";
import { DashboardNav } from "@/components/dashboard-nav";
import { SignOutButton } from "@/components/sign-out-button";
import { requireUser } from "@/lib/session";

export default async function AppLayout({ children }: { children: ReactNode }) {
  const user = await requireUser();
  return (
    <div className="min-h-dvh bg-paper">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-primary-foreground"
      >
        Skip to content
      </a>
      <header className="border-b border-border bg-surface">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-6 py-3">
          <Link href="/" aria-label="ChamberLens home" className="shrink-0">
            <ChamberLensWordmark />
          </Link>
          {user.isDemo ? <Badge variant="warning">Demo</Badge> : null}
          <div className="ml-auto flex items-center gap-3 text-sm">
            <span className="hidden text-ink-muted sm:inline">{user.email}</span>
            <Badge variant="primary" className="capitalize">
              {user.plan}
            </Badge>
            <SignOutButton demo={user.isDemo} />
          </div>
        </div>
      </header>
      <div className="mx-auto grid max-w-6xl gap-8 px-6 py-8 lg:grid-cols-[220px_1fr]">
        <aside>
          <DashboardNav plan={user.plan} isOperator={user.role === "operator"} />
        </aside>
        <main id="main" tabIndex={-1} className="min-w-0 outline-none">
          {children}
        </main>
      </div>
    </div>
  );
}
