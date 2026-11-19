import type { Metadata } from "next";
import "./globals.css";
import { BookingProvider } from "@/components/booking-provider";
import { AiConcierge } from "@/components/ai-concierge";
import { CookieBanner } from "@/components/cookie-banner";

export const metadata: Metadata = {
  title: "StayEase — Effortless getaways",
  description: "Find a stay that feels just right with StayEase.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <body>
        <BookingProvider>
          {children}
          <AiConcierge />
          <CookieBanner />
        </BookingProvider>
      </body>
    </html>
  );
}
