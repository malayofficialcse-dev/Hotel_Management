import { langsmith } from "../../observability/langsmith.tracer.js";
import type { ConciergeState } from "../state.js";

export async function routerNode(state: ConciergeState): Promise<Partial<ConciergeState>> {
  const spanId = langsmith.startSpan(state.traceId, "supervisor_router_node", "router", {
    query: state.query,
  });

  const q = state.query.toLowerCase();
  let intent: ConciergeState["intent"] = "GENERAL";

  const isService =
    /towel|pillow|blanket|water|clean|bed|shampoo|soap|housekeep|check-out|checkout|maintenance|ac not|plumbing|room\s*\d+/i.test(
      q
    );

  const isHotelSearch =
    /hotel|room|villa|resort|stay|book|under\s*₹?\s*\d+|beachfront|pool|view|property|cottage|retreat|where can i stay/i.test(
      q
    );

  const isItinerary =
    /itinerary|explore|sightsee|visit|food|eat|ferry|places to|what to do|things to do|must visit|attraction|monument/i.test(
      q
    );

  if (isService) {
    intent = "IN_STAY_SERVICE";
  } else if (isItinerary) {
    intent = "ITINERARY_PLANNER";
  } else if (isHotelSearch) {
    intent = "HOTEL_RECOMMENDATION";
  }

  let city: string | undefined;
  if (/goa|candolim|calangute|panaji/i.test(q)) city = "Goa";
  else if (/kolkata|calcutta/i.test(q)) city = "Kolkata";
  else if (/udaipur/i.test(q)) city = "Udaipur";
  else if (/kumarakom|kottayam|kerala/i.test(q)) city = "Kumarakom";
  else if (/jaipur/i.test(q)) city = "Jaipur";
  else if (/jodhpur/i.test(q)) city = "Jodhpur";
  else if (/munnar/i.test(q)) city = "Munnar";
  else if (state.context?.currentCity) city = state.context.currentCity;

  let maxPrice: number | undefined;
  const priceMatch = q.match(/(?:under|below|less than|within)\s*(?:₹|rs\.?|inr)?\s*([0-9,]+)/i);
  if (priceMatch) {
    const rawNumber = priceMatch[1].replace(/,/g, "");
    const parsed = parseInt(rawNumber, 10);
    if (!isNaN(parsed) && parsed > 500) {
      maxPrice = parsed;
    }
  }

  const amenities: string[] = [];
  if (/pool|swimming/i.test(q)) amenities.push("pool");
  if (/private pool/i.test(q)) amenities.push("private pool");
  if (/beach|beachfront|sea/i.test(q)) amenities.push("beachfront");
  if (/quiet|peaceful|calm/i.test(q)) amenities.push("quiet");
  if (/spa|massage/i.test(q)) amenities.push("spa");
  if (/breakfast/i.test(q)) amenities.push("breakfast");

  let roomNumber: string | undefined;
  const roomMatch = q.match(/(?:room|rm|suite)\s*(?:no\.?|#)?\s*([0-9]{2,4})/i);
  if (roomMatch) {
    roomNumber = roomMatch[1];
  } else if (state.context?.roomNumber) {
    roomNumber = state.context.roomNumber;
  }

  let time: string | undefined;
  const timeMatch = q.match(/at\s*([0-9]{1,2}(?::[0-9]{2})?\s*(?:am|pm)?)/i);
  if (timeMatch) {
    time = timeMatch[1];
  }

  let category: string | undefined;
  if (/villa/i.test(q)) category = "Villas & retreats";
  else if (/beach/i.test(q)) category = "Beach resorts";
  else if (/heritage|palace/i.test(q)) category = "Heritage stays";

  langsmith.endSpan(state.traceId, spanId, {
    intent,
    city,
    maxPrice,
    roomNumber,
    amenities,
  });

  return {
    intent,
    extractedEntities: {
      city,
      maxPrice,
      category,
      amenities,
      roomNumber,
      time,
      serviceType: isService ? q : undefined,
    },
  };
}
