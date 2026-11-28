import { env } from "../config/env.js";
import { pineconeClient } from "./pinecone.client.js";
import { localVectorStore } from "./local-vector-store.js";
import type { CatalogHotel } from "./catalog-data.js";

const REFRESH_INTERVAL_MS = 5 * 60 * 1000;
let lastRefreshAt = 0;
let refreshInFlight: Promise<boolean> | null = null;
let lastPineconeSync = false;

export function isPineconeCatalogSynced(): boolean {
  return lastPineconeSync;
}

function toCatalogHotel(value: Record<string, unknown>): CatalogHotel | null {
  const id = String(value._id || value.id || value.slug || "");
  const name = String(value.name || "");
  const city = String(value.city || "");
  if (!id || !name || !city) return null;

  const features = Array.isArray(value.amenities)
    ? value.amenities.map(String)
    : Array.isArray(value.features)
      ? value.features.map(String)
      : [];
  return {
    id,
    name,
    city,
    location: String(value.location || city),
    image: String(value.mainImage || value.image || ""),
    price: Number(value.basePrice ?? value.price) || 0,
    rating: String(Number(value.rating) || 0),
    reviews: Number(value.reviewsCount ?? value.reviews) || 0,
    description: String(value.description || ""),
    tag: String(value.tag || ""),
    features,
    offer: String(value.offer || ""),
    category: String(value.category || ""),
  };
}

/** Refresh the searchable catalog from active Operations Service hotel records. */
export async function refreshHotelCatalog(force = false): Promise<boolean> {
  if (!force && Date.now() - lastRefreshAt < REFRESH_INTERVAL_MS) return true;
  if (refreshInFlight) return refreshInFlight;

  refreshInFlight = (async () => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    try {
      const response = await fetch(`${env.SERVICES.HOTEL}/api/v1/hotels`, { signal: controller.signal });
      if (!response.ok) throw new Error(`Hotel Service returned HTTP ${response.status}`);
      const payload: unknown = await response.json();
      const rows = Array.isArray(payload)
        ? payload
        : payload && typeof payload === "object" && Array.isArray((payload as { hotels?: unknown[] }).hotels)
          ? (payload as { hotels: unknown[] }).hotels
          : [];
      const hotels = rows
        .filter((row): row is Record<string, unknown> => Boolean(row && typeof row === "object"))
        .map(toCatalogHotel)
        .filter((hotel): hotel is CatalogHotel => hotel !== null);
      if (!hotels.length) throw new Error("Hotel Service returned no usable hotel records");

      const oldIds = new Set(localVectorStore.getRecords().map((record) => record.id));
      const records = await localVectorStore.replaceHotels(hotels);
      if (pineconeClient.isConfigured()) {
        const synced = await pineconeClient.upsert(records);
        const liveIds = new Set(records.map((record) => record.id));
        const staleIds = [...oldIds].filter((id) => !liveIds.has(id));
        const deleted = synced && await pineconeClient.delete(staleIds);
        lastPineconeSync = synced && deleted;
        if (!lastPineconeSync) console.warn("[AI Catalog] Pinecone sync failed; using live local catalog.");
      } else {
        lastPineconeSync = false;
      }
      lastRefreshAt = Date.now();
      return true;
    } catch (error) {
      console.warn("[AI Catalog] Live catalog refresh failed; retaining the last available catalog:", error);
      return false;
    } finally {
      clearTimeout(timeout);
      refreshInFlight = null;
    }
  })();
  return refreshInFlight;
}
