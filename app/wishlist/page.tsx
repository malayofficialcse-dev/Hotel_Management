"use client";

import { FormEvent, useMemo, useState } from "react";
import { FigmaIcon } from "@/components/figma-icon";
import { HotelCard } from "@/components/hotel-card";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui";
import { useBooking } from "@/components/booking-provider";
import { hotels } from "@/lib/data";

export default function WishlistPage() {
  const { savedHotelIds } = useBooking();
  const [collection, setCollection] = useState("All saved");
  const [query, setQuery] = useState("");
  const [searched, setSearched] = useState(false);
  const [newCollection, setNewCollection] = useState(false);
  const savedHotels = useMemo(() => hotels.filter((hotel) => {
    const inCollection =
      collection === "All saved" ||
      (collection === "Beach escapes" && hotel.category === "Beach resorts") ||
      (collection === "Slow weekends" && hotel.category === "Villas & retreats");
    const matchesSearch = !searched || `${hotel.name} ${hotel.city}`.toLowerCase().includes(query.toLowerCase());
    return savedHotelIds.includes(hotel.id) && inCollection && matchesSearch;
  }), [savedHotelIds, collection, searched, query]);

  function checkAvailability(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSearched(true);
  }

  return (
    <>
      <SiteHeader active="wishlist" />
      <main className="mx-auto max-w-[1296px] px-5 py-7 lg:px-0">
        <section className="flex flex-col justify-between gap-5 rounded-[4px] bg-blush p-6 sm:flex-row sm:items-center sm:px-8 sm:py-7">
          <div>
            <span className="rounded-[4px] bg-white px-2 py-1 text-[9px] font-semibold">A LITTLE SOMEDAY LIST</span>
            <h1 className="mt-3 text-[25px] font-semibold tracking-[-0.6px]">Good places, kept close.</h1>
            <p className="mt-2 text-xs text-muted">The stays you love, ready when you are. Your next getaway starts here.</p>
            <p className="mt-3 flex items-center gap-2 text-[10px] font-semibold"><FigmaIcon name="heart" className="h-3.5 w-3.5" /> {savedHotelIds.length} saved stays · 6 possibilities</p>
          </div>
          <span className="flex h-[84px] w-[84px] items-center justify-center self-center rounded-full bg-white sm:self-auto"><FigmaIcon name="heart" className="h-9 w-9" /></span>
        </section>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          {["All saved", "Beach escapes", "Slow weekends"].map((item) => (
            <button type="button" key={item} onClick={() => setCollection(item)} className={`rounded-[4px] border px-3 py-2 text-[10px] ${collection === item ? "border-forest bg-forest text-white" : "border-line bg-white text-ink"}`}>
              {item}{item === "All saved" ? ` (${savedHotelIds.length})` : item === "Beach escapes" ? " (2)" : " (4)"}
            </button>
          ))}
          <button type="button" onClick={() => setNewCollection(true)} className="rounded-[4px] border border-line px-3 py-2 text-[10px]">New collection&nbsp; +</button>
          {newCollection && <span className="text-[10px] text-forest">Your new collection is ready to fill.</span>}
          <label className="ml-auto flex items-center gap-2 text-[10px] text-muted">Recently saved <select className="bg-white text-ink"><option>Recently saved</option><option>Price: low to high</option></select></label>
        </div>

        <form onSubmit={checkAvailability} className="mt-4 grid gap-3 rounded-[4px] bg-sky p-4 md:grid-cols-[1.4fr_0.8fr_0.8fr_0.8fr_auto] md:items-end">
          <div><p className="text-[10px] font-medium">Turn someday into a check-in.</p><p className="mt-1 text-[9px] text-muted">See which of your favourites are ready for you.</p></div>
          <label className="text-[9px] font-semibold">Check-in<input type="date" defaultValue="2026-12-18" className="mt-1.5 h-9 w-full rounded-[4px] border border-line px-2 text-[10px] font-normal" /></label>
          <label className="text-[9px] font-semibold">Check-out<input type="date" defaultValue="2026-12-21" className="mt-1.5 h-9 w-full rounded-[4px] border border-line px-2 text-[10px] font-normal" /></label>
          <label className="text-[9px] font-semibold">Guests<select className="mt-1.5 h-9 w-full rounded-[4px] border border-line bg-white px-2 text-[10px] font-normal"><option>2 adults · 1 room</option></select></label>
          <Button type="submit">Check availability</Button>
        </form>

        {searched && (
          <label className="mt-4 block text-[10px] font-semibold">Filter saved stays
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search by hotel or city" className="ml-3 h-9 max-w-xs rounded-[4px] border border-line px-3 text-xs font-normal" />
          </label>
        )}

        {savedHotels.length ? (
          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {savedHotels.map((hotel) => <HotelCard key={hotel.id} hotel={hotel} />)}
          </div>
        ) : (
          <div className="mt-5 rounded-[4px] border border-line p-10 text-center">
            <h2 className="text-sm font-semibold">Nothing saved here yet.</h2>
            <p className="mt-2 text-xs text-muted">Explore our stays and tap the heart to keep a favourite close.</p>
            <Button href="/" className="mt-4">Explore stays</Button>
          </div>
        )}

        <section className="mt-5 flex flex-col justify-between gap-3 rounded-[4px] bg-butter p-4 sm:flex-row sm:items-center">
          <div><p className="text-[11px] font-semibold">Some places are better with your favourite people.</p><p className="mt-1 text-[10px] text-muted">Share your collection and start dreaming up the next trip together.</p></div>
          <Button type="button" variant="outline" onClick={() => navigator.clipboard?.writeText(window.location.href)}>Share my wishlist <FigmaIcon name="share" className="h-4 w-4" /></Button>
        </section>
        <p className="mt-4 text-center text-[9px] text-muted"><FigmaIcon name="info" className="mr-2 h-3 w-3" /> Rates are per room, per night and may change with your dates. Tap the heart to remove a saved stay.</p>
      </main>
      <SiteFooter />
    </>
  );
}
