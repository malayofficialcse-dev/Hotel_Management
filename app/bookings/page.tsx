"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { Button, PageHeading, Surface } from "@/components/ui";
import { api, type UserBooking } from "@/lib/api-client";
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
    return () => {
      active = false;
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
}: {
  booking: UserBooking;
  hotel?: Hotel;
  group: BookingGroup;
}) {
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
        </div>
      </div>
    </Surface>
  );
}
