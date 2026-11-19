import { defaultCatalogHotels } from "./catalog-data.js";
import { generateEmbedding, cosineSimilarity } from "./embedding.service.js";
import type { HotelVectorMetadata, PineconeMatch, PineconeRecord } from "../config/pinecone.config.js";

class LocalVectorDatabase {
  private records: PineconeRecord[] = [];
  private initialized = false;

  async init(): Promise<void> {
    if (this.initialized) return;

    for (const h of defaultCatalogHotels) {
      const documentText = [
        h.name,
        h.city,
        h.location,
        h.category,
        h.tag,
        h.features.join(", "),
        h.description,
        `Price: ₹${h.price}`,
        `Rating: ${h.rating}`,
      ].join(" | ");

      const values = await generateEmbedding(documentText);
      const metadata: HotelVectorMetadata = {
        id: h.id,
        name: h.name,
        city: h.city,
        location: h.location,
        price: h.price,
        rating: parseFloat(h.rating) || 4.5,
        reviews: h.reviews,
        category: h.category,
        tag: h.tag,
        features: h.features,
        description: h.description,
        image: h.image,
        offer: h.offer,
      };

      this.records.push({
        id: `hotel_${h.id}`,
        values,
        metadata,
      });
    }

    this.initialized = true;
  }

  async query(
    queryVector: number[],
    topK = 4,
    filter?: Record<string, any>
  ): Promise<PineconeMatch[]> {
    await this.init();

    let candidates = this.records;

    if (filter) {
      candidates = candidates.filter((rec) => {
        const m = rec.metadata;
        if (filter.city && filter.city !== "All" && m.city.toLowerCase() !== String(filter.city).toLowerCase()) {
          return false;
        }
        if (filter.category && filter.category !== "All" && m.category.toLowerCase() !== String(filter.category).toLowerCase()) {
          return false;
        }
        if (filter.price) {
          if (typeof filter.price === "object") {
            if (filter.price.$lte !== undefined && m.price > filter.price.$lte) return false;
            if (filter.price.$gte !== undefined && m.price < filter.price.$gte) return false;
          } else if (m.price > filter.price) {
            return false;
          }
        }
        return true;
      });
    }

    const scored: PineconeMatch[] = candidates.map((rec) => ({
      id: rec.id,
      score: cosineSimilarity(queryVector, rec.values),
      metadata: rec.metadata,
    }));

    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, topK);
  }

  getRecords(): PineconeRecord[] {
    return this.records;
  }

  load(records: PineconeRecord[]): void {
    this.records = records;
    this.initialized = true;
  }

  size(): number {
    return this.records.length;
  }
}

export const localVectorStore = new LocalVectorDatabase();
