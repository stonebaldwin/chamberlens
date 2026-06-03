import Link from "next/link";
import { MapPin } from "lucide-react";
import { buttonVariants, EmptyState } from "@repo/ui";

export default function NotFound() {
  return (
    <main className="mx-auto max-w-xl px-6 py-20">
      <EmptyState
        icon={<MapPin />}
        title="Page not found"
        description="That record doesn't exist or hasn't been indexed. Try searching, or browse covered jurisdictions."
        action={
          <Link href="/search" className={buttonVariants({ size: "sm" })}>
            Search ChamberLens
          </Link>
        }
      />
    </main>
  );
}
