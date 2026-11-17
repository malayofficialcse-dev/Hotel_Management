"use client";

import React from "react";

export function BookingsSkeleton() {
  return (
    <div className="mt-6 space-y-4">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="rounded-xl border border-[#e5e7e1] bg-white p-6 shadow-sm">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <div className="skeleton-shimmer h-4 w-32 rounded" />
                <div className="skeleton-shimmer h-5 w-20 rounded-full" />
              </div>
              <div className="skeleton-shimmer h-6 w-56 rounded-md" />
              <div className="skeleton-shimmer h-3.5 w-44 rounded" />
            </div>
            <div className="flex items-center gap-4">
              <div>
                <div className="skeleton-shimmer h-3 w-16 rounded" />
                <div className="skeleton-shimmer mt-1 h-5 w-24 rounded" />
              </div>
              <div className="skeleton-shimmer h-9 w-28 rounded-lg" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
