"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { AdminShell } from "@/components/admin/admin-shell";
import { api, type AdminBooking } from "@/lib/api-client";

function CheckInContent() {
  const searchParams = useSearchParams();
  const initialToken = searchParams.get("token") || "";

  const [tokenInput, setTokenInput] = useState(initialToken);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [verifiedBooking, setVerifiedBooking] = useState<AdminBooking | null>(null);
  const [alreadyCheckedIn, setAlreadyCheckedIn] = useState(false);

  // Quick lookup by code if staff doesn't have raw token
  const [manualCode, setManualCode] = useState("");
  const [codeLoading, setCodeLoading] = useState(false);

  // Auto-verify if token is present in URL
  useEffect(() => {
    if (initialToken) {
      setTokenInput(initialToken);
      handleVerify(initialToken);
    }
  }, [initialToken]);

  const handleVerify = async (tokenToVerify?: string) => {
    const token = (tokenToVerify || tokenInput).trim();
    if (!token) {
      setError("Please paste or scan a valid QR pass token");
      return;
    }

    setLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const res = await api.verifyQRPass(token);
      if (res && res.success) {
        setVerifiedBooking(res.data);
        setAlreadyCheckedIn(res.alreadyCheckedIn);
        setSuccessMessage(res.message);
      } else {
        setError(res?.message || "Failed to verify pass");
      }
    } catch (err: any) {
      setError(err?.message || "Invalid or expired QR pass token");
    } finally {
      setLoading(false);
    }
  };

  const handleLookupByCode = async () => {
    if (!manualCode.trim()) return;
    setCodeLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const pass = await api.getQRPass(manualCode.trim());
      if (pass?.data?.token) {
        setTokenInput(pass.data.token);
        await handleVerify(pass.data.token);
      } else {
        setError("Could not find an active pass for booking code: " + manualCode);
      }
    } catch (err: any) {
      setError(err?.message || "Booking code lookup failed");
    } finally {
      setCodeLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-line pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-mint text-base font-bold text-forest">
              🔑
            </span>
            <h1 className="text-xl font-bold tracking-tight text-charcoal">
              Contactless QR Check-In Scanner
            </h1>
          </div>
          <p className="mt-1 text-xs text-muted">
            Front Desk Portal · Verify HMAC-SHA256 cryptographically signed guest passes & mark CHECKED_IN.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/admin/reservations"
            className="rounded border border-line bg-white px-3 py-1.5 text-xs font-semibold text-charcoal hover:bg-mist transition-colors"
          >
            ← All Reservations
          </Link>
        </div>
      </div>

      {/* Main scanner & input grid */}
      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        {/* Left Column: Verification Action & Scanner */}
        <div className="space-y-5">
          {/* Token verification box */}
          <div className="rounded-xl border border-line bg-white p-5 shadow-xs">
            <h2 className="text-sm font-bold text-charcoal flex items-center gap-2">
              <span>📷</span> Scan or Enter Digital Pass Token
            </h2>
            <p className="mt-1 text-xs text-muted">
              Paste the cryptographic payload from the guest’s mobile QR code or scan using your scanner device.
            </p>

            <div className="mt-4 space-y-3">
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-muted mb-1">
                  Signed QR JWT Token
                </label>
                <textarea
                  value={tokenInput}
                  onChange={(e) => setTokenInput(e.target.value)}
                  placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOi..."
                  rows={3}
                  className="w-full rounded border border-line bg-mist/30 p-2.5 font-mono text-xs text-charcoal focus:border-forest focus:outline-none"
                />
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleVerify()}
                  disabled={loading || !tokenInput.trim()}
                  className="inline-flex items-center gap-2 rounded bg-forest px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-[#344d40] disabled:opacity-50 transition-colors"
                >
                  {loading ? "Verifying HMAC Signature…" : "⚡ Verify & Check In Guest"}
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      const text = await navigator.clipboard.readText();
                      if (text) {
                        setTokenInput(text);
                        handleVerify(text);
                      }
                    } catch {
                      // ignore clipboard block
                    }
                  }}
                  className="rounded border border-line bg-white px-3 py-2 text-xs font-medium text-charcoal hover:bg-mist transition-colors"
                >
                  Paste from Clipboard
                </button>
                {tokenInput && (
                  <button
                    type="button"
                    onClick={() => {
                      setTokenInput("");
                      setVerifiedBooking(null);
                      setError(null);
                      setSuccessMessage(null);
                    }}
                    className="text-xs text-muted hover:text-charcoal underline"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>

            {/* Quick booking code lookup fallback */}
            <div className="mt-5 border-t border-line/60 pt-4">
              <span className="text-[11px] font-semibold text-charcoal">
                Manual Fallback: Lookup by Booking Code
              </span>
              <div className="mt-2 flex gap-2">
                <input
                  type="text"
                  value={manualCode}
                  onChange={(e) => setManualCode(e.target.value)}
                  placeholder="e.g. SE-261218-0482 or SE/2026/101/0001"
                  className="flex-1 rounded border border-line bg-white px-3 py-1.5 text-xs text-charcoal focus:border-forest focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleLookupByCode}
                  disabled={codeLoading || !manualCode.trim()}
                  className="rounded border border-forest bg-forest/5 px-3 py-1.5 text-xs font-semibold text-forest hover:bg-forest hover:text-white disabled:opacity-50 transition-colors"
                >
                  {codeLoading ? "Locating…" : "Fetch & Verify"}
                </button>
              </div>
            </div>
          </div>

          {/* Feedback messages */}
          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-xs text-red-800">
              <div className="flex items-center gap-2 font-bold">
                <span>⚠️</span> Verification Error
              </div>
              <p className="mt-1">{error}</p>
            </div>
          )}

          {successMessage && (
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-xs text-emerald-900">
              <div className="flex items-center gap-2 font-bold">
                <span>✅</span> {alreadyCheckedIn ? "Valid Pass Active" : "Check-In Success"}
              </div>
              <p className="mt-1">{successMessage}</p>
            </div>
          )}
        </div>

        {/* Right Column: Verified Guest & Room Pass Card */}
        <div>
          {verifiedBooking ? (
            <div className="rounded-xl border border-line bg-white p-5 shadow-xs">
              <div className="flex items-center justify-between border-b border-line pb-3">
                <h3 className="text-sm font-bold text-charcoal flex items-center gap-2">
                  <span>🏨</span> Verified Guest Reservation
                </h3>
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-bold text-emerald-800">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-600 animate-pulse" />
                  {verifiedBooking.status}
                </span>
              </div>

              <div className="mt-4 space-y-4">
                {/* Guest Identity */}
                <div className="rounded-lg bg-mist/40 p-3">
                  <div className="text-[10px] uppercase tracking-wider text-muted">Guest Name</div>
                  <div className="mt-0.5 text-base font-bold text-charcoal">
                    {verifiedBooking.guest_first_name} {verifiedBooking.guest_last_name}
                  </div>
                  <div className="mt-1 flex flex-wrap gap-x-4 text-xs text-muted">
                    <span>✉ {verifiedBooking.guest_email || "N/A"}</span>
                    <span>📞 {verifiedBooking.guest_phone || "N/A"}</span>
                  </div>
                </div>

                {/* Stay & Room Details */}
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="rounded border border-line p-2.5">
                    <span className="block text-[10px] text-muted">HOTEL PROPERTY</span>
                    <strong className="mt-0.5 block text-charcoal">{verifiedBooking.hotel_name}</strong>
                  </div>
                  <div className="rounded border border-line p-2.5">
                    <span className="block text-[10px] text-muted">ASSIGNED ROOM</span>
                    <strong className="mt-0.5 block text-charcoal">{verifiedBooking.room_type_name}</strong>
                  </div>
                  <div className="rounded border border-line p-2.5">
                    <span className="block text-[10px] text-muted">CHECK-IN</span>
                    <strong className="mt-0.5 block text-charcoal">
                      {new Date(verifiedBooking.check_in_date).toLocaleDateString("en-IN", {
                        weekday: "short",
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </strong>
                  </div>
                  <div className="rounded border border-line p-2.5">
                    <span className="block text-[10px] text-muted">CHECK-OUT</span>
                    <strong className="mt-0.5 block text-charcoal">
                      {new Date(verifiedBooking.check_out_date).toLocaleDateString("en-IN", {
                        weekday: "short",
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </strong>
                  </div>
                </div>

                {/* Booking Code & Total */}
                <div className="flex items-center justify-between border-t border-line pt-3 text-xs">
                  <div>
                    <span className="text-[10px] text-muted">BOOKING CODE</span>
                    <p className="font-mono font-bold text-charcoal">{verifiedBooking.booking_code}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-muted">TOTAL BILLED</span>
                    <p className="font-bold text-forest">₹{verifiedBooking.total_price.toLocaleString("en-IN")}</p>
                  </div>
                </div>

                {/* Security Verification Stamp */}
                <div className="rounded border border-[#c2ded0] bg-[#eef7f2] p-3 text-[11px] text-forest">
                  <div className="flex items-center gap-1.5 font-bold">
                    <span>🛡️</span> Security Validation
                  </div>
                  <p className="mt-1 text-[10px] text-[#2c523f] leading-relaxed">
                    HMAC-SHA256 signature verified against StayEase Auth Secret. Identity and dates match authoritative reservation database.
                  </p>
                </div>

                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setVerifiedBooking(null);
                      setSuccessMessage(null);
                      setTokenInput("");
                    }}
                    className="w-full rounded border border-line bg-white py-2 text-xs font-semibold text-charcoal hover:bg-mist transition-colors"
                  >
                    Scan Next Guest
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex h-full min-h-[320px] flex-col items-center justify-center rounded-xl border border-dashed border-line bg-mist/20 p-8 text-center text-muted">
              <span className="text-3xl">📱</span>
              <h3 className="mt-3 text-sm font-bold text-charcoal">Awaiting QR Pass Scan</h3>
              <p className="mt-1 max-w-[260px] text-xs leading-relaxed">
                When a guest arrives at reception, scan their phone QR code or paste the token to instantly retrieve and check in their room.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function AdminCheckInPage() {
  return (
    <AdminShell>
      <Suspense fallback={<div className="p-8 text-center text-xs text-muted">Loading QR Scanner…</div>}>
        <CheckInContent />
      </Suspense>
    </AdminShell>
  );
}
