"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { FigmaIcon } from "@/components/figma-icon";
import { HotelCard } from "@/components/hotel-card";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui";
import { hotels, type Hotel } from "@/lib/data";
import { api, type PublicRoom } from "@/lib/api-client";
import { TotalPageSkeleton, HotelGridSkeleton } from "@/components/skeletons/home-page-skeleton";

const benefits = [
  { icon: "shield" as const, title: "Handpicked, not endless", subtitle: "Stays worth travelling for" },
  { icon: "wallet" as const, title: "Good stays. Better prices.", subtitle: "Member perks & honest pricing" },
  { icon: "support" as const, title: "Here, whenever you need", subtitle: "Real people. Round-the-clock care." },
];

function dateInputValue(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function addDaysToDateInput(value: string, days: number) {
  const date = new Date(`${value}T00:00:00`);
  date.setDate(date.getDate() + days);
  return dateInputValue(date);
}

function amenityKey(value: string) {
  const normalized = value.toLowerCase().replace(/&/g, " and ").replace(/[^a-z0-9]+/g, " ").trim().replace(/\s+/g, " ");
  const aliases: Record<string, string> = {
    pool: "swimming pool",
    "swimming pool": "swimming pool",
    wifi: "free wi fi",
    "wi fi": "free wi fi",
    "free wifi": "free wi fi",
    "free wi fi": "free wi fi",
    breakfast: "breakfast included",
    "complimentary breakfast": "breakfast included",
    "breakfast included": "breakfast included",
    spa: "spa wellness",
    "spa and wellness": "spa wellness",
    "spa wellness": "spa wellness",
    parking: "free parking",
    "free parking": "free parking",
  };
  return aliases[normalized] || normalized;
}

function amenityLabel(key: string) {
  const labels: Record<string, string> = {
    "swimming pool": "Swimming pool",
    "free wi fi": "Free Wi-Fi",
    "breakfast included": "Breakfast included",
    "spa wellness": "Spa & wellness",
    "free parking": "Free parking",
  };
  return labels[key] || key.replace(/\b\w/g, (letter) => letter.toUpperCase());
}

type HeroCarouselSlide = {
  image: string;
  title: string;
  subtitle: string;
  kind: "Hotel" | "Room";
};

function createHotelSlides(properties: Hotel[], includeGalleryImages = true): HeroCarouselSlide[] {
  return properties.flatMap((hotel) =>
    [...new Set([hotel.image, ...(includeGalleryImages ? hotel.galleryImages || [] : [])].filter(Boolean))]
      .map((image) => ({
        image,
        title: hotel.name,
        subtitle: `${hotel.location || hotel.city} · ${hotel.category}`,
        kind: "Hotel" as const,
      })),
  );
}

export default function HomePage() {
  const [query, setQuery] = useState("");
  const [searched, setSearched] = useState("");
  const [checkInDate, setCheckInDate] = useState("");
  const [checkOutDate, setCheckOutDate] = useState("");
  const [minimumDate, setMinimumDate] = useState("");
  const [searchedDates, setSearchedDates] = useState<{ checkIn: string; checkOut: string } | null>(null);
  const [guestCount, setGuestCount] = useState(2);
  const [roomCount, setRoomCount] = useState(1);
  const [sort, setSort] = useState("Recommended");
  const [minimumPrice, setMinimumPrice] = useState<number | null>(null);
  const [maximumPrice, setMaximumPrice] = useState<number | null>(null);
  const [rating, setRating] = useState("");
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [availabilityByHotel, setAvailabilityByHotel] = useState<Record<string, boolean> | null>(null);
  const [availabilityLoading, setAvailabilityLoading] = useState(false);
  const [availabilityError, setAvailabilityError] = useState("");
  const [searchError, setSearchError] = useState("");
  const [catalog, setCatalog] = useState(hotels);
  const [catalogError, setCatalogError] = useState("");
  const [heroSlides, setHeroSlides] = useState<HeroCarouselSlide[]>(() => createHotelSlides(hotels));
  const [activeHeroSlide, setActiveHeroSlide] = useState(0);
  const [carouselPaused, setCarouselPaused] = useState(false);
  const [carouselNotice, setCarouselNotice] = useState("");
  const [isPageLoading, setIsPageLoading] = useState(true);
  const [forceSkeleton, setForceSkeleton] = useState(false);
  const searchRequestId = useRef(0);
  const activeSlide = heroSlides[activeHeroSlide] || heroSlides[0];

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("skeleton") === "true") {
        setForceSkeleton(true);
      }
    }
  }, []);

  useEffect(() => {
    let active = true;
    const today = new Date();
    const checkIn = new Date(today);
    checkIn.setDate(checkIn.getDate() + 1);
    const checkOut = new Date(checkIn);
    checkOut.setDate(checkOut.getDate() + 2);
    setMinimumDate(dateInputValue(today));
    setCheckInDate(dateInputValue(checkIn));
    setCheckOutDate(dateInputValue(checkOut));
    api.getHotels()
      .then(async (rows) => {
        if (!active) return;
        setCatalog(rows);

        const hotelSlides = createHotelSlides(rows, false);
        const gallerySlides = createHotelSlides(rows)
          .filter((slide) => !hotelSlides.some((hotelSlide) => hotelSlide.image === slide.image));
        const roomResults = await Promise.allSettled(rows.map(async (hotel) => ({
          hotel,
          rooms: await api.getRoomsByHotel(hotel.id),
        })));
        if (!active) return;

        const roomSlides: HeroCarouselSlide[] = [];
        let failedRoomLookups = false;
        roomResults.forEach((result) => {
          if (result.status === "rejected") {
            failedRoomLookups = true;
            return;
          }
          const { hotel, rooms } = result.value;
          roomSlides.push(...rooms
            .filter((room: PublicRoom) => Boolean(room.image))
            .map((room: PublicRoom) => ({
              image: room.image,
              title: room.name,
              subtitle: `${hotel.name} · ${hotel.city}`,
              kind: "Room" as const,
            })));
        });

        const slides = [
          ...hotelSlides.slice(0, 6),
          ...roomSlides.slice(0, 6),
          ...gallerySlides,
        ].slice(0, 12);
        setHeroSlides(slides.length ? slides : createHotelSlides(hotels));
        setActiveHeroSlide(0);
        if (failedRoomLookups) setCarouselNotice("Some room photos could not be loaded.");
      })
      .catch(() => {
        if (active) setCatalogError("Showing our saved catalogue while the live catalogue reconnects.");
      })
      .finally(() => {
        if (active) {
          setTimeout(() => {
            if (active) setIsPageLoading(false);
          }, 350);
        }
      });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (carouselPaused || heroSlides.length < 2 || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timer = window.setInterval(() => {
      if (!document.hidden) setActiveHeroSlide((current) => (current + 1) % heroSlides.length);
    }, 5500);
    return () => window.clearInterval(timer);
  }, [carouselPaused, heroSlides.length]);

  const priceBounds = useMemo(() => {
    const prices = catalog.map((hotel) => hotel.price).filter((price) => Number.isFinite(price));
    if (prices.length === 0) return { min: 0, max: 1 };
    return {
      min: Math.min(...prices),
      max: Math.max(...prices),
    };
  }, [catalog]);

  const amenityOptions = useMemo(() => {
    const labelsByKey = new Map<string, string>();
    for (const hotel of catalog) {
      for (const feature of hotel.features || []) {
        const key = amenityKey(feature);
        if (key && !labelsByKey.has(key)) labelsByKey.set(key, amenityLabel(key));
      }
    }
    return Array.from(labelsByKey, ([key, label]) => ({ key, label })).sort((a, b) => a.label.localeCompare(b.label));
  }, [catalog]);

  const stayStyles = useMemo(
    () => Array.from(new Set(catalog.map((hotel) => hotel.category).filter(Boolean))).sort(),
    [catalog],
  );
  const destinations = useMemo(
    () => Array.from(new Set(catalog.map((hotel) => hotel.city.trim()).filter(Boolean))).sort(),
    [catalog],
  );

  const visibleHotels = useMemo(() => {
    let result = catalog.filter((hotel) => {
      const locationText = `${hotel.name} ${hotel.location} ${hotel.city}`.toLowerCase();
      const searchTerms = searched.toLowerCase().split(/[,\s]+/).map((term) => term.trim()).filter((term) => term && term !== "india");
      const matchesLocation = searchTerms.length === 0 || searchTerms.every((term) => locationText.includes(term));
      const matchesPrice = hotel.price >= (minimumPrice ?? priceBounds.min) && hotel.price <= (maximumPrice ?? priceBounds.max);
      const matchesRating = !rating || Number(hotel.rating) >= Number(rating);
      const hotelAmenities = new Set((hotel.features || []).map(amenityKey));
      const matchesAmenities = selectedAmenities.every((feature) => hotelAmenities.has(feature));
      const matchesStyle = selectedCategories.length === 0 || selectedCategories.includes(hotel.category);
      const matchesAvailability = availabilityByHotel === null || availabilityByHotel[hotel.id] === true;
      return matchesLocation && matchesPrice && matchesRating && matchesAmenities && matchesStyle && matchesAvailability;
    });
    if (sort === "Price: low to high") result = [...result].sort((a, b) => a.price - b.price);
    if (sort === "Price: high to low") result = [...result].sort((a, b) => b.price - a.price);
    if (sort === "Top rated") result = [...result].sort((a, b) => Number(b.rating) - Number(a.rating));
    if (sort === "Most reviewed") result = [...result].sort((a, b) => b.reviews - a.reviews);
    return result;
  }, [catalog, searched, sort, minimumPrice, maximumPrice, priceBounds, rating, selectedAmenities, selectedCategories, availabilityByHotel]);

  async function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!checkInDate || !checkOutDate || checkOutDate <= checkInDate) {
      setSearchError("Choose a check-out date after check-in.");
      return;
    }

    const requestId = ++searchRequestId.current;
    setSearched(query.trim());
    setSearchedDates({ checkIn: checkInDate, checkOut: checkOutDate });
    setAvailabilityByHotel(null);
    setAvailabilityError("");
    setSearchError("");
    setAvailabilityLoading(true);
    document.getElementById("stays")?.scrollIntoView({ behavior: "smooth" });

    const roomsNeeded = roomCount;
    const guestsPerRoom = Math.ceil(guestCount / roomsNeeded);
    try {
      const results = await Promise.allSettled(catalog.map(async (hotel) => {
        const rooms = await api.getRoomsForHotel(hotel.id);
        const suitableRooms = rooms.filter((room) => room.isActive && room.capacity >= guestsPerRoom);
        const checks = await Promise.allSettled(suitableRooms.map((room) =>
          api.getRoomAvailability(room._id, checkInDate, checkOutDate, roomsNeeded),
        ));
        if (checks.some((check) => check.status === "fulfilled" && check.value.isAvailable)) return true;
        if (checks.some((check) => check.status === "rejected")) {
          throw new Error(`Could not verify room availability for ${hotel.name}.`);
        }
        return false;
      }));

      if (requestId !== searchRequestId.current) return;
      const availability: Record<string, boolean> = {};
      let failedChecks = 0;
      results.forEach((result, index) => {
        if (result.status === "fulfilled") availability[catalog[index].id] = result.value;
        else failedChecks++;
      });
      setAvailabilityByHotel(availability);
      if (failedChecks) {
        setAvailabilityError(`Availability could not be verified for ${failedChecks} stay${failedChecks === 1 ? "" : "s"}; those stays were omitted.`);
      }
    } catch (error) {
      if (requestId === searchRequestId.current) {
        setAvailabilityByHotel({});
        setAvailabilityError(error instanceof Error ? error.message : "Could not check room availability.");
      }
    } finally {
      if (requestId === searchRequestId.current) setAvailabilityLoading(false);
    }
  }

  function resetAll() {
    searchRequestId.current++;
    const today = new Date();
    const checkIn = new Date(today);
    checkIn.setDate(checkIn.getDate() + 1);
    const checkOut = new Date(checkIn);
    checkOut.setDate(checkOut.getDate() + 2);
    setQuery("");
    setSearched("");
    setCheckInDate(dateInputValue(checkIn));
    setCheckOutDate(dateInputValue(checkOut));
    setSearchedDates(null);
    setGuestCount(2);
    setRoomCount(1);
    setSort("Recommended");
    setMinimumPrice(null);
    setMaximumPrice(null);
    setRating("");
    setSelectedAmenities([]);
    setSelectedCategories([]);
    setAvailabilityByHotel(null);
    setAvailabilityLoading(false);
    setAvailabilityError("");
    setSearchError("");
  }

  if (isPageLoading || forceSkeleton) {
    return (
      <>
        <SiteHeader active="explore" />
        <TotalPageSkeleton />
        <SiteFooter />
      </>
    );
  }

  return (
    <>
      <SiteHeader active="explore" />
      <main className="min-h-screen bg-[#f6f7f5] pb-14 text-[#1d302a]">
        <div className="mx-auto max-w-[1760px] px-4 pt-5 sm:px-6 lg:px-10 2xl:px-14">
          <section className="relative isolate overflow-hidden rounded-2xl bg-[#163a32] shadow-[0_24px_70px_rgba(22,58,50,0.18)]">
            <div className="grid min-h-[390px] lg:min-h-[470px] lg:grid-cols-[0.88fr_1.12fr]">
              <div className="relative z-10 flex flex-col justify-center px-7 py-10 sm:px-12 lg:px-16 xl:px-20">
                <span className="flex w-fit items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#e1c28a]">
                  StayEase · considered stays
                </span>
                <h1 className="mt-6 max-w-[620px] font-serif text-[42px] leading-[1.05] tracking-[-1.5px] text-white sm:text-[54px] xl:text-[68px]">
                  Find your kind<br />of <span className="italic text-[#e1c28a]">somewhere.</span>
                </h1>
                <p className="mt-5 max-w-[470px] text-sm leading-6 text-white/70 sm:text-base">
                  Thoughtful places, memorable details, and room to make the trip your own.
                </p>
                <div className="mt-8 flex flex-wrap items-center gap-x-8 gap-y-4">
                  <div>
                    <p className="text-lg font-semibold text-white">4.9 <span className="text-[#e1c28a]">★</span></p>
                    <p className="mt-1 text-[10px] uppercase tracking-[0.14em] text-white/55">Guest satisfaction</p>
                  </div>
                  <span className="hidden h-9 w-px bg-white/20 sm:block" />
                  <div>
                    <p className="text-lg font-semibold text-white">Handpicked</p>
                    <p className="mt-1 text-[10px] uppercase tracking-[0.14em] text-white/55">Independent stays</p>
                  </div>
                </div>
              </div>
              <div
                className="relative min-h-[270px] overflow-hidden lg:min-h-0"
                role="region"
                aria-roledescription="carousel"
                aria-label="Featured hotel and room photos"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  key={activeSlide.image}
                  src={activeSlide.image}
                  alt={`${activeSlide.title} ${activeSlide.kind.toLowerCase()} photo`}
                  className="hero-carousel-image absolute inset-0 h-full w-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-[#163a32]/65 via-[#163a32]/5 to-transparent lg:from-[#163a32]/30" />
                {carouselNotice && (
                  <p role="status" className="absolute left-4 top-4 rounded-lg bg-[#163a32]/70 px-3 py-2 text-xs text-white backdrop-blur-md">
                    {carouselNotice}
                  </p>
                )}
                {heroSlides.length > 1 && (
                  <div className="absolute right-4 top-4 flex gap-2 sm:right-7 sm:top-7">
                    <button
                      type="button"
                      aria-label="Previous photo"
                      onClick={() => {
                        setCarouselPaused(true);
                        setActiveHeroSlide((current) => (current - 1 + heroSlides.length) % heroSlides.length);
                      }}
                      className="flex h-10 w-10 items-center justify-center rounded-full border border-white/50 bg-[#163a32]/45 text-xl text-white backdrop-blur-md transition hover:bg-[#163a32]/75"
                    >
                      <span aria-hidden="true">‹</span>
                    </button>
                    <button
                      type="button"
                      aria-label="Next photo"
                      onClick={() => {
                        setCarouselPaused(true);
                        setActiveHeroSlide((current) => (current + 1) % heroSlides.length);
                      }}
                      className="flex h-10 w-10 items-center justify-center rounded-full border border-white/50 bg-[#163a32]/45 text-xl text-white backdrop-blur-md transition hover:bg-[#163a32]/75"
                    >
                      <span aria-hidden="true">›</span>
                    </button>
                    <button
                      type="button"
                      aria-label={carouselPaused ? "Play carousel" : "Pause carousel"}
                      onClick={() => setCarouselPaused((paused) => !paused)}
                      className="flex h-10 w-10 items-center justify-center rounded-full border border-white/50 bg-[#163a32]/45 text-sm text-white backdrop-blur-md transition hover:bg-[#163a32]/75"
                    >
                      <span aria-hidden="true">{carouselPaused ? "▶" : "Ⅱ"}</span>
                    </button>
                  </div>
                )}
                <div className="absolute bottom-5 left-5 max-w-[75%] rounded-xl border border-white/30 bg-[#163a32]/60 px-4 py-3 text-white shadow-xl backdrop-blur-md sm:bottom-8 sm:left-8">
                  <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-[#e1c28a]">{activeSlide.kind} · Featured stay</p>
                  <p className="mt-1 truncate text-sm font-semibold">{activeSlide.title}</p>
                  <p className="mt-1 truncate text-xs text-white/75">{activeSlide.subtitle}</p>
                </div>
                {heroSlides.length > 1 && (
                  <div className="absolute bottom-5 right-5 flex items-center gap-1.5 sm:bottom-8 sm:right-8" aria-label="Choose a photo">
                    {heroSlides.map((slide, index) => (
                      <button
                        key={`${slide.image}-${index}`}
                        type="button"
                        aria-label={`Show photo ${index + 1}: ${slide.title}`}
                        aria-current={index === activeHeroSlide ? "true" : undefined}
                        onClick={() => {
                          setCarouselPaused(true);
                          setActiveHeroSlide(index);
                        }}
                        className={`h-2 rounded-full transition-all ${index === activeHeroSlide ? "w-6 bg-[#e1c28a]" : "w-2 bg-white/70 hover:bg-white"}`}
                      />
                    ))}
                    <span className="ml-1 text-[10px] font-medium tabular-nums text-white/90">
                      {String(activeHeroSlide + 1).padStart(2, "0")} / {String(heroSlides.length).padStart(2, "0")}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </section>

          <form onSubmit={(event) => void handleSearch(event)} className="relative z-10 mx-2 -mt-7 grid gap-3 rounded-2xl border border-[#e7e8e2] bg-white p-4 shadow-[0_18px_50px_rgba(24,43,36,0.12)] sm:mx-5 sm:grid-cols-2 sm:p-5 lg:mx-10 lg:grid-cols-[1.35fr_1fr_1fr_1.05fr_auto] lg:items-end lg:gap-4 lg:p-6">
            <label className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#6b786f]">
              Where to?
              <span className="mt-2 flex h-12 items-center gap-3 rounded-lg border border-[#e7e8e2] bg-[#fbfbf9] px-3 text-sm font-normal transition focus-within:border-[#496b59] focus-within:ring-2 focus-within:ring-[#496b59]/10">
                <FigmaIcon name="map-pin" className="h-4 w-4 text-[#496b59]" />
                <input aria-label="Destination" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="City, region or property" className="w-full border-0 bg-transparent text-sm outline-none placeholder:text-[#9ca69e]" />
              </span>
            </label>
            <label className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#6b786f]">
              Check-in
              <span className="mt-2 flex h-12 items-center justify-between rounded-lg border border-[#e7e8e2] bg-[#fbfbf9] px-3 text-xs font-normal focus-within:border-[#496b59]">
                <input
                  aria-label="Check-in date"
                  required
                  type="date"
                  min={minimumDate}
                  value={checkInDate}
                  onChange={(event) => {
                    const nextDate = event.target.value;
                    setCheckInDate(nextDate);
                    if (nextDate && checkOutDate <= nextDate) setCheckOutDate(addDaysToDateInput(nextDate, 1));
                  }}
                  className="w-full border-0 bg-transparent text-sm font-normal outline-none"
                />
                <FigmaIcon name="calendar" className="h-4 w-4" />
              </span>
            </label>
            <label className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#6b786f]">
              Check-out
              <span className="mt-2 flex h-12 items-center justify-between rounded-lg border border-[#e7e8e2] bg-[#fbfbf9] px-3 text-xs font-normal focus-within:border-[#496b59]">
                <input
                  aria-label="Check-out date"
                  required
                  type="date"
                  min={checkInDate ? addDaysToDateInput(checkInDate, 1) : minimumDate}
                  value={checkOutDate}
                  onChange={(event) => setCheckOutDate(event.target.value)}
                  className="w-full border-0 bg-transparent text-sm font-normal outline-none"
                />
                <FigmaIcon name="calendar" className="h-4 w-4" />
              </span>
            </label>
            <label className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#6b786f]">
              Guests &amp; rooms
              <select
                aria-label="Guests and rooms"
                value={`${guestCount}:${roomCount}`}
                onChange={(event) => {
                  const [guests, rooms] = event.target.value.split(":").map(Number);
                  setGuestCount(guests);
                  setRoomCount(rooms);
                }}
                className="mt-2 h-12 w-full rounded-lg border border-[#e7e8e2] bg-[#fbfbf9] px-3 text-sm font-normal"
              >
                <option value="1:1">1 adult · 1 room</option>
                <option value="2:1">2 adults · 1 room</option>
                <option value="2:2">2 adults · 2 rooms</option>
                <option value="4:2">4 adults · 2 rooms</option>
                <option value="6:3">6 adults · 3 rooms</option>
              </select>
            </label>
            <Button type="submit" disabled={availabilityLoading} className="h-12 rounded-lg bg-[#244b3e] px-6 text-[11px] uppercase tracking-[0.1em] hover:bg-[#193c32]">
              {availabilityLoading ? "Checking dates..." : "Find my stay"}
              <FigmaIcon name="search" className="h-3.5 w-3.5" />
            </Button>
          </form>
          {(searchError || availabilityError) && (
            <p role="status" className="mt-2 text-[11px] text-rose-700">
              {searchError || availabilityError}
            </p>
          )}

          <section className="mt-7 grid gap-3 md:grid-cols-3">
            {benefits.map((benefit) => (
              <div key={benefit.title} className="flex items-center gap-4 rounded-xl border border-[#e9e9e3] bg-white px-5 py-4 shadow-[0_4px_16px_rgba(24,43,36,0.035)]">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#edf3ee] text-[#426653]">
                  <FigmaIcon name={benefit.icon} className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-xs font-semibold text-[#253c32]">{benefit.title}</p>
                  <p className="mt-1 text-[11px] text-[#7b867e]">{benefit.subtitle}</p>
                </div>
              </div>
            ))}
          </section>

          <section id="stays" className="mt-12 scroll-mt-28 lg:mt-16">
            <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
              <div>
                <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#92784d]">Your next check-in</p>
                <h2 className="font-serif text-3xl tracking-[-0.7px] text-[#20372e] sm:text-4xl">A stay worth going for.</h2>
                <p className="mt-2 text-sm text-[#78847c]">Explore places picked for the way you like to travel.</p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                {catalogError && <p className="text-[11px] text-[#78847c]">{catalogError}</p>}
                <label className="flex items-center gap-3 rounded-lg border border-[#e2e5df] bg-white px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#78847c]">
                  Sort
                  <select value={sort} onChange={(event) => setSort(event.target.value)} className="border-0 bg-transparent text-xs font-medium normal-case tracking-normal text-[#263b31] outline-none">
                    <option>Recommended</option><option>Price: low to high</option><option>Price: high to low</option><option>Top rated</option><option>Most reviewed</option>
                  </select>
                </label>
              </div>
            </div>

            <div className="mt-7 flex flex-wrap items-center gap-2.5">
              <button type="button" onClick={() => { setQuery(""); setSearched(""); }} className={`rounded-full border px-4 py-2 text-[11px] font-semibold transition ${!searched ? "border-[#244b3e] bg-[#244b3e] text-white shadow-sm" : "border-[#e1e5df] bg-white text-[#617168] hover:border-[#9cae9f]"}`}>
                All destinations <span className="ml-1 opacity-70">{catalog.length}</span>
              </button>
              {destinations.map((destination) => {
                const count = catalog.filter((hotel) => hotel.city.trim() === destination).length;
                const selected = searched.toLowerCase() === destination.toLowerCase();
                return (
                  <button
                    type="button"
                    key={destination}
                    onClick={() => { setQuery(destination); setSearched(destination); }}
                    className={`rounded-full border px-4 py-2 text-[11px] font-semibold transition ${selected ? "border-[#244b3e] bg-[#244b3e] text-white shadow-sm" : "border-[#e1e5df] bg-white text-[#617168] hover:border-[#9cae9f]"}`}
                  >
                    {destination} <span className="ml-1 opacity-70">{count}</span>
                  </button>
                );
              })}
            </div>

            <div className="mt-5 grid items-start gap-5 xl:grid-cols-[270px_minmax(0,1fr)] 2xl:gap-7">
              <aside className="h-fit rounded-xl border border-[#e5e7e1] bg-white p-5 shadow-[0_6px_24px_rgba(24,43,36,0.04)] xl:sticky xl:top-24">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-[#263b31]">Refine your stay</h3>
                    <p className="mt-1 text-[10px] text-[#879188]">Find the details that matter</p>
                  </div>
                  <button type="button" onClick={resetAll} className="text-[10px] font-semibold text-[#496b59] hover:underline">Reset</button>
                </div>
                <div className="my-5 border-t border-[#edf0eb]" />
                <fieldset>
                  <legend className="text-[11px] font-semibold text-[#354b40]">Price per night</legend>
                  <p className="mt-2 text-[11px] font-medium text-[#496b59]">
                    ₹{(minimumPrice ?? priceBounds.min).toLocaleString("en-IN")} – ₹{(maximumPrice ?? priceBounds.max).toLocaleString("en-IN")}
                  </p>
                  <input
                    aria-label="Minimum price"
                    type="range"
                    min={priceBounds.min}
                    max={maximumPrice ?? priceBounds.max}
                    value={minimumPrice ?? priceBounds.min}
                    onChange={(event) => setMinimumPrice(Number(event.target.value))}
                    className="mt-3 w-full accent-[#496b59]"
                  />
                  <input
                    aria-label="Maximum price"
                    type="range"
                    min={minimumPrice ?? priceBounds.min}
                    max={priceBounds.max}
                    value={maximumPrice ?? priceBounds.max}
                    onChange={(event) => setMaximumPrice(Number(event.target.value))}
                    className="mt-2 w-full accent-[#496b59]"
                  />
                  <div className="mt-2 flex justify-between text-[9px] text-[#879188]">
                    <span>₹{priceBounds.min.toLocaleString("en-IN")}</span>
                    <button type="button" onClick={() => { setMinimumPrice(null); setMaximumPrice(null); }} className="font-medium text-[#496b59] hover:underline">
                      Reset price
                    </button>
                    <span>₹{priceBounds.max.toLocaleString("en-IN")}</span>
                  </div>
                </fieldset>
                <fieldset className="mt-5 border-t border-[#edf0eb] pt-4">
                  <legend className="text-[11px] font-semibold text-[#354b40]">Guest rating</legend>
                  {[{ value: "", label: "Any rating" }, { value: "4.5", label: "4.5 & above" }, { value: "4.8", label: "4.8 & above" }, { value: "3.5", label: "3.5 & above" }].map((item) => (
                    <label key={item.label} className="mt-3 flex items-center gap-2 text-[11px] text-[#68756d]">
                      <input type="radio" name="rating" checked={rating === item.value} onChange={() => setRating(item.value)} className="accent-[#496b59]" />
                      {item.label}
                    </label>
                  ))}
                </fieldset>
                <fieldset className="mt-5 border-t border-[#edf0eb] pt-4">
                  <legend className="text-[11px] font-semibold text-[#354b40]">Amenities</legend>
                  {amenityOptions.map((item) => (
                    <label key={item.key} className="mt-3 flex items-center gap-2 text-[11px] text-[#68756d]">
                      <input
                        type="checkbox"
                        checked={selectedAmenities.includes(item.key)}
                        onChange={(event) => setSelectedAmenities((current) =>
                          event.target.checked
                            ? [...current, item.key]
                            : current.filter((feature) => feature !== item.key),
                        )}
                        className="accent-[#496b59]"
                      />
                      {item.label}
                    </label>
                  ))}
                  {amenityOptions.length === 0 && <p className="mt-3 text-[10px] text-[#879188]">No amenities listed for these stays.</p>}
                </fieldset>
                <fieldset className="mt-5 border-t border-[#edf0eb] pt-4">
                  <legend className="text-[11px] font-semibold text-[#354b40]">Stay style</legend>
                  {stayStyles.map((item) => (
                    <label key={item} className="mt-3 flex items-center gap-2 text-[11px] text-[#68756d]">
                      <input
                        type="checkbox"
                        checked={selectedCategories.includes(item)}
                        onChange={(event) => setSelectedCategories((current) =>
                          event.target.checked
                            ? [...current, item]
                            : current.filter((category) => category !== item),
                        )}
                        className="accent-[#496b59]"
                      />
                      {item}
                    </label>
                  ))}
                </fieldset>
              </aside>

              <div>
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#e5e7e1] bg-white px-4 py-3">
                  <div>
                    <p className="text-sm font-semibold text-[#263b31]">
                      {availabilityLoading ? "Checking availability…" : `${visibleHotels.length} ${visibleHotels.length === 1 ? "stay" : "stays"} to discover`}
                    </p>
                    <p className="mt-1 text-[10px] text-[#879188]">Considered places for your next escape</p>
                  </div>
                  <span className="rounded-full bg-[#f0f3ed] px-3 py-1.5 text-[10px] font-medium text-[#496b59]">
                    {searchedDates
                      ? `${new Date(`${searchedDates.checkIn}T00:00:00`).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })} – ${new Date(`${searchedDates.checkOut}T00:00:00`).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })} · ${Math.round((Date.parse(`${searchedDates.checkOut}T00:00:00Z`) - Date.parse(`${searchedDates.checkIn}T00:00:00Z`)) / 86400000)} nights`
                      : "Choose dates to check availability"}
                  </span>
                </div>
                {availabilityLoading ? (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 rounded-xl border border-[#cbe0d3] bg-[#edf3ee] px-4 py-3 text-xs font-medium text-[#2d5a43] shadow-sm">
                      <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-[#2d5a43] border-t-transparent" />
                      Checking live room availability for your dates and party size…
                    </div>
                    <HotelGridSkeleton count={8} />
                  </div>
                ) : visibleHotels.length ? (
                  <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                    {visibleHotels.map((hotel) => <HotelCard key={hotel.id} hotel={hotel} />)}
                  </div>
                ) : (
                  <div className="rounded-xl border border-[#e5e7e1] bg-white px-6 py-16 text-center">
                    <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#eef3ee] text-xl text-[#496b59]">⌕</span>
                    <p className="mt-4 text-sm font-semibold text-[#263b31]">No stays match these preferences</p>
                    <p className="mt-2 text-xs text-[#879188]">Try widening your dates or relaxing a filter to discover more places.</p>
                    <button type="button" onClick={resetAll} className="mt-5 rounded-lg bg-[#244b3e] px-4 py-2.5 text-[11px] font-semibold text-white hover:bg-[#193c32]">Clear all filters</button>
                  </div>
                )}
              </div>
            </div>
          </section>

          <section id="offers" className="mt-14 flex flex-col justify-between gap-5 overflow-hidden rounded-2xl bg-[#e9eee7] p-7 sm:flex-row sm:items-center sm:px-10 sm:py-8">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#92784d]">A little welcome</p>
              <h2 className="mt-2 font-serif text-2xl text-[#20372e]">Good things come with a getaway.</h2>
              <p className="mt-2 text-xs text-[#6e7c72]">Your first escape comes with 10% off. Use STAYEASE10 at checkout.</p>
            </div>
            <Button href="/wishlist" className="rounded-lg bg-[#244b3e] px-5 text-[11px] uppercase tracking-[0.1em] hover:bg-[#193c32]">Explore member offers <FigmaIcon name="arrow-up-right" className="h-3.5 w-3.5" /></Button>
          </section>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
