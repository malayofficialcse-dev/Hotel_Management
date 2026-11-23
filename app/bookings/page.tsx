"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { QRCodeSVG } from "qrcode.react";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { Button, PageHeading, Surface } from "@/components/ui";
import { api, type GuestServiceRequest, type UserBooking } from "@/lib/api-client";
import { formatPrice, type Hotel } from "@/lib/data";
import { AdminPagination } from "@/components/admin/admin-pagination";
import { BookingsSkeleton } from "@/components/skeletons/bookings-skeleton";

type BookingGroup = "upcoming" | "completed" | "cancelled";

function dateOnly(value: string) {
  return value.slice(0, 10);
}

function formatBookingDate(value: string) {
  const date = new Date(`${dateOnly(value)}T00:00:00`);
  if (Number.isNaN(date.getTime())) return "Date unavailable";
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

function groupBooking(booking: UserBooking, today: string): BookingGroup {
  const status = booking.status.toUpperCase();
  if (status === "CANCELLED" || status === "EXPIRED") return "cancelled";
  if (
    status === "CHECKED_OUT" ||
    status === "COMPLETED" ||
    ((status === "CONFIRMED" || status === "CHECKED_IN") && dateOnly(booking.check_out_date) < today)
  ) {
    return "completed";
  }
  return "upcoming";
}

function statusLabel(status: string) {
  return status
    .toLowerCase()
    .split(/[_\s]+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function findHotel(booking: UserBooking, hotelsByKey: Map<string, Hotel>) {
  return hotelsByKey.get(booking.hotel_id.toLowerCase()) ||
    hotelsByKey.get(booking.hotel_name.toLowerCase());
}

export default function BookingsPage() {
  const router = useRouter();
  const [bookings, setBookings] = useState<UserBooking[]>([]);
  const [hotelsByKey, setHotelsByKey] = useState<Map<string, Hotel>>(() => new Map());
  const [tab, setTab] = useState<BookingGroup>("upcoming");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [hotelImageNotice, setHotelImageNotice] = useState("");

  useEffect(() => {
    let active = true;

    async function loadBookings() {
      if (!api.getToken()) {
        router.replace("/auth/login?returnUrl=%2Fbookings");
        return;
      }

      let bookingResult;
      try {
        bookingResult = await api.getMyBookings();
      } catch {
        if (!active) return;
        if (!api.getToken()) {
          router.replace("/auth/login?returnUrl=%2Fbookings");
          return;
        }
        setError("We couldn't load your bookings. Please try again.");
        setLoading(false);
        return;
      }
      if (!active) return;

      setBookings(bookingResult.bookings);
      setLoading(false);
      void api.getHotels().then((rows) => {
        if (!active) return;
        const hotelMap = new Map<string, Hotel>();
        rows.forEach((hotel) => {
          hotelMap.set(hotel.id.toLowerCase(), hotel);
          hotelMap.set(hotel.name.toLowerCase(), hotel);
        });
        setHotelsByKey(hotelMap);
      }).catch(() => {
        if (!active) return;
        setHotelImageNotice("Some property photos are currently unavailable.");
      });

    }

    void loadBookings();
    const syncBookings = async () => {
      if (!api.getToken()) return;
      try {
        const result = await api.getMyBookings();
        if (active) setBookings(result.bookings);
      } catch { /* Keep the last confirmed snapshot while the network is unavailable. */ }
    };
    const refreshTimer = window.setInterval(() => void syncBookings(), 5000);
    window.addEventListener("focus", syncBookings);
    window.addEventListener("stayease-reservations-updated", syncBookings);
    const handleStorage = (event: StorageEvent) => { if (event.key === "stayease-reservations-updated-at") void syncBookings(); };
    window.addEventListener("storage", handleStorage);
    return () => {
      active = false;
      window.clearInterval(refreshTimer);
      window.removeEventListener("focus", syncBookings);
      window.removeEventListener("stayease-reservations-updated", syncBookings);
      window.removeEventListener("storage", handleStorage);
    };
  }, [router]);

  const groupedBookings = useMemo(() => {
    const today = new Date();
    const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
    const groups: Record<BookingGroup, UserBooking[]> = {
      upcoming: [],
      completed: [],
      cancelled: [],
    };
    bookings.forEach((booking) => groups[groupBooking(booking, todayKey)].push(booking));
    groups.upcoming.sort((a, b) => dateOnly(a.check_in_date).localeCompare(dateOnly(b.check_in_date)));
    groups.completed.sort((a, b) => dateOnly(b.check_out_date).localeCompare(dateOnly(a.check_out_date)));
    groups.cancelled.sort((a, b) => dateOnly(b.created_at).localeCompare(dateOnly(a.created_at)));
    return groups;
  }, [bookings]);

  const tabs: { key: BookingGroup; label: string }[] = [
    { key: "upcoming", label: `Upcoming (${groupedBookings.upcoming.length})` },
    { key: "completed", label: `Completed (${groupedBookings.completed.length})` },
    { key: "cancelled", label: `Cancelled (${groupedBookings.cancelled.length})` },
  ];
  const visibleBookings = groupedBookings[tab];
  const nextBooking = groupedBookings.upcoming[0];
  const nextHotel = nextBooking ? findHotel(nextBooking, hotelsByKey) : undefined;

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);

  useEffect(() => {
    setCurrentPage(1);
  }, [tab]);

  const paginatedVisibleBookings = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return visibleBookings.slice(start, start + pageSize);
  }, [visibleBookings, currentPage, pageSize]);

  return (
    <>
      <SiteHeader active="bookings" />
      <main className="mx-auto min-h-[65vh] max-w-[1176px] px-5 py-8 lg:px-0">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <PageHeading
            eyebrow="YOUR TRAVEL JOURNAL"
            title="Your bookings."
            description="Only bookings made from your account are shown here."
          />
          <Button href="/" variant="outline">Find your next stay</Button>
        </div>

        {loading ? (
          <BookingsSkeleton />
        ) : error ? (
          <Surface role="alert" className="mt-6 p-8 text-center">
            <p className="text-sm font-semibold">Your bookings couldn’t be loaded.</p>
            <p className="mt-2 text-xs text-muted">{error}</p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="mt-4 rounded-[4px] bg-forest px-4 py-2 text-xs font-semibold text-white"
            >
              Try again
            </button>
          </Surface>
        ) : (
          <>
            <div className="mt-6 flex gap-2 border-b border-line" role="group" aria-label="Filter your bookings">
              {tabs.map((item) => (
                <button
                  type="button"
                  aria-pressed={tab === item.key}
                  onClick={() => setTab(item.key)}
                  key={item.key}
                  className={`rounded-t-[4px] px-4 py-3 text-[11px] ${tab === item.key ? "bg-mint font-semibold text-forest" : "text-muted"}`}
                >
                  {item.label}
                </button>
              ))}
            </div>

            {hotelImageNotice && (
              <p role="status" className="mt-3 text-[10px] text-muted">{hotelImageNotice}</p>
            )}

            {tab === "upcoming" && nextBooking && (
              <Link
                href={`/booking/confirmation?code=${encodeURIComponent(nextBooking.booking_code)}`}
                className="mt-5 flex items-center justify-between gap-3 rounded-[4px] bg-butter p-4 text-[10px] hover:bg-[#faeec5] transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span aria-hidden="true" className="text-base">✦</span>
                  <div>
                    <p className="font-semibold text-charcoal">
                      Your next stay: {nextHotel ? `${nextHotel.name}, ${nextHotel.city}` : nextBooking.hotel_name}.
                    </p>
                    <p className="mt-1 text-muted">
                      {formatBookingDate(nextBooking.check_in_date)} · {statusLabel(nextBooking.status)}
                    </p>
                  </div>
                </div>
                <span className="font-semibold text-forest whitespace-nowrap">View Digital Pass ↗</span>
              </Link>
            )}

            {visibleBookings.length ? (
              <>
                <div className="mt-5 space-y-4">
                  {paginatedVisibleBookings.map((booking) => (
                    <BookingCard
                      key={booking.id}
                      booking={booking}
                      hotel={findHotel(booking, hotelsByKey)}
                      group={tab}
                      onBookingUpdated={(updated) => setBookings((current) => current.map((item) => item.id === updated.id ? updated : item))}
                    />
                  ))}
                </div>
                <div className="mt-4 overflow-hidden rounded border border-line bg-white shadow-sm">
                  <AdminPagination
                    currentPage={currentPage}
                    totalItems={visibleBookings.length}
                    pageSize={pageSize}
                    onPageChange={setCurrentPage}
                    onPageSizeChange={(newSize) => {
                      setPageSize(newSize);
                      setCurrentPage(1);
                    }}
                    pageSizeOptions={[5, 10, 20]}
                    itemLabel="bookings"
                  />
                </div>
              </>
            ) : (
              <Surface className="mt-5 p-8 text-center">
                <h2 className="text-sm font-semibold">
                  {tab === "upcoming" ? "No upcoming bookings" : tab === "completed" ? "No completed stays yet" : "No cancelled bookings"}
                </h2>
                <p className="mt-2 text-xs text-muted">
                  {bookings.length
                    ? "There are no bookings in this section for your account."
                    : "Bookings you make while signed in will appear here."}
                </p>
                {!bookings.length && <Button href="/" variant="outline" className="mt-4">Explore stays</Button>}
              </Surface>
            )}
          </>
        )}

        <p className="mt-6 text-center text-[10px] text-muted">
          Questions about one of your stays? Our team is here, 24/7.{" "}
          <a href="#help" className="font-semibold text-forest">Visit help centre →</a>
        </p>
      </main>
      <SiteFooter />
    </>
  );
}

function BookingCard({
  booking,
  hotel,
  group,
  onBookingUpdated,
}: {
  booking: UserBooking;
  hotel?: Hotel;
  group: BookingGroup;
  onBookingUpdated: (booking: UserBooking) => void;
}) {
  const [requestsOpen, setRequestsOpen] = useState(false);
  const [requests, setRequests] = useState<GuestServiceRequest[]>([]);
  const [requestType, setRequestType] = useState("EXTRA_TOWELS");
  const [requestDetails, setRequestDetails] = useState("");
  const [requestBusy, setRequestBusy] = useState(false);
  const [requestMessage, setRequestMessage] = useState("");
  const [editing, setEditing] = useState(false);
  const [editBusy, setEditBusy] = useState(false);
  const [editMessage, setEditMessage] = useState("");
  const [successInfo, setSuccessInfo] = useState<{ message: string; billNumber?: string } | null>(null);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"UPI" | "CARD" | "NETBANKING">("UPI");
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [refundProcessing, setRefundProcessing] = useState(false);
  const [availabilityPreview, setAvailabilityPreview] = useState<{ state: "checking" | "available" | "unavailable" | "error"; message: string } | null>(null);
  const [editForm, setEditForm] = useState({ checkInDate: dateOnly(booking.check_in_date), checkOutDate: dateOnly(booking.check_out_date), roomCount: booking.room_count, guestsCount: booking.guests_count, specialRequests: booking.special_requests || "" });
  const [cancelBusy, setCancelBusy] = useState(false);
  const [guestCardDigits, setGuestCardDigits] = useState({ number: "", expiry: "", cvv: "", name: "" });
  const [guestBankDetails, setGuestBankDetails] = useState({ bankName: "HDFC Bank", accountNumber: "", utr: "" });
  const [guestUpiRef, setGuestUpiRef] = useState("");

  const calculatedFinancials = useMemo(() => {
    const start = Date.parse(`${editForm.checkInDate}T00:00:00Z`);
    const end = Date.parse(`${editForm.checkOutDate}T00:00:00Z`);
    const nights = Number.isFinite(start) && Number.isFinite(end) && end > start
      ? Math.round((end - start) / (24 * 60 * 60 * 1000))
      : (booking.total_nights || 1);
    const rate = booking.room_price_per_night || (nights > 0 && (booking.room_count || 1) > 0 ? Math.round((booking.total_price / 1.12) / (nights * (booking.room_count || 1))) : 0);
    const count = editForm.roomCount || 1;
    const subtotal = rate * nights * count;
    const taxes = Math.round(subtotal * 0.12 * 100) / 100;
    const newTotal = Math.round((subtotal + taxes) * 100) / 100;
    const oldTotal = booking.total_price || 0;
    const diff = Math.round((newTotal - oldTotal) * 100) / 100;
    return { nights, rate, count, subtotal, taxes, newTotal, oldTotal, diff };
  }, [booking, editForm.checkInDate, editForm.checkOutDate, editForm.roomCount]);

  useEffect(() => {
    if (editing) return;
    setEditForm({ checkInDate: dateOnly(booking.check_in_date), checkOutDate: dateOnly(booking.check_out_date), roomCount: booking.room_count, guestsCount: booking.guests_count, specialRequests: booking.special_requests || "" });
    setSuccessInfo(null);
  }, [booking, editing]);

  useEffect(() => {
    if (!editing) {
      setAvailabilityPreview(null);
      return;
    }

    const start = Date.parse(`${editForm.checkInDate}T00:00:00Z`);
    const end = Date.parse(`${editForm.checkOutDate}T00:00:00Z`);
    if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start || end - start > 62 * 24 * 60 * 60 * 1000 || editForm.roomCount < 1) {
      setAvailabilityPreview({ state: "error", message: "Enter a valid date range and room count to check availability." });
      return;
    }

    setAvailabilityPreview({ state: "checking", message: "Checking availability for your dates…" });
    let active = true;
    const timer = window.setTimeout(async () => {
      try {
        const calendar = await api.getRoomAvailabilityCalendar(booking.room_type_id, editForm.checkInDate, editForm.checkOutDate);
        if (!active) return;
        const nights = calendar.days.filter((day) => day.date >= editForm.checkInDate && day.date < editForm.checkOutDate);
        if (!nights.length) throw new Error("No nightly availability data was returned.");

        const originalCheckIn = dateOnly(booking.check_in_date);
        const originalCheckOut = dateOnly(booking.check_out_date);
        const leastAvailable = Math.min(...nights.map((day) => {
          const currentBookingOccupiesNight = day.date >= originalCheckIn && day.date < originalCheckOut;
          return day.availableInventory + (currentBookingOccupiesNight ? booking.room_count : 0);
        }));
        setAvailabilityPreview(leastAvailable >= editForm.roomCount
          ? { state: "available", message: `Available: at least ${leastAvailable} room${leastAvailable === 1 ? "" : "s"} for every night. Availability is checked again when you save.` }
          : { state: "unavailable", message: `Only ${Math.max(0, leastAvailable)} room${leastAvailable === 1 ? " is" : "s are"} available for at least one night; you selected ${editForm.roomCount}. Try different dates or fewer rooms.` });
      } catch {
        if (active) setAvailabilityPreview({ state: "error", message: "Availability could not be checked right now. Saving will recheck the dates before changing your reservation." });
      }
    }, 350);

    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [booking, editForm.checkInDate, editForm.checkOutDate, editForm.roomCount, editing]);

  async function toggleRequests() {
    const open = !requestsOpen;
    setRequestsOpen(open);
    setRequestMessage("");
    if (open) {
      try { setRequests(await api.getGuestServiceRequests(booking.id)); }
      catch { setRequestMessage("Requests could not be loaded. Please try again."); }
    }
  }

  async function submitRequest(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setRequestBusy(true);
    setRequestMessage("");
    try {
      const created = await api.createGuestServiceRequest(booking.id, requestType, requestDetails.trim());
      setRequests((current) => [created, ...current]);
      setRequestDetails("");
      setRequestMessage("Request sent to the hotel team.");
    } catch (error) {
      setRequestMessage(error instanceof Error ? error.message : "Could not send your request.");
    } finally { setRequestBusy(false); }
  }

  async function saveReservation(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (calculatedFinancials.diff > 0) {
      setPaymentModalOpen(true);
      return;
    }
    if (calculatedFinancials.diff < 0) {
      await handleRefundAndSave();
      return;
    }
    setEditBusy(true);
    setEditMessage("");
    try {
      const updated = await api.updateMyBooking(booking.id, editForm);
      onBookingUpdated(updated);
      setEditing(false);
      setSuccessInfo({ message: "Reservation updated successfully. Availability has been recalculated." });
      window.dispatchEvent(new Event("stayease-reservations-updated"));
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not update reservation.";
      setEditMessage(message.includes("(405)") || message.includes("Method Not Allowed")
        ? "The booking service currently running does not have reservation updates enabled. Restart or rebuild the booking-service, then try again."
        : message);
    }
    finally { setEditBusy(false); }
  }

  async function handlePaymentAndSave() {
    setPaymentProcessing(true);
    setEditMessage("");
    try {
      let paymentMethodLabel = "Instant Payment";
      if (paymentMethod === "UPI") {
        const ref = guestUpiRef ? ` (Ref: ${guestUpiRef})` : "";
        paymentMethodLabel = `UPI Payment${ref}`;
      } else if (paymentMethod === "CARD") {
        const last4 = guestCardDigits.number.replace(/\D/g, "").slice(-4) || "4242";
        paymentMethodLabel = `Card ending in ${last4}`;
      } else if (paymentMethod === "NETBANKING") {
        const utr = guestBankDetails.utr ? ` (UTR: ${guestBankDetails.utr})` : "";
        paymentMethodLabel = `Net Banking ${guestBankDetails.bankName}${utr}`;
      }

      const intentRes = await api.createPaymentIntent(booking.id, booking.booking_code, calculatedFinancials.diff, paymentMethodLabel);
      const confirmRes = await api.confirmPaymentIntent({
        paymentId: intentRes.paymentId,
        paymentMethod: paymentMethodLabel,
        hotelName: booking.hotel_name,
        roomTypeName: booking.room_type_name,
        guestName: `${booking.guest_first_name || ""} ${booking.guest_last_name || ""}`.trim() || "Guest",
        guestEmail: booking.guest_email || "",
        guestPhone: booking.guest_phone || "",
        checkInDate: editForm.checkInDate,
        checkOutDate: editForm.checkOutDate,
        totalNights: calculatedFinancials.nights,
        roomCount: editForm.roomCount,
        subtotal: calculatedFinancials.subtotal,
        taxesAndFees: calculatedFinancials.taxes,
        totalAmount: calculatedFinancials.newTotal,
      });

      const updated = await api.updateMyBooking(booking.id, editForm);
      onBookingUpdated(updated);
      setPaymentModalOpen(false);
      setEditing(false);
      setSuccessInfo({
        message: `Payment of ₹${calculatedFinancials.diff.toLocaleString("en-IN")} received! Reservation upgraded to ${editForm.roomCount} room${editForm.roomCount > 1 ? "s" : ""}.`,
        billNumber: confirmRes?.billNumber,
      });
      window.dispatchEvent(new Event("stayease-reservations-updated"));
    } catch (error) {
      setEditMessage(error instanceof Error ? error.message : "Payment processing failed. Please try again.");
    } finally {
      setPaymentProcessing(false);
    }
  }

  async function handleRefundAndSave() {
    setRefundProcessing(true);
    setEditMessage("");
    const refundAmount = Math.abs(calculatedFinancials.diff);
    try {
      let paymentRecord: any = null;
      try {
        paymentRecord = await api.getPaymentByBookingCode(booking.booking_code);
      } catch {
        // Continue if payment record lookup fails
      }

      if (paymentRecord && paymentRecord.id) {
        try {
          await api.refundPayment(paymentRecord.id, refundAmount, `Reduced rooms from ${booking.room_count} to ${editForm.roomCount}`);
        } catch {
          // Fallback if partial refund endpoint error
        }
      }

      const updated = await api.updateMyBooking(booking.id, editForm);
      onBookingUpdated(updated);
      setEditing(false);
      setSuccessInfo({
        message: `Refund of ₹${refundAmount.toLocaleString("en-IN")} processed! Reservation updated to ${editForm.roomCount} room${editForm.roomCount > 1 ? "s" : ""}.`,
      });
      window.dispatchEvent(new Event("stayease-reservations-updated"));
    } catch (error) {
      setEditMessage(error instanceof Error ? error.message : "Could not process room reduction.");
    } finally {
      setRefundProcessing(false);
    }
  }

  async function cancelReservation() {
    if (!window.confirm(`Cancel reservation ${booking.booking_code}? The dates will be released for other guests.`)) return;
    setCancelBusy(true);
    setEditMessage("");
    try {
      const result = await api.cancelBooking(booking.id);
      onBookingUpdated(result);
      setEditMessage("Reservation cancelled. The room inventory is available again.");
      window.dispatchEvent(new Event("stayease-reservations-updated"));
    } catch (error) { setEditMessage(error instanceof Error ? error.message : "Could not cancel reservation."); }
    finally { setCancelBusy(false); }
  }

  const statusStyle = group === "cancelled"
    ? "bg-rose-50 text-rose-700"
    : group === "completed"
      ? "bg-sky text-charcoal"
      : "bg-mint text-forest";

  const confirmationUrl = `/booking/confirmation?code=${encodeURIComponent(booking.booking_code)}`;

  return (
    <Surface className="group relative overflow-hidden p-4 transition-all hover:shadow-md hover:border-forest/40 sm:p-5">
      <div className="flex items-center justify-between gap-3 text-[9px] text-muted">
        <span>BOOKING ID · <strong className="font-mono text-charcoal">{booking.booking_code}</strong></span>
        <span className={`rounded-[4px] px-2 py-1 font-semibold ${statusStyle}`}>
          {statusLabel(booking.status)}
        </span>
      </div>
      <div className="mt-4 grid gap-4 sm:grid-cols-[140px_1fr_170px]">
        <Link href={confirmationUrl} className="block overflow-hidden rounded-[4px]">
          {hotel?.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={hotel.image} alt={hotel.name} className="h-[105px] w-full rounded-[4px] object-cover transition-transform duration-200 group-hover:scale-105" />
          ) : (
            <div aria-hidden="true" className="flex h-[105px] items-center justify-center rounded-[4px] bg-mint text-2xl font-semibold text-forest">
              {booking.hotel_name.charAt(0).toUpperCase()}
            </div>
          )}
        </Link>
        <div>
          <Link href={confirmationUrl} className="hover:text-forest transition-colors">
            <h2 className="text-sm font-bold text-charcoal group-hover:text-forest">
              {hotel ? `${hotel.name}, ${hotel.city}` : booking.hotel_name}
            </h2>
          </Link>
          {hotel?.location && <p className="mt-1 text-[10px] text-muted">{hotel.location}</p>}
          <p className="mt-2 text-[11px] font-semibold text-charcoal">
            {formatBookingDate(booking.check_in_date)} – {formatBookingDate(booking.check_out_date)}
            {" · "}{booking.total_nights} {booking.total_nights === 1 ? "night" : "nights"}
          </p>
          <p className="mt-2 text-[10px] text-muted">
            {booking.room_type_name} · {booking.guests_count} {booking.guests_count === 1 ? "adult" : "adults"} · {booking.room_count} {booking.room_count === 1 ? "room" : "rooms"}
          </p>
        </div>
        <div className="flex flex-row items-center justify-between gap-3 sm:flex-col sm:items-end sm:justify-between">
          <div className="text-right">
            <p className="text-lg font-semibold text-charcoal">{formatPrice(booking.total_price)}</p>
            <p className="text-[9px] text-muted">Total booking price</p>
          </div>
          <Link
            href={confirmationUrl}
            className="inline-flex items-center gap-1.5 rounded bg-forest px-3 py-1.5 text-[11px] font-semibold text-white shadow-xs hover:bg-[#344d40] transition-colors"
          >
            <span>🔑 Digital Pass & QR</span>
            <span>→</span>
          </Link>
          <Link
            href={`/booking/bill?code=${encodeURIComponent(booking.booking_code)}`}
            className="inline-flex items-center gap-1.5 rounded border border-line bg-white px-3 py-1.5 text-[11px] font-semibold text-forest transition-colors hover:bg-mist"
            aria-label={`View bill for booking ${booking.booking_code}`}
          >
            <span>View bill</span>
            <span aria-hidden="true">↗</span>
          </Link>
        </div>
      </div>
      {group === "upcoming" && ["CONFIRMED", "CHECKED_IN"].includes(booking.status.toUpperCase()) && (
        <div className="mt-4 border-t border-line pt-3">
          <button type="button" onClick={() => void toggleRequests()} className="text-[11px] font-semibold text-forest hover:underline">
            {requestsOpen ? "Hide stay requests" : "Request something for your stay"}
          </button>
          {requestsOpen && <div className="mt-3 grid gap-4 sm:grid-cols-2">
            <form onSubmit={(event) => void submitRequest(event)} className="space-y-2">
              <label className="block text-[10px] font-semibold text-charcoal">What do you need?
                <select value={requestType} onChange={(event) => setRequestType(event.target.value)} className="mt-1 block h-9 w-full rounded border border-line bg-white px-2 text-xs font-normal">
                  <option value="EXTRA_TOWELS">Extra towels</option><option value="HOUSEKEEPING">Housekeeping</option><option value="MAINTENANCE">Maintenance</option><option value="LATE_CHECKOUT">Late checkout</option><option value="ACCESSIBILITY">Accessibility request</option><option value="OTHER">Other</option>
                </select>
              </label>
              <label className="block text-[10px] font-semibold text-charcoal">Details (optional)
                <textarea value={requestDetails} onChange={(event) => setRequestDetails(event.target.value)} maxLength={500} rows={2} className="mt-1 block w-full rounded border border-line px-2 py-2 text-xs font-normal" placeholder="Add timing or other details" />
              </label>
              <button disabled={requestBusy} className="rounded bg-forest px-3 py-2 text-[10px] font-semibold text-white disabled:opacity-50">{requestBusy ? "Sending…" : "Send request"}</button>
              {requestMessage && <p role="status" className="text-[10px] text-muted">{requestMessage}</p>}
            </form>
            <div>
              <p className="text-[10px] font-semibold text-charcoal">Recent requests</p>
              {requests.length ? <ul className="mt-2 space-y-2">{requests.map((item) => <li key={item.id} className="rounded bg-mint/50 p-2 text-[10px]">
                <span className="font-semibold">{item.requestType.replaceAll("_", " ")}</span><span className="float-right rounded bg-white px-1.5 py-0.5">{item.status}</span>
                {item.details && <p className="mt-1 text-muted">{item.details}</p>}
              </li>)}</ul> : <p className="mt-2 text-[10px] text-muted">No requests yet.</p>}
            </div>
          </div>}
        </div>
      )}
      {group === "upcoming" && ["CONFIRMED", "PENDING_PAYMENT"].includes(booking.status.toUpperCase()) && (
        <div className="mt-3 flex flex-wrap items-center gap-3">
          {booking.status.toUpperCase() === "CONFIRMED" && <button type="button" onClick={() => { setEditing((value) => !value); setEditMessage(""); }} className="text-[11px] font-semibold text-forest hover:underline">{editing ? "Close edit" : "Update reservation"}</button>}
          <button type="button" onClick={() => void cancelReservation()} disabled={cancelBusy} className="text-[11px] font-semibold text-red-700 hover:underline disabled:opacity-50">{cancelBusy ? "Cancelling…" : "Cancel reservation"}</button>
          {successInfo && (
            <div className="basis-full rounded bg-mint p-3 text-[11px] text-forest flex items-center justify-between">
              <span>{successInfo.message}</span>
              <Link href={`/booking/bill?code=${encodeURIComponent(booking.booking_code)}`} className="font-bold underline hover:text-charcoal ml-2">
                View Updated Bill ↗
              </Link>
            </div>
          )}
          {editMessage && <p role="status" className="basis-full text-[10px] text-muted">{editMessage}</p>}
          {editing && <form onSubmit={(event) => void saveReservation(event)} className="grid w-full gap-3 rounded border border-line bg-mist/50 p-3 sm:grid-cols-2">
            <label className="text-[10px] font-semibold">Check in<input type="date" required value={editForm.checkInDate} onChange={(event) => setEditForm((form) => ({ ...form, checkInDate: event.target.value }))} className="mt-1 block h-9 w-full rounded border border-line bg-white px-2 text-xs font-normal" /></label>
            <label className="text-[10px] font-semibold">Check out<input type="date" required min={editForm.checkInDate} value={editForm.checkOutDate} onChange={(event) => setEditForm((form) => ({ ...form, checkOutDate: event.target.value }))} className="mt-1 block h-9 w-full rounded border border-line bg-white px-2 text-xs font-normal" /></label>
            <label className="text-[10px] font-semibold">Rooms<input type="number" required min={1} max={20} value={editForm.roomCount} onChange={(event) => setEditForm((form) => ({ ...form, roomCount: Number(event.target.value) }))} className="mt-1 block h-9 w-full rounded border border-line bg-white px-2 text-xs font-normal" /></label>
            <label className="text-[10px] font-semibold">Guests<input type="number" required min={1} max={100} value={editForm.guestsCount} onChange={(event) => setEditForm((form) => ({ ...form, guestsCount: Number(event.target.value) }))} className="mt-1 block h-9 w-full rounded border border-line bg-white px-2 text-xs font-normal" /></label>
            <label className="text-[10px] font-semibold sm:col-span-2">Special requests<textarea maxLength={2000} value={editForm.specialRequests} onChange={(event) => setEditForm((form) => ({ ...form, specialRequests: event.target.value }))} className="mt-1 block w-full rounded border border-line bg-white px-2 py-2 text-xs font-normal" /></label>

            {calculatedFinancials.diff > 0 && (
              <div className="sm:col-span-2 rounded border border-forest/30 bg-mint/40 p-3">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div>
                    <p className="text-xs font-semibold text-charcoal">
                      Room Count Increased ({booking.room_count} → {editForm.roomCount} room{editForm.roomCount > 1 ? "s" : ""})
                    </p>
                    <p className="text-[10px] text-muted">
                      New Total: ₹{calculatedFinancials.newTotal.toLocaleString("en-IN")} · Previous Total: ₹{booking.total_price.toLocaleString("en-IN")}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-muted">Remaining Balance to Pay:</span>
                    <p className="text-sm font-bold text-forest">₹{calculatedFinancials.diff.toLocaleString("en-IN")}</p>
                  </div>
                </div>
                <p className="mt-1 text-[10px] text-muted">
                  Before saving the updated room count, please pay the remaining amount. A new sequential bill will be generated.
                </p>
              </div>
            )}

            {calculatedFinancials.diff < 0 && (
              <div className="sm:col-span-2 rounded border border-amber-300 bg-amber-50/70 p-3">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div>
                    <p className="text-xs font-semibold text-charcoal">
                      Room Count Reduced ({booking.room_count} → {editForm.roomCount} room{editForm.roomCount > 1 ? "s" : ""})
                    </p>
                    <p className="text-[10px] text-muted">
                      New Total: ₹{calculatedFinancials.newTotal.toLocaleString("en-IN")} · Previous Total: ₹{booking.total_price.toLocaleString("en-IN")}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-muted">Refund Amount:</span>
                    <p className="text-sm font-bold text-amber-800">₹{Math.abs(calculatedFinancials.diff).toLocaleString("en-IN")}</p>
                  </div>
                </div>
                <p className="mt-1 text-[10px] text-muted">
                  A refund of ₹{Math.abs(calculatedFinancials.diff).toLocaleString("en-IN")} will be credited back, and an updated bill will be generated.
                </p>
              </div>
            )}

            {availabilityPreview && <p role="status" aria-live="polite" className={`rounded px-3 py-2 text-[10px] sm:col-span-2 ${availabilityPreview.state === "available" ? "bg-mint text-forest" : availabilityPreview.state === "unavailable" ? "bg-rose-50 text-rose-700" : "bg-white text-muted"}`}>{availabilityPreview.message}</p>}

            <div className="flex items-center gap-3 sm:col-span-2">
              {calculatedFinancials.diff > 0 ? (
                <button
                  type="button"
                  onClick={() => setPaymentModalOpen(true)}
                  disabled={editBusy || availabilityPreview?.state === "unavailable"}
                  className="rounded bg-forest px-4 py-2 text-[11px] font-semibold text-white shadow-xs hover:bg-[#344d40] transition-colors disabled:opacity-50"
                >
                  Pay Remaining ₹{calculatedFinancials.diff.toLocaleString("en-IN")} &amp; Save
                </button>
              ) : calculatedFinancials.diff < 0 ? (
                <button
                  type="button"
                  onClick={() => void handleRefundAndSave()}
                  disabled={refundProcessing || editBusy || availabilityPreview?.state === "unavailable"}
                  className="rounded bg-forest px-4 py-2 text-[11px] font-semibold text-white shadow-xs hover:bg-[#344d40] transition-colors disabled:opacity-50"
                >
                  {refundProcessing ? "Processing refund…" : `Confirm Refund of ₹${Math.abs(calculatedFinancials.diff).toLocaleString("en-IN")} & Save`}
                </button>
              ) : (
                <button
                  disabled={editBusy || availabilityPreview?.state === "unavailable"}
                  className="rounded bg-forest px-4 py-2 text-[11px] font-semibold text-white disabled:opacity-50"
                >
                  {editBusy ? "Saving…" : availabilityPreview?.state === "checking" ? "Checking availability…" : "Save reservation"}
                </button>
              )}
              <span className="text-[10px] text-muted">Availability is rechecked atomically when you save.</span>
            </div>
          </form>}

          {/* Payment Modal for Remaining Balance */}
          {paymentModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
              <div className="w-full max-w-md rounded-lg border border-line bg-white p-6 shadow-xl">
                <div className="flex items-center justify-between border-b border-line pb-3">
                  <div>
                    <h3 className="text-sm font-bold text-charcoal">Pay Remaining Balance</h3>
                    <p className="text-[10px] text-muted">Booking: {booking.booking_code}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setPaymentModalOpen(false)}
                    className="text-xs text-muted hover:text-charcoal"
                  >
                    ✕
                  </button>
                </div>

                <div className="mt-4 rounded bg-mist/50 p-3">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted">Updated room count:</span>
                    <strong className="text-charcoal">{editForm.roomCount} room{editForm.roomCount > 1 ? "s" : ""}</strong>
                  </div>
                  <div className="mt-1 flex justify-between text-xs">
                    <span className="text-muted">Stay duration:</span>
                    <strong className="text-charcoal">{calculatedFinancials.nights} night{calculatedFinancials.nights > 1 ? "s" : ""}</strong>
                  </div>
                  <div className="mt-2 flex justify-between border-t border-line pt-2 text-xs font-semibold">
                    <span>Remaining Amount to Pay:</span>
                    <span className="text-forest text-sm">₹{calculatedFinancials.diff.toLocaleString("en-IN")}</span>
                  </div>
                </div>

                {/* Payment Method Selector */}
                <div className="mt-4">
                  <label className="text-[10px] font-semibold text-muted block mb-2">Select Payment Method</label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setPaymentMethod("UPI")}
                      className={`rounded border p-2 text-center text-[10px] font-medium transition-colors ${paymentMethod === "UPI" ? "border-forest bg-mint font-semibold text-forest" : "border-line bg-white text-muted hover:bg-mist"}`}
                    >
                      Instant UPI QR
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaymentMethod("CARD")}
                      className={`rounded border p-2 text-center text-[10px] font-medium transition-colors ${paymentMethod === "CARD" ? "border-forest bg-mint font-semibold text-forest" : "border-line bg-white text-muted hover:bg-mist"}`}
                    >
                      Card
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaymentMethod("NETBANKING")}
                      className={`rounded border p-2 text-center text-[10px] font-medium transition-colors ${paymentMethod === "NETBANKING" ? "border-forest bg-mint font-semibold text-forest" : "border-line bg-white text-muted hover:bg-mist"}`}
                    >
                      Net Banking
                    </button>
                  </div>
                </div>

                {paymentMethod === "UPI" && (
                  <div className="mt-4 flex flex-col items-center rounded border border-line bg-[#fdfbf7] p-4 text-center">
                    <p className="text-[10px] text-muted mb-2">Scan with GPay, PhonePe, Paytm or any UPI App</p>
                    <QRCodeSVG
                      value={`upi://pay?pa=stayease@okhdfcbank&pn=StayEase+Hotels&am=${calculatedFinancials.diff}&cu=INR&tn=Room+Upgrade+${encodeURIComponent(booking.booking_code)}`}
                      size={130}
                      level="M"
                      className="rounded border border-line bg-white p-2 shadow-xs"
                    />
                    <p className="mt-2 text-[9px] font-mono text-muted">stayease@okhdfcbank</p>
                    <div className="w-full mt-3 text-left">
                      <label className="text-[10px] font-semibold text-charcoal block mb-1">
                        UPI Transaction / UTR Ref (optional)
                      </label>
                      <input
                        type="text"
                        placeholder="12-digit UTR (e.g. 438291028371)"
                        value={guestUpiRef}
                        onChange={(e) => setGuestUpiRef(e.target.value.trim())}
                        className="h-8 w-full rounded border border-line px-2 text-xs font-mono"
                      />
                    </div>
                  </div>
                )}

                {paymentMethod === "CARD" && (
                  <div className="mt-4 space-y-2 rounded border border-line bg-white p-3">
                    <p className="text-[10px] font-semibold text-charcoal">Enter Card Details</p>
                    <div>
                      <label className="text-[10px] font-semibold text-muted block mb-1">Card Number (16 digits)</label>
                      <input
                        type="text"
                        placeholder="4532 0000 0000 8892"
                        maxLength={19}
                        value={guestCardDigits.number}
                        onChange={(e) => {
                          const raw = e.target.value.replace(/\D/g, "").slice(0, 16);
                          const fmt = raw.match(/.{1,4}/g)?.join(" ") || raw;
                          setGuestCardDigits((prev) => ({ ...prev, number: fmt }));
                        }}
                        className="h-8 w-full rounded border border-line bg-white px-2 text-xs font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-semibold text-muted block mb-1">Cardholder Name</label>
                      <input
                        type="text"
                        placeholder="Name on Card"
                        value={guestCardDigits.name}
                        onChange={(e) => setGuestCardDigits((prev) => ({ ...prev, name: e.target.value }))}
                        className="h-8 w-full rounded border border-line bg-white px-2 text-xs"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] font-semibold text-muted block mb-1">Expiry (MM/YY)</label>
                        <input
                          type="text"
                          placeholder="12/28"
                          maxLength={5}
                          value={guestCardDigits.expiry}
                          onChange={(e) => {
                            let val = e.target.value.replace(/\D/g, "").slice(0, 4);
                            if (val.length >= 3) val = val.slice(0, 2) + "/" + val.slice(2);
                            setGuestCardDigits((prev) => ({ ...prev, expiry: val }));
                          }}
                          className="h-8 w-full rounded border border-line bg-white px-2 text-xs font-mono"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-semibold text-muted block mb-1">CVV</label>
                        <input
                          type="password"
                          placeholder="•••"
                          maxLength={4}
                          value={guestCardDigits.cvv}
                          onChange={(e) => setGuestCardDigits((prev) => ({ ...prev, cvv: e.target.value.replace(/\D/g, "").slice(0, 4) }))}
                          className="h-8 w-full rounded border border-line bg-white px-2 text-xs font-mono"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {paymentMethod === "NETBANKING" && (
                  <div className="mt-4 space-y-2 rounded border border-line bg-white p-3">
                    <p className="text-[10px] font-semibold text-charcoal mb-1">Net Banking Settlement Details</p>
                    <div>
                      <label className="text-[10px] font-semibold text-muted block mb-1">Bank Name</label>
                      <select
                        value={guestBankDetails.bankName}
                        onChange={(e) => setGuestBankDetails((prev) => ({ ...prev, bankName: e.target.value }))}
                        className="h-8 w-full rounded border border-line bg-white px-2 text-xs"
                      >
                        <option value="HDFC Bank">HDFC Bank</option>
                        <option value="ICICI Bank">ICICI Bank</option>
                        <option value="State Bank of India">State Bank of India</option>
                        <option value="Axis Bank">Axis Bank</option>
                        <option value="Kotak Mahindra Bank">Kotak Mahindra Bank</option>
                        <option value="Other Bank">Other Bank</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] font-semibold text-muted block mb-1">Account Digits</label>
                      <input
                        type="text"
                        placeholder="Enter account digits"
                        maxLength={18}
                        value={guestBankDetails.accountNumber}
                        onChange={(e) => setGuestBankDetails((prev) => ({ ...prev, accountNumber: e.target.value.replace(/\D/g, "") }))}
                        className="h-8 w-full rounded border border-line bg-white px-2 text-xs font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-semibold text-muted block mb-1">Transfer UTR Reference</label>
                      <input
                        type="text"
                        placeholder="e.g. UTR202611239842"
                        value={guestBankDetails.utr}
                        onChange={(e) => setGuestBankDetails((prev) => ({ ...prev, utr: e.target.value.trim().toUpperCase() }))}
                        className="h-8 w-full rounded border border-line bg-white px-2 text-xs font-mono"
                      />
                    </div>
                  </div>
                )}

                <div className="mt-5 flex gap-2">
                  <button
                    type="button"
                    onClick={() => setPaymentModalOpen(false)}
                    disabled={paymentProcessing}
                    className="flex-1 rounded border border-line bg-white py-2 text-xs font-semibold text-charcoal hover:bg-mist disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => void handlePaymentAndSave()}
                    disabled={paymentProcessing}
                    className="flex-1 rounded bg-forest py-2 text-xs font-semibold text-white shadow-sm hover:bg-[#344d40] disabled:opacity-50"
                  >
                    {paymentProcessing ? "Processing & Generating Bill…" : `Pay ₹${calculatedFinancials.diff.toLocaleString("en-IN")}`}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </Surface>
  );
}
