"use client";

import { ReactNode, useEffect, useState } from "react";

const slides = [
  {
    image: "https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=1800&q=85",
    location: "Ubud, Bali",
    title: "A little closer to paradise.",
    detail: "Wake up somewhere unforgettable, with every detail taken care of.",
  },
  {
    image: "https://images.unsplash.com/photo-1511818966892-d7d671e672a2?auto=format&fit=crop&w=1800&q=85",
    location: "Santorini, Greece",
    title: "Make room for wonder.",
    detail: "Find the places that turn a few days away into a lasting memory.",
  },
  {
    image: "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=1800&q=85",
    location: "The good kind of getaway",
    title: "Your next stay starts here.",
    detail: "Thoughtful stays, easy booking, and more time to enjoy the journey.",
  },
];

export function AuthSplitLayout({ children }: { children: ReactNode }) {
  const [active, setActive] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => setActive((current) => (current + 1) % slides.length), 6000);
    return () => window.clearInterval(timer);
  }, []);

  const slide = slides[active];

  return (
    <div className="grid w-full overflow-hidden rounded-[3px] border border-stone-200 bg-white shadow-[0_24px_80px_-32px_rgba(32,59,49,0.18)] lg:min-h-[660px] lg:grid-cols-[0.92fr_1.08fr]">
      <aside className="relative isolate min-h-[250px] overflow-hidden bg-[#203d35] sm:min-h-[320px] lg:min-h-[660px]">
        {slides.map((item, index) => (
          <div
            key={item.image}
            aria-hidden="true"
            className={`absolute inset-0 bg-cover bg-center transition-opacity duration-1000 ${index === active ? "opacity-100" : "opacity-0"}`}
            style={{ backgroundImage: `url("${item.image}")` }}
          />
        ))}
        <div className="absolute inset-0 bg-gradient-to-t from-[#10251f]/90 via-[#10251f]/20 to-[#10251f]/10" />
        <div className="relative flex h-full min-h-[250px] flex-col justify-between p-6 text-white sm:min-h-[320px] sm:p-9 lg:min-h-[660px] lg:p-12">
          <a href="/" className="inline-flex w-fit items-center gap-2 text-sm font-semibold tracking-wide text-white/95">
            <span className="flex h-9 w-9 items-center justify-center rounded-full border border-white/35 bg-white/10 text-lg">⌂</span>
            StayEase
          </a>
          <div className="max-w-md pb-2">
            <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.22em] text-emerald-200">{slide.location}</p>
            <h2 className="text-3xl font-semibold leading-tight tracking-tight sm:text-4xl lg:text-[42px]">{slide.title}</h2>
            <p className="mt-3 max-w-sm text-sm leading-6 text-white/80">{slide.detail}</p>
            <div className="mt-7 flex items-center gap-2" aria-label="Choose a featured stay">
              {slides.map((item, index) => (
                <button
                  key={item.image}
                  type="button"
                  aria-label={`Show slide ${index + 1}`}
                  aria-pressed={index === active}
                  onClick={() => setActive(index)}
                  className={`h-1.5 rounded-full transition-all ${index === active ? "w-8 bg-white" : "w-1.5 bg-white/55 hover:bg-white/80"}`}
                />
              ))}
              <span className="ml-2 text-[11px] text-white/70">A better stay is just around the corner</span>
            </div>
          </div>
        </div>
      </aside>
      <section className="flex items-center justify-center bg-[#fbfaf8] px-5 py-8 sm:px-10 sm:py-12 lg:px-12 lg:py-10">
        {children}
      </section>
    </div>
  );
}
