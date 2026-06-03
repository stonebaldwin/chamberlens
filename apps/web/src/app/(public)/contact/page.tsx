import type { Metadata } from "next";
import { InfoPage } from "@/components/info-page";

export const metadata: Metadata = { title: "Contact & corrections" };

export default function ContactPage() {
  return (
    <InfoPage title="Contact & corrections">
      <p>
        Found an error, a misattributed record, or a meeting we got wrong? We take corrections to
        the public record seriously.
      </p>
      <h2>Corrections</h2>
      <p>
        Email <a href="mailto:corrections@example.com">corrections@example.com</a> with a link to
        the record and what&rsquo;s wrong. Because every ChamberLens record links its official
        source, we can verify and fix quickly.
      </p>
      <h2>Coverage requests</h2>
      <p>
        Want us to add a jurisdiction? Use the <a href="/coverage">coverage request form</a> —
        demand is a major input to our roadmap.
      </p>
      <h2>General</h2>
      <p>
        Everything else: <a href="mailto:hello@example.com">hello@example.com</a>.
      </p>
    </InfoPage>
  );
}
