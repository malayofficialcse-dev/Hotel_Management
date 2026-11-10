"use client";

import Link from "next/link";
import { FigmaIcon } from "@/components/figma-icon";
import { Surface } from "@/components/ui";
import { useBooking } from "@/components/booking-provider";
import { formatPrice, roomTypes } from "@/lib/data";

export function BookingSummary() {
  const { roomId } = useBooking();
  const room = roomTypes.find((item) => item.id === roomId) ?? roomTypes[2];
  const subtotal = room.price * 3;
  const taxes = Math.round(subtotal * 0.12);
  const discount = 2400;
  const total = subtotal + taxes - discount;

  return (
    <aside className="space-y-3">
      <Surface className="p-4">
        <h2 className="text-sm font-semibold text-ink">Your stay, at a glance</h2>
        <div className="mt-4 h-[116px] overflow-hidden rounded-[4px]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/assets/figma/7bc4e.png"
            alt="The Palm House pool"
            className="h-full w-full object-cover"
          />
        </div>
        <h3 className="mt-3 text-sm font-semibold">The Palm House, Goa</h3>
        <p className="mt-1 text-[10px] text-muted">Candolim, North Goa · ★ 4.8 (324 reviews)</p>
        <div className="my-3 space-y-3 border-y border-line py-3 text-[11px]">
          <div className="flex justify-between gap-3"><span className="text-muted">Check-in</span><span>18 Dec 2026, Fri</span></div>
          <div className="flex justify-between gap-3"><span className="text-muted">Check-out</span><span>21 Dec 2026, Mon</span></div>
          <span className="inline-block rounded-[4px] bg-sky px-2 py-1 text-[9px]">3 nights · 2 adults · 1 room</span>
        </div>
        <div className="border-b border-line pb-3">
          <p className="text-[11px] font-semibold">{room.name} · King bed</p>
          <p className="mt-2 text-[10px] text-muted">Breakfast included · 32 m² · Balcony</p>
        </div>
        <div className="space-y-3 py-3 text-[11px]">
          <div className="flex justify-between"><span className="text-muted">{formatPrice(room.price)} × 3 nights</span><span>{formatPrice(subtotal)}</span></div>
          <div className="flex justify-between"><span className="text-muted">Taxes &amp; fees (12%)</span><span>{formatPrice(taxes)}</span></div>
          <div className="flex justify-between text-forest"><span>STAYEASE10</span><span>− {formatPrice(discount)}</span></div>
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
        <p className="mt-1 pl-5 text-muted">Free cancellation before 15 Dec, 2:00 PM.</p>
      </div>
      <Link href="#help" className="flex items-center gap-2 text-[10px] text-ink">
        <FigmaIcon name="support" className="h-3 w-3" /> Need help? Call +91 800 123 4567
      </Link>
    </aside>
  );
}
