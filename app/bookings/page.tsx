"use client";

import { useState } from "react";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { Button, PageHeading, Surface } from "@/components/ui";
import { FigmaIcon } from "@/components/figma-icon";
import { formatPrice } from "@/lib/data";

const upcoming = [
  {
    id: "SE-261218-0482",
    name: "The Palm House, Goa",
    location: "Candolim, North Goa",
    image: "/assets/figma/25751.png",
    dates: "18 Dec – 21 Dec 2026 · 3 nights",
    room: "Deluxe Room · 2 adults · 1 room",
    price: 24480,
    cancel: "Free cancellation until 15 Dec, 2:00 PM",
  },
  {
    id: "SE-270115-0629",
    name: "Haveli & Co., Jaipur",
    location: "Civil Lines, Jaipur",
    image: "/assets/figma/7c7f1.png",
    dates: "15 Jan – 17 Jan 2027 · 2 nights",
    room: "Heritage Double · 2 adults · 1 room",
    price: 14560,
    cancel: "Free cancellation until 12 Jan, 2:00 PM",
  },
];

export default function BookingsPage() {
  const [tab, setTab] = useState("Upcoming (2)");
  return (
    <>
      <SiteHeader active="bookings" />
      <main className="mx-auto max-w-[1176px] px-5 py-8 lg:px-0">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <PageHeading eyebrow="YOUR TRAVEL JOURNAL" title="Good trips, all in one place." description="Upcoming escapes, happy memories, and every detail in between." />
          <Button href="/" variant="outline">Find your next stay <FigmaIcon name="arrow-up-right" className="h-4 w-4" /></Button>
        </div>
        <div className="mt-6 flex gap-2 border-b border-line">
          {["Upcoming (2)", "Completed (1)", "Cancelled (1)"].map((item) => (
            <button type="button" onClick={() => setTab(item)} key={item} className={`rounded-t-[4px] px-4 py-3 text-[11px] ${tab === item ? "bg-mint font-semibold text-forest" : "text-muted"}`}>{item}</button>
          ))}
        </div>
        <div className="mt-5 flex items-center gap-3 rounded-[4px] bg-butter p-4 text-[10px]">
          <FigmaIcon name="sun" className="h-5 w-5" />
          <div><p className="font-semibold">Your next chapter: Goa, this December.</p><p className="mt-1 text-muted">The Palm House is getting ready to welcome you. Your booking is confirmed and paid.</p></div>
        </div>
        {tab === "Upcoming (2)" ? (
          <div className="mt-5 space-y-4">
            {upcoming.map((booking) => (
              <Surface key={booking.id} className="p-4 sm:p-5">
                <div className="flex items-center justify-between text-[9px] text-muted"><span>BOOKING ID · {booking.id}</span><span className="rounded-[4px] bg-mint px-2 py-1 font-semibold text-forest">Confirmed</span></div>
                <div className="mt-4 grid gap-4 sm:grid-cols-[140px_1fr_150px]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={booking.image} alt={booking.name} className="h-[105px] w-full rounded-[4px] object-cover" />
                  <div>
                    <h2 className="text-sm font-semibold">{booking.name}</h2>
                    <p className="mt-1 text-[10px] text-muted">{booking.location}</p>
                    <p className="mt-2 text-[11px] font-semibold">{booking.dates}</p>
                    <p className="mt-2 text-[10px] text-muted">{booking.room}</p>
                    <p className="mt-2 text-[10px] text-forest">{booking.cancel}</p>
                  </div>
                  <div className="flex flex-row items-center justify-between gap-3 sm:flex-col sm:items-end">
                    <div className="text-right"><p className="text-lg font-semibold">{formatPrice(booking.price)}</p><p className="text-[9px] text-muted">Total paid · incl. taxes</p></div>
                    <Button href="/booking/confirmation">View booking</Button>
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap gap-5 border-t border-line pt-3 text-[10px] text-forest">
                  <a href="#invoice">↓ Download invoice</a><a href="#contact">Contact property</a><a href="/booking/confirmation" className="ml-auto">Manage booking</a>
                </div>
              </Surface>
            ))}
          </div>
        ) : (
          <Surface className="mt-5 p-8 text-center">
            <h2 className="text-sm font-semibold">{tab.startsWith("Completed") ? "The Green Canopy" : "Lakehouse Retreat"}</h2>
            <p className="mt-2 text-xs text-muted">{tab.startsWith("Completed") ? "12 – 14 Sep 2026 · 2 nights" : "05 – 07 Oct 2026 · 2 nights"}</p>
            <Button className="mt-4" variant="outline">{tab.startsWith("Completed") ? "Write a review" : "View refund details"}</Button>
          </Surface>
        )}
        <h2 className="mt-7 text-base font-semibold">A little travel history</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <HistoryCard image="/assets/figma/fb51e.png" state="Completed" title="The Green Canopy" dates="12 – 14 Sep 2026 · 2 nights" details="A forest escape to remember." button="Write a review" />
          <HistoryCard image="/assets/figma/a3d66.png" state="Cancelled" title="Lakehouse Retreat" dates="05 – 07 Oct 2026 · 2 nights" details="Full refund processed on 29 Sep." button="View refund details" />
        </div>
        <p className="mt-6 text-center text-[10px] text-muted"><FigmaIcon name="support" className="mr-2 h-3 w-3" /> A question about your stay? Our team is here, 24/7. <a href="#help" className="font-semibold text-forest">Visit help centre →</a></p>
      </main>
      <SiteFooter />
    </>
  );
}

function HistoryCard({ image, state, title, dates, details, button }: { image: string; state: string; title: string; dates: string; details: string; button: string }) {
  return (
    <Surface className="p-4">
      <div className="flex gap-3">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={image} alt={title} className="h-[84px] w-[100px] rounded-[4px] object-cover" />
        <div>
          <span className="rounded-[4px] bg-sky px-2 py-1 text-[9px]">{state}</span>
          <h3 className="mt-2 text-xs font-semibold">{title}</h3>
          <p className="mt-1 text-[10px] text-muted">{dates}</p>
          <p className="mt-2 text-[10px]">{details}</p>
        </div>
      </div>
      <Button variant="outline" className="mt-4 w-full">{button}</Button>
    </Surface>
  );
}
