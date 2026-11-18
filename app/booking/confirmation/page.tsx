"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { QRCodeSVG } from "qrcode.react";
import { BookingStepper } from "@/components/booking-stepper";
import { BookingSummary } from "@/components/booking-summary";
import { FigmaIcon } from "@/components/figma-icon";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { Button, Surface } from "@/components/ui";
import { api, type UserSession, type QRPassResponse } from "@/lib/api-client";
import { useBooking } from "@/components/booking-provider";

const calendarEvent = `BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VEVENT
SUMMARY:StayEase booking - The Palm House, Goa
DTSTART:20261218T083000Z
DTEND:20261221T053000Z
LOCATION:The Palm House, Candolim, Goa
DESCRIPTION:Booking ID SE-261218-0482
END:VEVENT
END:VCALENDAR`;

export default function BookingConfirmationPage() {
  const { guestDetails, checkInDate, checkOutDate } = useBooking();
  const guestName = `${guestDetails.firstName} ${guestDetails.lastName}`.trim() || "Guest";
  const [bookingCode, setBookingCode] = useState("SE-261218-0482");
  const [userChecked, setUserChecked] = useState(false);
  const [user, setUser] = useState<UserSession | null>(null);

  // Digital Pass & Signed QR state
  const [qrPassData, setQrPassData] = useState<QRPassResponse | null>(null);
  const [qrLoading, setQrLoading] = useState(true);
  const [copiedWifi, setCopiedWifi] = useState(false);
  const [showTokenInfo, setShowTokenInfo] = useState(false);

  useEffect(() => {
    const code = new URLSearchParams(window.location.search).get("code");
    if (code) setBookingCode(code);
  }, []);

  useEffect(() => {
    if (!bookingCode) return;
    let active = true;
    setQrLoading(true);
    api.getQRPass(bookingCode)
      .then((res) => {
        if (active && res?.data) {
          setQrPassData(res.data);
        }
      })
      .catch((err) => {
        console.warn("Digital QR pass retrieval note:", err?.message || err);
      })
      .finally(() => {
        if (active) setQrLoading(false);
      });
    return () => { active = false; };
  }, [bookingCode]);

  useEffect(() => {
    const syncUser = () => {
      setUser(api.getUser());
      setUserChecked(true);
    };
    syncUser();
    window.addEventListener("stayease-user-updated", syncUser);
    return () => window.removeEventListener("stayease-user-updated", syncUser);
  }, []);

  if (!userChecked) {
    return (
      <>
        <SiteHeader />
        <main className="mx-auto max-w-[800px] px-5 py-16 text-center">
          <div className="rounded-lg border border-line bg-white p-12 text-sm text-muted">
            Checking session…
          </div>
        </main>
        <SiteFooter />
      </>
    );
  }

  if (!user) {
    const returnUrl = typeof window !== "undefined" ? window.location.pathname + window.location.search : "/bookings";
    return (
      <>
        <SiteHeader />
        <main className="mx-auto max-w-[560px] px-5 py-16 text-center">
          <div className="rounded-xl border border-line bg-white p-8 shadow-sm">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#f0f4f1] text-forest">
              <FigmaIcon name="lock" className="h-6 w-6" />
            </div>
            <h1 className="mt-4 text-lg font-bold text-charcoal">Sign in to view booking confirmation</h1>
            <p className="mt-2 text-xs text-muted leading-relaxed">
              You are currently signed out. For guest privacy and security, booking confirmation details can only be viewed while signed in to an authorized account.
            </p>
            <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                href={`/auth/login?returnUrl=${encodeURIComponent(returnUrl)}`}
                className="w-full sm:w-auto rounded bg-forest px-5 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-[#344d40] transition-colors"
              >
                Sign in to view booking
              </Link>
              <Link
                href="/auth/register"
                className="w-full sm:w-auto rounded border border-line bg-white px-4 py-2.5 text-xs font-semibold text-charcoal hover:bg-mist transition-colors"
              >
                Create account
              </Link>
            </div>
            <div className="mt-4">
              <Link href="/" className="text-xs text-muted hover:text-forest underline">
                Return to Explore
              </Link>
            </div>
          </div>
        </main>
        <SiteFooter />
      </>
    );
  }

  const isCheckedIn = qrPassData?.booking?.status === "CHECKED_IN";
  const qrValue = qrPassData?.token || (typeof window !== "undefined" ? `${window.location.origin}/booking/confirmation?code=${bookingCode}` : bookingCode);

  const b = qrPassData?.booking;
  const activeGuestName = b ? `${b.guest_first_name} ${b.guest_last_name}`.trim() : guestName;
  const activeGuestFirstName = b?.guest_first_name || guestDetails.firstName || user?.name?.split(" ")[0] || "Guest";
  const activeHotelName = b?.hotel_name || "The Palm House, Goa";
  const activeRoomName = b?.room_type_name || "Deluxe Suite 101";
  const activeCheckIn = b?.check_in_date ? String(b.check_in_date).split("T")[0] : checkInDate;
  const activeCheckOut = b?.check_out_date ? String(b.check_out_date).split("T")[0] : checkOutDate;
  const activeNights = b?.total_nights || 1;
  const activeGuestsCount = b?.guests_count || 2;
  const activeRoomCount = b?.room_count || 1;
  const activeEmail = b?.guest_email || guestDetails.email || user?.email || "your email address";

  const handleCopyWifi = () => {
    if (qrPassData?.digitalPass?.wifiPassword) {
      navigator.clipboard.writeText(qrPassData.digitalPass.wifiPassword);
      setCopiedWifi(true);
      setTimeout(() => setCopiedWifi(false), 2000);
    }
  };

  return (
    <>
      <SiteHeader />
      <BookingStepper active={4} />
      <main className="mx-auto max-w-[1160px] px-5 py-7 lg:px-0">
        <section className="rounded-[4px] bg-mint px-5 py-8 text-center sm:py-10">
          <span className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-white"><FigmaIcon name="check" className="h-5 w-5" /></span>
          <h1 className="mt-4 text-[24px] font-semibold tracking-[-0.5px]">
            You’re going to {activeHotelName.split(",")[0]}, {activeGuestFirstName}!
          </h1>
          <p className="mt-2 text-xs text-muted">Your stay is confirmed. Let the countdown to slow mornings begin.</p>
          <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
            <span className="inline-block rounded-[4px] bg-white px-3 py-1 text-[9px] font-semibold uppercase tracking-wider text-charcoal shadow-xs">
              {isCheckedIn ? "CHECKED-IN" : "CONFIRMED"} · BOOKING ID {bookingCode}
            </span>
            {isCheckedIn && (
              <span className="inline-flex items-center gap-1.5 rounded-[4px] bg-forest px-3 py-1 text-[9px] font-semibold text-white">
                <span className="h-1.5 w-1.5 rounded-full bg-[#52b788] animate-pulse" /> Digital Pass Active
              </span>
            )}
          </div>
        </section>

        <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="space-y-4">
            {/* Contactless Mobile QR Pass Card */}
            <Surface className="overflow-hidden border border-line bg-gradient-to-br from-white via-white to-[#f4f8f5] p-5 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line pb-3">
                <div className="flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-mint text-forest">
                    <span className="text-sm font-bold">🔑</span>
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-charcoal">Digital Room Pass & Contactless QR</h2>
                    <p className="text-[10px] text-muted">Cryptographically Signed HMAC-SHA256 Token</p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[9px] font-semibold ${
                    isCheckedIn ? "bg-emerald-100 text-emerald-800" : "bg-forest/10 text-forest"
                  }`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${isCheckedIn ? "bg-emerald-600" : "bg-forest"} animate-pulse`} />
                    {isCheckedIn ? "Checked In · Room Ready" : "FastPass Ready For Scan"}
                  </span>
                </div>
              </div>

              <div className="mt-4 grid gap-5 sm:grid-cols-[160px_1fr]">
                {/* QR Display */}
                <div className="flex flex-col items-center justify-center rounded-lg border border-line/60 bg-white p-3 text-center shadow-xs">
                  <div className="relative">
                    <QRCodeSVG
                      value={qrValue}
                      size={132}
                      level="M"
                      includeMargin
                      className="rounded"
                    />
                  </div>
                  <p className="mt-2 text-[9px] font-medium text-muted">
                    {qrLoading ? "Generating Signed Pass…" : "Front Desk Scan Pass"}
                  </p>
                  {qrPassData?.token && (
                    <button
                      type="button"
                      onClick={() => setShowTokenInfo(!showTokenInfo)}
                      className="mt-1 text-[8px] text-forest underline hover:opacity-80"
                    >
                      {showTokenInfo ? "Hide Signature" : "View JWT Pass Details"}
                    </button>
                  )}
                </div>

                {/* Digital Pass Room & Amenities Details */}
                <div className="flex flex-col justify-between space-y-3">
                  <div>
                    <div className="grid grid-cols-2 gap-2 text-[11px]">
                      <div className="rounded border border-line/40 bg-white p-2">
                        <span className="block text-[9px] uppercase tracking-wider text-muted">Room Allocated</span>
                        <strong className="mt-0.5 block text-charcoal">
                          {qrPassData?.digitalPass?.roomAssigned || activeRoomName}
                        </strong>
                      </div>
                      <div className="rounded border border-line/40 bg-white p-2">
                        <span className="block text-[9px] uppercase tracking-wider text-muted">Pass Holder</span>
                        <strong className="mt-0.5 block text-charcoal truncate">
                          {activeGuestName}
                        </strong>
                      </div>
                    </div>

                    {/* Wi-Fi & Hotel Contact Credentials */}
                    <div className="mt-3 rounded-lg border border-[#cbe3d6] bg-[#f0f8f3] p-3 text-[11px]">
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1.5 text-[10px] font-semibold text-forest">
                          <span>📶</span> High-Speed Guest Wi-Fi
                        </span>
                        <button
                          type="button"
                          onClick={handleCopyWifi}
                          className="rounded bg-white px-2 py-0.5 text-[9px] font-medium text-forest shadow-xs hover:bg-mist transition-colors"
                        >
                          {copiedWifi ? "Copied! ✓" : "Copy Password"}
                        </button>
                      </div>
                      <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-[10px] text-charcoal">
                        <span>SSID: <strong className="font-mono">{qrPassData?.digitalPass?.wifiSsid || "StayEase-Guest"}</strong></span>
                        <span>Key: <strong className="font-mono">{qrPassData?.digitalPass?.wifiPassword || "StayEase@2026"}</strong></span>
                      </div>
                    </div>
                  </div>

                  {/* Contact Shortcuts & Staff Check-In link */}
                  <div className="flex flex-wrap items-center justify-between gap-2 border-t border-line/60 pt-2 text-[10px]">
                    <div className="flex items-center gap-3 text-muted">
                      <span>Front Desk: <strong className="text-charcoal">{qrPassData?.digitalPass?.frontDesk || "Dial 9"}</strong></span>
                      <span>Emergency: <strong className="text-charcoal">+91 832 245 9999</strong></span>
                    </div>
                    {qrPassData?.token && (
                      <Link
                        href={`/admin/check-in?token=${encodeURIComponent(qrPassData.token)}`}
                        className="inline-flex items-center gap-1 rounded bg-forest/10 px-2 py-1 text-[9px] font-semibold text-forest hover:bg-forest hover:text-white transition-colors"
                      >
                        Staff Scanner View ↗
                      </Link>
                    )}
                  </div>
                </div>
              </div>

              {showTokenInfo && qrPassData?.token && (
                <div className="mt-3 rounded border border-line bg-gray-50 p-2.5 font-mono text-[9px] text-muted break-all">
                  <p className="font-semibold text-charcoal">Cryptographic JWT Token Payload:</p>
                  <p className="mt-1 select-all">{qrPassData.token}</p>
                </div>
              )}
            </Surface>

            <Surface className="p-5">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold">Your reservation</h2>
                <span className="rounded-[4px] bg-mint px-2 py-1 text-[9px] font-semibold text-forest">Payment successful</span>
              </div>
              <div className="mt-4 grid gap-4 sm:grid-cols-[150px_1fr]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/assets/figma/e4bd0.png" alt={activeHotelName} className="h-[105px] w-full rounded-[4px] object-cover" />
                <div>
                  <h3 className="text-sm font-semibold">{activeHotelName}</h3>
                  <p className="mt-2 text-[10px] text-muted">Candolim Beach Road, North Goa, Goa 403515, India</p>
                  <p className="mt-2 text-[10px] text-muted">+91 832 245 6789</p>
                  <a href="#location" className="mt-2 inline-block text-[10px] font-medium text-forest">Get directions ↗</a>
                </div>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3 border-t border-line pt-4 text-[10px]">
                <div><p className="text-muted">CHECK-IN</p><p className="mt-1 font-semibold">{formatStayDate(activeCheckIn)}</p><p className="mt-1 text-muted">From 2:00 PM</p></div>
                <div><p className="text-muted">CHECK-OUT</p><p className="mt-1 font-semibold">{formatStayDate(activeCheckOut)}</p><p className="mt-1 text-muted">By 11:00 AM</p></div>
              </div>
              <div className="mt-4 flex items-center justify-between gap-4 border-t border-line pt-4">
                <div className="text-[10px]">
                  <p className="font-semibold">{activeGuestName} · {activeGuestsCount} {activeGuestsCount === 1 ? "adult" : "adults"}</p>
                  <p className="mt-1 text-muted">{activeRoomCount} {activeRoomCount === 1 ? "room" : "rooms"} · {activeRoomName} · {activeNights} {activeNights === 1 ? "night" : "nights"}</p>
                  <p className="mt-1 text-muted">Breakfast included · Free High-Speed Wi-Fi</p>
                  <p className="mt-2 text-forest font-medium">Show your Contactless QR Pass above upon arrival for instant check-in.</p>
                </div>
              </div>
            </Surface>
            <Surface className="bg-sky p-5">
              <h2 className="text-sm font-semibold">All the details, delivered</h2>
              <p className="mt-3 flex items-center gap-2 text-[10px]"><FigmaIcon name="mail" className="h-4 w-4" /> Your confirmation and payment receipt have been sent to {activeEmail}.</p>
              <div className="mt-4 flex flex-wrap gap-2">
                <a href={`/booking/bill?code=${encodeURIComponent(bookingCode)}`} className="inline-flex min-h-9 items-center gap-2 rounded-[4px] bg-white px-3 text-[10px] font-semibold text-charcoal shadow-sm hover:bg-mist">View & Print Tax Invoice <FigmaIcon name="download" className="h-3.5 w-3.5" /></a>
                <a href={`data:text/calendar;charset=utf-8,${encodeURIComponent(calendarEvent)}`} download="stayease-stay.ics" className="inline-flex min-h-9 items-center gap-2 rounded-[4px] bg-white px-3 text-[10px] font-semibold">Add to calendar <FigmaIcon name="calendar-plus" className="h-3.5 w-3.5" /></a>
              </div>
            </Surface>
            <Surface className="p-5">
              <h2 className="text-sm font-semibold">Before you pack</h2>
              <div className="mt-4 grid gap-4 text-[10px] sm:grid-cols-3">
                <p><FigmaIcon name="credit-card" className="mb-2 h-4 w-4" /><strong className="block">Bring a valid photo ID</strong><span className="mt-1 block text-muted">Required for all adult guests.</span></p>
                <p><FigmaIcon name="calendar" className="mb-2 h-4 w-4" /><strong className="block">Arriving early?</strong><span className="mt-1 block text-muted">Contact the hotel to arrange it.</span></p>
                <p><FigmaIcon name="sun" className="mb-2 h-4 w-4" /><strong className="block">Pack for sunshine</strong><span className="mt-1 block text-muted">Goa in December: 22–31°C.</span></p>
              </div>
            </Surface>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <Button href="/" variant="outline">Back to explore</Button>
              <Button href="/bookings">View my bookings <FigmaIcon name="arrow-right" className="h-4 w-4" /></Button>
            </div>
          </div>
          <div className="lg:sticky lg:top-24 lg:h-fit"><BookingSummary booking={b} /></div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}

function formatStayDate(value: string) {
  const date = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) return "Select a date";
  return new Intl.DateTimeFormat("en-GB", { weekday: "long", day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }).format(date);
}
