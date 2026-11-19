import { env } from "../../config/env.js";
import { langsmith } from "../../observability/langsmith.tracer.js";
import type { ConciergeState } from "../state.js";

export async function synthesizerNode(state: ConciergeState): Promise<Partial<ConciergeState>> {
  const spanId = langsmith.startSpan(state.traceId, "gemini_synthesizer_llm", "llm", {
    intent: state.intent,
    hasHotels: state.retrievedHotels.length > 0,
    hasTicket: Boolean(state.serviceTicket),
    hasGuide: Boolean(state.destinationGuide),
  });

  const guestName = state.context?.guestName || "Guest";

  let groundedPrompt = `You are StayEase 24/7 Virtual Concierge & Smart Guest Assistant.
Guest Name: ${guestName}
Intent: ${state.intent}
User Query: "${state.query}"
`;

  if (state.intent === "HOTEL_RECOMMENDATION" && state.retrievedHotels.length > 0) {
    groundedPrompt += `\nRelevant Hotels from Pinecone Vector Search:\n` +
      state.retrievedHotels.map((h, i) => {
        const hotelName = String(h.metadata.name || h.metadata.hotelName || "StayEase Property");
        const features = Array.isArray(h.metadata.features) ? h.metadata.features.join(", ") : "";
        const desc = String(h.metadata.description || h.metadata.tag || "");
        return `${i + 1}. ${hotelName} (${h.metadata.city})
   - Price: ₹${h.metadata.price}/night | Rating: ${h.metadata.rating}★
   - Features: ${features}
   - Description: ${desc}
   - Score: ${h.score.toFixed(3)}`;
      }).join("\n\n");
  } else if (state.intent === "IN_STAY_SERVICE" && state.serviceTicket) {
    groundedPrompt += `\nHousekeeping Service Action Taken:
Ticket ID: ${state.serviceTicket.ticketId}
Allocated Room: ${state.serviceTicket.roomNumber}
Requested Task: ${state.serviceTicket.serviceType}
Priority: ${state.serviceTicket.priority}
Status: ${state.serviceTicket.status}
Estimated Fulfillment: ${state.serviceTicket.scheduledTime}`;
  } else if (state.intent === "ITINERARY_PLANNER" && state.destinationGuide) {
    const g = state.destinationGuide;
    groundedPrompt += `\nDestination Knowledge (${g.city}):
- Sightseeing Highlights: ${g.sightseeing.map((s) => `${s.name} (${s.bestTime})`).join("; ")}
- Food & Dining Spots: ${g.foodSpots.map((f) => `${f.name} - ${f.speciality} (${f.location})`).join("; ")}
- Transit / Ferry Info: ${g.localTransit.map((t) => `${t.type}: ${t.info}`).join(" | ")}
- Insider Advice: ${g.tips.join(" | ")}`;
  }

  // Attempt live Gemini 1.5 Flash API call
  let reply = "";
  if (env.GEMINI_API_KEY) {
    try {
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${env.GEMINI_API_KEY}`;
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [
                {
                  text: `${groundedPrompt}\n\nProvide a warm, polite, formatted response with clear recommendations, next steps, or confirmation details. Use markdown bullet points and bold headers where helpful.`
                }
              ]
            }
          ],
          generationConfig: {
            temperature: 0.3,
            maxOutputTokens: 600,
          }
        }),
      });

      if (res.ok) {
        const data = await res.json() as any;
        reply = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "";
      }
    } catch {
      reply = "";
    }
  }

  // Fallback synthesis if offline or key not provided
  if (!reply) {
    if (state.intent === "HOTEL_RECOMMENDATION") {
      if (state.retrievedHotels.length > 0) {
        const top = state.retrievedHotels[0];
        const topName = String(top.metadata.name || top.metadata.hotelName || "StayEase Property");
        reply = `✨ Here are our top handpicked recommendations based on your preferences:\n\n` +
          state.retrievedHotels.slice(0, 3).map((h) => {
            const name = String(h.metadata.name || h.metadata.hotelName || "StayEase Property");
            const feats = Array.isArray(h.metadata.features) ? h.metadata.features.slice(0, 4).join(", ") : "";
            const desc = String(h.metadata.tag || h.metadata.description || "");
            return `🏨 **${name}**, ${h.metadata.city}\n` +
              `• **Rate:** ₹${Number(h.metadata.price).toLocaleString("en-IN")}/night (${h.metadata.rating}★)\n` +
              `• **Highlights:** ${desc}\n` +
              `• **Key Amenities:** ${feats}`;
          }).join("\n\n") +
          `\n\nWould you like me to guide you through booking at **${topName}**?`;
      } else {
        reply = "I couldn't find an exact property match with those specific filters. Would you like to expand your budget or check our recommended stays across Goa, Udaipur, or Kumarakom?";
      }
    } else if (state.intent === "IN_STAY_SERVICE") {
      const t = state.serviceTicket!;
      reply = `🛎️ **Service Request Confirmed!**\n\n` +
        `• **Ticket ID:** \`${t.ticketId}\`\n` +
        `• **Room:** ${t.roomNumber}\n` +
        `• **Request:** ${t.serviceType}\n` +
        `• **Priority:** ${t.priority}\n` +
        `• **Status:** ${t.status} — Our staff has been notified.\n` +
        `• **Estimated Arrival:** ${t.scheduledTime}\n\n` +
        `If you need anything else or have additional instructions, just let me know!`;
    } else if (state.intent === "ITINERARY_PLANNER") {
      const g = state.destinationGuide!;
      reply = `🗺️ **Curated Local Itinerary for ${g.city}**\n\n` +
        `**Top Sightseeing Spots:**\n` +
        g.sightseeing.slice(0, 3).map((s) => `• **${s.name}** – Best visited: *${s.bestTime}*\n  _${s.description}_`).join("\n") +
        `\n\n**Must-Visit Dining:**\n` +
        g.foodSpots.slice(0, 3).map((f) => `• **${f.name}** (${f.location}) – Famous for *${f.speciality}*`).join("\n") +
        `\n\n**Local Transit & Ferry Advice:**\n` +
        g.localTransit.map((t) => `• ${t.type}: ${t.info}`).join("\n") +
        `\n\n💡 _Concierge Tip: ${g.tips[0]}_`;
    } else {
      reply = `Hello ${guestName}! I am your StayEase 24/7 AI Concierge. I can help you find luxury villas, schedule housekeeping requests (e.g. extra towels or late check-out), or plan your day's itinerary with local spots and ferry timings. How can I assist you today?`;
    }
  }

  langsmith.endSpan(state.traceId, spanId, {
    replyLength: reply.length,
    model: env.GEMINI_API_KEY ? "gemini-1.5-flash" : "grounded-synthesizer-engine",
  });

  return {
    reply,
  };
}
