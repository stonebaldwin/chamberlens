import type { Metadata } from "next";
import { InfoPage } from "@/components/info-page";

export const metadata: Metadata = { title: "Terms of Service" };

export default function TermsPage() {
  return (
    <InfoPage title="Terms of Service" updated="June 2026">
      <p>
        These terms govern your use of ChamberLens. By using the service you agree to them. This is
        a working draft and will be finalized before launch.
      </p>
      <h2>The service</h2>
      <p>
        ChamberLens indexes public civic records and provides search and alerting. We aim for
        accuracy but do not warrant that the record is complete or error-free; always verify against
        the linked official source.
      </p>
      <h2>AI-generated content</h2>
      <p>
        Summaries labeled &ldquo;AI-generated&rdquo; are provided for convenience and are not the
        authoritative record. Do not rely on them for legal, financial, or compliance decisions
        without checking the primary document.
      </p>
      <h2>Acceptable use</h2>
      <p>
        Do not use the service to violate the law, overload our systems, or scrape at abusive rates.
        API access is governed by your plan and rate limits.
      </p>
      <h2>Subscriptions</h2>
      <p>
        Paid plans bill through Stripe and can be managed or canceled at any time from your billing
        portal.
      </p>
    </InfoPage>
  );
}
