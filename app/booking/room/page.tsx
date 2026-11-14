"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { BookingStepper } from "@/components/booking-stepper";
import { BookingSummary } from "@/components/booking-summary";
import { FigmaIcon } from "@/components/figma-icon";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { Button, PageHeading, Surface } from "@/components/ui";
import { useBooking } from "@/components/booking-provider";
import { api, type PublicRoom } from "@/lib/api-client";
import { formatPrice } from "@/lib/data";

export default function RoomSelectionPage() {
  const router = useRouter();
  const {
    roomId, hotelId, checkInDate, checkOutDate, guestsCount, roomCount,
    selectedRoom, setSelectedRoom, setBookingDetails,
  } = useBooking();
  const [rooms, setRooms] = useState<PublicRoom[]>([]);
  const [availability, setAvailability] = useState<Record<string, { isAvailable: boolean; availableInventory: number }>>({});
  const [loadingRooms, setLoadingRooms] = useState(true);
  const [loadingAvailability, setLoadingAvailability] = useState(false);
  const [error, setError] = useState("");
  const [childrenCount, setChildrenCount] = useState(0);

  useEffect(() => {
    let active = true;
    setLoadingRooms(true);
    setError("");
    api.getRoomsByHotel(hotelId)
      .then((result) => {
        if (!active) return;
        setRooms(result);
      })
      .catch((cause: unknown) => {
        if (active) setError(cause instanceof Error ? cause.message : "Could not load rooms for this hotel.");
      })
      .finally(() => {
        if (active) setLoadingRooms(false);
      });
    return () => { active = false; };
  }, [hotelId]);

  useEffect(() => {
    const selected = rooms.find((room) => room.id === roomId) || rooms[0];
    if (selected && selectedRoom?.id !== selected.id) setSelectedRoom(selected);
  }, [rooms, roomId, selectedRoom?.id, setSelectedRoom]);

  useEffect(() => {
    let active = true;
    setAvailability({});
    setLoadingAvailability(false);
    if (!rooms.length) return () => { active = false; };
    if (!checkInDate || !checkOutDate || checkOutDate <= checkInDate) {
      setError("Choose a valid check-in and check-out date to check availability.");
      return () => { active = false; };
    }

    setError("");
    setLoadingAvailability(true);
    Promise.all(rooms.map(async (room) => [
      room.id,
      await api.checkRoomAvailability(room.id, checkInDate, checkOutDate, roomCount),
    ] as const))
      .then((results) => {
        if (active) setAvailability(Object.fromEntries(results));
      })
      .catch((cause: unknown) => {
        if (active) setError(cause instanceof Error ? cause.message : "Could not check room availability.");
      })
      .finally(() => {
        if (active) setLoadingAvailability(false);
      });
    return () => { active = false; };
  }, [rooms, checkInDate, checkOutDate, roomCount]);

  const canContinue = Boolean(
    selectedRoom && availability[selectedRoom.id]?.isAvailable && !loadingAvailability,
  );

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
              <label className="text-[10px] font-medium">Check-in<input type="date" value={checkInDate} onChange={(event) => setBookingDetails({ checkInDate: event.target.value })} className="mt-2 h-10 w-full rounded-[4px] border border-line px-3 text-xs" /></label>
              <label className="text-[10px] font-medium">Check-out<input type="date" value={checkOutDate} onChange={(event) => setBookingDetails({ checkOutDate: event.target.value })} className="mt-2 h-10 w-full rounded-[4px] border border-line px-3 text-xs" /></label>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <Counter label="Rooms" value={roomCount} onChange={(value) => setBookingDetails({ roomCount: value })} min={1} max={5} />
              <Counter label="Adults" value={Math.max(1, guestsCount - childrenCount)} onChange={(value) => setBookingDetails({ guestsCount: value + childrenCount })} min={1} max={8} />
              <Counter label="Children" value={childrenCount} onChange={(value) => { setChildrenCount(value); setBookingDetails({ guestsCount: Math.max(1, guestsCount + value - childrenCount) }); }} min={0} max={6} />
            </div>
            <p className="mt-3 text-[9px] text-muted">Children are guests aged 0–12. Maximum occupancy varies by room.</p>
          </Surface>
          <div className="mt-6 flex items-end justify-between">
            <h2 className="text-sm font-semibold">Choose your room</h2>
            <span className="rounded-[4px] bg-sky px-2 py-1 text-[10px]">{rooms.length} room types</span>
          </div>
          <div className="mt-3 space-y-3">
            {rooms.map((room) => {
              const selected = room.id === roomId;
              const roomAvailability = availability[room.id];
              return (
                <Surface key={room.id} className={`flex flex-col gap-3 p-3 sm:flex-row sm:items-center ${selected ? "border-forest bg-mint" : ""}`}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={room.image || "/assets/figma/a0108.png"} alt={room.name} className="h-[90px] w-full rounded-[4px] object-cover sm:w-[132px]" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2"><h3 className="text-xs font-semibold">{room.name}</h3>{selected && <span className="rounded-[4px] bg-white px-2 py-1 text-[9px]">Selected</span>}</div>
                    <p className="mt-1 text-[10px] text-muted">{room.beds}</p>
                    <p className="mt-1 text-[10px] text-muted">{room.detail}</p>
                    <p className="mt-1 text-[10px] text-forest">{room.inclusions}</p>
                    <p className="mt-1 text-[10px] text-muted">
                      {loadingAvailability ? "Checking availability…" : roomAvailability ? `${roomAvailability.availableInventory} available` : "Availability not checked"}
                    </p>
                  </div>
                  <div className="flex items-center justify-between gap-3 sm:flex-col sm:items-end">
                    <div className="text-right"><p className="text-sm font-semibold">{formatPrice(room.price)}</p><p className="text-[9px] text-muted">per night + taxes</p></div>
                    <Button type="button" variant={selected ? "primary" : "outline"} className="min-h-8 px-3" onClick={() => setSelectedRoom(room)} disabled={loadingAvailability || !roomAvailability?.isAvailable}>
                      {selected ? "✓ Selected" : "Select room"}
                    </Button>
                  </div>
                </Surface>
              );
            })}
            {loadingRooms && <p className="rounded-[4px] bg-mist p-4 text-xs text-muted">Loading available rooms…</p>}
            {!loadingRooms && !rooms.length && !error && <p className="rounded-[4px] bg-mist p-4 text-xs text-muted">No rooms are currently listed for this hotel.</p>}
          </div>
          <div className="mt-4 flex items-center justify-between rounded-[4px] bg-mist p-3 text-[10px]">
            <span>{selectedRoom?.name || "Select a room"} · {roomCount} {roomCount === 1 ? "room" : "rooms"}</span>
            <span>Quantity&nbsp; <button type="button" onClick={() => setBookingDetails({ roomCount: Math.max(1, roomCount - 1) })}>−</button>&nbsp; {roomCount} &nbsp;<button type="button" onClick={() => setBookingDetails({ roomCount: Math.min(5, roomCount + 1) })}>+</button></span>
          </div>
          {error && <p role="alert" className="mt-3 rounded-[4px] bg-blush p-3 text-[10px] text-red-800">{error}</p>}
          <div className="mt-5 flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
            <p className="text-[10px] text-muted">No payment needed just yet.</p>
            <Button
              disabled={!canContinue}
              onClick={() => {
                if (!canContinue) return;
                const token = api.getToken();
                if (!token) {
                  router.push(`/auth/login?returnUrl=${encodeURIComponent("/booking/guest")}`);
                } else {
                  router.push("/booking/guest");
                }
              }}
            >
              Continue to guest details <FigmaIcon name="arrow-right" className="h-4 w-4" />
            </Button>
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
