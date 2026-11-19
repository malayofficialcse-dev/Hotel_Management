import type { PineconeMatch } from "../config/pinecone.config.js";
import type { DestinationGuide } from "../knowledge/destination-guides.js";

export interface GuestContext {
  currentCity?: string;
  currentHotel?: string;
  roomNumber?: string;
  guestName?: string;
  userEmail?: string;
}

export interface ServiceTicket {
  ticketId: string;
  hotelId: string;
  roomNumber: string;
  serviceType: string;
  priority: "LOW" | "NORMAL" | "HIGH" | "URGENT";
  notes: string;
  status: "DISPATCHED" | "QUEUED" | "IN_PROGRESS";
  scheduledTime?: string;
  createdAt: string;
}

export interface ConciergeState {
  query: string;
  history: { role: "user" | "assistant"; content: string }[];
  context?: GuestContext;
  intent: "HOTEL_RECOMMENDATION" | "IN_STAY_SERVICE" | "ITINERARY_PLANNER" | "GENERAL";
  extractedEntities: {
    city?: string;
    maxPrice?: number;
    category?: string;
    amenities: string[];
    roomNumber?: string;
    serviceType?: string;
    time?: string;
  };
  retrievedHotels: PineconeMatch[];
  serviceTicket?: ServiceTicket;
  destinationGuide?: DestinationGuide;
  reply: string;
  traceId: string;
}
