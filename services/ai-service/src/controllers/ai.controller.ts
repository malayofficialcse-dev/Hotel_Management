import type { Request, Response } from "express";
import { executeLangGraphPipeline } from "../langgraph/workflow.js";
import { pineconeClient } from "../vector/pinecone.client.js";
import { localVectorStore } from "../vector/local-vector-store.js";
import { langsmith } from "../observability/langsmith.tracer.js";
import { env } from "../config/env.js";
import { isPineconeCatalogSynced, refreshHotelCatalog } from "../vector/catalog-sync.service.js";

export async function chatHandler(req: Request, res: Response) {
  try {
    const { message, history = [], context } = req.body;
    if (!message || typeof message !== "string") {
      res.status(400).json({ error: "Missing required parameter 'message'" });
      return;
    }

    const state = await executeLangGraphPipeline(message, history, context);
    const trace = langsmith.getTrace(state.traceId);

    res.json({
      reply: state.reply,
      intent: state.intent,
      hotels: state.retrievedHotels.map((h) => ({
        id: h.id,
        score: Number(h.score.toFixed(3)),
        hotelId: h.metadata.id || h.metadata.hotelId,
        name: h.metadata.name || h.metadata.hotelName || "StayEase property",
        city: h.metadata.city,
        location: h.metadata.location || h.metadata.city,
        price: h.metadata.price,
        rating: h.metadata.rating,
        image: h.metadata.image,
        tag: h.metadata.tag || h.metadata.highlights || "",
        description: h.metadata.description || "",
        features: (h.metadata.features as string[]) || (h.metadata.amenities as string[]) || [],
        offer: h.metadata.offer || "",
      })),
      ticket: state.serviceTicket,
      serviceError: state.serviceError,
      guide: state.destinationGuide,
      traceId: state.traceId,
      trace: {
        latencyMs: trace?.latencyMs,
        spansCount: trace?.spans.length ?? 0,
        langsmithConfigured: Boolean(env.LANGSMITH.API_KEY),
      },
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
    const refreshed = await refreshHotelCatalog(true);
    if (!refreshed && localVectorStore.size() === 0) {
      throw new Error("Hotel catalog is unavailable from the Operations Service.");
    }
    res.json({
      status: refreshed ? "SUCCESS" : "DEGRADED",
      count: localVectorStore.size(),
      localStoreReady: true,
      liveCatalogSynced: refreshed,
      pineconeCloudSynced: isPineconeCatalogSynced(),
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
  const liveCatalogSynced = await refreshHotelCatalog();
  res.json({
    service: "ai-service",
    status: "HEALTHY",
    port: env.PORT,
    timestamp: new Date().toISOString(),
    pinecone: {
      configured: pineconeClient.isConfigured(),
      localCatalogCount: localVectorStore.size(),
      liveCatalogSynced,
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
