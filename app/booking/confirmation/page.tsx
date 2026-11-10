import Link from "next/link";
import { QRCodeSVG } from "qrcode.react";
import { BookingStepper } from "@/components/booking-stepper";
import { BookingSummary } from "@/components/booking-summary";
import { FigmaIcon } from "@/components/figma-icon";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { Button, Surface } from "@/components/ui";

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
  return (
    <>
      <SiteHeader />
      <BookingStepper active={4} />
      <main className="mx-auto max-w-[1160px] px-5 py-7 lg:px-0">
        <section className="rounded-[4px] bg-mint px-5 py-8 text-center sm:py-10">
          <span className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-white"><FigmaIcon name="check" className="h-5 w-5" /></span>
          <h1 className="mt-4 text-[24px] font-semibold tracking-[-0.5px]">You’re going to Goa, Aarav!</h1>
          <p className="mt-2 text-xs text-muted">Your stay is confirmed. Let the countdown to slow mornings begin.</p>
          <span className="mt-3 inline-block rounded-[4px] bg-white px-3 py-1 text-[9px] font-semibold">CONFIRMED · BOOKING ID SE-261218-0482</span>
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
                  <QRCodeSVG value="https://stayease.example/booking/SE-261218-0482" size={88} level="M" />
                </div>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3 border-t border-line pt-4 text-[10px]">
                <div><p className="text-muted">CHECK-IN</p><p className="mt-1 font-semibold">18 Dec 2026, Friday</p><p className="mt-1 text-muted">From 2:00 PM</p></div>
                <div><p className="text-muted">CHECK-OUT</p><p className="mt-1 font-semibold">21 Dec 2026, Monday</p><p className="mt-1 text-muted">By 11:00 AM</p></div>
              </div>
              <div className="mt-4 flex items-center justify-between gap-4 border-t border-line pt-4">
                <div className="text-[10px]">
                  <p className="font-semibold">Aarav Mehta · 2 adults</p>
                  <p className="mt-1 text-muted">1 Deluxe Room · King bed · 3 nights</p>
                  <p className="mt-1 text-muted">Breakfast included · Free Wi-Fi</p>
                  <p className="mt-2 text-muted">Show this QR at the front desk for a smooth check-in.</p>
                </div>
                <div className="sm:hidden"><QRCodeSVG value="https://stayease.example/booking/SE-261218-0482" size={72} /></div>
              </div>
            </Surface>
            <Surface className="bg-sky p-5">
              <h2 className="text-sm font-semibold">All the details, delivered</h2>
              <p className="mt-3 flex items-center gap-2 text-[10px]"><FigmaIcon name="mail" className="h-4 w-4" /> Your confirmation and payment receipt have been sent to aarav.mehta@gmail.com.</p>
              <div className="mt-4 flex flex-wrap gap-2">
                <a href="#invoice" download="stayease-invoice.txt" className="inline-flex min-h-9 items-center gap-2 rounded-[4px] bg-white px-3 text-[10px] font-semibold">Download invoice <FigmaIcon name="download" className="h-3.5 w-3.5" /></a>
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
