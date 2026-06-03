import type { Metadata } from "next";
import { InfoPage } from "@/components/info-page";

export const metadata: Metadata = { title: "Privacy Policy" };

export default function PrivacyPage() {
  return (
    <InfoPage title="Privacy Policy" updated="June 2026">
      <p>
        This policy explains what we collect and why. It is a working draft and will be finalized
        before launch.
      </p>
      <h2>What we index</h2>
      <p>
        ChamberLens indexes <em>public</em> government meeting records. We do not assemble dossiers
        on private individuals; we surface what governments have already published.
      </p>
      <h2>Account data</h2>
      <p>
        If you create an account we store your email and your saved searches and alert preferences,
        so we can send the alerts you ask for. We use Resend to deliver email and Stripe to process
        payments; we don&rsquo;t store card details.
      </p>
      <h2>Your choices</h2>
      <p>
        You can delete saved searches and alerts at any time, and request deletion of your account
        by emailing <a href="mailto:privacy@example.com">privacy@example.com</a>.
      </p>
    </InfoPage>
  );
}
