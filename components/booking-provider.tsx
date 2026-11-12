"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { PublicRoom } from "@/lib/api-client";

type BookingState = {
  roomId: string;
  hotelId: string;
  checkInDate: string;
  checkOutDate: string;
  guestsCount: number;
  roomCount: number;
  selectedRoom?: PublicRoom;
  booking?: { bookingId: string; bookingCode: string; totalPrice: number };
  savedHotelIds: string[];
  paymentMethod: string;
  setSelectedRoom: (room: PublicRoom) => void;
  setBookingDetails: (details: Partial<Pick<BookingState, "hotelId" | "checkInDate" | "checkOutDate" | "guestsCount" | "roomCount">>) => void;
  setBooking: (booking: BookingState["booking"]) => void;
  toggleSavedHotel: (hotelId: string) => void;
  setPaymentMethod: (method: string) => void;
};

const BookingContext = createContext<BookingState | null>(null);
const STORAGE_KEY = "stayease-state";

export function BookingProvider({ children }: { children: React.ReactNode }) {
  const [roomId, setRoomId] = useState("");
  const [selectedRoom, setSelectedRoomState] = useState<PublicRoom>();
  const [hotelId, setHotelId] = useState("palm-house");
  const [checkInDate, setCheckInDate] = useState("2026-12-18");
  const [checkOutDate, setCheckOutDate] = useState("2026-12-21");
  const [guestsCount, setGuestsCount] = useState(2);
  const [roomCount, setRoomCount] = useState(1);
  const [booking, setBooking] = useState<BookingState["booking"]>();
  const [savedHotelIds, setSavedHotelIds] = useState([
    "palm-house",
    "haveli",
    "lakehouse",
    "green-canopy",
    "marine-collective",
    "river-root",
  ]);
  const [paymentMethod, setPaymentMethod] = useState("Credit / Debit card");
  const [hydrated, setHydrated] = useState(false);

  const setSelectedRoom = useCallback((room: PublicRoom) => {
    setRoomId(room.id);
    setSelectedRoomState(room);
  }, []);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const state = JSON.parse(saved) as Partial<{
          roomId: string;
          savedHotelIds: string[];
          paymentMethod: string;
          hotelId: string; checkInDate: string; checkOutDate: string; guestsCount: number; roomCount: number;
        }>;
        if (state.roomId) setRoomId(state.roomId);
        if (Array.isArray(state.savedHotelIds)) setSavedHotelIds(state.savedHotelIds);
        if (state.paymentMethod) setPaymentMethod(state.paymentMethod);
        if (state.hotelId) setHotelId(state.hotelId);
        if (state.checkInDate) setCheckInDate(state.checkInDate);
        if (state.checkOutDate) setCheckOutDate(state.checkOutDate);
        if (state.guestsCount) setGuestsCount(state.guestsCount);
        if (state.roomCount) setRoomCount(state.roomCount);
      }
    } catch (error) {
      console.error("Could not restore the saved StayEase session.", error);
    } finally {
      setHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ roomId, hotelId, checkInDate, checkOutDate, guestsCount, roomCount, savedHotelIds, paymentMethod }),
      );
    } catch (error) {
      console.error("Could not persist the StayEase session.", error);
    }
  }, [hydrated, roomId, hotelId, checkInDate, checkOutDate, guestsCount, roomCount, savedHotelIds, paymentMethod]);

  const value = useMemo(
    () => ({
      roomId,
      hotelId, checkInDate, checkOutDate, guestsCount, roomCount, selectedRoom, booking,
      savedHotelIds,
      paymentMethod,
      setSelectedRoom,
      setPaymentMethod,
      setBookingDetails: (details: Partial<Pick<BookingState, "hotelId" | "checkInDate" | "checkOutDate" | "guestsCount" | "roomCount">>) => {
        if (details.hotelId !== undefined) setHotelId(details.hotelId);
        if (details.checkInDate !== undefined) setCheckInDate(details.checkInDate);
        if (details.checkOutDate !== undefined) setCheckOutDate(details.checkOutDate);
        if (details.guestsCount !== undefined) setGuestsCount(details.guestsCount);
        if (details.roomCount !== undefined) setRoomCount(details.roomCount);
      },
      setBooking,
      toggleSavedHotel: (hotelId: string) => {
        setSavedHotelIds((current) =>
          current.includes(hotelId)
            ? current.filter((id) => id !== hotelId)
            : [...current, hotelId],
        );
      },
    }),
    [roomId, hotelId, checkInDate, checkOutDate, guestsCount, roomCount, selectedRoom, booking, savedHotelIds, paymentMethod],
  );

  return <BookingContext.Provider value={value}>{children}</BookingContext.Provider>;
}

export function useBooking() {
  const context = useContext(BookingContext);
  if (!context) throw new Error("useBooking must be used within BookingProvider");
  return context;
}
