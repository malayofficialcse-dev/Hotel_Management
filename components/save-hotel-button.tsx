"use client";

import { FigmaIcon } from "@/components/figma-icon";
import { useBooking } from "@/components/booking-provider";

export function SaveHotelButton({ hotelId }: { hotelId: string }) {
  const { savedHotelIds, toggleSavedHotel } = useBooking();
  const saved = savedHotelIds.includes(hotelId);
  return (
    <button
      type="button"
      onClick={() => toggleSavedHotel(hotelId)}
      aria-pressed={saved}
      aria-label={saved ? "Remove this hotel from wishlist" : "Save this hotel"}
      className="flex h-9 w-9 items-center justify-center rounded-full border border-line bg-white"
    >
      <FigmaIcon name="heart" className={`h-4 w-4 ${saved ? "text-forest" : ""}`} />
    </button>
  );
}
