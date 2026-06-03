import type { Metadata } from "next";
import { Check, Minus } from "lucide-react";
import { PricingTier, type PricingTierProps } from "@repo/ui";

export const metadata: Metadata = {
  title: "Pricing",
  description:
    "Free search and browse. Paid plans add real-time keyword alerts, watchlists, and API access.",
};

const TIERS: PricingTierProps[] = [
  {
    name: "Free",
    price: "$0",
    description: "Search and read every covered record.",
    features: [
      "Full-text search across all jurisdictions",
      "View agendas, minutes & transcripts",
      "3 saved searches",
      "Weekly digest (no instant alerts)",
    ],
    ctaLabel: "Get started",
    ctaHref: "/login?intent=signup",
  },
  {
    name: "Pro",
    price: "$19",
    cadence: "/ month",
    description: "For individuals, journalists & small businesses.",
    features: [
      "Everything in Free",
      "Unlimited saved searches",
      "Real-time keyword alerts",
      "Monitor specific bodies & geo-radius",
      "Daily & weekly email digests",
    ],
    ctaLabel: "Start Pro",
    ctaHref: "/checkout?plan=pro&interval=monthly",
    highlighted: true,
  },
  {
    name: "Business",
    price: "$99",
    cadence: "/ month",
    description: "For gov-affairs, newsrooms & development firms.",
    features: [
      "Everything in Pro",
      "Multi-jurisdiction watchlists",
      "Team seats",
      "Read API access",
      "Exportable reports",
      "Priority coverage requests",
    ],
    ctaLabel: "Start Business",
    ctaHref: "/checkout?plan=business&interval=monthly",
  },
];

const MATRIX: {
  feature: string;
  free: boolean | string;
  pro: boolean | string;
  business: boolean | string;
}[] = [
  { feature: "Full-text search & browse", free: true, pro: true, business: true },
  { feature: "Saved searches", free: "3", pro: "Unlimited", business: "Unlimited" },
  { feature: "Real-time keyword alerts", free: false, pro: true, business: true },
  { feature: "Geo-radius alerts", free: false, pro: true, business: true },
  { feature: "Team seats", free: false, pro: false, business: true },
  { feature: "API access", free: false, pro: false, business: true },
  { feature: "Exports & reports", free: false, pro: false, business: true },
];

function Cell({ value }: { value: boolean | string }) {
  if (value === true) return <Check className="mx-auto size-4 text-success" />;
  if (value === false) return <Minus className="mx-auto size-4 text-ink-subtle" />;
  return <span className="text-ink">{value}</span>;
}

export default function PricingPage() {
  return (
    <main className="mx-auto max-w-6xl px-6 py-12">
      <div className="flex flex-col items-center gap-3 text-center">
        <span className="kicker">Simple, self-serve pricing</span>
        <h1 className="font-serif text-4xl font-semibold tracking-tight text-ink">
          Free to search. Pay when you want to be alerted.
        </h1>
        <p className="max-w-2xl text-ink-muted">
          Searching and reading public records is always free. Paid plans add the thing the
          incumbents don&rsquo;t: real-time, cross-jurisdiction keyword alerts.
        </p>
      </div>

      <div className="mt-10 grid gap-6 lg:grid-cols-3">
        {TIERS.map((t) => (
          <PricingTier key={t.name} {...t} />
        ))}
      </div>

      <section className="mt-16">
        <h2 className="font-serif text-2xl font-semibold tracking-tight text-ink">Compare plans</h2>
        <div className="mt-4 overflow-x-auto rounded-lg border border-border">
          <table className="w-full border-collapse text-left text-sm">
            <thead>
              <tr className="kicker border-b border-border bg-surface-muted/60">
                <th className="px-4 py-3 text-left">Feature</th>
                <th className="px-4 py-3 text-center">Free</th>
                <th className="px-4 py-3 text-center">Pro</th>
                <th className="px-4 py-3 text-center">Business</th>
              </tr>
            </thead>
            <tbody>
              {MATRIX.map((r) => (
                <tr key={r.feature} className="border-b border-border last:border-0">
                  <td className="px-4 py-2.5 text-ink">{r.feature}</td>
                  <td className="px-4 py-2.5 text-center">
                    <Cell value={r.free} />
                  </td>
                  <td className="px-4 py-2.5 text-center">
                    <Cell value={r.pro} />
                  </td>
                  <td className="px-4 py-2.5 text-center">
                    <Cell value={r.business} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
