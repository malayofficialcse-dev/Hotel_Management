"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { FigmaIcon } from "./figma-icon";

const STORAGE_KEY = "stayease_cookie_consent";

interface CookiePreferences {
  essential: boolean; // Always true
  analytics: boolean;
  preferences: boolean;
  marketing: boolean;
  timestamp: string;
}

export function CookieBanner() {
  const [isOpen, setIsOpen] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [analytics, setAnalytics] = useState(true);
  const [preferences, setPreferences] = useState(true);
  const [marketing, setMarketing] = useState(false);

  useEffect(() => {
    // Check if consent has already been saved in localStorage
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (!saved) {
        // Slowly glide up from bottom after page renders
        const timer = setTimeout(() => {
          setIsOpen(true);
        }, 800);
        return () => clearTimeout(timer);
      }
    } catch {
      // Fallback if localStorage is restricted
      const timer = setTimeout(() => setIsOpen(true), 800);
      return () => clearTimeout(timer);
    }
  }, []);

  // Listen for custom event to re-open cookie settings from footer or legal pages
  useEffect(() => {
    const handleReopen = () => {
      setShowDetails(true);
      setIsOpen(true);
    };

    window.addEventListener("stayease-open-cookie-settings", handleReopen);
    return () => window.removeEventListener("stayease-open-cookie-settings", handleReopen);
  }, []);

  const saveConsent = (prefs: Omit<CookiePreferences, "timestamp">) => {
    const data: CookiePreferences = {
      ...prefs,
      timestamp: new Date().toISOString(),
    };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch {
      // Ignored
    }
    setIsOpen(false);
    setShowDetails(false);
  };

  const handleAcceptAll = () => {
    saveConsent({
      essential: true,
      analytics: true,
      preferences: true,
      marketing: true,
    });
  };

  const handleEssentialOnly = () => {
    saveConsent({
      essential: true,
      analytics: false,
      preferences: false,
      marketing: false,
    });
  };

  const handleSaveCustom = () => {
    saveConsent({
      essential: true,
      analytics,
      preferences,
      marketing,
    });
  };

  return (
    <aside
      aria-label="Cookie consent banner"
      role="region"
      className={`fixed bottom-0 left-0 right-0 z-50 w-full transform transition-all duration-1000 ease-out ${
        isOpen
          ? "translate-y-0 opacity-100 pointer-events-auto shadow-[0_-12px_40px_rgba(0,0,0,0.18)]"
          : "translate-y-full opacity-0 pointer-events-none"
      }`}
    >
      <div className="border-t border-stone-200/90 bg-white/95 backdrop-blur-md">
        <div className="mx-auto max-w-[1400px] px-4 py-5 sm:px-6 sm:py-6 lg:px-10">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
            {/* Left Content */}
            <div className="max-w-3xl">
              <div className="flex items-center gap-2 mb-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-amber-100 text-base shadow-xs" role="img" aria-label="Cookie">
                  🍪
                </span>
                <h3 className="text-sm sm:text-base font-bold text-charcoal tracking-tight">
                  We respect your privacy & care about your stay experience
                </h3>
              </div>

              <p className="text-xs sm:text-[13px] text-stone-600 leading-relaxed">
                StayEase uses cookies and local device tokens to ensure high-security authentication, maintain your booking reservation flow, and provide instant FastPass Digital Key issuance. By continuing, you agree to our{" "}
                <Link
                  href="/terms"
                  className="font-semibold text-forest underline hover:text-[#2d4738] transition-colors"
                >
                  Terms and Conditions
                </Link>{" "}
                and{" "}
                <Link
                  href="/privacy"
                  className="font-semibold text-forest underline hover:text-[#2d4738] transition-colors"
                >
                  Privacy Policy
                </Link>
                .
              </p>
            </div>

            {/* Right Action Buttons */}
            <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 flex-shrink-0">
              <button
                type="button"
                onClick={() => setShowDetails(!showDetails)}
                className="rounded-[4px] border border-stone-300 bg-white px-3.5 py-2.5 text-xs font-semibold text-stone-700 hover:border-stone-400 hover:bg-stone-50 transition-colors shadow-xs"
              >
                {showDetails ? "Hide Preferences" : "Customize Settings"}
              </button>

              <button
                type="button"
                onClick={handleEssentialOnly}
                className="rounded-[4px] border border-stone-300 bg-stone-100 px-4 py-2.5 text-xs font-semibold text-stone-800 hover:bg-stone-200 transition-colors shadow-xs"
              >
                Essential Only
              </button>

              <button
                type="button"
                onClick={handleAcceptAll}
                className="rounded-[4px] bg-forest px-5 py-2.5 text-xs font-semibold text-white hover:bg-[#344d40] transition-colors shadow-sm"
              >
                Accept All Cookies
              </button>
            </div>
          </div>

          {/* Expanded Granular Settings */}
          {showDetails && (
            <div className="mt-5 border-t border-stone-200 pt-5 transition-all">
              <h4 className="text-xs font-bold uppercase tracking-wider text-charcoal mb-3">
                Granular Cookie Preferences
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                {/* Essential Category */}
                <div className="rounded-lg border border-stone-200 bg-stone-50/80 p-3.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-charcoal">Strictly Necessary</span>
                    <span className="rounded bg-stone-200 px-2 py-0.5 text-[10px] font-semibold text-stone-700">
                      Always Active
                    </span>
                  </div>
                  <p className="mt-1.5 text-[11px] text-stone-500 leading-snug">
                    Session security tokens, reservation basket, and cryptographically signed QR codes.
                  </p>
                </div>

                {/* Preferences Category */}
                <div className="rounded-lg border border-stone-200 bg-white p-3.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-charcoal">Preferences & Localization</span>
                    <label className="relative inline-flex cursor-pointer items-center">
                      <input
                        type="checkbox"
                        checked={preferences}
                        onChange={(e) => setPreferences(e.target.checked)}
                        className="peer sr-only"
                      />
                      <div className="peer h-5 w-9 rounded-full bg-stone-200 after:absolute after:left-[2px] after:top-[2px] after:h-4 after:w-4 after:rounded-full after:bg-white after:transition-all after:content-[''] peer-checked:bg-forest peer-checked:after:translate-x-full peer-focus:outline-none" />
                    </label>
                  </div>
                  <p className="mt-1.5 text-[11px] text-stone-500 leading-snug">
                    Remembers your preferred currency (INR ₹), selected destination cities, and filters.
                  </p>
                </div>

                {/* Analytics Category */}
                <div className="rounded-lg border border-stone-200 bg-white p-3.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-charcoal">Telemetry & Performance</span>
                    <label className="relative inline-flex cursor-pointer items-center">
                      <input
                        type="checkbox"
                        checked={analytics}
                        onChange={(e) => setAnalytics(e.target.checked)}
                        className="peer sr-only"
                      />
                      <div className="peer h-5 w-9 rounded-full bg-stone-200 after:absolute after:left-[2px] after:top-[2px] after:h-4 after:w-4 after:rounded-full after:bg-white after:transition-all after:content-[''] peer-checked:bg-forest peer-checked:after:translate-x-full peer-focus:outline-none" />
                    </label>
                  </div>
                  <p className="mt-1.5 text-[11px] text-stone-500 leading-snug">
                    Anonymous telemetry to prevent room booking errors and measure server response latency.
                  </p>
                </div>
              </div>

              <div className="mt-4 flex justify-end gap-2 border-t border-stone-100 pt-3">
                <button
                  type="button"
                  onClick={() => setShowDetails(false)}
                  className="rounded-[4px] px-3 py-1.5 text-xs text-stone-600 hover:text-stone-900"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveCustom}
                  className="rounded-[4px] bg-forest px-4 py-1.5 text-xs font-semibold text-white hover:bg-[#344d40]"
                >
                  Save My Preferences
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
