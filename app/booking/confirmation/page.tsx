"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { QRCodeSVG } from "qrcode.react";
import { BookingStepper } from "@/components/booking-stepper";
import { BookingSummary } from "@/components/booking-summary";
import { FigmaIcon } from "@/components/figma-icon";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { Button, Surface } from "@/components/ui";
import { api, type UserSession } from "@/lib/api-client";
import { useBooking } from "@/components/booking-provider";

const calendarEvent = `BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VEVENT
SUMMARY:StayEase booking - The Palm House, Goa
DTSTART:20261218T083000Z
DTEND:20261221T053000Z
LOCATION:The Palm House, Candolim, Goa
DESCRIPTION:Booking ID SE-261218-0482
END:VEVENT
END:VCALENDAR`;

export default function BookingConfirmationPage() {
  const { guestDetails, checkInDate, checkOutDate } = useBooking();
  const guestName = `${guestDetails.firstName} ${guestDetails.lastName}`.trim() || "Guest";
  const [bookingCode, setBookingCode] = useState("SE-261218-0482");
  const [userChecked, setUserChecked] = useState(false);
  const [user, setUser] = useState<UserSession | null>(null);

  useEffect(() => {
    const code = new URLSearchParams(window.location.search).get("code");
    if (code) setBookingCode(code);
  }, []);

  useEffect(() => {
    const syncUser = () => {
      setUser(api.getUser());
      setUserChecked(true);
    };
    syncUser();
    window.addEventListener("stayease-user-updated", syncUser);
    return () => window.removeEventListener("stayease-user-updated", syncUser);
  }, []);

  if (!userChecked) {
    return (
      <>
        <SiteHeader />
        <main className="mx-auto max-w-[800px] px-5 py-16 text-center">
          <div className="rounded-lg border border-line bg-white p-12 text-sm text-muted">
            Checking session…
          </div>
        </main>
        <SiteFooter />
      </>
    );
  }

  if (!user) {
    const returnUrl = typeof window !== "undefined" ? window.location.pathname + window.location.search : "/bookings";
    return (
      <>
        <SiteHeader />
        <main className="mx-auto max-w-[560px] px-5 py-16 text-center">
          <div className="rounded-xl border border-line bg-white p-8 shadow-sm">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#f0f4f1] text-forest">
              <FigmaIcon name="lock" className="h-6 w-6" />
            </div>
            <h1 className="mt-4 text-lg font-bold text-charcoal">Sign in to view booking confirmation</h1>
            <p className="mt-2 text-xs text-muted leading-relaxed">
              You are currently signed out. For guest privacy and security, booking confirmation details can only be viewed while signed in to an authorized account.
            </p>
            <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                href={`/auth/login?returnUrl=${encodeURIComponent(returnUrl)}`}
                className="w-full sm:w-auto rounded bg-forest px-5 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-[#344d40] transition-colors"
              >
                Sign in to view booking
              </Link>
              <Link
                href="/auth/register"
                className="w-full sm:w-auto rounded border border-line bg-white px-4 py-2.5 text-xs font-semibold text-charcoal hover:bg-mist transition-colors"
              >
                Create account
              </Link>
            </div>
            <div className="mt-4">
              <Link href="/" className="text-xs text-muted hover:text-forest underline">
                Return to Explore
              </Link>
            </div>
          </div>
        </main>
        <SiteFooter />
      </>
    );
  }

  return (
    <>
      <SiteHeader />
      <BookingStepper active={4} />
      <main className="mx-auto max-w-[1160px] px-5 py-7 lg:px-0">
        <section className="rounded-[4px] bg-mint px-5 py-8 text-center sm:py-10">
          <span className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-white"><FigmaIcon name="check" className="h-5 w-5" /></span>
          <h1 className="mt-4 text-[24px] font-semibold tracking-[-0.5px]">You’re going to Goa, {guestDetails.firstName || "Guest"}!</h1>
          <p className="mt-2 text-xs text-muted">Your stay is confirmed. Let the countdown to slow mornings begin.</p>
          <span className="mt-3 inline-block rounded-[4px] bg-white px-3 py-1 text-[9px] font-semibold">CONFIRMED · BOOKING ID {bookingCode}</span>
        </section>
        <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="space-y-4">
            <Surface className="p-5">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold">Your reservation</h2>
                <span className="rounded-[4px] bg-mint px-2 py-1 text-[9px] font-semibold text-forest">Payment successful</span>
              </div>
              <div className="mt-4 grid gap-4 sm:grid-cols-[150px_1fr_auto]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/assets/figma/e4bd0.png" alt="The Palm House hotel" className="h-[105px] w-full rounded-[4px] object-cover" />
                <div>
                  <h3 className="text-sm font-semibold">The Palm House, Goa</h3>
                  <p className="mt-2 text-[10px] text-muted">Candolim Beach Road, North Goa, Goa 403515, India</p>
                  <p className="mt-2 text-[10px] text-muted">+91 832 245 6789</p>
                  <a href="#location" className="mt-2 inline-block text-[10px] font-medium text-forest">Get directions ↗</a>
                </div>
                <div className="hidden items-center justify-center sm:flex">
                  <QRCodeSVG value={`${typeof window !== "undefined" ? window.location.origin : ""}/booking/confirmation?code=${bookingCode}`} size={88} level="M" />
                </div>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3 border-t border-line pt-4 text-[10px]">
                <div><p className="text-muted">CHECK-IN</p><p className="mt-1 font-semibold">{formatStayDate(checkInDate)}</p><p className="mt-1 text-muted">From 2:00 PM</p></div>
                <div><p className="text-muted">CHECK-OUT</p><p className="mt-1 font-semibold">{formatStayDate(checkOutDate)}</p><p className="mt-1 text-muted">By 11:00 AM</p></div>
              </div>
              <div className="mt-4 flex items-center justify-between gap-4 border-t border-line pt-4">
                <div className="text-[10px]">
                  <p className="font-semibold">{guestName} · 2 adults</p>
                  <p className="mt-1 text-muted">1 Deluxe Room · King bed · 3 nights</p>
                  <p className="mt-1 text-muted">Breakfast included · Free Wi-Fi</p>
                  <p className="mt-2 text-muted">Show this QR at the front desk for a smooth check-in.</p>
                </div>
                <div className="sm:hidden"><QRCodeSVG value={`${typeof window !== "undefined" ? window.location.origin : ""}/booking/confirmation?code=${bookingCode}`} size={72} /></div>
              </div>
            </Surface>
            <Surface className="bg-sky p-5">
              <h2 className="text-sm font-semibold">All the details, delivered</h2>
              <p className="mt-3 flex items-center gap-2 text-[10px]"><FigmaIcon name="mail" className="h-4 w-4" /> Your confirmation and payment receipt have been sent to {guestDetails.email || "your email address"}.</p>
              <div className="mt-4 flex flex-wrap gap-2">
                <a href={`/booking/bill?code=${encodeURIComponent(bookingCode)}`} className="inline-flex min-h-9 items-center gap-2 rounded-[4px] bg-white px-3 text-[10px] font-semibold text-charcoal shadow-sm hover:bg-mist">View & Print Tax Invoice <FigmaIcon name="download" className="h-3.5 w-3.5" /></a>
                <a href={`data:text/calendar;charset=utf-8,${encodeURIComponent(calendarEvent)}`} download="stayease-stay.ics" className="inline-flex min-h-9 items-center gap-2 rounded-[4px] bg-white px-3 text-[10px] font-semibold">Add to calendar <FigmaIcon name="calendar-plus" className="h-3.5 w-3.5" /></a>
              </div>
            </Surface>
            <Surface className="p-5">
              <h2 className="text-sm font-semibold">Before you pack</h2>
              <div className="mt-4 grid gap-4 text-[10px] sm:grid-cols-3">
                <p><FigmaIcon name="credit-card" className="mb-2 h-4 w-4" /><strong className="block">Bring a valid photo ID</strong><span className="mt-1 block text-muted">Required for all adult guests.</span></p>
                <p><FigmaIcon name="calendar" className="mb-2 h-4 w-4" /><strong className="block">Arriving early?</strong><span className="mt-1 block text-muted">Contact the hotel to arrange it.</span></p>
                <p><FigmaIcon name="sun" className="mb-2 h-4 w-4" /><strong className="block">Pack for sunshine</strong><span className="mt-1 block text-muted">Goa in December: 22–31°C.</span></p>
              </div>
            </Surface>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <Button href="/" variant="outline">Back to explore</Button>
              <Button href="/bookings">View my bookings <FigmaIcon name="arrow-right" className="h-4 w-4" /></Button>
            </div>
          </div>
          <div className="lg:sticky lg:top-24 lg:h-fit"><BookingSummary /></div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}

function formatStayDate(value: string) {
  const date = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) return "Select a date";
  return new Intl.DateTimeFormat("en-GB", { weekday: "long", day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }).format(date);
}
