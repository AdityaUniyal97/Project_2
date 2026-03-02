import mongoose from "mongoose";

function getMongoUri() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error("Missing MONGODB_URI in environment variables.");
  }
  return uri;
}

type MongooseCache = {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
};

declare global {
  var mongooseCache: MongooseCache | undefined;
}

const cache: MongooseCache = global.mongooseCache ?? { conn: null, promise: null };

export async function connectToDatabase() {
  if (cache.conn) return cache.conn;

  if (!cache.promise) {
    // Cache the pending promise in dev to avoid hot-reload reconnection storms.
    cache.promise = mongoose.connect(getMongoUri(), {
      autoIndex: true,
      dbName: process.env.MONGODB_DB || "projectguard"
    });
  }

  cache.conn = await cache.promise;
  global.mongooseCache = cache;

  return cache.conn;
}
