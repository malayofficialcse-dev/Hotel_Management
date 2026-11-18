"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { api, type RoomAvailabilityCalendar as CalendarData } from "@/lib/api-client";

type Props = {
  roomTypeId: string;
  roomCount: number;
  checkIn: string;
  checkOut: string;
  onDatesChange: (checkIn: string, checkOut: string) => void;
  compact?: boolean;
};

function dateKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function addDay(key: string) {
  const [year, month, day] = key.split("-").map(Number);
  return dateKey(new Date(year, month - 1, day + 1));
}

function monthFromKey(key: string) {
  const [year, month] = key.split("-").map(Number);
  return new Date(year, month - 1, 1);
}

export function RoomAvailabilityCalendar({ roomTypeId, roomCount, checkIn, checkOut, onDatesChange, compact = false }: Props) {
  const [month, setMonth] = useState(() => monthFromKey(checkIn || dateKey(new Date())));
  const [calendar, setCalendar] = useState<CalendarData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [anchor, setAnchor] = useState<string | null>(null);
  const [selectionError, setSelectionError] = useState("");
  const [checkingRange, setCheckingRange] = useState(false);
  const [pendingDate, setPendingDate] = useState<string | null>(null);
  const rangeCheckInFlight = useRef(false);

  const year = month.getFullYear();
  const monthIndex = month.getMonth();
  const startDate = dateKey(new Date(year, monthIndex, 1));
  const endDate = dateKey(new Date(year, monthIndex + 1, 0));

  useEffect(() => {
    if (!roomTypeId) {
      setCalendar(null);
      return;
    }
    let active = true;
    const load = async () => {
      setLoading(true);
      try {
        const result = await api.getRoomAvailabilityCalendar(roomTypeId, startDate, endDate);
        if (active) {
          setCalendar(result);
          setError("");
        }
      } catch (cause) {
        if (active) setError(cause instanceof Error ? cause.message : "Could not load the room availability calendar.");
      } finally {
        if (active) setLoading(false);
      }
    };
    void load();
    const timer = window.setInterval(() => void load(), 10_000);
    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, [roomTypeId, startDate, endDate]);

  useEffect(() => {
    setMonth(monthFromKey(checkIn || dateKey(new Date())));
    setAnchor(null);
  }, [roomTypeId]);

  const dayMap = useMemo(() => new Map(calendar?.days.map((day) => [day.date, day]) || []), [calendar]);
  const leadingDays = new Date(year, monthIndex, 1).getDay();
  const numberOfDays = new Date(year, monthIndex + 1, 0).getDate();
  const today = dateKey(new Date());
  const monthLabel = month.toLocaleDateString("en-US", { month: "long", year: "numeric" });

  async function chooseDate(selectedDate: string) {
    if (rangeCheckInFlight.current) return;
    setSelectionError("");
    if (!anchor || selectedDate <= anchor) {
      const day = dayMap.get(selectedDate);
      if (!day || day.availableInventory < roomCount) {
        setSelectionError("That date has no rooms available for the selected room quantity.");
        return;
      }
      setAnchor(selectedDate);
      onDatesChange(selectedDate, addDay(selectedDate));
      return;
    }

    rangeCheckInFlight.current = true;
    setCheckingRange(true);
    setPendingDate(selectedDate);
    try {
      const range = await api.checkRoomAvailability(roomTypeId, anchor, selectedDate, roomCount);
      if (!range.isAvailable) {
        setSelectionError("Those dates no longer have enough rooms available. Choose another date range.");
        return;
      }
    } catch (cause) {
      setSelectionError(cause instanceof Error ? cause.message : "Could not verify that date range.");
      return;
    } finally {
      rangeCheckInFlight.current = false;
      setCheckingRange(false);
      setPendingDate(null);
    }
    onDatesChange(anchor, selectedDate);
    setAnchor(null);
  }

  return (
    <section className={`rounded-[5px] border border-line bg-white ${compact ? "p-3" : "p-4 sm:p-5"}`} aria-label="Room availability calendar">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-charcoal">Availability calendar</h3>
          <p className="mt-1 text-[10px] text-muted">{checkingRange ? "Checking the selected stay…" : loading ? "Refreshing live room availability…" : "Select a check-in date, then a check-out date."}</p>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" aria-label="Previous month" onClick={() => setMonth(new Date(year, monthIndex - 1, 1))} className="flex h-8 w-8 items-center justify-center rounded border border-line text-sm hover:bg-mist">‹</button>
          <span className="min-w-32 text-center text-xs font-semibold">{monthLabel}</span>
          <button type="button" aria-label="Next month" onClick={() => setMonth(new Date(year, monthIndex + 1, 1))} className="flex h-8 w-8 items-center justify-center rounded border border-line text-sm hover:bg-mist">›</button>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-7 gap-1 text-center">
        {(["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const).map((day) => (
          <span key={day} className="py-1 text-[9px] font-semibold uppercase tracking-wide text-muted">{day}</span>
        ))}
        {Array.from({ length: leadingDays }, (_, index) => <span key={`blank-${index}`} aria-hidden="true" />)}
        {Array.from({ length: numberOfDays }, (_, index) => {
          const dayNumber = index + 1;
          const key = dateKey(new Date(year, monthIndex, dayNumber));
          const availability = dayMap.get(key);
          const past = key < today;
          const unavailable = !availability || availability.availableInventory < roomCount;
          const selectingCheckout = Boolean(anchor && key > anchor);
          const soldOut = availability?.status === "FULL";
          const partiallyBooked = availability?.status === "PARTIALLY_BOOKED";
          const lowAvailability = availability?.status === "LIMITED";
          const selected = key === checkIn || key === checkOut || (key > checkIn && key < checkOut);
          const description = !availability
            ? "Availability not loaded"
            : `${availability.availableInventory} of ${calendar?.totalInventory ?? 0} rooms available`;
          return (
            <button
              key={key}
              type="button"
              disabled={past || (!availability && !selectingCheckout) || (unavailable && !selectingCheckout) || checkingRange}
              aria-busy={checkingRange && pendingDate === key}
              onClick={() => chooseDate(key)}
              aria-label={`${new Date(`${key}T00:00:00`).toLocaleDateString()}, ${description}`}
              title={description}
              className={`relative flex min-h-10 flex-col items-center justify-center rounded text-[11px] transition-colors disabled:cursor-not-allowed ${selected
                  ? "bg-forest font-semibold text-white"
                  : soldOut
                    ? "bg-red-100 text-red-500 line-through cursor-not-allowed"
                    : partiallyBooked
                      ? lowAvailability
                        ? "bg-orange-100 text-orange-900 hover:bg-orange-200"
                        : "bg-amber-50 text-amber-900 hover:bg-amber-100"
                      : availability && !past
                        ? "bg-emerald-50 text-emerald-900 hover:bg-emerald-100"
                        : "bg-stone-50 text-stone-400"
                }`}
            >
              {checkingRange && pendingDate === key
                ? <span aria-hidden="true" className="h-3 w-3 animate-spin rounded-full border-2 border-current border-r-transparent" />
                : dayNumber}
              {availability && !past && <span className="text-[8px] leading-3">{soldOut ? "Full" : partiallyBooked ? `${availability.bookedInventory} booked` : selected ? `${availability.availableInventory} left` : "Open"}</span>}
            </button>
          );
        })}
      </div>

      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-[9px] text-muted" aria-label="Availability legend">
        <span className="inline-flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-sm bg-emerald-100" /> Available</span>
        <span className="inline-flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-sm bg-amber-100" /> Partially booked</span>
        <span className="inline-flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-sm bg-orange-100" /> Low availability</span>
        <span className="inline-flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-sm bg-red-100" /> Fully reserved</span>
        {checkIn && checkOut && <span className="ml-auto">Selected: {checkIn} → {checkOut}</span>}
      </div>
      {(error || selectionError) && <p role="alert" className="mt-3 rounded bg-red-50 p-2 text-[10px] text-red-700">{error || selectionError}</p>}
    </section>
  );
}
