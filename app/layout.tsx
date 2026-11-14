import type { Metadata } from "next";
import "./globals.css";
import { BookingProvider } from "@/components/booking-provider";

export const metadata: Metadata = {
  title: "StayEase — Effortless getaways",
  description: "Find a stay that feels just right with StayEase.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <body>
        <BookingProvider>{children}</BookingProvider>
      </body>
    </html>
  );
}
