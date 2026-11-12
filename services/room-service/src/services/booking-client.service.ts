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
