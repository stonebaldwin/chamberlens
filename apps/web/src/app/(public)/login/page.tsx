import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthForm } from "@/components/auth-form";
import { authAvailable } from "@/lib/auth";
import { getSessionUser } from "@/lib/session";

export const metadata: Metadata = { title: "Sign in" };
export const dynamic = "force-dynamic";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ intent?: string }>;
}) {
  const sp = await searchParams;
  const user = await getSessionUser();
  if (user) redirect("/dashboard");

  const mode = sp.intent === "signup" ? "signup" : "signin";

  return (
    <main className="mx-auto flex max-w-sm flex-col gap-6 px-6 py-16">
      <div className="text-center">
        <h1 className="text-2xl font-semibold tracking-tight text-ink">
          {mode === "signup" ? "Create your ChamberLens account" : "Sign in to ChamberLens"}
        </h1>
        <p className="mt-1 text-sm text-ink-muted">
          {mode === "signup" ? "Free to search. Add alerts anytime." : "Welcome back."}
        </p>
      </div>

      {authAvailable() ? (
        <AuthForm mode={mode} />
      ) : (
        <div className="rounded-lg border border-warning/40 bg-warning-tint/60 px-4 py-3 text-sm text-ink">
          Authentication needs <code className="font-mono">DATABASE_URL</code>. In demo mode
          you&rsquo;re browsing as a demo user —{" "}
          <Link href="/dashboard" className="font-medium text-primary underline">
            open the dashboard
          </Link>
          .
        </div>
      )}

      <p className="text-center text-sm text-ink-muted">
        {mode === "signup" ? (
          <>
            Already have an account?{" "}
            <Link href="/login" className="font-medium text-primary hover:underline">
              Sign in
            </Link>
          </>
        ) : (
          <>
            New here?{" "}
            <Link href="/login?intent=signup" className="font-medium text-primary hover:underline">
              Create an account
            </Link>
          </>
        )}
      </p>
      <p className="text-center text-2xs text-ink-subtle">
        By continuing you agree to our{" "}
        <Link href="/terms" className="underline hover:text-ink">
          Terms
        </Link>
        .
      </p>
    </main>
  );
}
