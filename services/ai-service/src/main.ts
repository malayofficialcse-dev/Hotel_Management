import { createApp } from "./app.js";
import { env } from "./config/env.js";
import { CATALOG_DATASET } from "./vector/catalog-data.js";
import { localVectorStore } from "./vector/local-vector-store.js";
import { refreshHotelCatalog } from "./vector/catalog-sync.service.js";

async function bootstrap() {
  const app = createApp();

  // Pre-seed local vector store for zero-delay instant response
  console.log("[AI Service] Initializing semantic vector store...");
  try {
    await localVectorStore.replaceHotels(CATALOG_DATASET);
    const liveSynced = await refreshHotelCatalog(true);
    console.log(`[AI Service] Loaded ${localVectorStore.size()} hotels (${liveSynced ? "live Operations catalog" : "local fallback catalog"})`);
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
