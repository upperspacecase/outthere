import type { Metadata } from "next";
import { Anton, Space_Mono, Inter } from "next/font/google";
import "./globals.css";

const anton = Anton({ subsets: ["latin"], weight: "400", variable: "--font-anton" });
const spaceMono = Space_Mono({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-space-mono",
});
const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Out There — NYC Photo Booth Map",
  description:
    "A crowdsourced map of offline experiences worth leaving the house for. Starts with fixed analog & vintage photo booths across Manhattan, Brooklyn, and Queens you can actually visit.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${anton.variable} ${spaceMono.variable} ${inter.variable} h-full`}
    >
      <body className="h-full">{children}</body>
    </html>
  );
}
