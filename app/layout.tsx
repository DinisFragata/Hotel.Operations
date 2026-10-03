import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";

import "./globals.css";
import { Toaster } from "@/components/ui/sonner";

const geist = Geist({
  variable: "--font-geist",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Hotel.Operations",
  description: "Hotel operations dashboard: reservations, rooms, guests, maintenance and check-in/check-out",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${geist.variable} antialiased`}>
        <div className="fixed inset-0 -z-10 soft-grid bg-subtle-pattern opacity-60" />
          {children}
        <Toaster />
        <Analytics />
      </body>
    </html>
  );
}