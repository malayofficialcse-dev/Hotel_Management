import { env } from "../../config/env.js";
import { langsmith } from "../../observability/langsmith.tracer.js";
import type { ConciergeState, ServiceTicket } from "../state.js";

export async function housekeepingToolNode(state: ConciergeState): Promise<Partial<ConciergeState>> {
  const spanId = langsmith.startSpan(state.traceId, "housekeeping_service_tool", "tool", {
    query: state.query,
    roomNumber: state.extractedEntities.roomNumber,
    serviceType: state.extractedEntities.serviceType,
  });

  const room = state.extractedEntities.roomNumber || state.context?.roomNumber;
  const hotelId = state.context?.currentHotel;
  const service = state.extractedEntities.serviceType || "Guest in-stay assistance";
  const priority = /urgent|emergency|flood|leak|broken/i.test(state.query)
    ? "URGENT"
    : /check-out|checkout/i.test(state.query)
      ? "HIGH"
      : "NORMAL";

  if (!hotelId || !room) {
    const serviceError = !hotelId
      ? "I need your active hotel booking before I can send a room service request."
      : "Please include your room number so I can send this request to the right room.";
    langsmith.endSpan(state.traceId, spanId, { serviceError });
    return { serviceError };
  }

  // Attempt to forward to actual housekeeping service microservice
  try {
    const housekeepingUrl = `${env.SERVICES.HOUSEKEEPING}/api/v1/housekeeping`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2000);

    const res = await fetch(housekeepingUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        hotelId,
        roomNumber: room,
        taskType: service,
        guestName: state.context?.guestName || "Guest",
        guestEmail: state.context?.userEmail || "",
        bookingReference: state.context?.bookingCode || "",
        priority,
        status: "DIRTY",
        notes: state.query,
        taskDate: new Date().toISOString(),
      }),
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!res.ok) throw new Error(`Housekeeping service returned HTTP ${res.status}`);
    const created = await res.json() as { _id?: string; id?: string; createdAt?: string; status?: string };
    const serviceTicket: ServiceTicket = {
      ticketId: String(created._id || created.id || ""),
      hotelId,
      roomNumber: room,
      serviceType: service,
      priority,
      notes: state.query,
      status: "DISPATCHED",
      scheduledTime: state.extractedEntities.time || "As soon as staff is available",
      createdAt: created.createdAt || new Date().toISOString(),
    };
    langsmith.endSpan(state.traceId, spanId, { serviceTicket });
    return { serviceTicket };
  } catch (error) {
    const serviceError = error instanceof Error ? error.message : "Housekeeping service is unavailable.";
    langsmith.endSpan(state.traceId, spanId, {}, serviceError);
    return { serviceError };
  }
}
