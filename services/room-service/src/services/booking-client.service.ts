import axios from "axios";

const bookingServiceUrl = process.env.BOOKING_SERVICE_URL || "http://localhost:8005";

export async function getBookedRoomCount(roomTypeId: string, checkIn: string, checkOut: string) {
  const response = await axios.get(
    `${bookingServiceUrl}/internal/rooms/${encodeURIComponent(roomTypeId)}/booked-count`,
    { params: { checkIn, checkOut }, timeout: 3000 },
  );
  const count = Number(response.data?.count);
  if (!Number.isInteger(count) || count < 0) throw new Error("Booking service returned an invalid room count");
  return count;
}

export type RoomAvailabilityCalendar = {
  roomTypeId: string;
  startDate: string;
  endDate: string;
  totalInventory: number;
  days: Array<{
    date: string;
    bookedInventory: number;
    availableInventory: number;
    isAvailable: boolean;
  }>;
};

export async function getRoomAvailabilityCalendar(roomTypeId: string, startDate: string, endDate: string) {
  const response = await axios.get(
    `${bookingServiceUrl}/internal/rooms/${encodeURIComponent(roomTypeId)}/availability`,
    { params: { startDate, endDate }, timeout: 5000 },
  );
  const calendar = response.data?.data as RoomAvailabilityCalendar | undefined;
  if (!calendar || !Array.isArray(calendar.days)) throw new Error("Booking service returned an invalid room calendar");
  return calendar;
}
