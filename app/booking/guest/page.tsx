"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { BookingStepper } from "@/components/booking-stepper";
import { BookingSummary } from "@/components/booking-summary";
import { FigmaIcon } from "@/components/figma-icon";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { Button, PageHeading, Surface, TextField } from "@/components/ui";
import { api } from "@/lib/api-client";
import { useBooking } from "@/components/booking-provider";

export default function GuestDetailsPage() {
  const router = useRouter();
  const {
    hotelId, roomId, checkInDate, checkOutDate, guestsCount, roomCount,
    selectedRoom, setSelectedRoom, setBooking,
  } = useBooking();
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [user, setUser] = useState<{ name: string; email: string; phone?: string } | null>(null);

  useEffect(() => {
    const token = api.getToken();
    if (!token) {
      router.push(`/auth/login?returnUrl=${encodeURIComponent("/booking/guest")}`);
      return;
    }
    const loggedInUser = api.getUser();
    if (loggedInUser) setUser(loggedInUser);
  }, [router]);

  useEffect(() => {
    if (!roomId || selectedRoom?.id === roomId) return;
    let active = true;
    api.getRoomsByHotel(hotelId)
      .then((rooms) => {
        const room = rooms.find((item) => item.id === roomId);
        if (active && room) setSelectedRoom(room);
        else if (active) setError("Your selected room is no longer available. Please choose another room.");
      })
      .catch((cause: unknown) => {
        if (active) setError(cause instanceof Error ? cause.message : "Could not load your selected room.");
      });
    return () => { active = false; };
  }, [hotelId, roomId, selectedRoom, setSelectedRoom]);

  async function continueToReview(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    if (!roomId || selectedRoom?.id !== roomId) {
      setError("Please select a room before continuing.");
      return;
    }
    const nights = (Date.parse(`${checkOutDate}T00:00:00Z`) - Date.parse(`${checkInDate}T00:00:00Z`)) / 86_400_000;
    if (!Number.isInteger(nights) || nights < 1) {
      setError("Choose a valid check-in and check-out date before continuing.");
      return;
    }
    if (guestsCount > selectedRoom.capacity * roomCount) {
      setError(`This room can accommodate up to ${selectedRoom.capacity * roomCount} guests.`);
      return;
    }
    setSubmitting(true);
    const data = new FormData(event.currentTarget);
    try {
      const hotel = await api.getHotel(hotelId);
      const result = await api.holdRoom({
        hotelId,
        hotelName: hotel?.name || hotelId,
        roomTypeId: roomId,
        roomTypeName: selectedRoom.name,
        checkInDate,
        checkOutDate,
        guestsCount,
        roomCount,
        guestFirstName: String(data.get("firstName")),
        guestLastName: String(data.get("lastName")),
        guestEmail: String(data.get("email")),
        guestPhone: String(data.get("phone")),
        specialRequests: String(data.get("specialRequests") || ""),
      });
      if (!result.success) {
        setError(result.message || "We couldn't reserve that room. Please try again.");
        return;
      }
      setBooking({ bookingId: result.data.bookingId, bookingCode: result.data.bookingCode, totalPrice: result.data.totalPrice });
      router.push("/booking/review");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "We couldn't reserve that room. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <SiteHeader />
      <BookingStepper active={1} />
      <main className="mx-auto grid max-w-[1160px] gap-6 px-5 py-8 lg:grid-cols-[minmax(0,1fr)_320px] lg:px-0">
        <form onSubmit={continueToReview}>
          <PageHeading title="Let’s make it your stay." description="A few details, and you’re one step closer to Goa." />
          <div className="mt-6 rounded-[4px] bg-sky p-4 text-[10px]">
            <p className="flex items-center gap-2 font-semibold"><FigmaIcon name="shield" className="h-4 w-4" /> You’re booking as {user?.name || "StayEase Guest"}</p>
            <p className="mt-1 pl-6 text-muted">We’ve filled in your verified details. You can review or adjust them below.</p>
          </div>
          <Surface className="mt-4 p-5">
            <h2 className="text-sm font-semibold">Lead guest details</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <TextField name="firstName" label="First name *" key={`fn-${user?.name}`} defaultValue={user?.name ? user.name.split(" ")[0] : "Aarav"} required />
              <TextField name="lastName" label="Last name *" key={`ln-${user?.name}`} defaultValue={user?.name ? user.name.split(" ").slice(1).join(" ") || "Guest" : "Mehta"} required />
              <TextField name="email" label="Email address *" type="email" key={`em-${user?.email}`} defaultValue={user?.email || "aarav.mehta@gmail.com"} required />
              <TextField name="phone" label="Mobile number *" type="tel" key={`ph-${user?.phone}`} defaultValue={user?.phone || "+91 98765 43210"} required />
            </div>
            <p className="mt-3 text-[10px] text-muted">Your confirmation and stay updates will be sent here.</p>
            <div className="mt-4 flex flex-wrap gap-5 text-[11px]">
              <label className="flex items-center gap-2"><input type="radio" name="guest-type" defaultChecked className="accent-[#486958]" /> I’m the lead guest</label>
              <label className="flex items-center gap-2 text-muted"><input type="radio" name="guest-type" className="accent-[#486958]" /> Booking for someone else</label>
            </div>
          </Surface>
          <Surface className="mt-4 p-5">
            <h2 className="text-sm font-semibold">Address</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <TextField label="Street address *" defaultValue="24, Palm Avenue, Indiranagar" required className="sm:col-span-2" />
              <TextField label="City *" defaultValue="Bengaluru" required />
              <TextField label="Postal code *" defaultValue="560038" required />
              <TextField label="State *" defaultValue="Karnataka" required />
              <TextField label="Country *" defaultValue="India" required />
            </div>
          </Surface>
          <Surface className="mt-4 p-5">
            <h2 className="text-sm font-semibold">Make yourself at home</h2>
            <label className="mt-4 block text-[11px] font-medium">
              Special requests (optional)
              <textarea name="specialRequests" defaultValue="A quiet room on a higher floor would be lovely, please." rows={3} className="mt-2 w-full resize-y rounded-[4px] border border-line p-3 text-xs font-normal" />
            </label>
            <p className="mt-2 text-[10px] text-muted">We’ll share your requests with the hotel. They’re subject to availability.</p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <label className="text-[10px] font-medium">Estimated arrival<select className="mt-2 h-10 w-full rounded-[4px] border border-line px-3 text-xs font-normal"><option>2:00 PM – 3:00 PM</option><option>3:00 PM – 4:00 PM</option></select></label>
              <label className="text-[10px] font-medium">Room preference<select className="mt-2 h-10 w-full rounded-[4px] border border-line px-3 text-xs font-normal"><option>Non-smoking</option><option>Smoking</option></select></label>
            </div>
          </Surface>
          <label className="mt-4 flex items-center gap-2 text-[10px]"><input type="checkbox" defaultChecked className="accent-[#486958]" /> Save these details for my next getaway</label>
          <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
            <Button href="/booking/room" variant="outline">Back to rooms</Button>
            <Button type="submit" disabled={submitting || !selectedRoom || selectedRoom.id !== roomId}>{submitting ? "Reserving…" : "Review my booking"} <FigmaIcon name="arrow-right" className="h-4 w-4" /></Button>
          </div>
          {error && <p role="alert" className="mt-3 rounded-[4px] bg-blush p-3 text-[10px] text-red-800">{error}</p>}
        </form>
        <div className="lg:sticky lg:top-24 lg:h-fit"><BookingSummary /></div>
      </main>
      <SiteFooter />
    </>
  );
}
