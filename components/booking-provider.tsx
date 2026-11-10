"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";

type BookingState = {
  roomId: string;
  savedHotelIds: string[];
  paymentMethod: string;
  setRoomId: (roomId: string) => void;
  toggleSavedHotel: (hotelId: string) => void;
  setPaymentMethod: (method: string) => void;
};

const BookingContext = createContext<BookingState | null>(null);
const STORAGE_KEY = "stayease-state";

export function BookingProvider({ children }: { children: React.ReactNode }) {
  const [roomId, setRoomId] = useState("deluxe");
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

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const state = JSON.parse(saved) as Partial<{
          roomId: string;
          savedHotelIds: string[];
          paymentMethod: string;
        }>;
        if (state.roomId) setRoomId(state.roomId);
        if (Array.isArray(state.savedHotelIds)) setSavedHotelIds(state.savedHotelIds);
        if (state.paymentMethod) setPaymentMethod(state.paymentMethod);
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
        JSON.stringify({ roomId, savedHotelIds, paymentMethod }),
      );
    } catch (error) {
      console.error("Could not persist the StayEase session.", error);
    }
  }, [hydrated, roomId, savedHotelIds, paymentMethod]);

  const value = useMemo(
    () => ({
      roomId,
      savedHotelIds,
      paymentMethod,
      setRoomId,
      setPaymentMethod,
      toggleSavedHotel: (hotelId: string) => {
        setSavedHotelIds((current) =>
          current.includes(hotelId)
            ? current.filter((id) => id !== hotelId)
            : [...current, hotelId],
        );
      },
    }),
    [roomId, savedHotelIds, paymentMethod],
  );

  return <BookingContext.Provider value={value}>{children}</BookingContext.Provider>;
}

export function useBooking() {
  const context = useContext(BookingContext);
  if (!context) throw new Error("useBooking must be used within BookingProvider");
  return context;
}
