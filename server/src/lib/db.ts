import mongoose from "mongoose";

type MongooseCache = {
  connection: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
};

const globalForMongoose = globalThis as typeof globalThis & {
  __mongooseCache?: MongooseCache;
};

const mongooseCache = globalForMongoose.__mongooseCache ?? {
  connection: null,
  promise: null,
};

globalForMongoose.__mongooseCache = mongooseCache;

function getDatabaseConfig() {
  const dbUri = process.env.DB_URI;
  const dbName = process.env.DB_DB ?? "projectguard";

  if (!dbUri) {
    throw new Error("Missing DB_URI in environment.");
  }

  return { dbUri, dbName };
}

export async function connectToDatabase() {
  if (mongooseCache.connection) {
    return mongooseCache.connection;
  }

  if (!mongooseCache.promise) {
    const { dbUri, dbName } = getDatabaseConfig();

    mongooseCache.promise = mongoose
      .connect(dbUri, { dbName })
      .then((mongooseInstance) => mongooseInstance)
      .catch((error) => {
        mongooseCache.promise = null;
        throw error;
      });
  }

  mongooseCache.connection = await mongooseCache.promise;
  return mongooseCache.connection;
}
