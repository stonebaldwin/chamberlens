"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@repo/ui";
import { authClient } from "@/lib/auth-client";

const inputCls =
  "h-10 w-full rounded-md border border-border-strong bg-surface px-3 text-sm text-ink placeholder:text-ink-subtle focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30";

export function AuthForm({ mode }: { mode: "signin" | "signup" }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [magicSent, setMagicSent] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (mode === "signup") {
        const { error: err } = await authClient.signUp.email({
          email,
          password,
          name: name || email,
        });
        if (err) throw new Error(err.message ?? "Sign up failed");
      } else {
        const { error: err } = await authClient.signIn.email({ email, password });
        if (err) throw new Error(err.message ?? "Sign in failed");
      }
      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  async function onMagicLink() {
    if (!email) {
      setError("Enter your email first");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const { error: err } = await authClient.signIn.magicLink({
        email,
        callbackURL: "/dashboard",
      });
      if (err) throw new Error(err.message ?? "Could not send link");
      setMagicSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  if (magicSent) {
    return (
      <div className="rounded-lg border border-success/40 bg-success-tint px-4 py-3 text-sm text-success">
        Check your email for a sign-in link.
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-3">
      {mode === "signup" ? (
        <input
          placeholder="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className={inputCls}
          aria-label="Name"
        />
      ) : null}
      <input
        type="email"
        required
        placeholder="you@example.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className={inputCls}
        aria-label="Email"
      />
      <input
        type="password"
        required
        minLength={8}
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className={inputCls}
        aria-label="Password"
      />
      {error ? <p className="text-sm text-danger">{error}</p> : null}
      <Button type="submit" disabled={loading}>
        {loading ? "…" : mode === "signup" ? "Create account" : "Sign in"}
      </Button>
      <button
        type="button"
        onClick={onMagicLink}
        disabled={loading}
        className="text-sm text-primary hover:underline"
      >
        Email me a magic link instead
      </button>
    </form>
  );
}
