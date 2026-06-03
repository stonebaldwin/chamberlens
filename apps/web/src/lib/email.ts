import { Resend } from "resend";

const FROM = process.env.EMAIL_FROM ?? "ChamberLens <alerts@chamberlens.com>";

function client(): Resend | null {
  const key = process.env.RESEND_API_KEY;
  return key ? new Resend(key) : null;
}

export interface SendEmailInput {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

/** Send transactional email via Resend, or log to console when unconfigured. */
export async function sendEmail(
  input: SendEmailInput,
): Promise<{ ok: boolean; id?: string; error?: string }> {
  const c = client();
  if (!c) {
    // RESEND_API_KEY unset — log instead of sending so dev/preview still works.
    console.warn(`[email] simulated (RESEND_API_KEY unset): to=${input.to} subject="${input.subject}"`);
    return { ok: true };
  }
  const { data, error } = await c.emails.send({
    from: FROM,
    to: input.to,
    subject: input.subject,
    html: input.html,
    text: input.text,
  });
  if (error) return { ok: false, error: String(error) };
  return { ok: true, id: data?.id };
}

export async function sendMagicLinkEmail(to: string, url: string): Promise<void> {
  await sendEmail({
    to,
    subject: "Your ChamberLens sign-in link",
    text: `Sign in to ChamberLens: ${url}`,
    html: `<p>Click to sign in to ChamberLens:</p><p><a href="${url}">Sign in</a></p><p>This link expires shortly. If you didn't request it, you can ignore this email.</p>`,
  });
}
