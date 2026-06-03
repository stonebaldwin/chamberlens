"use client";

import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { signOut } from "@/lib/auth-client";

export function SignOutButton({ demo }: { demo: boolean }) {
  const router = useRouter();
  return (
    <button
      type="button"
      onClick={async () => {
        if (!demo) {
          try {
            await signOut();
          } catch {
            // ignore
          }
        }
        router.push("/");
        router.refresh();
      }}
      className="inline-flex items-center gap-1.5 text-sm text-ink-muted transition-colors hover:text-ink"
    >
      <LogOut className="size-4" /> Sign out
    </button>
  );
}
