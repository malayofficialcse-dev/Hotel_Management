"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
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
    selectedRoom, setSelectedRoom, setBooking, guestDetails, setGuestDetails, hydrated,
  } = useBooking();
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const submissionInFlight = useRef(false);
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
    if (!hydrated || !user) return;
    const [firstName = "", ...lastNames] = user.name.trim().split(/\s+/);
    const updates: Partial<typeof guestDetails> = {};
    if (!guestDetails.firstName) updates.firstName = firstName;
    if (!guestDetails.lastName) updates.lastName = lastNames.join(" ");
    if (!guestDetails.email) updates.email = user.email;
    if (!guestDetails.phone && user.phone) updates.phone = user.phone;
    if (Object.keys(updates).length) setGuestDetails(updates);
  }, [hydrated, user, guestDetails, setGuestDetails]);

  function updateGuestField(field: keyof typeof guestDetails, value: string) {
    setGuestDetails({ [field]: value });
  }

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
    if (submissionInFlight.current) return;
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
    submissionInFlight.current = true;
    setSubmitting(true);
    let navigationStarted = false;
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
        guestFirstName: guestDetails.firstName,
        guestLastName: guestDetails.lastName,
        guestEmail: guestDetails.email,
        guestPhone: guestDetails.phone,
        specialRequests: guestDetails.specialRequests,
      });
      if (!result.success) {
        setError(result.message || "We couldn't reserve that room. Please try again.");
        return;
      }
      setBooking({ bookingId: result.data.bookingId, bookingCode: result.data.bookingCode, totalPrice: result.data.totalPrice });
      router.push("/booking/review");
      navigationStarted = true;
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "We couldn't reserve that room. Please try again.");
    } finally {
      if (!navigationStarted) {
        submissionInFlight.current = false;
        setSubmitting(false);
      }
    }
  }

  return (
    <>
      <SiteHeader />
      <BookingStepper active={1} />
      <main className="mx-auto grid max-w-[1160px] gap-6 px-5 py-8 lg:grid-cols-[minmax(0,1fr)_320px] lg:px-0">
        <form onSubmit={continueToReview}>
          <fieldset disabled={submitting} aria-busy={submitting} className="m-0 min-w-0 border-0 p-0">
          <PageHeading title="Let’s make it your stay." description="A few details, and you’re one step closer to Goa." />
          <div className="mt-6 rounded-[4px] bg-sky p-4 text-[10px]">
            <p className="flex items-center gap-2 font-semibold"><FigmaIcon name="shield" className="h-4 w-4" /> You’re booking as {user?.name || "StayEase Guest"}</p>
            <p className="mt-1 pl-6 text-muted">We’ve filled in your verified details. You can review or adjust them below.</p>
          </div>
          <Surface className="mt-4 p-5">
            <h2 className="text-sm font-semibold">Lead guest details</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <TextField name="firstName" label="First name *" value={guestDetails.firstName} onChange={(event) => updateGuestField("firstName", event.target.value)} required />
              <TextField name="lastName" label="Last name *" value={guestDetails.lastName} onChange={(event) => updateGuestField("lastName", event.target.value)} required />
              <TextField name="email" label="Email address *" type="email" value={guestDetails.email} onChange={(event) => updateGuestField("email", event.target.value)} required />
              <TextField name="phone" label="Mobile number *" type="tel" value={guestDetails.phone} onChange={(event) => updateGuestField("phone", event.target.value)} required />
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
              <TextField label="Street address *" name="street" value={guestDetails.street} onChange={(event) => updateGuestField("street", event.target.value)} required className="sm:col-span-2" />
              <TextField label="City *" name="city" value={guestDetails.city} onChange={(event) => updateGuestField("city", event.target.value)} required />
              <TextField label="Postal code *" name="postalCode" value={guestDetails.postalCode} onChange={(event) => updateGuestField("postalCode", event.target.value)} required />
              <TextField label="State *" name="state" value={guestDetails.state} onChange={(event) => updateGuestField("state", event.target.value)} required />
              <TextField label="Country *" name="country" value={guestDetails.country} onChange={(event) => updateGuestField("country", event.target.value)} required />
            </div>
          </Surface>
          <Surface className="mt-4 p-5">
            <h2 className="text-sm font-semibold">Make yourself at home</h2>
            <label className="mt-4 block text-[11px] font-medium">
              Special requests (optional)
              <textarea name="specialRequests" value={guestDetails.specialRequests} onChange={(event) => updateGuestField("specialRequests", event.target.value)} rows={3} className="mt-2 w-full resize-y rounded-[4px] border border-line p-3 text-xs font-normal" />
            </label>
            <p className="mt-2 text-[10px] text-muted">We’ll share your requests with the hotel. They’re subject to availability.</p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <label className="text-[10px] font-medium">Estimated arrival<select value={guestDetails.arrivalTime} onChange={(event) => updateGuestField("arrivalTime", event.target.value)} className="mt-2 h-10 w-full rounded-[4px] border border-line px-3 text-xs font-normal"><option>2:00 PM – 3:00 PM</option><option>3:00 PM – 4:00 PM</option></select></label>
              <label className="text-[10px] font-medium">Room preference<select value={guestDetails.roomPreference} onChange={(event) => updateGuestField("roomPreference", event.target.value)} className="mt-2 h-10 w-full rounded-[4px] border border-line px-3 text-xs font-normal"><option>Non-smoking</option><option>Smoking</option></select></label>
            </div>
          </Surface>
          <label className="mt-4 flex items-center gap-2 text-[10px]"><input type="checkbox" defaultChecked className="accent-[#486958]" /> Save these details for my next getaway</label>
          <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
            <Button href="/booking/room" variant="outline" disabled={submitting}>Back to rooms</Button>
            <Button type="submit" loading={submitting} disabled={!selectedRoom || selectedRoom.id !== roomId}>
              {submitting ? "Reserving…" : "Review my booking"}
              {!submitting && <FigmaIcon name="arrow-right" className="h-4 w-4" />}
            </Button>
          </div>
          </fieldset>
          {error && <p role="alert" className="mt-3 rounded-[4px] bg-blush p-3 text-[10px] text-red-800">{error}</p>}
        </form>
        <div className="lg:sticky lg:top-24 lg:h-fit"><BookingSummary /></div>
      </main>
      <SiteFooter />
    </>
  );
}
