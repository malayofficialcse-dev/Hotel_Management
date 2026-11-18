"use client";

import Link from "next/link";
import { FigmaIcon } from "@/components/figma-icon";
import { Surface } from "@/components/ui";
import { useBooking } from "@/components/booking-provider";
import { formatPrice, roomTypes } from "@/lib/data";
import type { AdminBooking, UserBooking } from "@/lib/api-client";

export function BookingSummary({ booking }: { booking?: AdminBooking | UserBooking | null }) {
  const { roomId, selectedRoom, checkInDate: ctxCheckIn, checkOutDate: ctxCheckOut, guestsCount: ctxGuests, roomCount: ctxRooms } = useBooking();
  const room = selectedRoom ?? roomTypes.find((item) => item.id === roomId) ?? roomTypes[2];

  const hotelName = booking?.hotel_name || "The Palm House, Goa";
  const roomName = booking?.room_type_name || room.name;
  const checkInDate = booking?.check_in_date ? String(booking.check_in_date).split("T")[0] : ctxCheckIn;
  const checkOutDate = booking?.check_out_date ? String(booking.check_out_date).split("T")[0] : ctxCheckOut;
  const guestsCount = booking?.guests_count || ctxGuests;
  const roomCount = booking?.room_count || ctxRooms;
  const totalAmount = booking?.total_price;

  const stayNights = booking?.total_nights || Math.max(
    1,
    (Date.parse(`${checkOutDate}T00:00:00Z`) - Date.parse(`${checkInDate}T00:00:00Z`)) / 86_400_000,
  );
  const subtotal = room.price * stayNights * roomCount;
  const taxes = Math.round(subtotal * 0.12);
  const total = totalAmount ?? (subtotal + taxes);

  return (
    <aside className="space-y-3">
      <Surface className="p-4">
        <h2 className="text-sm font-semibold text-ink">Your stay, at a glance</h2>
        <div className="mt-4 h-[116px] overflow-hidden rounded-[4px]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={selectedRoom?.image || "/assets/figma/7bc4e.png"}
            alt={selectedRoom?.name || hotelName}
            className="h-full w-full object-cover"
          />
        </div>
        <h3 className="mt-3 text-sm font-semibold">{hotelName}</h3>
        <p className="mt-1 text-[10px] text-muted">Luxury Stay · ★ 4.8 (Verified StayEase Partner)</p>
        <div className="my-3 space-y-3 border-y border-line py-3 text-[11px]">
          <div className="flex justify-between gap-3"><span className="text-muted">Check-in</span><span>{formatStayDate(checkInDate)}</span></div>
          <div className="flex justify-between gap-3"><span className="text-muted">Check-out</span><span>{formatStayDate(checkOutDate)}</span></div>
          <span className="inline-block rounded-[4px] bg-sky px-2 py-1 text-[9px]">{stayNights} {stayNights === 1 ? "night" : "nights"} · {guestsCount} guests · {roomCount} {roomCount === 1 ? "room" : "rooms"}</span>
        </div>
        <div className="border-b border-line pb-3">
          <p className="text-[11px] font-semibold">{roomName}</p>
          <p className="mt-2 text-[10px] text-muted">Breakfast included · Free Wi-Fi</p>
        </div>
        <div className="space-y-3 py-3 text-[11px]">
          <div className="flex justify-between"><span className="text-muted">Stay duration</span><span>{stayNights} nights × {roomCount} rooms</span></div>
          <div className="flex justify-between"><span className="text-muted">Taxes &amp; fees (included)</span><span>12% GST</span></div>
        </div>
        <div className="flex items-center justify-between border-t border-line pt-3">
          <span className="text-[11px] text-muted">Total amount</span>
          <span className="text-lg font-semibold">{formatPrice(total)}</span>
        </div>
        <p className="mt-2 text-[9px] text-muted">Includes all taxes. No hidden charges.</p>
      </Surface>
      <div className="rounded-[4px] bg-mint p-3 text-[10px]">
        <p className="flex items-center gap-2 font-semibold text-ink">
          <FigmaIcon name="shield" className="h-3 w-3" /> Plans change. We understand.
        </p>
        <p className="mt-1 pl-5 text-muted">Cancellation terms depend on the selected room.</p>
      </div>
      <Link href="#help" className="flex items-center gap-2 text-[10px] text-ink">
        <FigmaIcon name="support" className="h-3 w-3" /> Need help? Call +91 800 123 4567
      </Link>
    </aside>
  );
}

function formatStayDate(value: string) {
  const date = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) return "Select a date";
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    weekday: "short",
    timeZone: "UTC",
  }).format(date);
}
