import type { Env } from "./env";

export async function sendEmail(
  env: Env,
  to: string,
  subject: string,
  html: string,
): Promise<{ ok: boolean; error?: string }> {
  if (!env.RESEND_API_KEY) {
    console.log(`[email:dev] to=${to} subject="${subject}"`);
    return { ok: true };
  }
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      authorization: `Bearer ${env.RESEND_API_KEY}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      from: env.EMAIL_FROM ?? "ChamberLens <alerts@chamberlens.com>",
      to,
      subject,
      html,
    }),
  });
  if (!res.ok) return { ok: false, error: `resend ${res.status}` };
  return { ok: true };
}

export async function emailOperator(env: Env, subject: string, html: string): Promise<void> {
  if (!env.OPERATOR_EMAIL) {
    console.warn(`[operator] ${subject}`);
    return;
  }
  await sendEmail(env, env.OPERATOR_EMAIL, `[ChamberLens ops] ${subject}`, html);
}

export function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
