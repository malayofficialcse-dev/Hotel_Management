"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
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
  const [availabilityPreview, setAvailabilityPreview] = useState<{ state: "checking" | "available" | "unavailable" | "error"; message: string } | null>(null);
  const [editForm, setEditForm] = useState({ checkInDate: dateOnly(booking.check_in_date), checkOutDate: dateOnly(booking.check_out_date), roomCount: booking.room_count, guestsCount: booking.guests_count, specialRequests: booking.special_requests || "" });
  const [cancelBusy, setCancelBusy] = useState(false);

  useEffect(() => {
    if (editing) return;
    setEditForm({ checkInDate: dateOnly(booking.check_in_date), checkOutDate: dateOnly(booking.check_out_date), roomCount: booking.room_count, guestsCount: booking.guests_count, specialRequests: booking.special_requests || "" });
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
    setEditBusy(true);
    setEditMessage("");
    try {
      const updated = await api.updateMyBooking(booking.id, editForm);
      onBookingUpdated(updated);
      setEditing(false);
      setEditMessage("Reservation updated. Availability has been recalculated.");
      window.dispatchEvent(new Event("stayease-reservations-updated"));
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not update reservation.";
      setEditMessage(message.includes("(405)") || message.includes("Method Not Allowed")
        ? "The booking service currently running does not have reservation updates enabled. Restart or rebuild the booking-service, then try again."
        : message);
    }
    finally { setEditBusy(false); }
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
          {editMessage && <p role="status" className="basis-full text-[10px] text-muted">{editMessage}</p>}
          {editing && <form onSubmit={(event) => void saveReservation(event)} className="grid w-full gap-3 rounded border border-line bg-mist/50 p-3 sm:grid-cols-2">
            <label className="text-[10px] font-semibold">Check in<input type="date" required value={editForm.checkInDate} onChange={(event) => setEditForm((form) => ({ ...form, checkInDate: event.target.value }))} className="mt-1 block h-9 w-full rounded border border-line bg-white px-2 text-xs font-normal" /></label>
            <label className="text-[10px] font-semibold">Check out<input type="date" required min={editForm.checkInDate} value={editForm.checkOutDate} onChange={(event) => setEditForm((form) => ({ ...form, checkOutDate: event.target.value }))} className="mt-1 block h-9 w-full rounded border border-line bg-white px-2 text-xs font-normal" /></label>
            <label className="text-[10px] font-semibold">Rooms<input type="number" required min={1} max={20} value={editForm.roomCount} onChange={(event) => setEditForm((form) => ({ ...form, roomCount: Number(event.target.value) }))} className="mt-1 block h-9 w-full rounded border border-line bg-white px-2 text-xs font-normal" /></label>
            <label className="text-[10px] font-semibold">Guests<input type="number" required min={1} max={100} value={editForm.guestsCount} onChange={(event) => setEditForm((form) => ({ ...form, guestsCount: Number(event.target.value) }))} className="mt-1 block h-9 w-full rounded border border-line bg-white px-2 text-xs font-normal" /></label>
            <label className="text-[10px] font-semibold sm:col-span-2">Special requests<textarea maxLength={2000} value={editForm.specialRequests} onChange={(event) => setEditForm((form) => ({ ...form, specialRequests: event.target.value }))} className="mt-1 block w-full rounded border border-line bg-white px-2 py-2 text-xs font-normal" /></label>
            {availabilityPreview && <p role="status" aria-live="polite" className={`rounded px-3 py-2 text-[10px] sm:col-span-2 ${availabilityPreview.state === "available" ? "bg-mint text-forest" : availabilityPreview.state === "unavailable" ? "bg-rose-50 text-rose-700" : "bg-white text-muted"}`}>{availabilityPreview.message}</p>}
            <div className="flex items-center gap-3 sm:col-span-2"><button disabled={editBusy || availabilityPreview?.state === "unavailable"} className="rounded bg-forest px-3 py-2 text-[10px] font-semibold text-white disabled:opacity-50">{editBusy ? "Saving…" : availabilityPreview?.state === "checking" ? "Checking availability…" : "Save reservation"}</button><span className="text-[10px] text-muted">Availability is rechecked atomically when you save.</span></div>
          </form>}
        </div>
      )}
    </Surface>
  );
}
