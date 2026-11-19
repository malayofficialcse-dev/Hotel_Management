import { createApp } from "./app.js";
import { env } from "./config/env.js";
import { CATALOG_DATASET } from "./vector/catalog-data.js";
import { generateEmbedding } from "./vector/embedding.service.js";
import { localVectorStore } from "./vector/local-vector-store.js";
import { pineconeClient } from "./vector/pinecone.client.js";
import type { PineconeRecord } from "./config/pinecone.config.js";

async function bootstrap() {
  const app = createApp();

  // Pre-seed local vector store for zero-delay instant response
  console.log("[AI Service] Initializing semantic vector store...");
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
    localVectorStore.load(vectors);
    console.log(`[AI Service] Loaded ${vectors.length} hotel vector embeddings into local store`);

    if (pineconeClient.isConfigured()) {
      console.log("[AI Service] Pinecone Cloud is configured. Syncing vectors in background...");
      pineconeClient.upsert(vectors).then((ok) => {
        if (ok) console.log("[AI Service] Pinecone Cloud sync completed successfully");
        else console.warn("[AI Service] Pinecone Cloud sync returned non-OK status");
      }).catch((e) => console.warn("[AI Service] Pinecone background sync error:", e));
    } else {
      console.log("[AI Service] Running with fast embedded Vector Store (Pinecone compatible 768-dim cosine)");
    }
  } catch (err) {
    console.warn("[AI Service] Note during vector bootstrap:", err);
  }

  const server = app.listen(env.PORT, () => {
    console.log(`[AI Service] 🤖 StayEase AI Concierge Service listening on http://localhost:${env.PORT}`);
    console.log(`[AI Service] Health check: http://localhost:${env.PORT}/api/v1/ai/health`);
    console.log(`[AI Service] Chat endpoint: http://localhost:${env.PORT}/api/v1/ai/chat`);
  });

  const shutdown = () => {
    console.log("[AI Service] Shutting down gracefully...");
    server.close(() => {
      console.log("[AI Service] Process terminated.");
      process.exit(0);
    });
  };

  process.on("SIGTERM", shutdown);
  process.on("SIGINT", shutdown);
}

bootstrap().catch((err) => {
  console.error("[AI Service] Fatal error starting server:", err);
  process.exit(1);
});
