import { env } from "../config/env.js";

const VECTOR_DIMENSION = 768;

/**
 * Generates 768-dimensional normalized dense embedding vectors.
 * Calls Gemini text-embedding-004 if GEMINI_API_KEY is configured,
 * or uses deterministic normalized semantic feature mapping.
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  if (env.GEMINI_API_KEY) {
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent?key=${env.GEMINI_API_KEY}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            model: "models/text-embedding-004",
            content: { parts: [{ text }] },
          }),
        }
      );
      if (res.ok) {
        const data = (await res.json()) as { embedding?: { values?: number[] } };
        const values = data?.embedding?.values;
        if (Array.isArray(values) && values.length === VECTOR_DIMENSION) {
          return values;
        }
      }
    } catch (e) {
      console.warn("[Embedding Service] External API error, falling back to local semantic encoder:", e);
    }
  }

  return createSemanticVector(text);
}

function createSemanticVector(text: string): number[] {
  const lower = text.toLowerCase();
  const vector = new Float32Array(VECTOR_DIMENSION);

  const semanticFeatures: [string, number, number][] = [
    // Locations
    ["goa", 5, 2.5],
    ["candolim", 8, 2.0],
    ["calangute", 9, 2.0],
    ["kolkata", 15, 2.5],
    ["udaipur", 22, 2.5],
    ["kumarakom", 28, 2.5],
    ["jaipur", 35, 2.5],
    ["jodhpur", 40, 2.5],
    ["munnar", 45, 2.5],

    // Types
    ["beach", 55, 3.0],
    ["beachfront", 56, 3.5],
    ["villa", 65, 3.0],
    ["retreat", 68, 2.0],
    ["resort", 70, 2.5],
    ["heritage", 80, 2.8],
    ["palace", 82, 3.0],
    ["boutique", 90, 2.2],
    ["luxury", 100, 2.5],
    ["budget", 110, 2.0],

    // Amenities
    ["pool", 125, 3.0],
    ["private pool", 128, 3.8],
    ["infinity pool", 130, 3.5],
    ["spa", 140, 2.2],
    ["wifi", 150, 1.8],
    ["free wi-fi", 152, 1.8],
    ["breakfast", 160, 2.2],
    ["sea view", 170, 2.8],
    ["lake", 180, 2.6],
    ["lake view", 182, 3.0],
    ["quiet", 195, 2.5],
    ["peaceful", 197, 2.5],

    // Price tags & vibes
    ["under 10000", 225, 3.0],
    ["under 10,000", 226, 3.0],
    ["under 15000", 230, 2.5],
    ["under 5000", 235, 3.0],
    ["cheap", 240, 2.0],
    ["affordable", 245, 2.0],
    ["romantic", 260, 2.2],
    ["family", 270, 2.0],
  ];

  for (const [term, dim, weight] of semanticFeatures) {
    if (lower.includes(term)) {
      vector[dim] += weight;
      if (dim > 0) vector[dim - 1] += weight * 0.4;
      if (dim < VECTOR_DIMENSION - 1) vector[dim + 1] += weight * 0.4;
    }
  }

  const words = lower.split(/\W+/).filter(Boolean);
  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    let hash = 0;
    for (let j = 0; j < word.length; j++) {
      hash = (hash << 5) - hash + word.charCodeAt(j);
      hash |= 0;
    }
    const idx = Math.abs(hash) % VECTOR_DIMENSION;
    vector[idx] += 0.8 / (i + 1);
  }

  let norm = 0;
  for (let i = 0; i < VECTOR_DIMENSION; i++) {
    norm += vector[i] * vector[i];
  }
  norm = Math.sqrt(norm);
  if (norm > 0) {
    for (let i = 0; i < VECTOR_DIMENSION; i++) {
      vector[i] /= norm;
    }
  }

  return Array.from(vector);
}

export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) return 0;
  let dot = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
  }
  return dot;
}
