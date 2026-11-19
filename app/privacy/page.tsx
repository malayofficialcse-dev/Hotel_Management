"use client";

import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { FigmaIcon } from "@/components/figma-icon";
import { Surface } from "@/components/ui";

export default function PrivacyPolicyPage() {
  const triggerCookieSettings = () => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("stayease-open-cookie-settings"));
    }
  };

  return (
    <>
      <SiteHeader />
      <main className="min-h-screen bg-[#faf9f6] pb-20">
        <div className="border-b border-stone-200/80 bg-white">
          <div className="mx-auto max-w-[1100px] px-5 py-12 lg:px-8">
            <nav className="flex items-center gap-2 text-xs text-muted mb-4" aria-label="Breadcrumb">
              <Link href="/" className="hover:text-forest transition-colors">Home</Link>
              <span>/</span>
              <span className="text-charcoal font-medium">Privacy Policy</span>
            </nav>

            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200/80 px-3 py-1 text-[11px] font-semibold text-emerald-800">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              Privacy & Data Protection Notice
            </span>
            <h1 className="mt-3 text-3xl sm:text-4xl font-bold tracking-tight text-charcoal">
              StayEase Privacy & Cookie Policy
            </h1>
            <p className="mt-2 text-sm text-stone-600 max-w-2xl leading-relaxed">
              Your trust is our highest priority. Discover how StayEase collects, utilizes, safeguards, and handles your personal reservation data and digital pass credentials.
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-6 border-t border-stone-100 pt-4 text-xs text-stone-500">
              <div>
                <span className="text-stone-400">Last Revised:</span>{" "}
                <strong className="text-charcoal font-medium">November 2026</strong>
              </div>
              <div>
                <span className="text-stone-400">Compliant With:</span>{" "}
                <strong className="text-charcoal font-medium">Digital Personal Data Protection (DPDP) Act & GDPR</strong>
              </div>
            </div>
          </div>
        </div>

        <div className="mx-auto max-w-[1100px] px-5 py-10 lg:px-8 space-y-6">
          <Surface className="p-6 sm:p-8">
            <h2 className="text-lg font-bold text-charcoal">1. Information We Collect</h2>
            <div className="mt-3 space-y-3 text-xs sm:text-sm text-stone-700 leading-relaxed">
              <p>
                To facilitate hotel reservations, personalized guest service, and Contactless QR Pass issuance, StayEase collects:
              </p>
              <ul className="list-disc pl-5 space-y-1.5">
                <li><strong>Identity & Contact Details:</strong> Full name, telephone number, verified email address, and billing residency.</li>
                <li><strong>Booking Parameters:</strong> Selected property, room category, check-in/check-out dates, guest count, and special dietary/accessibility preferences.</li>
                <li><strong>Authentication & Security:</strong> Account credentials, encrypted session tokens, and cryptographic keys utilized to sign FastPass QR codes.</li>
                <li><strong>Payment Metadata:</strong> Transaction reference IDs, invoice receipts, and masked card identifiers provided by certified banking gateways. We never retain full card numbers or CVVs.</li>
              </ul>
            </div>
          </Surface>

          <Surface className="p-6 sm:p-8">
            <h2 className="text-lg font-bold text-charcoal">2. How Cookies & Local Storage Are Used</h2>
            <div className="mt-3 space-y-3 text-xs sm:text-sm text-stone-700 leading-relaxed">
              <p>
                StayEase uses first-party cookies and modern local storage mechanisms to deliver essential portal services:
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                <div className="rounded-lg border border-line bg-stone-50 p-4">
                  <strong className="block text-xs font-bold text-forest uppercase tracking-wider mb-1">
                    Strictly Necessary
                  </strong>
                  <p className="text-xs text-stone-600">
                    Required for user sign-in, maintaining your reservation cart, and securing QR pass signatures. Cannot be disabled.
                  </p>
                </div>
                <div className="rounded-lg border border-line bg-stone-50 p-4">
                  <strong className="block text-xs font-bold text-forest uppercase tracking-wider mb-1">
                    Functional & Preference
                  </strong>
                  <p className="text-xs text-stone-600">
                    Remembers your preferred currency (INR ₹, USD, EUR), language settings, and recent search filters.
                  </p>
                </div>
                <div className="rounded-lg border border-line bg-stone-50 p-4">
                  <strong className="block text-xs font-bold text-forest uppercase tracking-wider mb-1">
                    Performance & Analytics
                  </strong>
                  <p className="text-xs text-stone-600">
                    Anonymized telemetry to detect room availability latency, page load metrics, and optimize booking stepper flows.
                  </p>
                </div>
              </div>

              <div className="mt-4 pt-3 flex items-center justify-between border-t border-line">
                <span className="text-xs text-stone-600">
                  Want to modify your cookie preferences or review active consent?
                </span>
                <button
                  type="button"
                  onClick={triggerCookieSettings}
                  className="rounded-[4px] bg-forest px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#344d40] transition-colors"
                >
                  Manage Cookie Preferences
                </button>
              </div>
            </div>
          </Surface>

          <Surface className="p-6 sm:p-8">
            <h2 className="text-lg font-bold text-charcoal">3. Data Sharing & Security Safeguards</h2>
            <div className="mt-3 space-y-3 text-xs sm:text-sm text-stone-700 leading-relaxed">
              <p>
                We do not sell, rent, or lease your private information to third-party advertisers. Data is exclusively transferred to:
              </p>
              <ul className="list-disc pl-5 space-y-1.5">
                <li><strong>Booked Property Operators:</strong> To prepare your suite, execute housekeeping scheduling, and verify guest identity at check-in.</li>
                <li><strong>Payment Gateways:</strong> To authorize bank transactions under RBI-regulated secure standards.</li>
                <li><strong>Legal Authorities:</strong> Only when strictly mandated under statutory law or court order.</li>
              </ul>
            </div>
          </Surface>

          <Surface className="p-6 sm:p-8">
            <h2 className="text-lg font-bold text-charcoal">4. Your Data Rights & Contact</h2>
            <div className="mt-3 space-y-3 text-xs sm:text-sm text-stone-700 leading-relaxed">
              <p>
                You retain the right to review, update, or request the deletion of your personal account data at any time by contacting our Data Protection Officer at <a href="mailto:privacy@stayease.com" className="font-semibold text-forest underline">privacy@stayease.com</a>.
              </p>
            </div>
          </Surface>

          <div className="flex items-center justify-between pt-4">
            <Link href="/terms" className="text-xs font-semibold text-forest hover:underline">
              ← View Terms & Conditions
            </Link>
            <Link href="/" className="text-xs font-semibold text-stone-600 hover:text-charcoal">
              Return to Stays Homepage →
            </Link>
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
