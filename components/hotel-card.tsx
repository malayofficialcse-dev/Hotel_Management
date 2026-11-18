"use client";

import Link from "next/link";
import { FigmaIcon } from "@/components/figma-icon";
import { useBooking } from "@/components/booking-provider";
import type { Hotel } from "@/lib/data";
import { formatPrice } from "@/lib/data";

export function HotelCard({ hotel }: { hotel: Hotel }) {
  const { savedHotelIds, toggleSavedHotel } = useBooking();
  const saved = savedHotelIds.includes(hotel.id);
  const hotelHref = `/hotels/${encodeURIComponent(hotel.id)}`;

  return (
    <article className="hotel-card group overflow-hidden rounded-xl border border-[#e7e9e3] bg-white shadow-[0_6px_24px_rgba(24,43,36,0.045)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_18px_42px_rgba(24,43,36,0.12)]">
      <div className="relative h-[210px] overflow-hidden bg-[#e8ede7] sm:h-[225px]">
        <Link href={hotelHref} aria-label={`View ${hotel.name}`}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={hotel.image || "/assets/figma/a0108.png"}
            alt={`${hotel.name} in ${hotel.city}`}
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.045]"
          />
        </Link>
        <button
          type="button"
          onClick={() => toggleSavedHotel(hotel.id)}
          aria-label={saved ? `Remove ${hotel.name} from wishlist` : `Save ${hotel.name}`}
          aria-pressed={saved}
          className={`absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full border shadow-md backdrop-blur transition hover:scale-105 ${
            saved
              ? "border-[#dcebe2] bg-[#f0f7f3] text-[#176b58] hover:bg-[#e5f2ea]"
              : "border-white/80 bg-white/95 text-[#56645c] hover:border-[#dce8f2] hover:bg-[#f0f6fb]"
          }`}
        >
          <FigmaIcon name="heart" className="h-[17px] w-[17px]" />
        </button>
        <span className="absolute bottom-4 left-4 rounded-full border border-white/60 bg-white/95 px-3 py-1.5 text-[10px] font-semibold text-[#344b3f] shadow-sm">
          {hotel.tag || hotel.category}
        </span>
      </div>
      <div className="p-5">
        <div className="flex items-start justify-between gap-2">
          <Link
            href={hotelHref}
            className="text-base font-semibold tracking-[-0.2px] text-[#263b31] hover:text-[#496b59]"
          >
            {hotel.name}
          </Link>
          <span className="shrink-0 rounded-full bg-[#edf3ee] px-2.5 py-1 text-[10px] font-semibold text-[#385a49]">
            ★ {hotel.rating}
          </span>
        </div>
        <p className="mt-2 flex items-center gap-1.5 text-[11px] text-[#78847c]">
          <FigmaIcon name="map-pin" className="h-3.5 w-3.5 text-[#92784d]" />
          {hotel.location} <span className="text-[#c0c6c0]">·</span> {hotel.reviews} reviews
        </p>
        <div className="mt-4 flex min-h-7 flex-wrap gap-1.5">
          {hotel.features.slice(0, 3).map((feature) => (
            <span key={feature} className="rounded-full bg-[#f3f5f1] px-2.5 py-1 text-[9px] font-medium text-[#68756d]">{feature}</span>
          ))}
          {hotel.features.length > 3 && <span className="rounded-full bg-[#f3f5f1] px-2.5 py-1 text-[9px] font-medium text-[#68756d]">+{hotel.features.length - 3}</span>}
        </div>
        {hotel.offer ? <p className="mt-3 text-[10px] font-semibold text-[#92784d]">{hotel.offer}</p> : <div className="mt-3 h-3" />}
        <div className="mt-4 flex items-center justify-between border-t border-[#edf0eb] pt-4">
          <div>
            <p className="text-lg font-semibold tracking-[-0.3px] text-[#263b31]">{formatPrice(hotel.price)}</p>
            <p className="mt-0.5 text-[9px] text-[#879188]">per night · taxes may apply</p>
          </div>
          <Link
            href={hotelHref}
            className="rounded-lg border border-[#dfe5dd] px-3.5 py-2.5 text-[10px] font-semibold text-[#385a49] transition hover:border-[#496b59] hover:bg-[#f4f7f3]"
          >
            View details
          </Link>
        </div>
      </div>
    </article>
  );
}
