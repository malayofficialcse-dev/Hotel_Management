import "dotenv/config";
import mongoose from "mongoose";

const options = { maxPoolSize: Number(process.env.MONGODB_MAX_POOL_SIZE || 20), serverSelectionTimeoutMS: 5000 };
export const catalogDb = mongoose.createConnection(process.env.CATALOG_MONGODB_URI || process.env.MONGODB_URI || "mongodb://localhost:27017/hotel_catalog", options);
export const departmentDb = mongoose.createConnection(process.env.DEPARTMENT_MONGODB_URI || "mongodb://localhost:27017/hotel_departments", options);
export const housekeepingDb = mongoose.createConnection(process.env.HOUSEKEEPING_MONGODB_URI || "mongodb://localhost:27017/hotel_housekeeping", options);
export const reviewDb = mongoose.createConnection(process.env.REVIEW_MONGODB_URI || "mongodb://localhost:27017/hotel_reviews", options);

export async function connectDatabases() {
  await Promise.all([catalogDb.asPromise(), departmentDb.asPromise(), housekeepingDb.asPromise(), reviewDb.asPromise()]);
  console.log("[Operations Service] connected to catalog, departments, housekeeping, and reviews MongoDB databases");
}

export async function disconnectDatabases() {
  await Promise.all([catalogDb.close(), departmentDb.close(), housekeepingDb.close(), reviewDb.close()]);
}
