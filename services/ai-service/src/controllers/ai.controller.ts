import type { Request, Response } from "express";
import { executeLangGraphPipeline } from "../langgraph/workflow.js";
import { pineconeClient } from "../vector/pinecone.client.js";
import { localVectorStore } from "../vector/local-vector-store.js";
import { CATALOG_DATASET } from "../vector/catalog-data.js";
import { generateEmbedding } from "../vector/embedding.service.js";
import { langsmith } from "../observability/langsmith.tracer.js";
import { env } from "../config/env.js";
import type { PineconeRecord } from "../config/pinecone.config.js";

export async function chatHandler(req: Request, res: Response) {
  try {
    const { message, history = [], context } = req.body;
    if (!message || typeof message !== "string") {
      res.status(400).json({ error: "Missing required parameter 'message'" });
      return;
    }

    const state = await executeLangGraphPipeline(message, history, context);

    res.json({
      reply: state.reply,
      intent: state.intent,
      hotels: state.retrievedHotels.map((h) => ({
        id: h.id,
        score: Number(h.score.toFixed(3)),
        hotelId: h.metadata.id || h.metadata.hotelId,
        hotelName: h.metadata.name || h.metadata.hotelName,
        city: h.metadata.city,
        price: h.metadata.price,
        rating: h.metadata.rating,
        highlights: h.metadata.tag || h.metadata.highlights || h.metadata.description,
        roomTypes: (h.metadata.roomTypes as string[]) || ["Deluxe Suite", "Executive Villa"],
        amenities: (h.metadata.features as string[]) || (h.metadata.amenities as string[]) || [],
      })),
      ticket: state.serviceTicket,
      guide: state.destinationGuide,
      traceId: state.traceId,
    });
  } catch (err: any) {
    res.status(500).json({
      error: "Internal server error",
      details: err?.message || String(err),
    });
  }
}

export async function syncVectorsHandler(_req: Request, res: Response) {
  try {
    const vectors: PineconeRecord[] = [];
    for (const item of CATALOG_DATASET) {
      const textToEmbed = `${item.name} ${item.city} ${item.location} ${item.category} ${item.tag} ${item.description} ${item.features.join(" ")}`;
      const values = await generateEmbedding(textToEmbed);
      vectors.push({
        id: `hotel_${item.id}`,
        values,
        metadata: {
          id: item.id,
          name: item.name,
          city: item.city,
          location: item.location,
          price: item.price,
          rating: parseFloat(item.rating) || 4.5,
          reviews: item.reviews,
          category: item.category,
          tag: item.tag,
          features: item.features,
          description: item.description,
          image: item.image,
          offer: item.offer,
        },
      });
    }

    // Always update local store
    localVectorStore.load(vectors);

    // If Pinecone is configured, upsert into Pinecone cloud
    let pineconeUpserted = false;
    if (pineconeClient.isConfigured()) {
      pineconeUpserted = await pineconeClient.upsert(vectors);
    }

    res.json({
      status: "SUCCESS",
      count: vectors.length,
      localStoreReady: true,
      pineconeCloudSynced: pineconeUpserted,
      pineconeConfigured: pineconeClient.isConfigured(),
    });
  } catch (err: any) {
    res.status(500).json({
      error: "Failed to sync vectors",
      details: err?.message || String(err),
    });
  }
}

export async function healthHandler(_req: Request, res: Response) {
  res.json({
    service: "ai-service",
    status: "HEALTHY",
    port: env.PORT,
    timestamp: new Date().toISOString(),
    pinecone: {
      configured: pineconeClient.isConfigured(),
      localCatalogCount: localVectorStore.size(),
    },
    gemini: {
      configured: Boolean(env.GEMINI_API_KEY),
    },
    langsmith: {
      configured: Boolean(env.LANGSMITH.API_KEY),
      project: env.LANGSMITH.PROJECT,
      recentTracesCount: langsmith.getTraces().length,
    },
  });
}

export async function tracesHandler(_req: Request, res: Response) {
  res.json({
    traces: langsmith.getTraces(15),
  });
}
