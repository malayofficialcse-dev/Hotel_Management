import mongoose from "mongoose";

export async function connectDatabase() {
  const uri = process.env.MONGODB_URI || "mongodb://localhost:27017/hotel_housekeeping";

  await mongoose.connect(uri, {
    maxPoolSize: Number(process.env.MONGODB_MAX_POOL_SIZE || 20),
    serverSelectionTimeoutMS: 5000,
  });
  console.log("[Housekeeping Service] MongoDB connected");
}
