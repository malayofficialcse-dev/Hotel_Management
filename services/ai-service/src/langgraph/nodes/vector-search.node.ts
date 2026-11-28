import { langsmith } from "../../observability/langsmith.tracer.js";
import { searchHotelCatalogVectors } from "../../vector/pinecone.client.js";
import type { ConciergeState } from "../state.js";
import { refreshHotelCatalog } from "../../vector/catalog-sync.service.js";

export async function vectorSearchNode(state: ConciergeState): Promise<Partial<ConciergeState>> {
  await refreshHotelCatalog();
  const spanId = langsmith.startSpan(state.traceId, "pinecone_vector_retriever", "retriever", {
    query: state.query,
    filters: state.extractedEntities,
  });

  try {
    const matches = await searchHotelCatalogVectors(state.query, {
      city: state.extractedEntities.city,
      maxPrice: state.extractedEntities.maxPrice,
      category: state.extractedEntities.category,
      topK: 4,
    });

    langsmith.endSpan(state.traceId, spanId, {
      matchCount: matches.length,
      topMatches: matches.map((m) => ({
        id: m.id,
        score: Number(m.score.toFixed(4)),
        hotelName: m.metadata.name || m.metadata.hotelName,
        city: m.metadata.city,
        price: m.metadata.price,
      })),
    });

    return {
      retrievedHotels: matches,
    };
  } catch (err) {
    langsmith.endSpan(state.traceId, spanId, {}, String(err));
    return {
      retrievedHotels: [],
    };
  }
}
