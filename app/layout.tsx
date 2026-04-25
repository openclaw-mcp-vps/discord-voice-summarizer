import type { Metadata } from "next";
import { IBM_Plex_Mono, Space_Grotesk } from "next/font/google";

import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
});

const ibmPlexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  variable: "--font-ibm-plex-mono",
  weight: ["400", "500", "600"],
});

const appUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(appUrl),
  title: {
    default: "Discord Voice Summarizer | Actionable Meeting Notes",
    template: "%s | Discord Voice Summarizer",
  },
  description:
    "Record Discord voice calls, transcribe with Whisper, and generate action items so remote teams stop losing context.",
  keywords: [
    "Discord",
    "voice summary",
    "meeting notes",
    "action items",
    "remote team productivity",
  ],
  openGraph: {
    title: "Discord Voice Summarizer",
    description:
      "Automated Discord voice call summaries with action items and decisions.",
    siteName: "Discord Voice Summarizer",
    type: "website",
    url: appUrl,
  },
  twitter: {
    card: "summary_large_image",
    title: "Discord Voice Summarizer",
    description:
      "Turn Discord voice calls into searchable summaries and action items.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${spaceGrotesk.variable} ${ibmPlexMono.variable} h-full`}
    >
      <body className="min-h-screen bg-[#0d1117] text-slate-100 antialiased">
        {children}
      </body>
    </html>
  );
}
