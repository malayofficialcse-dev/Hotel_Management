"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { QRCodeSVG } from "qrcode.react";
import { BookingStepper } from "@/components/booking-stepper";
import { FigmaIcon } from "@/components/figma-icon";
import { BuildingIcon } from "@/components/icons";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { Button, PageHeading, Surface, TextField } from "@/components/ui";
import { useBooking } from "@/components/booking-provider";
import { api } from "@/lib/api-client";

const paymentMethods = [
  { id: "Credit / Debit card", label: "Credit / Debit Card", icon: "credit-card" as const },
  { id: "UPI", label: "UPI (GPay / PhonePe / QR)", icon: "phone" as const },
  { id: "Net Banking", label: "Net Banking", icon: "wallet" as const },
  { id: "Cash / Pay at Desk", label: "Cash / Pay at Desk", icon: "wallet" as const },
];

const popularBanks = [
  "State Bank of India (SBI)",
  "HDFC Bank",
  "ICICI Bank",
  "Axis Bank",
  "Kotak Mahindra Bank",
  "Punjab National Bank (PNB)",
  "Bank of Baroda",
];

export default function PaymentPage() {
  const { paymentMethod: ctxMethod, setPaymentMethod: setCtxMethod, booking: ctxBooking, setBooking } = useBooking();
  const router = useRouter();

  const [paymentMethod, setPaymentMethod] = useState<string>("Credit / Debit card");
  const [loadingBooking, setLoadingBooking] = useState(false);
  const [error, setError] = useState("");
  const [processing, setProcessing] = useState(false);

  // Loaded or context booking
  const [bookingCode, setBookingCode] = useState<string>("");
  const [bookingId, setBookingId] = useState<string>("");
  const [hotelName, setHotelName] = useState<string>("StayEase Luxury Hotel");
  const [roomTypeName, setRoomTypeName] = useState<string>("Deluxe Room");
  const [guestName, setGuestName] = useState<string>("Aarav Mehta");
  const [guestEmail, setGuestEmail] = useState<string>("aarav.mehta@gmail.com");
  const [guestPhone, setGuestPhone] = useState<string>("+91 9876543210");
  const [checkInDate, setCheckInDate] = useState<string>("2026-12-18");
  const [checkOutDate, setCheckOutDate] = useState<string>("2026-12-21");
  const [nights, setNights] = useState<number>(3);
  const [rooms, setRooms] = useState<number>(1);
  const [pricePerNight, setPricePerNight] = useState<number>(6800);
  const [taxesAndFees, setTaxesAndFees] = useState<number>(2448);
  const [totalPrice, setTotalPrice] = useState<number>(22848);

  // Method specific state
  const [upiId, setUpiId] = useState("");
  const [showQr, setShowQr] = useState(false);
  const [selectedBank, setSelectedBank] = useState("HDFC Bank");
  const [cardName, setCardName] = useState("Aarav Mehta");
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const codeParam = params.get("code") || params.get("bookingCode") || "";

    if (codeParam) {
      setBookingCode(codeParam);
      setLoadingBooking(true);
      api
        .getBookingByCode(codeParam)
        .then((b) => {
          if (!b) return;
          setBookingId(b.id || "");
          setBookingCode(b.booking_code || codeParam);
          setHotelName(b.hotel_name || "StayEase Luxury Hotel");
          setRoomTypeName(b.room_type_name || "Deluxe Room");
          setGuestName(`${b.guest_first_name || ""} ${b.guest_last_name || ""}`.trim() || "Guest");
          setGuestEmail(b.guest_email || "");
          setGuestPhone(b.guest_phone || "");
          setCardName(`${b.guest_first_name || ""} ${b.guest_last_name || ""}`.trim() || "Guest");
          setCheckInDate(b.check_in_date || "");
          setCheckOutDate(b.check_out_date || "");
          setNights(b.total_nights || 1);
          setRooms(b.room_count || 1);
          setPricePerNight(b.room_price_per_night || 0);
          setTaxesAndFees(b.taxes_and_fees || 0);
          setTotalPrice(b.total_price || 0);
        })
        .catch((err) => {
          console.warn("Could not load booking by code:", err);
        })
        .finally(() => setLoadingBooking(false));
    } else if (ctxBooking) {
      setBookingId(ctxBooking.bookingId || "");
      setBookingCode(ctxBooking.bookingCode || "");
      setTotalPrice(ctxBooking.totalPrice || 22848);
      if (ctxBooking.totalPrice) {
        const sub = Math.round(ctxBooking.totalPrice / 1.12);
        setTaxesAndFees(ctxBooking.totalPrice - sub);
      }
    }
  }, [ctxBooking]);

  async function submitPayment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setProcessing(true);
    setError("");

    try {
      const activeBookingId = bookingId || ctxBooking?.bookingId;
      const activeBookingCode = bookingCode || ctxBooking?.bookingCode || "SE-ONLINE-001";
      const activeTotal = totalPrice || ctxBooking?.totalPrice || 5000;

      // 1. Create or retrieve payment intent
      let paymentId = "";
      try {
        const intent = await api.createPaymentIntent(activeBookingId || "temp-id", activeBookingCode, activeTotal, paymentMethod);
        paymentId = intent.paymentId || intent.id || intent.clientSecret || "";
      } catch (intentErr: any) {
        console.warn("Intent creation note:", intentErr?.message);
      }

      // 2. Confirm payment and generate sequential bill
      const confirmPayload = {
        paymentId,
        paymentMethod,
        hotelName,
        roomTypeName,
        guestName,
        guestEmail,
        guestPhone,
        checkInDate,
        checkOutDate,
        totalNights: nights,
        roomCount: rooms,
        subtotal: Math.round(activeTotal / 1.12),
        taxesAndFees,
        totalAmount: activeTotal,
      };

      const result = await api.confirmPaymentIntent(confirmPayload);

      // 3. Mark booking confirmed
      if (activeBookingId) {
        try {
          await api.confirmBooking(activeBookingId);
        } catch (confirmErr: any) {
          console.warn("Booking confirmation sync note:", confirmErr?.message);
        }
      }

      if (setBooking && ctxBooking) {
        setBooking({ ...ctxBooking, totalPrice: activeTotal });
      }

      // 4. Navigate directly to the generated sequential bill
      const billParam = result.billNumber ? `&invoice=${encodeURIComponent(result.billNumber)}` : "";
      router.push(`/booking/bill?code=${encodeURIComponent(activeBookingCode)}${billParam}`);
    } catch (paymentError: any) {
      setError(paymentError instanceof Error ? paymentError.message : "Payment processing failed. Please try again.");
    } finally {
      setProcessing(false);
    }
  }

  const subtotal = Math.round(totalPrice / 1.12);

  return (
    <>
      <SiteHeader />
      <BookingStepper active={3} />
      <main className="mx-auto grid max-w-[1160px] gap-6 px-5 py-8 lg:grid-cols-[minmax(0,1fr)_340px] lg:px-0">
        <div>
          <PageHeading
            title="Complete Payment & Confirm Stay"
            description="Select your preferred payment method below. An official sequential tax invoice will be generated upon confirmation."
          />

          {bookingCode && (
            <div className="mt-3 flex items-center justify-between rounded bg-mist px-4 py-2 text-xs">
              <span>
                Paying for Reservation: <strong className="font-mono text-forest">{bookingCode}</strong>
              </span>
              <span className="rounded bg-butter px-2 py-0.5 text-[10px] font-semibold text-charcoal">
                PENDING PAYMENT
              </span>
            </div>
          )}

          <div className="mt-4 rounded-[4px] bg-mint p-4 text-[10px]">
            <p className="flex items-center gap-2 font-semibold">
              <FigmaIcon name="lock" className="h-4 w-4" /> Safe, RBI-regulated & 256-bit encrypted checkout.
            </p>
            <p className="mt-1 pl-6 text-muted">
              Your transaction is processed over secure banking gateways. Official GST tax invoice is issued immediately.
            </p>
          </div>

          <form onSubmit={submitPayment}>
            <Surface className="mt-4 p-5">
              <h2 className="text-sm font-semibold">How would you like to pay?</h2>

              {/* Payment Methods Tabs */}
              <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
                {paymentMethods.map((method) => {
                  const selected = method.id === paymentMethod;
                  return (
                    <button
                      type="button"
                      key={method.id}
                      onClick={() => {
                        setPaymentMethod(method.id);
                        if (setCtxMethod) setCtxMethod(method.id);
                      }}
                      aria-pressed={selected}
                      className={`flex min-h-[58px] flex-col items-center justify-center gap-1.5 rounded-[4px] border p-2 text-center text-[10px] transition-colors ${selected ? "border-forest bg-mint font-semibold text-forest shadow-sm" : "border-line text-muted hover:bg-mist"
                        }`}
                    >
                      <FigmaIcon name={method.icon} className="h-4 w-4" />
                      <span>{method.label}</span>
                    </button>
                  );
                })}
              </div>

              <div className="my-4 border-t border-line" />

              {/* Method 1: Credit / Debit Card */}
              {paymentMethod === "Credit / Debit card" && (
                <div>
                  <div className="mb-3 flex items-center justify-between">
                    <h3 className="text-xs font-semibold">Credit / Debit card</h3>
                    <span className="flex gap-1.5 text-[9px] font-semibold">
                      <span className="rounded bg-sky px-2 py-0.5">VISA</span>
                      <span className="rounded bg-butter px-2 py-0.5">Mastercard</span>
                      <span className="rounded bg-mint px-2 py-0.5">RuPay</span>
                      <span className="rounded bg-mist px-2 py-0.5">Amex</span>
                    </span>
                  </div>
                  <TextField
                    label="Cardholder name *"
                    value={cardName}
                    onChange={(e) => setCardName(e.target.value)}
                    required
                  />
                  <TextField
                    label="Card number *"
                    placeholder="4111 2222 3333 4444"
                    value={cardNumber}
                    onChange={(e) => setCardNumber(e.target.value)}
                    required
                    className="mt-3"
                    inputMode="numeric"
                  />
                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    <TextField
                      label="Expiry date *"
                      placeholder="MM / YY"
                      value={expiry}
                      onChange={(e) => setExpiry(e.target.value)}
                      required
                    />
                    <TextField
                      label="CVV / CVC *"
                      type="password"
                      placeholder="•••"
                      maxLength={4}
                      value={cvv}
                      onChange={(e) => setCvv(e.target.value)}
                      required
                    />
                  </div>
                </div>
              )}

              {/* Method 2: UPI */}
              {paymentMethod === "UPI" && (
                <div className="rounded-[4px] border border-line bg-mist/60 p-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-semibold text-forest">Instant UPI Payment</h3>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setShowQr(false)}
                        className={`rounded px-2.5 py-1 text-[10px] font-medium ${!showQr ? "bg-forest text-white" : "bg-white text-muted"}`}
                      >
                        UPI ID / VPA
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowQr(true)}
                        className={`rounded px-2.5 py-1 text-[10px] font-medium ${showQr ? "bg-forest text-white" : "bg-white text-muted"}`}
                      >
                        Scan QR Code
                      </button>
                    </div>
                  </div>

                  {!showQr ? (
                    <div className="mt-4">
                      <label className="block text-[11px] font-medium text-charcoal">
                        Enter UPI ID / VPA *
                        <input
                          type="text"
                          required={paymentMethod === "UPI" && !showQr}
                          placeholder="e.g. yourname@okhdfcbank"
                          value={upiId}
                          onChange={(e) => setUpiId(e.target.value)}
                          className="mt-1.5 w-full rounded border border-line bg-white px-3 py-2 text-xs"
                        />
                      </label>
                      <div className="mt-2 flex flex-wrap gap-1.5 text-[9px] text-muted">
                        <span>Quick handles:</span>
                        {["@okhdfcbank", "@okicici", "@oksbi", "@paytm", "@ybl"].map((handle) => (
                          <button
                            type="button"
                            key={handle}
                            onClick={() => {
                              const base = upiId.split("@")[0] || "aarav";
                              setUpiId(`${base}${handle}`);
                            }}
                            className="rounded border border-line bg-white px-1.5 py-0.5 hover:bg-mist"
                          >
                            {handle}
                          </button>
                        ))}
                      </div>
                      <p className="mt-3 text-[10px] text-muted">
                        A payment collect request of ₹{totalPrice.toLocaleString("en-IN")} will be approved in your UPI app.
                      </p>
                    </div>
                  ) : (
                    <div className="mt-4 flex flex-col items-center justify-center p-4 text-center">
                      <div className="rounded-lg border border-line bg-white p-3 shadow-sm">
                        <QRCodeSVG
                          value={`upi://pay?pa=stayease@okhdfcbank&pn=StayEase%20Hotels&am=${totalPrice}&cu=INR&tn=Booking%20${bookingCode}`}
                          size={140}
                          level="M"
                        />
                      </div>
                      <p className="mt-3 text-xs font-semibold text-charcoal">Scan with any UPI App</p>
                      <p className="text-[10px] text-muted">Google Pay, PhonePe, Paytm, BHIM, CRED</p>
                    </div>
                  )}
                </div>
              )}

              {/* Method 3: Net Banking */}
              {paymentMethod === "Net Banking" && (
                <div className="rounded-[4px] border border-line bg-mist/60 p-4">
                  <h3 className="text-xs font-semibold text-forest">Select Your Bank</h3>
                  <p className="mt-1 text-[10px] text-muted">Choose your bank to initiate a secure Net Banking transaction.</p>
                  <div className="mt-3 grid gap-2 sm:grid-cols-2">
                    {popularBanks.map((bank) => (
                      <label
                        key={bank}
                        className={`flex cursor-pointer items-center gap-2 rounded border p-2.5 text-xs transition-colors ${selectedBank === bank ? "border-forest bg-mint font-medium text-forest" : "border-line bg-white text-charcoal"
                          }`}
                      >
                        <input
                          type="radio"
                          name="bank"
                          value={bank}
                          checked={selectedBank === bank}
                          onChange={(e) => setSelectedBank(e.target.value)}
                          className="accent-[#486958]"
                        />
                        <span>{bank}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Method 4: Cash / Pay at Desk */}
              {paymentMethod === "Cash / Pay at Desk" && (
                <div className="rounded-[4px] border border-forest/30 bg-mint/50 p-4 text-xs">
                  <h3 className="font-semibold text-forest flex items-center gap-1.5">
                    <BuildingIcon size={14} /> Pay at Hotel Front Desk
                  </h3>
                  <p className="mt-2 text-muted">
                    Your reservation will be held and guaranteed immediately. You can pay ₹{totalPrice.toLocaleString("en-IN")} via Cash, Card, or UPI upon arrival during check-in.
                  </p>
                  <p className="mt-2 font-medium text-forest">
                    ✓ Instant booking confirmation & tax invoice generated right away.
                  </p>
                </div>
              )}

              {/* Billing Summary Box */}
              <div className="mt-5 rounded border border-line bg-[#fafbfa] p-3 text-xs">
                <div className="flex justify-between text-muted">
                  <span>Room tariff ({nights} night{nights > 1 ? "s" : ""}, {rooms} room{rooms > 1 ? "s" : ""})</span>
                  <span>₹{subtotal.toLocaleString("en-IN")}</span>
                </div>
                <div className="mt-1 flex justify-between text-muted">
                  <span>Taxes & GST (12%)</span>
                  <span>₹{taxesAndFees.toLocaleString("en-IN")}</span>
                </div>
                <div className="mt-2 flex items-center justify-between border-t border-line pt-2">
                  <span className="font-semibold text-charcoal">Total Amount Payable</span>
                  <strong className="text-lg font-bold text-forest">₹{totalPrice.toLocaleString("en-IN")}</strong>
                </div>
              </div>

              <Button type="submit" disabled={processing} className="mt-4 w-full">
                {processing ? "Processing Payment & Generating Bill…" : `Pay ₹${totalPrice.toLocaleString("en-IN")} & Get Bill`}
                <FigmaIcon name="lock" className="h-4 w-4" />
              </Button>

              <p className="mt-3 text-center text-[10px] text-muted">
                Clicking confirm generates your sequential tax invoice and secures your room instantly.
              </p>
            </Surface>
          </form>

          {error && <p role="alert" className="mt-3 rounded-[4px] bg-blush p-3 text-xs text-red-800">{error}</p>}

          <div className="mt-4 flex flex-wrap gap-5 text-[10px] text-muted">
            <span><FigmaIcon name="shield" className="mr-1 h-3 w-3" /> 256-bit SSL encrypted</span>
            <span><FigmaIcon name="shield" className="mr-1 h-3 w-3" /> PCI DSS compliant</span>
            <span><FigmaIcon name="shield" className="mr-1 h-3 w-3" /> RBI-regulated gateway</span>
          </div>

          <div className="mt-6">
            <Link href="/admin/reservations" className="text-xs font-semibold text-forest hover:underline">
              ← Return to Reservations Workspace
            </Link>
          </div>
        </div>

        {/* Sidebar Summary Card */}
        <aside className="lg:sticky lg:top-24 lg:h-fit">
          <Surface className="p-5">
            <h3 className="text-sm font-semibold">Reservation Summary</h3>
            <div className="mt-4 space-y-3 text-xs">
              <div>
                <p className="text-[10px] text-muted">HOTEL</p>
                <p className="font-semibold text-charcoal">{hotelName}</p>
              </div>
              <div>
                <p className="text-[10px] text-muted">ROOM TYPE</p>
                <p className="font-medium text-charcoal">{roomTypeName}</p>
              </div>
              <div className="grid grid-cols-2 gap-2 border-t border-line pt-2 text-[11px]">
                <div>
                  <span className="text-muted block">Check-in:</span>
                  <span className="font-medium">{checkInDate || "18 Dec 2026"}</span>
                </div>
                <div>
                  <span className="text-muted block">Check-out:</span>
                  <span className="font-medium">{checkOutDate || "21 Dec 2026"}</span>
                </div>
              </div>
              <div className="border-t border-line pt-2">
                <p className="text-[10px] text-muted">PRIMARY GUEST</p>
                <p className="font-medium text-charcoal">{guestName}</p>
                <p className="text-[10px] text-muted">{guestEmail}</p>
                <p className="text-[10px] text-muted">{guestPhone}</p>
              </div>
            </div>
          </Surface>
        </aside>
      </main>
      <SiteFooter />
    </>
  );
}
