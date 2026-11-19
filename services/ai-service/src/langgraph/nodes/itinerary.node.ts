import { DESTINATION_GUIDES } from "../../knowledge/destination-guides.js";
import { langsmith } from "../../observability/langsmith.tracer.js";
import type { ConciergeState } from "../state.js";

export async function itineraryNode(state: ConciergeState): Promise<Partial<ConciergeState>> {
  const spanId = langsmith.startSpan(state.traceId, "destination_knowledge_node", "tool", {
    query: state.query,
    city: state.extractedEntities.city,
  });

  const cityKey = (state.extractedEntities.city || state.context?.currentCity || "Goa").toLowerCase();
  const guide = DESTINATION_GUIDES[cityKey] || DESTINATION_GUIDES["goa"];

  langsmith.endSpan(state.traceId, spanId, {
    city: guide.city,
    sightseeingCount: guide.sightseeing.length,
    foodSpotsCount: guide.foodSpots.length,
  });

  return {
    destinationGuide: guide,
  };
}
