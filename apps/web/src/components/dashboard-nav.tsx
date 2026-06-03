"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BellRing,
  Bookmark,
  CreditCard,
  KeyRound,
  LayoutDashboard,
  ListChecks,
  Lock,
  Shield,
} from "lucide-react";
import { cn } from "@repo/ui";

const ITEMS = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/dashboard/searches", label: "Searches & alerts", icon: Bookmark },
  { href: "/dashboard/alerts", label: "Alert log", icon: BellRing },
  { href: "/dashboard/watchlists", label: "Watchlists", icon: ListChecks, business: true },
  { href: "/dashboard/api", label: "API access", icon: KeyRound, business: true },
  { href: "/dashboard/account", label: "Account & billing", icon: CreditCard },
] as const;

export function DashboardNav({
  plan,
  isOperator,
}: {
  plan: "free" | "pro" | "business";
  isOperator?: boolean;
}) {
  const path = usePathname();
  const linkCls = (active: boolean) =>
    cn(
      "flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors",
      active
        ? "bg-primary-tint font-medium text-primary"
        : "text-ink-muted hover:bg-surface-muted hover:text-ink",
    );

  return (
    <nav className="flex flex-col gap-0.5">
      {ITEMS.map((it) => {
        const active = path === it.href;
        const locked = "business" in it && it.business && plan !== "business";
        return (
          <Link key={it.href} href={it.href} className={linkCls(active)}>
            <it.icon className="size-4" />
            <span className="flex-1">{it.label}</span>
            {locked ? <Lock className="size-3 text-ink-subtle" /> : null}
          </Link>
        );
      })}
      {isOperator ? (
        <>
          <div className="my-1 border-t border-border" />
          <Link href="/admin" className={linkCls(path.startsWith("/admin"))}>
            <Shield className="size-4" />
            <span className="flex-1">Admin</span>
          </Link>
        </>
      ) : null}
    </nav>
  );
}
