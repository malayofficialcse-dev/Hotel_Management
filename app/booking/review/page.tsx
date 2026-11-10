"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { BookingStepper } from "@/components/booking-stepper";
import { BookingSummary } from "@/components/booking-summary";
import { FigmaIcon } from "@/components/figma-icon";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { Button, PageHeading, Surface } from "@/components/ui";

export default function BookingReviewPage() {
  const router = useRouter();
  const [agreed, setAgreed] = useState(true);
  function continueToPayment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    router.push("/booking/payment");
  }

  return (
    <>
      <SiteHeader />
      <BookingStepper active={2} />
      <main className="mx-auto grid max-w-[1160px] gap-6 px-5 py-8 lg:grid-cols-[minmax(0,1fr)_320px] lg:px-0">
        <form onSubmit={continueToPayment}>
          <PageHeading title="One last look before you go." description="Everything for your coastal escape, all in one place." />
          <Surface className="mt-6 p-5">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold">Your stay</h2>
              <Button href="/booking/room" variant="outline" className="min-h-8 border-0 px-2">Edit room &amp; dates</Button>
            </div>
            <h3 className="mt-4 text-lg font-semibold">The Palm House, Goa</h3>
            <p className="mt-2 text-[11px] text-muted">Candolim Beach Road, North Goa, India</p>
            <div className="mt-4 grid gap-3 rounded-[4px] bg-sky p-4 text-[10px] sm:grid-cols-3">
              <div><p className="text-muted">CHECK-IN</p><p className="mt-1 font-semibold">Fri, 18 Dec 2026</p><p className="mt-1 text-muted">From 2:00 PM</p></div>
              <div><p className="text-muted">CHECK-OUT</p><p className="mt-1 font-semibold">Mon, 21 Dec 2026</p><p className="mt-1 text-muted">By 11:00 AM</p></div>
              <div><p className="text-muted">YOUR STAY</p><p className="mt-1 font-semibold">3 nights</p><p className="mt-1 text-muted">2 adults · 1 room</p></div>
            </div>
            <p className="mt-4 text-[11px] font-semibold">Deluxe Room · 1 king bed · 32 m²</p>
            <p className="mt-3 text-[10px] text-muted">Private balcony · Pool view · Breakfast included · Free Wi-Fi</p>
          </Surface>
          <Surface className="mt-4 p-5">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold">Guest information</h2>
              <Button href="/booking/guest" variant="outline" className="min-h-8 border-0 px-2">Edit details</Button>
            </div>
            <div className="mt-4 grid gap-4 text-[11px] sm:grid-cols-2">
              <div><p className="font-semibold">Aarav Mehta</p><p className="mt-2 text-muted">aarav.mehta@gmail.com</p><p className="mt-2 text-muted">+91 98765 43210</p></div>
              <div className="text-muted">24, Palm Avenue, Indiranagar, Bengaluru, Karnataka 560038, India<br /><br />Arrival: 2:00 PM – 3:00 PM</div>
            </div>
            <p className="mt-4 border-t border-line pt-4 text-[10px] text-muted">Special request: A quiet room on a higher floor would be lovely, please.</p>
          </Surface>
          <Surface className="mt-4 flex items-center justify-between gap-3 bg-mint p-5">
            <div>
              <h2 className="text-sm font-semibold">A little extra, on us</h2>
              <p className="mt-3 text-xs font-semibold">STAYEASE10 applied</p>
              <p className="mt-1 text-[10px] text-muted">You saved ₹2,400 on your first StayEase escape.</p>
            </div>
            <span className="text-xs font-semibold text-forest">− ₹2,400</span>
          </Surface>
          <Surface className="mt-4 p-5">
            <h2 className="text-sm font-semibold">Book with peace of mind</h2>
            <p className="mt-3 text-[10px] leading-5 text-muted">Cancel for free before 15 Dec 2026, 2:00 PM (IST). After this time, a charge of ₹8,960 applies. No-shows are charged the full booking amount.</p>
            <label className="mt-4 flex items-start gap-2 text-[10px]">
              <input type="checkbox" checked={agreed} onChange={(event) => setAgreed(event.target.checked)} className="mt-0.5 accent-[#486958]" />
              I agree to the hotel policies, cancellation policy and StayEase terms of use.
            </label>
          </Surface>
          <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
            <Button href="/booking/guest" variant="outline">Back to guest details</Button>
            <Button type="submit" disabled={!agreed}>Continue to payment <FigmaIcon name="arrow-right" className="h-4 w-4" /></Button>
          </div>
        </form>
        <div className="lg:sticky lg:top-24 lg:h-fit"><BookingSummary /></div>
      </main>
      <SiteFooter />
    </>
  );
}
