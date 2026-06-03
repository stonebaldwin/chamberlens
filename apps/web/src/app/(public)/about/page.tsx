import type { Metadata } from "next";
import { InfoPage } from "@/components/info-page";

export const metadata: Metadata = { title: "About" };

export default function AboutPage() {
  return (
    <InfoPage title="About ChamberLens">
      <p>
        ChamberLens aggregates public local-government meeting agendas, minutes, and video across
        jurisdictions and across the vendor platforms governments use, makes them full-text
        searchable, and sends keyword alerts — so you can monitor what your local governments are
        doing without watching every meeting.
      </p>
      <h2>How coverage works</h2>
      <p>
        Local-government meeting data is concentrated in a handful of vendor platforms (Legistar,
        CivicPlus, CivicClerk, PrimeGov, Granicus). ChamberLens implements one adapter per platform,
        then adds a city by configuring it — so coverage expands quickly and breakage is
        concentrated and fast to fix.
      </p>
      <h2>Our commitment to the record</h2>
      <p>
        This is public civic record. Every item links the official source and shows when it was
        retrieved. AI summaries are clearly labeled as AI-generated and are never presented as the
        authoritative record — always verify against the primary document or video.
      </p>
      <p>
        We respect each platform&rsquo;s robots and terms of service, prefer official APIs over
        scraping, and rate-limit politely.
      </p>
    </InfoPage>
  );
}
