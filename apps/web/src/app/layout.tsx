import type { Metadata, Viewport } from "next";
import { fontVariables } from "@/lib/fonts";
import "./globals.css";

export const metadata: Metadata = {
  title: "Astro Note",
  description: "A free, personalized numerology reading — from your name and birth date.",
};

export const viewport: Viewport = {
  themeColor: "#0B0E1C",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={fontVariables}>
      <body className="min-h-dvh bg-ink-950 font-body text-paper-100 antialiased">{children}</body>
    </html>
  );
}
