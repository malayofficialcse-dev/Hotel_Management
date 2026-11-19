import { env } from "./env.js";

export interface HotelVectorMetadata {
  id: string;
  name: string;
  city: string;
  location: string;
  price: number;
  rating: number;
  reviews: number;
  category: string;
  tag: string;
  features: string[];
  description: string;
  image: string;
  offer?: string;
  [key: string]: unknown;
}

export interface PineconeRecord {
  id: string;
  values: number[]; // 768-dimensional normalized embedding
  metadata: HotelVectorMetadata;
}

export interface PineconeMatch {
  id: string;
  score: number;
  values?: number[];
  metadata: HotelVectorMetadata;
}

export const PINECONE_CONFIG = {
  INDEX_NAME: env.PINECONE_INDEX,
  DIMENSION: 768,
  METRIC: "cosine" as const,
  API_KEY: env.PINECONE_API_KEY,
  HOST: env.PINECONE_HOST,
  ENVIRONMENT: env.PINECONE_ENVIRONMENT,
};
