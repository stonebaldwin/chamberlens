import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Fraunces, JetBrains_Mono, Public_Sans } from "next/font/google";
import { ToastProvider } from "@repo/ui";
import "./globals.css";

// Public Sans — the U.S. government (USWDS) UI typeface. Fitting for civic data.
const publicSans = Public_Sans({
  subsets: ["latin"],
  variable: "--font-public-sans",
  display: "swap",
});

// Fraunces — expressive editorial serif for display headlines.
const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  display: "swap",
  style: ["normal", "italic"],
});

// JetBrains Mono — the "metadata of the record": IDs, dates, counts.
const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "ChamberLens — Search and monitor your local governments",
    template: "%s · ChamberLens",
  },
  description:
    "Search public local-government meeting agendas, minutes, and video across jurisdictions — and get alerted whenever a topic you care about comes up.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="en"
      className={`${publicSans.variable} ${fraunces.variable} ${jetbrainsMono.variable}`}
    >
      <body className="font-sans antialiased">
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
