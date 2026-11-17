"use client";

import React from "react";

export function HotelCardSkeleton() {
  return (
    <article className="overflow-hidden rounded-xl border border-[#e7e9e3] bg-white shadow-[0_6px_24px_rgba(24,43,36,0.045)]">
      {/* Image skeleton area */}
      <div className="relative h-[210px] overflow-hidden bg-[#e8ede7] sm:h-[225px]">
        <div className="skeleton-shimmer h-full w-full" />
        {/* Heart button skeleton */}
        <div className="absolute right-4 top-4 h-10 w-10 rounded-full bg-white/80 p-2 shadow-sm">
          <div className="skeleton-shimmer h-full w-full rounded-full" />
        </div>
        {/* Tag pill skeleton */}
        <div className="absolute bottom-4 left-4 h-6 w-24 rounded-full bg-white/90 p-1 shadow-sm">
          <div className="skeleton-shimmer h-full w-full rounded-full" />
        </div>
      </div>

      {/* Card body skeleton */}
      <div className="p-5">
        <div className="flex items-start justify-between gap-2">
          <div className="skeleton-shimmer h-5 w-3/5 rounded" />
          <div className="skeleton-shimmer h-5 w-12 rounded-full" />
        </div>

        <div className="mt-3 flex items-center gap-2">
          <div className="skeleton-shimmer h-3.5 w-3.5 rounded-full shrink-0" />
          <div className="skeleton-shimmer h-3.5 w-40 rounded" />
        </div>

        {/* Amenity tags skeleton */}
        <div className="mt-4 flex min-h-7 flex-wrap gap-1.5">
          <div className="skeleton-shimmer h-6 w-16 rounded-full" />
          <div className="skeleton-shimmer h-6 w-20 rounded-full" />
          <div className="skeleton-shimmer h-6 w-14 rounded-full" />
        </div>

        {/* Offer line skeleton */}
        <div className="mt-3">
          <div className="skeleton-shimmer h-3 w-28 rounded" />
        </div>

        {/* Footer with price and button */}
        <div className="mt-4 flex items-center justify-between border-t border-[#edf0eb] pt-4">
          <div>
            <div className="skeleton-shimmer h-5 w-20 rounded" />
            <div className="skeleton-shimmer mt-1 h-2.5 w-28 rounded" />
          </div>
          <div className="skeleton-shimmer h-8 w-24 rounded-lg" />
        </div>
      </div>
    </article>
  );
}

export function HotelGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <HotelCardSkeleton key={i} />
      ))}
    </div>
  );
}

export function HeroSkeleton() {
  return (
    <section className="relative isolate overflow-hidden rounded-2xl bg-[#163a32] shadow-[0_24px_70px_rgba(22,58,50,0.18)]">
      <div className="grid min-h-[390px] lg:min-h-[470px] lg:grid-cols-[0.88fr_1.12fr]">
        <div className="relative z-10 flex flex-col justify-center px-7 py-10 sm:px-12 lg:px-16 xl:px-20">
          {/* Eyebrow badge */}
          <div className="skeleton-shimmer-dark h-6 w-44 rounded-full" />

          {/* Heading lines */}
          <div className="mt-6 space-y-3">
            <div className="skeleton-shimmer-dark h-11 w-4/5 rounded-lg sm:h-14" />
            <div className="skeleton-shimmer-dark h-11 w-3/5 rounded-lg sm:h-14" />
          </div>

          {/* Description line */}
          <div className="mt-5 space-y-2">
            <div className="skeleton-shimmer-dark h-4 w-5/6 rounded" />
            <div className="skeleton-shimmer-dark h-4 w-3/5 rounded" />
          </div>

          {/* Stats row */}
          <div className="mt-8 flex flex-wrap items-center gap-x-8 gap-y-4">
            <div>
              <div className="skeleton-shimmer-dark h-6 w-16 rounded" />
              <div className="skeleton-shimmer-dark mt-1.5 h-3 w-28 rounded" />
            </div>
            <span className="hidden h-9 w-px bg-white/20 sm:block" />
            <div>
              <div className="skeleton-shimmer-dark h-6 w-24 rounded" />
              <div className="skeleton-shimmer-dark mt-1.5 h-3 w-32 rounded" />
            </div>
          </div>
        </div>

        {/* Carousel image area */}
        <div className="relative min-h-[270px] overflow-hidden lg:min-h-0 bg-[#122e28]">
          <div className="skeleton-shimmer-dark h-full w-full" />
          {/* Floating details badge in bottom-left */}
          <div className="absolute bottom-5 left-5 w-64 rounded-xl border border-white/20 bg-[#163a32]/70 p-3 sm:bottom-8 sm:left-8">
            <div className="skeleton-shimmer-dark h-2.5 w-24 rounded" />
            <div className="skeleton-shimmer-dark mt-2 h-4 w-40 rounded" />
            <div className="skeleton-shimmer-dark mt-1.5 h-3 w-32 rounded" />
          </div>
          {/* Carousel dots in bottom-right */}
          <div className="absolute bottom-5 right-5 flex items-center gap-2 sm:bottom-8 sm:right-8">
            <div className="skeleton-shimmer-dark h-2 w-6 rounded-full" />
            <div className="skeleton-shimmer-dark h-2 w-2 rounded-full" />
            <div className="skeleton-shimmer-dark h-2 w-2 rounded-full" />
            <div className="skeleton-shimmer-dark h-3 w-10 rounded" />
          </div>
        </div>
      </div>
    </section>
  );
}

export function SearchBarSkeleton() {
  return (
    <div className="relative z-10 mx-2 -mt-7 grid gap-3 rounded-2xl border border-[#e7e8e2] bg-white p-4 shadow-[0_18px_50px_rgba(24,43,36,0.12)] sm:mx-5 sm:grid-cols-2 sm:p-5 lg:mx-10 lg:grid-cols-[1.35fr_1fr_1fr_1.05fr_auto] lg:items-end lg:gap-4 lg:p-6">
      {/* Where to */}
      <div>
        <div className="skeleton-shimmer h-3 w-16 rounded" />
        <div className="skeleton-shimmer mt-2 h-12 w-full rounded-lg" />
      </div>
      {/* Check-in */}
      <div>
        <div className="skeleton-shimmer h-3 w-16 rounded" />
        <div className="skeleton-shimmer mt-2 h-12 w-full rounded-lg" />
      </div>
      {/* Check-out */}
      <div>
        <div className="skeleton-shimmer h-3 w-16 rounded" />
        <div className="skeleton-shimmer mt-2 h-12 w-full rounded-lg" />
      </div>
      {/* Guests */}
      <div>
        <div className="skeleton-shimmer h-3 w-24 rounded" />
        <div className="skeleton-shimmer mt-2 h-12 w-full rounded-lg" />
      </div>
      {/* Button */}
      <div className="skeleton-shimmer h-12 w-full lg:w-36 rounded-lg" />
    </div>
  );
}

export function BenefitsSkeleton() {
  return (
    <section className="mt-7 grid gap-3 md:grid-cols-3">
      {Array.from({ length: 3 }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-4 rounded-xl border border-[#e9e9e3] bg-white px-5 py-4 shadow-[0_4px_16px_rgba(24,43,36,0.035)]"
        >
          <div className="skeleton-shimmer h-10 w-10 shrink-0 rounded-full" />
          <div className="flex-1 space-y-2">
            <div className="skeleton-shimmer h-4 w-3/4 rounded" />
            <div className="skeleton-shimmer h-3 w-1/2 rounded" />
          </div>
        </div>
      ))}
    </section>
  );
}

export function DestinationsSkeleton() {
  return (
    <div className="mt-7 flex flex-wrap items-center gap-2.5">
      <div className="skeleton-shimmer h-8 w-32 rounded-full" />
      <div className="skeleton-shimmer h-8 w-24 rounded-full" />
      <div className="skeleton-shimmer h-8 w-24 rounded-full" />
      <div className="skeleton-shimmer h-8 w-28 rounded-full" />
      <div className="skeleton-shimmer h-8 w-20 rounded-full" />
      <div className="skeleton-shimmer h-8 w-28 rounded-full" />
    </div>
  );
}

export function SidebarFilterSkeleton() {
  return (
    <aside className="h-fit rounded-xl border border-[#e5e7e1] bg-white p-5 shadow-[0_6px_24px_rgba(24,43,36,0.04)]">
      <div className="flex items-center justify-between">
        <div>
          <div className="skeleton-shimmer h-4 w-28 rounded" />
          <div className="skeleton-shimmer mt-1 h-3 w-36 rounded" />
        </div>
        <div className="skeleton-shimmer h-3 w-10 rounded" />
      </div>

      <div className="my-5 border-t border-[#edf0eb]" />

      {/* Price per night */}
      <div>
        <div className="skeleton-shimmer h-3.5 w-24 rounded" />
        <div className="skeleton-shimmer mt-2 h-4 w-32 rounded" />
        <div className="skeleton-shimmer mt-3 h-2 w-full rounded-full" />
        <div className="mt-2 flex justify-between">
          <div className="skeleton-shimmer h-2.5 w-12 rounded" />
          <div className="skeleton-shimmer h-2.5 w-16 rounded" />
          <div className="skeleton-shimmer h-2.5 w-12 rounded" />
        </div>
      </div>

      {/* Guest rating */}
      <div className="mt-5 border-t border-[#edf0eb] pt-4">
        <div className="skeleton-shimmer h-3.5 w-20 rounded" />
        <div className="mt-3 space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className="skeleton-shimmer h-4 w-4 rounded-full shrink-0" />
              <div className="skeleton-shimmer h-3 w-20 rounded" />
            </div>
          ))}
        </div>
      </div>

      {/* Amenities */}
      <div className="mt-5 border-t border-[#edf0eb] pt-4">
        <div className="skeleton-shimmer h-3.5 w-20 rounded" />
        <div className="mt-3 space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className="skeleton-shimmer h-4 w-4 rounded shrink-0" />
              <div className="skeleton-shimmer h-3 w-28 rounded" />
            </div>
          ))}
        </div>
      </div>

      {/* Stay style */}
      <div className="mt-5 border-t border-[#edf0eb] pt-4">
        <div className="skeleton-shimmer h-3.5 w-20 rounded" />
        <div className="mt-3 space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className="skeleton-shimmer h-4 w-4 rounded shrink-0" />
              <div className="skeleton-shimmer h-3 w-24 rounded" />
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
}

export function StaysHeaderSkeleton() {
  return (
    <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
      <div>
        <div className="skeleton-shimmer h-3 w-28 rounded uppercase" />
        <div className="skeleton-shimmer mt-2 h-9 w-72 rounded-lg sm:w-96" />
        <div className="skeleton-shimmer mt-2 h-4 w-80 rounded" />
      </div>
      <div className="skeleton-shimmer h-10 w-36 rounded-lg" />
    </div>
  );
}

export function OffersBannerSkeleton() {
  return (
    <section className="mt-14 flex flex-col justify-between gap-5 overflow-hidden rounded-2xl bg-[#e9eee7] p-7 sm:flex-row sm:items-center sm:px-10 sm:py-8">
      <div className="space-y-2">
        <div className="skeleton-shimmer h-3 w-24 rounded" />
        <div className="skeleton-shimmer h-7 w-64 rounded" />
        <div className="skeleton-shimmer h-4 w-80 rounded" />
      </div>
      <div className="skeleton-shimmer h-10 w-44 rounded-lg" />
    </section>
  );
}

/**
 * TotalPageSkeleton: full-page skeleton replicating the complete layout of the Explore page.
 */
export function TotalPageSkeleton() {
  return (
    <main className="min-h-screen bg-[#f6f7f5] pb-14 text-[#1d302a]" aria-busy="true" aria-live="polite">
      <div className="mx-auto max-w-[1760px] px-4 pt-5 sm:px-6 lg:px-10 2xl:px-14">
        {/* 1. Hero Skeleton */}
        <HeroSkeleton />

        {/* 2. Floating Search Bar Skeleton */}
        <SearchBarSkeleton />

        {/* 3. 3-Column Benefits Skeleton */}
        <BenefitsSkeleton />

        {/* 4. Stays section with Sidebar and Cards */}
        <section className="mt-12 lg:mt-16">
          <StaysHeaderSkeleton />
          <DestinationsSkeleton />

          <div className="mt-5 grid items-start gap-5 xl:grid-cols-[270px_minmax(0,1fr)] 2xl:gap-7">
            {/* Sidebar filter skeleton */}
            <SidebarFilterSkeleton />

            {/* Right main hotel listing skeleton */}
            <div>
              {/* Count / availability bar */}
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#e5e7e1] bg-white px-4 py-3.5">
                <div>
                  <div className="skeleton-shimmer h-4 w-36 rounded" />
                  <div className="skeleton-shimmer mt-1 h-3 w-48 rounded" />
                </div>
                <div className="skeleton-shimmer h-7 w-44 rounded-full" />
              </div>

              {/* 8 hotel cards grid skeleton */}
              <HotelGridSkeleton count={8} />
            </div>
          </div>
        </section>

        {/* 5. Offers banner skeleton */}
        <OffersBannerSkeleton />
      </div>
    </main>
  );
}

