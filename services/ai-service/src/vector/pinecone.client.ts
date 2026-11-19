import { PINECONE_CONFIG, type PineconeMatch, type PineconeRecord } from "../config/pinecone.config.js";
import { localVectorStore } from "./local-vector-store.js";
import { generateEmbedding } from "./embedding.service.js";

export class PineconeCloudClient {
  private apiKey: string;
  private host: string;

  constructor() {
    this.apiKey = PINECONE_CONFIG.API_KEY;
    this.host = PINECONE_CONFIG.HOST.replace(/\/$/, "");
  }

  isConfigured(): boolean {
    return Boolean(this.apiKey && this.host);
  }

  async upsert(records: PineconeRecord[]): Promise<boolean> {
    if (!this.isConfigured()) return false;
    const url = `${this.host}/vectors/upsert`;
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Api-Key": this.apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ vectors: records }),
    });
    return res.ok;
  }

  async query(
    vector: number[],
    topK = 4,
    filter?: Record<string, unknown>
  ): Promise<PineconeMatch[]> {
    if (!this.isConfigured()) {
      return localVectorStore.query(vector, topK, filter);
    }

    try {
      const url = `${this.host}/query`;
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Api-Key": this.apiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          vector,
          topK,
          includeMetadata: true,
          filter,
        }),
      });

      if (!res.ok) {
        console.warn(`[Pinecone Client] HTTP ${res.status}, falling back to local vector store`);
        return localVectorStore.query(vector, topK, filter);
      }

      const data = (await res.json()) as { matches?: PineconeMatch[] };
      return data.matches || [];
    } catch (err) {
      console.warn("[Pinecone Client] Connection error, using local vector store fallback:", err);
      return localVectorStore.query(vector, topK, filter);
    }
  }
}

export const pineconeClient = new PineconeCloudClient();

export async function searchHotelCatalogVectors(
  query: string,
  options: {
    topK?: number;
    city?: string;
    maxPrice?: number;
    category?: string;
  } = {}
): Promise<PineconeMatch[]> {
  const queryVector = await generateEmbedding(query);

  const filter: Record<string, any> = {};
  if (options.city && options.city.toLowerCase() !== "all") {
    filter.city = options.city;
  }
  if (options.maxPrice && options.maxPrice > 0) {
    filter.price = { $lte: options.maxPrice };
  }
  if (options.category && options.category.toLowerCase() !== "all") {
    filter.category = options.category;
  }

  let matches = await pineconeClient.query(queryVector, options.topK || 4, Object.keys(filter).length ? filter : undefined);

  // Fallback relaxation if category filter was overly restrictive
  if (matches.length === 0 && filter.category) {
    delete filter.category;
    matches = await pineconeClient.query(queryVector, options.topK || 4, Object.keys(filter).length ? filter : undefined);
  }

  // Fallback relaxation if price filter was overly restrictive
  if (matches.length === 0 && filter.price) {
    delete filter.price;
    matches = await pineconeClient.query(queryVector, options.topK || 4, Object.keys(filter).length ? filter : undefined);
  }

  return matches;
}
