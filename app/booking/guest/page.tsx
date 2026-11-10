"use client";

import { FormEvent } from "react";
import { useRouter } from "next/navigation";
import { BookingStepper } from "@/components/booking-stepper";
import { BookingSummary } from "@/components/booking-summary";
import { FigmaIcon } from "@/components/figma-icon";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { Button, PageHeading, Surface, TextField } from "@/components/ui";

export default function GuestDetailsPage() {
  const router = useRouter();
  function continueToReview(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    router.push("/booking/review");
  }

  return (
    <>
      <SiteHeader />
      <BookingStepper active={1} />
      <main className="mx-auto grid max-w-[1160px] gap-6 px-5 py-8 lg:grid-cols-[minmax(0,1fr)_320px] lg:px-0">
        <form onSubmit={continueToReview}>
          <PageHeading title="Let’s make it your stay." description="A few details, and you’re one step closer to Goa." />
          <div className="mt-6 rounded-[4px] bg-sky p-4 text-[10px]">
            <p className="flex items-center gap-2 font-semibold"><FigmaIcon name="shield" className="h-4 w-4" /> You’re booking as Aarav Mehta</p>
            <p className="mt-1 pl-6 text-muted">We’ve filled in your saved details. You can update them below.</p>
          </div>
          <Surface className="mt-4 p-5">
            <h2 className="text-sm font-semibold">Lead guest details</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <TextField label="First name *" defaultValue="Aarav" required />
              <TextField label="Last name *" defaultValue="Mehta" required />
              <TextField label="Email address *" type="email" defaultValue="aarav.mehta@gmail.com" required />
              <TextField label="Mobile number *" type="tel" defaultValue="+91 98765 43210" required />
            </div>
            <p className="mt-3 text-[10px] text-muted">Your confirmation and stay updates will be sent here.</p>
            <div className="mt-4 flex flex-wrap gap-5 text-[11px]">
              <label className="flex items-center gap-2"><input type="radio" name="guest-type" defaultChecked className="accent-[#486958]" /> I’m the lead guest</label>
              <label className="flex items-center gap-2 text-muted"><input type="radio" name="guest-type" className="accent-[#486958]" /> Booking for someone else</label>
            </div>
          </Surface>
          <Surface className="mt-4 p-5">
            <h2 className="text-sm font-semibold">Address</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <TextField label="Street address *" defaultValue="24, Palm Avenue, Indiranagar" required className="sm:col-span-2" />
              <TextField label="City *" defaultValue="Bengaluru" required />
              <TextField label="Postal code *" defaultValue="560038" required />
              <TextField label="State *" defaultValue="Karnataka" required />
              <TextField label="Country *" defaultValue="India" required />
            </div>
          </Surface>
          <Surface className="mt-4 p-5">
            <h2 className="text-sm font-semibold">Make yourself at home</h2>
            <label className="mt-4 block text-[11px] font-medium">
              Special requests (optional)
              <textarea defaultValue="A quiet room on a higher floor would be lovely, please." rows={3} className="mt-2 w-full resize-y rounded-[4px] border border-line p-3 text-xs font-normal" />
            </label>
            <p className="mt-2 text-[10px] text-muted">We’ll share your requests with the hotel. They’re subject to availability.</p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <label className="text-[10px] font-medium">Estimated arrival<select className="mt-2 h-10 w-full rounded-[4px] border border-line px-3 text-xs font-normal"><option>2:00 PM – 3:00 PM</option><option>3:00 PM – 4:00 PM</option></select></label>
              <label className="text-[10px] font-medium">Room preference<select className="mt-2 h-10 w-full rounded-[4px] border border-line px-3 text-xs font-normal"><option>Non-smoking</option><option>Smoking</option></select></label>
            </div>
          </Surface>
          <label className="mt-4 flex items-center gap-2 text-[10px]"><input type="checkbox" defaultChecked className="accent-[#486958]" /> Save these details for my next getaway</label>
          <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
            <Button href="/booking/room" variant="outline">Back to rooms</Button>
            <Button type="submit">Review my booking <FigmaIcon name="arrow-right" className="h-4 w-4" /></Button>
          </div>
        </form>
        <div className="lg:sticky lg:top-24 lg:h-fit"><BookingSummary /></div>
      </main>
      <SiteFooter />
    </>
  );
}
