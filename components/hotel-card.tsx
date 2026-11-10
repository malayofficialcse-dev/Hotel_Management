"use client";

import Link from "next/link";
import { FigmaIcon } from "@/components/figma-icon";
import { useBooking } from "@/components/booking-provider";
import type { Hotel } from "@/lib/data";
import { formatPrice } from "@/lib/data";

export function HotelCard({ hotel }: { hotel: Hotel }) {
  const { savedHotelIds, toggleSavedHotel } = useBooking();
  const saved = savedHotelIds.includes(hotel.id);

  return (
    <article className="overflow-hidden rounded-[4px] border border-line bg-white">
      <div className="relative h-[190px] overflow-hidden">
        <Link href="/hotels/the-palm-house" aria-label={`View ${hotel.name}`}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={hotel.image}
            alt={`${hotel.name} in ${hotel.city}`}
            className="h-full w-full object-cover transition-transform duration-300 hover:scale-[1.03]"
          />
        </Link>
        <button
          type="button"
          onClick={() => toggleSavedHotel(hotel.id)}
          aria-label={saved ? `Remove ${hotel.name} from wishlist` : `Save ${hotel.name}`}
          aria-pressed={saved}
          className={`absolute right-3 top-3 flex h-[32px] w-[32px] items-center justify-center rounded-full bg-white shadow-soft ${
            saved ? "text-forest" : "text-ink"
          }`}
        >
          <FigmaIcon name="heart" className="h-[17px] w-[17px]" />
        </button>
        <span className="absolute bottom-3 left-3 rounded-[4px] bg-white/95 px-2 py-1 text-[10px] font-medium text-ink">
          {hotel.tag}
        </span>
      </div>
      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <Link
            href="/hotels/the-palm-house"
            className="text-sm font-semibold text-ink hover:text-forest"
          >
            {hotel.name}
          </Link>
          <span className="shrink-0 rounded-[4px] bg-mint px-2 py-1 text-[10px] font-semibold text-forest">
            ★ {hotel.rating}
          </span>
        </div>
        <p className="mt-2 text-[11px] text-muted">{hotel.location} · {hotel.reviews} reviews</p>
        <p className="mt-3 text-[10px] text-muted">{hotel.features.join("  ·  ")}</p>
        <p className="mt-2 text-[10px] font-medium text-forest">{hotel.offer}</p>
        <div className="mt-3 flex items-center justify-between border-t border-line pt-3">
          <div>
            <p className="text-base font-semibold text-ink">{formatPrice(hotel.price)}</p>
            <p className="text-[9px] text-muted">per night + taxes</p>
          </div>
          <Link
            href="/hotels/the-palm-house"
            className="rounded-[4px] border border-line px-3 py-2 text-[11px] font-medium text-ink hover:border-forest hover:text-forest"
          >
            View details
          </Link>
        </div>
      </div>
    </article>
  );
}
