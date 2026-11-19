import { langsmith } from "../observability/langsmith.tracer.js";
import { housekeepingToolNode } from "./nodes/housekeeping-tool.node.js";
import { itineraryNode } from "./nodes/itinerary.node.js";
import { routerNode } from "./nodes/router.node.js";
import { synthesizerNode } from "./nodes/synthesizer.node.js";
import { vectorSearchNode } from "./nodes/vector-search.node.js";
import type { ConciergeState, GuestContext } from "./state.js";

export async function executeLangGraphPipeline(
  query: string,
  history: { role: "user" | "assistant"; content: string }[] = [],
  context?: GuestContext
): Promise<ConciergeState> {
  const trace = langsmith.startTrace("concierge_rag_pipeline", {
    query,
    historyLength: history.length,
    guestContext: context,
  });

  const state: ConciergeState = {
    query,
    history,
    context,
    intent: "GENERAL",
    extractedEntities: {
      amenities: [],
    },
    retrievedHotels: [],
    reply: "",
    traceId: trace.traceId,
  };

  try {
    // Node 1: Supervisor Router
    const routerUpdate = await routerNode(state);
    Object.assign(state, routerUpdate);

    // Node 2: Conditional Branching based on classified intent
    switch (state.intent) {
      case "HOTEL_RECOMMENDATION": {
        const searchUpdate = await vectorSearchNode(state);
        Object.assign(state, searchUpdate);
        break;
      }
      case "IN_STAY_SERVICE": {
        const serviceUpdate = await housekeepingToolNode(state);
        Object.assign(state, serviceUpdate);
        break;
      }
      case "ITINERARY_PLANNER": {
        const itineraryUpdate = await itineraryNode(state);
        Object.assign(state, itineraryUpdate);
        break;
      }
      default:
        // General query - no tools needed
        break;
    }

    // Node 3: Synthesizer & Grounding LLM
    const synthUpdate = await synthesizerNode(state);
    Object.assign(state, synthUpdate);

    langsmith.endTrace(state.traceId, {
      intent: state.intent,
      reply: state.reply,
      retrievedHotelsCount: state.retrievedHotels.length,
      ticketCreated: Boolean(state.serviceTicket),
      destinationCity: state.destinationGuide?.city,
    });

    return state;
  } catch (err: any) {
    langsmith.endTrace(state.traceId, {}, err?.message || String(err));
    state.reply = "I apologize, but I encountered a temporary issue processing your request. Please try again in a moment.";
    return state;
  }
}
