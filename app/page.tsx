"use client";

import { FormEvent, useMemo, useState } from "react";
import { FigmaIcon } from "@/components/figma-icon";
import { HotelCard } from "@/components/hotel-card";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { Button, PageHeading } from "@/components/ui";
import { hotels } from "@/lib/data";

const benefits = [
  { icon: "shield" as const, title: "Handpicked, not endless", subtitle: "Stays worth travelling for", color: "bg-mint" },
  { icon: "wallet" as const, title: "Good stays. Better prices.", subtitle: "Member perks & honest pricing", color: "bg-butter" },
  { icon: "support" as const, title: "Here, whenever you need", subtitle: "Real people. Round-the-clock care.", color: "bg-lilac" },
];

export default function HomePage() {
  const [query, setQuery] = useState("");
  const [searched, setSearched] = useState("");
  const [sort, setSort] = useState("Recommended");
  const [onlyPool, setOnlyPool] = useState(false);
  const [rating, setRating] = useState("4.5 & above");

  const visibleHotels = useMemo(() => {
    let result = hotels.filter((hotel) => {
      const matchesQuery =
        !searched ||
        `${hotel.name} ${hotel.location} ${hotel.city}`.toLowerCase().includes(searched.toLowerCase());
      const matchesRating = rating !== "4.8 & above" || Number(hotel.rating) >= 4.8;
      return matchesQuery && matchesRating && (!onlyPool || hotel.features.includes("Pool"));
    });
    if (sort === "Price: low to high") result = [...result].sort((a, b) => a.price - b.price);
    if (sort === "Top rated") result = [...result].sort((a, b) => Number(b.rating) - Number(a.rating));
    return result;
  }, [searched, sort, onlyPool, rating]);

  function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSearched(query.trim());
    document.getElementById("stays")?.scrollIntoView({ behavior: "smooth" });
  }

  return (
    <>
      <SiteHeader active="explore" />
      <main className="mx-auto max-w-[1296px] px-5 pb-10 pt-6 lg:px-0 lg:pt-8">
        <section className="overflow-hidden rounded-[4px] bg-sky">
          <div className="grid min-h-[310px] lg:h-[370px] md:grid-cols-[minmax(0,0.85fr)_minmax(0,1fr)] lg:grid-cols-[595px_minmax(0,1fr)]">
            <div className="flex flex-col justify-center p-7 sm:p-10">
              <span className="w-fit rounded-[4px] bg-white px-2 py-1 text-[9px] font-semibold text-ink">
                LESS PLANNING. MORE LIVING.
              </span>
              <h1 className="mt-4 text-[36px] font-normal leading-[1.08] tracking-[-1.4px] text-ink sm:text-[44px]">
                Somewhere new.<br />Somewhere you.
              </h1>
              <p className="mt-3 max-w-[430px] text-xs leading-5 text-muted">
                From barefoot mornings to city discoveries, find a stay that feels just right.
              </p>
              <p className="mt-4 flex items-center gap-2 text-[10px] text-muted">
                <span className="font-semibold text-ink">★ 4.9</span>
                Loved by 20,000+ happy travellers
              </p>
            </div>
            <div className="min-h-[250px] overflow-hidden md:min-h-[310px] lg:min-h-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/assets/figma/f954b.png" alt="A tropical hotel pool at The Palm House" className="h-full w-full object-cover" />
            </div>
          </div>
        </section>

        <form onSubmit={handleSearch} className="relative z-10 -mt-1 grid gap-3 rounded-[4px] border border-line bg-white p-4 shadow-soft md:grid-cols-[1.35fr_1fr_1fr_1fr_auto] md:items-end">
          <label className="text-[10px] font-semibold text-ink">
            Where to?
            <span className="mt-2 flex h-10 items-center gap-2 border-b border-line px-1 text-xs font-normal">
              <FigmaIcon name="map-pin" className="h-4 w-4" />
              <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Goa, India" className="w-full border-0 bg-transparent outline-none placeholder:text-ink" />
            </span>
          </label>
          <label className="text-[10px] font-semibold text-ink">
            Check-in
            <span className="mt-2 flex h-10 items-center justify-between rounded-[4px] border border-line px-3 text-xs font-normal">
              18 Dec 2026 <FigmaIcon name="calendar" className="h-4 w-4" />
            </span>
          </label>
          <label className="text-[10px] font-semibold text-ink">
            Check-out
            <span className="mt-2 flex h-10 items-center justify-between rounded-[4px] border border-line px-3 text-xs font-normal">
              21 Dec 2026 <FigmaIcon name="calendar" className="h-4 w-4" />
            </span>
          </label>
          <label className="text-[10px] font-semibold text-ink">
            Guests &amp; rooms
            <select className="mt-2 h-10 w-full rounded-[4px] border border-line bg-white px-3 text-xs font-normal">
              <option>2 adults · 1 room</option><option>2 adults · 2 rooms</option><option>4 adults · 2 rooms</option>
            </select>
          </label>
          <Button type="submit" className="h-10">Find my stay <FigmaIcon name="search" className="h-3.5 w-3.5" /></Button>
        </form>

        <section className="mt-7 grid gap-3 md:grid-cols-3">
          {benefits.map((benefit) => (
            <div key={benefit.title} className={`${benefit.color} flex items-center gap-3 rounded-[4px] px-4 py-3`}>
              <FigmaIcon name={benefit.icon} className="h-5 w-5" />
              <div>
                <p className="text-[11px] font-semibold">{benefit.title}</p>
                <p className="mt-1 text-[10px] text-muted">{benefit.subtitle}</p>
              </div>
            </div>
          ))}
        </section>

        <section id="stays" className="mt-10">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <PageHeading
              eyebrow="YOUR NEXT CHECK-IN"
              title="Good places. Great possibilities."
              description="Handpicked stays in Goa and a few places you might fall for."
            />
            <label className="flex items-center gap-2 text-[11px] text-muted">
              Sort by:
              <select value={sort} onChange={(event) => setSort(event.target.value)} className="rounded-[4px] border border-line bg-white px-2 py-2 text-[11px] text-ink">
                <option>Recommended</option><option>Price: low to high</option><option>Top rated</option>
              </select>
            </label>
          </div>

          <div className="mt-6 grid gap-5 lg:grid-cols-[180px_1fr]">
            <aside className="h-fit rounded-[4px] border border-line p-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xs font-semibold">Filters</h2>
                <button type="button" onClick={() => { setOnlyPool(false); setRating("4.5 & above"); setSearched(""); setQuery(""); }} className="text-[10px] text-forest">Reset all</button>
              </div>
              <div className="my-4 border-t border-line" />
              <fieldset>
                <legend className="text-[11px] font-semibold">Price per night</legend>
                <p className="mt-2 text-[10px] text-muted">₹2,000 – ₹15,000</p>
                <input aria-label="Maximum price" type="range" min="2000" max="15000" defaultValue="15000" className="mt-3 w-full accent-[#486958]" />
                <div className="mt-2 flex justify-between text-[9px]"><span className="rounded-[4px] bg-mist px-2 py-1">₹2,000</span><span className="rounded-[4px] bg-mist px-2 py-1">₹15,000</span></div>
              </fieldset>
              <fieldset className="mt-5 border-t border-line pt-4">
                <legend className="text-[11px] font-semibold">Guest rating</legend>
                {["4.5 & above", "4.8 & above", "3.5 & above"].map((item) => (
                  <label key={item} className="mt-3 flex items-center gap-2 text-[10px] text-muted">
                    <input type="radio" name="rating" checked={rating === item} onChange={() => setRating(item)} className="accent-[#486958]" />
                    {item}
                  </label>
                ))}
              </fieldset>
              <fieldset className="mt-5 border-t border-line pt-4">
                <legend className="text-[11px] font-semibold">Amenities</legend>
                {["Free Wi-Fi", "Swimming pool", "Breakfast included", "Spa & wellness", "Free parking"].map((item) => (
                  <label key={item} className="mt-3 flex items-center gap-2 text-[10px] text-muted">
                    <input type="checkbox" checked={item === "Swimming pool" ? onlyPool : undefined} onChange={item === "Swimming pool" ? (event) => setOnlyPool(event.target.checked) : undefined} className="accent-[#486958]" />
                    {item}
                  </label>
                ))}
              </fieldset>
              <fieldset className="mt-5 border-t border-line pt-4">
                <legend className="text-[11px] font-semibold">Stay style</legend>
                {["Boutique hotels", "Beach resorts", "Heritage stays", "City hotels", "Villas & retreats"].map((item) => (
                  <label key={item} className="mt-3 flex items-center gap-2 text-[10px] text-muted">
                    <input type="checkbox" defaultChecked={item === "Boutique hotels"} className="accent-[#486958]" />{item}
                  </label>
                ))}
              </fieldset>
            </aside>

            <div>
              <div className="mb-3 flex items-center justify-between text-[10px] text-muted">
                <span>{visibleHotels.length} beautiful stays for your next escape</span>
                <span className="rounded-[4px] bg-sky px-2 py-1">18 – 21 Dec · 3 nights</span>
              </div>
              {visibleHotels.length ? (
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {visibleHotels.map((hotel) => <HotelCard key={hotel.id} hotel={hotel} />)}
                </div>
              ) : (
                <div className="rounded-[4px] border border-line p-8 text-center text-sm text-muted">
                  No stays match your search. Try another destination or reset your filters.
                </div>
              )}
              <div className="mt-5 flex items-center justify-center gap-4 text-[11px]">
                <button type="button" className="rounded-[4px] bg-mint px-3 py-2 font-semibold text-forest">1</button>
                <button type="button" className="text-muted">2</button>
                <button type="button" className="text-muted">3</button>
                <button type="button" aria-label="Next page" className="text-ink">→</button>
              </div>
            </div>
          </div>
        </section>

        <section id="offers" className="mt-8 flex flex-col justify-between gap-4 rounded-[4px] bg-blush p-5 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-sm font-semibold">A little welcome, a lovely saving.</h2>
            <p className="mt-2 text-[11px] text-muted">Your first getaway comes with 10% off. Use STAYEASE10 at checkout.</p>
          </div>
          <Button href="/wishlist" variant="outline">Explore member offers <FigmaIcon name="arrow-up-right" className="h-3.5 w-3.5" /></Button>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
