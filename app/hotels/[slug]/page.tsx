"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { BookingSummary } from "@/components/booking-summary";
import { FigmaIcon } from "@/components/figma-icon";
import { SaveHotelButton } from "@/components/save-hotel-button";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { Button, PageHeading, Surface } from "@/components/ui";
import { useBooking } from "@/components/booking-provider";
import { api, type PublicRoom } from "@/lib/api-client";
import type { Hotel } from "@/lib/data";
import { formatPrice } from "@/lib/data";
import { HotelDetailSkeleton } from "@/components/skeletons/hotel-detail-skeleton";
import { HotelDetailsExperience } from "@/components/hotel-details-experience";
import { HotelDiscoveryMap } from "@/components/hotel-discovery-map";

const fallbackImage = "/assets/figma/a0108.png";

export default function HotelDetailsPage() {
  const { slug } = useParams<{ slug: string }>();
  const router = useRouter();
  const { setBookingDetails, setSelectedRoom } = useBooking();
  const [hotel, setHotel] = useState<Hotel | null>(null);
  const [rooms, setRooms] = useState<PublicRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [openingRooms, setOpeningRooms] = useState(false);
  const [openingRoomId, setOpeningRoomId] = useState<string | null>(null);
  const navigationInFlight = useRef(false);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");
    Promise.all([api.getHotel(slug), api.getRoomsByHotel(slug)])
      .then(([hotelResult, roomResults]) => {
        if (!active) return;
        setHotel(hotelResult);
        setRooms(roomResults);
      })
      .catch((cause: unknown) => {
        if (active) setError(cause instanceof Error ? cause.message : "Could not load this property's details.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, [slug]);

  const gallery = useMemo(() => {
    if (!hotel) return [fallbackImage];
    const images = [...new Set([hotel.image, ...(hotel.galleryImages || [])].filter(Boolean))];
    return images.length ? images : [fallbackImage];
  }, [hotel]);

  function chooseRoom(room?: PublicRoom) {
    if (!hotel || navigationInFlight.current) return;
    navigationInFlight.current = true;
    setOpeningRooms(true);
    setOpeningRoomId(room?.id || null);
    setBookingDetails({ hotelId: hotel.id });
    if (room) setSelectedRoom(room);
    router.push("/booking/room");
  }

  return (
    <>
      <SiteHeader />
      <main className="mx-auto w-full max-w-[1760px] px-4 py-7 sm:px-6 lg:px-10 lg:py-9 2xl:px-14">
        {loading && <HotelDetailSkeleton />}
        {!loading && error && <p role="alert" className="rounded-[4px] bg-blush p-5 text-sm text-red-800">{error}</p>}
        {!loading && !error && hotel && (
          <>
            <p className="mb-4 text-[11px] text-muted">
              <Link href="/" className="hover:text-forest">Explore</Link> / {hotel.city} / {hotel.name}
            </p>
            <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
              <div>
                <span className="rounded-[4px] bg-mint px-2 py-1 text-[9px] font-semibold">{hotel.category.toUpperCase()}</span>
                <h1 className="mt-3 text-[28px] font-semibold tracking-[-0.7px] sm:text-[34px]">{hotel.name}, {hotel.city}</h1>
                <p className="mt-1 text-xs text-muted">{hotel.location}</p>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline"><FigmaIcon name="share" className="h-4 w-4" /> Share</Button>
                <SaveHotelButton hotelId={hotel.id} />
              </div>
            </div>

            <HotelDetailsExperience hotel={hotel} gallery={gallery} showGallery />

            <nav className="mt-5 flex gap-6 overflow-x-auto border-b border-line text-[11px]">
              {["Overview", "Rooms", "Amenities", "Reviews", "Location", "Policies"].map((item) => (
                <a key={item} href={`#${item.toLowerCase()}`} className="whitespace-nowrap border-b-2 border-transparent pb-3 text-muted hover:border-forest hover:text-forest">{item}</a>
              ))}
            </nav>

            <div className="mt-8 grid gap-7 xl:grid-cols-[minmax(0,1fr)_340px]">
              <div className="space-y-8">
                <section id="overview" className="grid gap-5 md:grid-cols-[1fr_230px]">
                  <div>
                    <h2 className="text-xl font-semibold">Discover {hotel.name}</h2>
                    <p className="mt-3 max-w-[750px] whitespace-pre-line text-xs leading-5 text-muted">
                      {hotel.description || `${hotel.name} is located in ${hotel.location}, ${hotel.city}.`}
                    </p>
                    <h3 className="mt-5 text-sm font-semibold">Property amenities</h3>
                    <div className="mt-3 flex flex-wrap gap-2 text-[10px]">
                      {hotel.features.map((feature) => <span key={feature} className="rounded-[4px] bg-mist px-3 py-2">{feature}</span>)}
                      {!hotel.features.length && <span className="text-muted">Amenities will be listed soon.</span>}
                    </div>
                  </div>
                  <Surface className="h-fit bg-mint p-4">
                    <div className="flex items-center justify-between">
                      <span className="text-2xl font-semibold">{hotel.rating}</span>
                      <span className="text-right text-[10px]">Guest rating<br /><span className="text-muted">{hotel.reviews} reviews</span></span>
                    </div>
                    <p className="mt-2 text-xs tracking-[2px] text-forest">★★★★★</p>
                    <p className="mt-3 border-t border-[#cfe4d8] pt-3 text-[10px] text-muted">Rooms from</p>
                    <p className="mt-1 text-lg font-semibold">{formatPrice(hotel.price)} <span className="text-[10px] font-normal text-muted">/ night</span></p>
                    <Button type="button" onClick={() => chooseRoom()} loading={openingRooms && openingRoomId === null} disabled={openingRooms} className="mt-3 w-full">
                      {openingRooms && openingRoomId === null ? "Opening rooms…" : "Choose a room"}
                    </Button>
                  </Surface>
                </section>

                <section id="rooms">
                  <PageHeading title="Rooms at this property" description={`Choose from room types currently listed for ${hotel.name}.`} />
                  <div className="mt-4 space-y-3">
                    {rooms.map((room) => (
                      <Surface key={room.id} className="flex flex-col gap-3 p-3 sm:flex-row sm:items-center">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={room.image || fallbackImage} alt={room.name} className="h-[96px] w-full rounded-[4px] object-cover sm:w-[140px]" />
                        <div className="flex-1">
                          <h3 className="text-xs font-semibold">{room.name}</h3>
                          <p className="mt-1 text-[10px] text-muted">{room.beds}</p>
                          <p className="mt-1 text-[10px] text-muted">{room.detail}</p>
                          <p className="mt-1 text-[10px] text-forest">{room.inclusions}</p>
                        </div>
                        <div className="flex items-center justify-between gap-4 sm:flex-col sm:items-end">
                          <div className="text-right">
                            <p className="text-sm font-semibold">{formatPrice(room.price)}</p>
                            <p className="text-[9px] text-muted">per night + taxes</p>
                          </div>
                          <Button type="button" variant="outline" className="min-h-8 px-3" onClick={() => chooseRoom(room)} loading={openingRoomId === room.id} disabled={openingRooms}>
                            {openingRoomId === room.id ? "Opening…" : "Select room"}
                          </Button>
                        </div>
                      </Surface>
                    ))}
                    {!rooms.length && <p className="rounded-[4px] bg-mist p-4 text-xs text-muted">No room types are currently listed for this property.</p>}
                  </div>
                </section>

                <section id="facilities" className="grid gap-4 md:grid-cols-2">
                  <Surface className="bg-butter p-4">
                    <h2 className="text-sm font-semibold">A stay at {hotel.name}</h2>
                    <p className="mt-3 text-lg font-semibold">{hotel.rating} / 5 <span className="text-xs font-normal text-muted"> · {hotel.reviews} reviews</span></p>
                    <p className="mt-3 text-xs leading-5 text-muted">{hotel.offer || "Contact the property for current offers."}</p>
                  </Surface>
                  <Surface className="bg-sky p-4">
                    <h2 className="text-sm font-semibold">Book with confidence</h2>
                    <p className="mt-3 text-xs leading-5 text-muted">Clear stay rules, verified-stay reviews and location details are available below.</p>
                  </Surface>
                </section>
                <section id="location">
                  <HotelDiscoveryMap hotels={[hotel]} />
                </section>
                <HotelDetailsExperience hotel={hotel} gallery={gallery} />
              </div>
              <div className="xl:sticky xl:top-24 xl:h-fit"><BookingSummary /></div>
            </div>
          </>
        )}
      </main>
      <SiteFooter />
    </>
  );
}
