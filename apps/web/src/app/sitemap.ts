import type { MetadataRoute } from "next";
import { getDataSource } from "@/lib/data";

const BASE = (process.env.NEXT_PUBLIC_APP_URL ?? "https://chamberlens.com").replace(/\/$/, "");

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const ds = getDataSource();
  const [jurs, bodies, meetingIds] = await Promise.all([
    ds.listJurisdictions(),
    ds.listBodies(),
    ds.allMeetingIds(),
  ]);

  const statics: MetadataRoute.Sitemap = [
    { url: `${BASE}/`, changeFrequency: "daily", priority: 1 },
    { url: `${BASE}/search`, changeFrequency: "daily", priority: 0.8 },
    { url: `${BASE}/coverage`, changeFrequency: "daily", priority: 0.7 },
    { url: `${BASE}/pricing`, changeFrequency: "monthly", priority: 0.6 },
    { url: `${BASE}/about`, changeFrequency: "monthly", priority: 0.4 },
  ];
  const jurUrls: MetadataRoute.Sitemap = jurs.map((j) => ({
    url: `${BASE}/jurisdictions/${j.slug}`,
    changeFrequency: "daily",
    priority: 0.6,
  }));
  const bodyUrls: MetadataRoute.Sitemap = bodies.map((b) => ({
    url: `${BASE}/jurisdictions/${b.jurisdictionSlug}/${b.slug}`,
    changeFrequency: "daily",
    priority: 0.5,
  }));
  const meetingUrls: MetadataRoute.Sitemap = meetingIds.map((id) => ({
    url: `${BASE}/meetings/${id}`,
    changeFrequency: "weekly",
    priority: 0.5,
  }));

  return [...statics, ...jurUrls, ...bodyUrls, ...meetingUrls];
}
