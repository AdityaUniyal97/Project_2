import mongoose from "mongoose";

type MongooseCache = {
  connection: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
  lastFailureAt: number;
};

const globalForMongoose = globalThis as typeof globalThis & {
  __mongooseCache?: MongooseCache;
};

const mongooseCache = globalForMongoose.__mongooseCache ?? {
  connection: null,
  promise: null,
  lastFailureAt: 0,
};

globalForMongoose.__mongooseCache = mongooseCache;

const MAX_RETRIES = 2;
const RETRY_DELAY_MS = 2_000;
const COOLDOWN_MS = 30_000; // don't retry for 30s after all attempts fail

function getDatabaseConfig() {
  const dbUri = process.env.DB_URI;
  const dbName = process.env.DB_DB ?? "projectguard";

  if (!dbUri) {
    throw new Error("Missing DB_URI in environment.");
  }

  return { dbUri, dbName };
}

function formatConnectionError(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);
  if (message.includes("ssl") || message.includes("SSL") || message.includes("tlsv1")) {
    return `MongoDB SSL/TLS error — your IP is likely not whitelisted in Atlas. Add it at Atlas → Network Access.`;
  }
  if (message.includes("whitelist") || message.includes("IP") || message.includes("Could not connect")) {
    return `MongoDB connection refused — IP not whitelisted in Atlas. Add it at Atlas → Network Access.`;
  }
  return message;
}

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function connectToDatabase() {
  if (mongooseCache.connection) {
    return mongooseCache.connection;
  }

  // Cooldown: if we recently failed all retries, throw immediately
  if (mongooseCache.lastFailureAt && Date.now() - mongooseCache.lastFailureAt < COOLDOWN_MS) {
    throw new Error("Database unavailable — IP not whitelisted in MongoDB Atlas. Add your IP at Atlas → Network Access, then restart the server.");
  }

  if (!mongooseCache.promise) {
    const { dbUri, dbName } = getDatabaseConfig();

    mongooseCache.promise = (async () => {
      let lastError: unknown;
      for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
        try {
          const instance = await mongoose.connect(dbUri, {
            dbName,
            serverSelectionTimeoutMS: 8_000,
          });
          mongooseCache.lastFailureAt = 0;
          console.log("[db] Connected to MongoDB.");
          return instance;
        } catch (error) {
          lastError = error;
          console.warn(
            `[db] Connection attempt ${attempt}/${MAX_RETRIES} failed: ${formatConnectionError(error)}`,
          );
          if (attempt < MAX_RETRIES) await sleep(RETRY_DELAY_MS);
        }
      }
      mongooseCache.promise = null;
      mongooseCache.lastFailureAt = Date.now();
      throw new Error(formatConnectionError(lastError));
    })();
  }

  mongooseCache.connection = await mongooseCache.promise;
  return mongooseCache.connection;
}
