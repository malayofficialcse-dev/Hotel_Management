import "dotenv/config";

export const env = {
  PORT: Number(process.env.PORT || 8013),
  NODE_ENV: process.env.NODE_ENV || "development",

  // Pinecone
  PINECONE_API_KEY: process.env.PINECONE_API_KEY || "",
  PINECONE_INDEX: process.env.PINECONE_INDEX || "stayease-hotels",
  PINECONE_HOST: (process.env.PINECONE_HOST || "").replace(/\/$/, ""),
  PINECONE_ENVIRONMENT: process.env.PINECONE_ENVIRONMENT || "us-east-1",

  // LLM
  GEMINI_API_KEY: process.env.GEMINI_API_KEY || "",

  // LangSmith
  LANGCHAIN_TRACING_V2: process.env.LANGCHAIN_TRACING_V2 === "true",
  LANGCHAIN_API_KEY: process.env.LANGCHAIN_API_KEY || "",
  LANGCHAIN_PROJECT: process.env.LANGCHAIN_PROJECT || "stayease-ai-service",
  LANGCHAIN_ENDPOINT: (process.env.LANGCHAIN_ENDPOINT || "https://api.smith.langchain.com").replace(/\/$/, ""),

  LANGSMITH: {
    API_KEY: process.env.LANGCHAIN_API_KEY || "",
    PROJECT: process.env.LANGCHAIN_PROJECT || "stayease-ai-service",
    ENDPOINT: (process.env.LANGCHAIN_ENDPOINT || "https://api.smith.langchain.com").replace(/\/$/, ""),
  },

  // Downstream Microservices
  HOTEL_SERVICE_URL: (process.env.HOTEL_SERVICE_URL || "http://localhost:8003").replace(/\/$/, ""),
  HOUSEKEEPING_SERVICE_URL: (process.env.HOUSEKEEPING_SERVICE_URL || "http://localhost:8008").replace(/\/$/, ""),
  API_GATEWAY_URL: (process.env.API_GATEWAY_URL || "http://localhost:8000").replace(/\/$/, ""),

  SERVICES: {
    HOTEL: (process.env.HOTEL_SERVICE_URL || "http://localhost:8003").replace(/\/$/, ""),
    HOUSEKEEPING: (process.env.HOUSEKEEPING_SERVICE_URL || "http://localhost:8008").replace(/\/$/, ""),
    GATEWAY: (process.env.API_GATEWAY_URL || "http://localhost:8000").replace(/\/$/, ""),
  },
} as const;
