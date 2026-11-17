"use client";

import React from "react";

export function HotelDetailSkeleton() {
  return (
    <div className="animate-pulse space-y-6">
      {/* Breadcrumb line */}
      <div className="skeleton-shimmer h-3.5 w-48 rounded" />

      {/* Header row */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div className="space-y-2">
          <div className="skeleton-shimmer h-5 w-24 rounded" />
          <div className="skeleton-shimmer h-8 w-80 rounded-lg sm:w-96" />
          <div className="skeleton-shimmer h-4 w-48 rounded" />
        </div>
        <div className="flex items-center gap-2">
          <div className="skeleton-shimmer h-9 w-24 rounded-lg" />
          <div className="skeleton-shimmer h-9 w-24 rounded-lg" />
        </div>
      </div>

      {/* Photo gallery grid */}
      <div className="grid h-[250px] gap-2 overflow-hidden rounded-xl sm:h-[340px] sm:grid-cols-[1.45fr_1fr]">
        <div className="skeleton-shimmer h-full w-full" />
        <div className="hidden h-full w-full space-y-2 sm:block">
          <div className="skeleton-shimmer h-[48%] w-full rounded" />
          <div className="skeleton-shimmer h-[48%] w-full rounded" />
        </div>
      </div>

      {/* Highlights / Features row */}
      <div className="grid gap-4 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 rounded-lg border border-[#e5e7e1] bg-white p-4">
            <div className="skeleton-shimmer h-8 w-8 rounded-full shrink-0" />
            <div className="flex-1 space-y-1.5">
              <div className="skeleton-shimmer h-3.5 w-24 rounded" />
              <div className="skeleton-shimmer h-2.5 w-16 rounded" />
            </div>
          </div>
        ))}
      </div>

      {/* 2-Column content */}
      <div className="mt-8 grid gap-8 lg:grid-cols-[1.4fr_1fr]">
        <div className="space-y-4">
          <div className="skeleton-shimmer h-6 w-36 rounded" />
          <div className="skeleton-shimmer h-4 w-full rounded" />
          <div className="skeleton-shimmer h-4 w-5/6 rounded" />
          <div className="skeleton-shimmer h-4 w-4/6 rounded" />
        </div>
        <div className="h-64 rounded-xl border border-[#e5e7e1] bg-white p-6">
          <div className="skeleton-shimmer h-5 w-32 rounded" />
          <div className="skeleton-shimmer mt-3 h-8 w-28 rounded" />
          <div className="skeleton-shimmer mt-6 h-10 w-full rounded-lg" />
        </div>
      </div>
    </div>
  );
}

