"use client";

import Link from "next/link";

export function SiteFooter() {
  const openCookiePreferences = () => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("stayease-open-cookie-settings"));
    }
  };

  return (
    <footer className="mt-10 bg-mist">
      <div className="mx-auto flex max-w-[1760px] flex-col gap-6 px-4 py-8 text-xs text-muted sm:px-6 lg:px-10 2xl:px-14">
        <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-start">
          <div>
            <Link href="/" className="text-lg font-semibold text-ink">StayEase</Link>
            <p className="mt-2">Beautiful stays. Effortless getaways.</p>
          </div>
          <nav className="flex flex-wrap items-center gap-x-6 gap-y-2" aria-label="Footer navigation">
            <Link href="/" className="hover:text-forest transition-colors">Explore Stays</Link>
            <Link href="/terms" className="hover:text-forest transition-colors font-medium">Terms & Conditions</Link>
            <Link href="/privacy" className="hover:text-forest transition-colors">Privacy Policy</Link>
            <button
              type="button"
              onClick={openCookiePreferences}
              className="text-left hover:text-forest transition-colors cursor-pointer"
            >
              Cookie Preferences
            </button>
            <a href="mailto:support@stayease.com" className="hover:text-forest transition-colors">Support & Help</a>
          </nav>
        </div>
        <div className="flex flex-col justify-between gap-2 border-t border-line/60 pt-4 text-[11px] sm:flex-row">
          <span>© 2026 StayEase Hospitality Inc. All rights reserved.</span>
          <span>Made for your next great escape.</span>
        </div>
      </div>
    </footer>
  );
}
