"use client";

import { useState } from "react";
import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { FigmaIcon } from "@/components/figma-icon";
import { Surface } from "@/components/ui";

const SECTIONS = [
  { id: "acceptance", label: "1. Acceptance of Terms" },
  { id: "booking", label: "2. Reservations & Rates" },
  { id: "checkin-checkout", label: "3. Check-In, QR Pass & Identification" },
  { id: "cancellation", label: "4. Cancellation & Refund Policy" },
  { id: "housekeeping", label: "5. Housekeeping & Room Access" },
  { id: "conduct", label: "6. Guest Conduct & Property Care" },
  { id: "payments", label: "7. Payments, Taxes & Security Deposits" },
  { id: "amenities", label: "8. Wi-Fi, Amenities & Valet" },
  { id: "privacy-data", label: "9. Privacy & Cookie Compliance" },
  { id: "liability", label: "10. Limitation of Liability & Force Majeure" },
  { id: "contact", label: "11. Governing Law & Contact" },
];

export default function TermsPage() {
  const [activeSection, setActiveSection] = useState("acceptance");
  const [copiedLink, setCopiedLink] = useState(false);

  const handleCopyLink = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  const handlePrint = () => {
    if (typeof window !== "undefined") {
      window.print();
    }
  };

  return (
    <>
      <SiteHeader />
      <main className="min-h-screen bg-[#faf9f6] pb-20">
        {/* Hero Header */}
        <div className="border-b border-stone-200/80 bg-white">
          <div className="mx-auto max-w-[1240px] px-5 py-12 lg:px-8">
            <nav className="flex items-center gap-2 text-xs text-muted mb-4" aria-label="Breadcrumb">
              <Link href="/" className="hover:text-forest transition-colors">Home</Link>
              <span>/</span>
              <span className="text-charcoal font-medium">Terms & Conditions</span>
            </nav>

            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
              <div>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200/80 px-3 py-1 text-[11px] font-semibold text-emerald-800">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  Legal Standard & Guest Charter
                </span>
                <h1 className="mt-3 text-3xl sm:text-4xl font-bold tracking-tight text-charcoal">
                  Terms & Conditions of Service
                </h1>
                <p className="mt-2 text-sm text-stone-600 max-w-2xl leading-relaxed">
                  These terms govern your reservations, check-ins, stays, and digital experiences across all StayEase partner hotels, resorts, and booking interfaces.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2.5">
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="inline-flex items-center gap-1.5 rounded-[4px] border border-line bg-white px-3.5 py-2 text-xs font-semibold text-charcoal hover:bg-mist transition-colors shadow-xs"
                >
                  <FigmaIcon name="share" className="h-3.5 w-3.5 text-stone-500" />
                  {copiedLink ? "Link Copied! ✓" : "Share"}
                </button>
                <button
                  type="button"
                  onClick={handlePrint}
                  className="inline-flex items-center gap-1.5 rounded-[4px] border border-line bg-white px-3.5 py-2 text-xs font-semibold text-charcoal hover:bg-mist transition-colors shadow-xs"
                >
                  <FigmaIcon name="download" className="h-3.5 w-3.5 text-stone-500" />
                  Print / Save PDF
                </button>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap items-center gap-6 border-t border-stone-100 pt-4 text-xs text-stone-500">
              <div>
                <span className="text-stone-400">Effective Date:</span>{" "}
                <strong className="text-charcoal font-medium">1 November 2026</strong>
              </div>
              <div>
                <span className="text-stone-400">Version:</span>{" "}
                <strong className="text-charcoal font-medium">v3.4.1 (Global Release)</strong>
              </div>
              <div>
                <span className="text-stone-400">Jurisdiction:</span>{" "}
                <strong className="text-charcoal font-medium">Hospitality Regulatory Authority & Cyber Act</strong>
              </div>
            </div>
          </div>
        </div>

        {/* Content Body with Sticky Sidebar */}
        <div className="mx-auto max-w-[1240px] px-5 py-10 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-10">
            {/* Table of contents sidebar */}
            <aside className="hidden lg:block">
              <div className="sticky top-24 rounded-lg border border-line bg-white p-5 shadow-xs">
                <h2 className="text-xs font-bold uppercase tracking-wider text-charcoal mb-3">
                  Contents Navigation
                </h2>
                <nav className="space-y-1">
                  {SECTIONS.map((sec) => (
                    <a
                      key={sec.id}
                      href={`#${sec.id}`}
                      onClick={() => setActiveSection(sec.id)}
                      className={`block rounded px-2.5 py-2 text-xs transition-colors ${
                        activeSection === sec.id
                          ? "bg-mint font-semibold text-forest"
                          : "text-stone-600 hover:bg-stone-50 hover:text-charcoal"
                      }`}
                    >
                      {sec.label}
                    </a>
                  ))}
                </nav>

                <div className="mt-6 border-t border-line pt-4">
                  <p className="text-[11px] text-stone-500 leading-relaxed">
                    Have questions regarding your guest rights or need accessibility accommodations?
                  </p>
                  <Link
                    href="/contact"
                    className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-forest hover:underline"
                  >
                    Contact StayEase Concierge ↗
                  </Link>
                </div>
              </div>
            </aside>

            {/* Terms Articles */}
            <div className="space-y-8">
              {/* Highlight Banner */}
              <div className="rounded-lg border border-forest/20 bg-emerald-50/70 p-5 shadow-xs">
                <div className="flex items-start gap-3">
                  <span className="text-xl">✨</span>
                  <div className="text-xs text-emerald-950 leading-relaxed">
                    <strong className="font-semibold block mb-1 text-emerald-900">
                      Summary of Your Guest Guarantee
                    </strong>
                    All confirmed bookings on StayEase come with our Transparent Rate Guarantee (no hidden resort fees), instantaneous FastPass digital room token generation, and guaranteed room assignment upon check-in.
                  </div>
                </div>
              </div>

              {/* Section 1 */}
              <Surface id="acceptance" className="p-6 sm:p-8">
                <h2 className="text-lg font-bold text-charcoal flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-mint text-xs font-bold text-forest">1</span>
                  Acceptance of Terms
                </h2>
                <div className="mt-4 space-y-3 text-xs sm:text-sm text-stone-700 leading-relaxed">
                  <p>
                    By accessing the StayEase website (<strong className="font-semibold">localhost:3000</strong> or official domains), using our mobile web applications, booking guest rooms, or activating a FastPass Digital Key, you confirm that you are at least 18 years of age and legally authorized to enter into this binding agreement.
                  </p>
                  <p>
                    If you make a reservation on behalf of accompanying guests or a corporate group, you certify that you have full authorization to bind all members of the party to these terms and accept joint responsibility for compliance with all house policies.
                  </p>
                </div>
              </Surface>

              {/* Section 2 */}
              <Surface id="booking" className="p-6 sm:p-8">
                <h2 className="text-lg font-bold text-charcoal flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-mint text-xs font-bold text-forest">2</span>
                  Reservations, Pricing & Sequential Invoicing
                </h2>
                <div className="mt-4 space-y-3 text-xs sm:text-sm text-stone-700 leading-relaxed">
                  <p>
                    <strong>2.1 Confirmation of Bookings:</strong> A reservation is considered finalized only when you receive an official StayEase Booking Reference (e.g., <code className="rounded bg-stone-100 px-1.5 py-0.5 text-xs font-mono text-forest">KLR/2026/872/0001</code>) and an authenticated digital pass in your guest dashboard.
                  </p>
                  <p>
                    <strong>2.2 Rate Inclusions & GST:</strong> All displayed rates are quoted in Indian National Rupees (INR ₹) or local equivalent and include applicable room charges and specified package amenities (such as complimentary buffet breakfast where explicitly noted). Applicable Goods and Services Tax (GST: 12% for room tariffs up to ₹7,500/night and 18% thereafter) is itemized transparently prior to payment confirmation.
                  </p>
                  <p>
                    <strong>2.3 Sequential Tax Invoice:</strong> Under Section 31 of the GST Act and Indian fiscal regulations, each confirmed payment generates an immutable, sequentially numbered Tax Invoice stored in our billing database, downloadable anytime via the Booking Bill portal.
                  </p>
                </div>
              </Surface>

              {/* Section 3 */}
              <Surface id="checkin-checkout" className="p-6 sm:p-8">
                <h2 className="text-lg font-bold text-charcoal flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-mint text-xs font-bold text-forest">3</span>
                  Check-In, FastPass QR & Identification Policy
                </h2>
                <div className="mt-4 space-y-3 text-xs sm:text-sm text-stone-700 leading-relaxed">
                  <div className="rounded-lg bg-stone-50 border border-stone-200 p-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div>
                        <span className="text-stone-500 uppercase font-semibold text-[10px] block">Standard Check-In Time</span>
                        <strong className="text-sm text-charcoal">From 2:00 PM (14:00 hrs)</strong>
                      </div>
                      <div>
                        <span className="text-stone-500 uppercase font-semibold text-[10px] block">Standard Check-Out Time</span>
                        <strong className="text-sm text-charcoal">By 11:00 AM (11:00 hrs)</strong>
                      </div>
                    </div>
                  </div>
                  <p>
                    <strong>3.1 FastPass Contactless QR:</strong> Each reservation produces a cryptographically signed HMAC-SHA256 JWT QR code. Presenting this code at the Front Desk contactless scanner bypasses paperwork and immediately issues your room credentials.
                  </p>
                  <p>
                    <strong>3.2 Mandatory Government ID:</strong> In accordance with local hospitality and law enforcement regulations, all adult occupants must present original, valid government-issued photographic identification (Aadhaar Card, Passport, Voter ID, or Driving License) upon arrival. PAN Cards are not accepted as valid proof of address. Foreign nationals must furnish a valid passport and visa or OCI card.
                  </p>
                  <p>
                    <strong>3.3 Early Arrival & Late Departure:</strong> Early check-in prior to 10:00 AM or late check-out beyond 1:00 PM is subject to room availability and may incur a surcharge equivalent to 50% or 100% of the published day tariff.
                  </p>
                </div>
              </Surface>

              {/* Section 4 */}
              <Surface id="cancellation" className="p-6 sm:p-8">
                <h2 className="text-lg font-bold text-charcoal flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-mint text-xs font-bold text-forest">4</span>
                  Cancellation, No-Show & Refund Policy
                </h2>
                <div className="mt-4 space-y-4 text-xs sm:text-sm text-stone-700 leading-relaxed">
                  <div className="overflow-x-auto rounded-lg border border-line">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-stone-50 text-stone-600 font-semibold border-b border-line">
                        <tr>
                          <th className="p-3">Cancellation Window</th>
                          <th className="p-3">Refund Eligibility</th>
                          <th className="p-3">Processing Timeline</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-line bg-white">
                        <tr>
                          <td className="p-3 font-medium text-charcoal">≥ 48 Hours before check-in</td>
                          <td className="p-3 text-emerald-700 font-semibold">100% Full Refund (Zero fee)</td>
                          <td className="p-3">3 to 5 business days</td>
                        </tr>
                        <tr>
                          <td className="p-3 font-medium text-charcoal">24 to 48 Hours before check-in</td>
                          <td className="p-3 text-amber-700 font-semibold">50% Refund</td>
                          <td className="p-3">5 to 7 business days</td>
                        </tr>
                        <tr>
                          <td className="p-3 font-medium text-charcoal">&lt; 24 Hours or No-Show</td>
                          <td className="p-3 text-rose-700 font-semibold">Non-refundable (1st night retained)</td>
                          <td className="p-3">N/A</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  <p>
                    Refunds are automatically initiated to the original payment source (Credit/Debit card, UPI ID, or Net Banking account) used during reservation checkout.
                  </p>
                </div>
              </Surface>

              {/* Section 5 */}
              <Surface id="housekeeping" className="p-6 sm:p-8">
                <h2 className="text-lg font-bold text-charcoal flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-mint text-xs font-bold text-forest">5</span>
                  Housekeeping, Room Cleanliness & Real-Time Sync
                </h2>
                <div className="mt-4 space-y-3 text-xs sm:text-sm text-stone-700 leading-relaxed">
                  <p>
                    <strong>5.1 Live Housekeeping Standards:</strong> StayEase operates a real-time event-driven Housekeeping Dispatch system. When a guest completes check-out, the room is marked as <span className="font-mono text-xs bg-amber-50 text-amber-900 border border-amber-200 px-1 py-0.5 rounded">DIRTY</span> and immediately queued for Deep Sanitization, Linen Replacement, and Room Inspection before being unlocked for new guest occupancy.
                  </p>
                  <p>
                    <strong>5.2 Daily Turn & Privacy Signs:</strong> Daily housekeeping services occur between 9:00 AM and 5:00 PM. If you display a digital or physical &quot;Do Not Disturb&quot; signal, staff will not enter your suite except in the event of suspected medical emergency or property safety concern.
                  </p>
                </div>
              </Surface>

              {/* Section 6 */}
              <Surface id="conduct" className="p-6 sm:p-8">
                <h2 className="text-lg font-bold text-charcoal flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-mint text-xs font-bold text-forest">6</span>
                  Guest Conduct, Property Care & Zero Tolerance Policy
                </h2>
                <div className="mt-4 space-y-3 text-xs sm:text-sm text-stone-700 leading-relaxed">
                  <p>
                    <strong>6.1 100% Smoke-Free Suites:</strong> All indoor guest rooms, balconies, and corridors are strictly non-smoking. A specialized sanitization and ozone cleaning fee of ₹5,000 will be assessed against guests found smoking or using e-cigarettes/vaping devices in prohibited areas. Designated outdoor smoking zones are provided on property grounds.
                  </p>
                  <p>
                    <strong>6.2 Property Damage:</strong> Guests will be held financially responsible for willful destruction, damage, or loss of hotel assets, electronic appliances, artwork, or linen. The replacement value will be charged to the card on file or deducted from security deposits.
                  </p>
                  <p>
                    <strong>6.3 Quiet Hours:</strong> To ensure restful sleep for all guests, quiet hours are observed from 10:30 PM to 7:00 AM. Loud audio equipment or disruptive behavior in public areas is prohibited during these hours.
                  </p>
                </div>
              </Surface>

              {/* Section 7 */}
              <Surface id="payments" className="p-6 sm:p-8">
                <h2 className="text-lg font-bold text-charcoal flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-mint text-xs font-bold text-forest">7</span>
                  Payment Security, Cards & Incidental Deposits
                </h2>
                <div className="mt-4 space-y-3 text-xs sm:text-sm text-stone-700 leading-relaxed">
                  <p>
                    All payment transactions processed on StayEase are encrypted using 256-bit SSL protocols and adhere to strict PCI-DSS Level 1 specifications. We do not store full CVV codes or primary credit card numbers on our local databases.
                  </p>
                  <p>
                    Upon check-in, the hotel reception may request a pre-authorization hold or nominal cash deposit to cover incidental services (such as minibar, spa treatments, or room service). Any unutilized balance is released promptly upon check-out inspection.
                  </p>
                </div>
              </Surface>

              {/* Section 8 */}
              <Surface id="amenities" className="p-6 sm:p-8">
                <h2 className="text-lg font-bold text-charcoal flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-mint text-xs font-bold text-forest">8</span>
                  High-Speed Wi-Fi & Digital Amenities Usage
                </h2>
                <div className="mt-4 space-y-3 text-xs sm:text-sm text-stone-700 leading-relaxed">
                  <p>
                    Complimentary high-speed guest Wi-Fi is provided for lawful personal browsing, video conferencing, and entertainment. Guests may not use hotel networks for illegal file sharing, malicious cyber operations, or downloading prohibited material under the Information Technology Act. Network credentials provided on your Digital Pass are private and intended solely for registered guests.
                  </p>
                </div>
              </Surface>

              {/* Section 9 */}
              <Surface id="privacy-data" className="p-6 sm:p-8">
                <h2 className="text-lg font-bold text-charcoal flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-mint text-xs font-bold text-forest">9</span>
                  Privacy, Cookies & Digital Pass Encryption
                </h2>
                <div className="mt-4 space-y-3 text-xs sm:text-sm text-stone-700 leading-relaxed">
                  <p>
                    StayEase is committed to safeguarding your personal data. We utilize strictly necessary cookies to handle user authentication, booking cart state, and token validation. Analytical and preference cookies are only deployed with your consent, as outlined in our{" "}
                    <Link href="/privacy" className="font-semibold text-forest underline">
                      Privacy & Cookie Policy
                    </Link>.
                  </p>
                  <p>
                    You can inspect or adjust your cookie preferences at any time using the Cookie Preferences controls available at the bottom of the page.
                  </p>
                </div>
              </Surface>

              {/* Section 10 */}
              <Surface id="liability" className="p-6 sm:p-8">
                <h2 className="text-lg font-bold text-charcoal flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-mint text-xs font-bold text-forest">10</span>
                  Limitation of Liability & Force Majeure
                </h2>
                <div className="mt-4 space-y-3 text-xs sm:text-sm text-stone-700 leading-relaxed">
                  <p>
                    <strong>10.1 Personal Valuables:</strong> Electronic room safes are provided in each suite for storage of jewelry, cash, and passports. StayEase and hotel partners shall not be held liable for the loss of unregistered valuables not deposited in the hotel main vault.
                  </p>
                  <p>
                    <strong>10.2 Force Majeure:</strong> Neither StayEase nor the guest shall be liable for non-performance or cancellation arising from acts of God, flood, cyclone, earthquake, civil unrest, government embargoes, or sudden pandemic travel restrictions beyond reasonable control. In such events, full booking credits or rebooking vouchers will be issued.
                  </p>
                </div>
              </Surface>

              {/* Section 11 */}
              <Surface id="contact" className="p-6 sm:p-8">
                <h2 className="text-lg font-bold text-charcoal flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-mint text-xs font-bold text-forest">11</span>
                  Governing Law, Dispute Resolution & Contact Information
                </h2>
                <div className="mt-4 space-y-3 text-xs sm:text-sm text-stone-700 leading-relaxed">
                  <p>
                    These Terms shall be governed by and construed in accordance with the laws of the Republic of India. Any legal proceedings or dispute claims arising hereunder shall be subject to the exclusive jurisdiction of the competent courts in New Delhi or Kolkata.
                  </p>
                  <div className="mt-4 rounded-lg bg-stone-50 border border-stone-200 p-4">
                    <h3 className="font-semibold text-charcoal text-xs uppercase tracking-wider mb-2">
                      Legal Compliance & Guest Support Desk
                    </h3>
                    <p className="text-xs text-stone-600">
                      StayEase Hospitality Tech Services Private Limited<br />
                      Corporate Tower B, Aerocity Hospitality District, New Delhi 110037, India<br />
                      Email: <a href="mailto:legal@stayease.com" className="font-semibold text-forest underline">legal@stayease.com</a> · Support Desk: <span className="font-semibold text-charcoal">+91 (800) 456-7890</span>
                    </p>
                  </div>
                </div>
              </Surface>

              {/* Quick Jump Back to Top */}
              <div className="flex items-center justify-between border-t border-line pt-6">
                <Link href="/" className="text-xs font-semibold text-forest hover:underline">
                  ← Return to Explore Stays
                </Link>
                <button
                  type="button"
                  onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
                  className="text-xs font-medium text-stone-500 hover:text-charcoal"
                >
                  ↑ Back to Top
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
