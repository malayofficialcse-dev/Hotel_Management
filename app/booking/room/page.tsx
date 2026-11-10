"use client";

import { useState } from "react";
import { BookingStepper } from "@/components/booking-stepper";
import { BookingSummary } from "@/components/booking-summary";
import { FigmaIcon } from "@/components/figma-icon";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { Button, PageHeading, Surface } from "@/components/ui";
import { useBooking } from "@/components/booking-provider";
import { formatPrice, roomTypes } from "@/lib/data";

export default function RoomSelectionPage() {
  const { roomId, setRoomId } = useBooking();
  const [rooms, setRooms] = useState(1);
  return (
    <>
      <SiteHeader />
      <BookingStepper active={0} />
      <main className="mx-auto grid max-w-[1160px] gap-6 px-5 py-8 lg:grid-cols-[minmax(0,1fr)_320px] lg:px-0">
        <div>
          <PageHeading title="Make room for a little escape." description="Choose your comfort at The Palm House, Goa." />
          <Surface className="mt-6 p-5">
            <h2 className="text-sm font-semibold">Your dates &amp; guests</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <label className="text-[10px] font-medium">Check-in<input type="date" defaultValue="2026-12-18" className="mt-2 h-10 w-full rounded-[4px] border border-line px-3 text-xs" /></label>
              <label className="text-[10px] font-medium">Check-out<input type="date" defaultValue="2026-12-21" className="mt-2 h-10 w-full rounded-[4px] border border-line px-3 text-xs" /></label>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <Counter label="Rooms" value={rooms} onChange={setRooms} min={1} max={5} />
              <Counter label="Adults" value={2} onChange={() => undefined} min={1} max={8} />
              <Counter label="Children" value={0} onChange={() => undefined} min={0} max={6} />
            </div>
            <p className="mt-3 text-[9px] text-muted">Children are guests aged 0–12. Maximum occupancy varies by room.</p>
          </Surface>
          <div className="mt-6 flex items-end justify-between">
            <h2 className="text-sm font-semibold">Choose your room</h2>
            <span className="rounded-[4px] bg-sky px-2 py-1 text-[10px]">5 room types available</span>
          </div>
          <div className="mt-3 space-y-3">
            {roomTypes.map((room) => {
              const selected = room.id === roomId;
              return (
                <Surface key={room.id} className={`flex flex-col gap-3 p-3 sm:flex-row sm:items-center ${selected ? "border-forest bg-mint" : ""}`}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={room.image} alt={room.name} className="h-[90px] w-full rounded-[4px] object-cover sm:w-[132px]" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2"><h3 className="text-xs font-semibold">{room.name}</h3>{selected && <span className="rounded-[4px] bg-white px-2 py-1 text-[9px]">Selected</span>}</div>
                    <p className="mt-1 text-[10px] text-muted">{room.beds}</p>
                    <p className="mt-1 text-[10px] text-muted">{room.detail}</p>
                    <p className="mt-1 text-[10px] text-forest">{room.inclusions}</p>
                  </div>
                  <div className="flex items-center justify-between gap-3 sm:flex-col sm:items-end">
                    <div className="text-right"><p className="text-sm font-semibold">{formatPrice(room.price)}</p><p className="text-[9px] text-muted">per night + taxes</p></div>
                    <Button type="button" variant={selected ? "primary" : "outline"} className="min-h-8 px-3" onClick={() => setRoomId(room.id)}>
                      {selected ? "✓ Selected" : "Select room"}
                    </Button>
                  </div>
                </Surface>
              );
            })}
          </div>
          <div className="mt-4 flex items-center justify-between rounded-[4px] bg-mist p-3 text-[10px]">
            <span>{roomTypes.find((room) => room.id === roomId)?.name} · {rooms} room selected</span>
            <span>Quantity&nbsp; <button type="button" onClick={() => setRooms(Math.max(1, rooms - 1))}>−</button>&nbsp; {rooms} &nbsp;<button type="button" onClick={() => setRooms(Math.min(5, rooms + 1))}>+</button></span>
          </div>
          <div className="mt-5 flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
            <p className="text-[10px] text-muted">No payment needed just yet.</p>
            <Button href="/booking/guest">Continue to guest details <FigmaIcon name="arrow-right" className="h-4 w-4" /></Button>
          </div>
        </div>
        <div className="lg:sticky lg:top-24 lg:h-fit"><BookingSummary /></div>
      </main>
      <SiteFooter />
    </>
  );
}

function Counter({
  label,
  value,
  onChange,
  min,
  max,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
}) {
  return (
    <div>
      <p className="mb-2 text-[10px] font-medium">{label}</p>
      <div className="flex h-10 items-center justify-between rounded-[4px] border border-line px-3 text-xs">
        <button type="button" aria-label={`Decrease ${label}`} onClick={() => onChange(Math.max(min, value - 1))}>−</button>
        <span>{value}</span>
        <button type="button" aria-label={`Increase ${label}`} onClick={() => onChange(Math.min(max, value + 1))}>+</button>
      </div>
    </div>
  );
}
