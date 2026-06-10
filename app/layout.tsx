import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-inter",
});

const TITLE = "Out There — NYC Photo Booth Map";
const DESCRIPTION =
  "A crowdsourced map of offline experiences worth leaving the house for. Starts with fixed analog & vintage photo booths across Manhattan, Brooklyn, and Queens you can actually visit.";

export const metadata: Metadata = {
  metadataBase: new URL("https://outthere.club"),
  title: TITLE,
  description: DESCRIPTION,
  openGraph: {
    type: "website",
    url: "https://outthere.club",
    siteName: "Out There",
    title: TITLE,
    description: DESCRIPTION,
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${inter.variable} h-full`}>
      <body className="h-full">{children}</body>
    </html>
  );
}
