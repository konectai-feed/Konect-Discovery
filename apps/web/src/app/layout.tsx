import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Konect Discovery — Find the Best, Ranked",
  description:
    "Discover top-rated local businesses ranked by trust, quality, and community signals.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
