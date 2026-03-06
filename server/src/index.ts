import "dotenv/config";

import app from "./app";
import { connectToDatabase } from "./lib/db";

const port = Number(process.env.PORT ?? 8000);

async function bootstrap() {
  // Start listening immediately so the server stays responsive
  app.listen(port, () => {
    console.log(`[server] listening on http://localhost:${port}`);
  });

  // Try connecting to DB in background — routes will retry lazily if this fails
  try {
    await connectToDatabase();
    console.log("[server] Database connected.");
  } catch (error) {
    console.error("[server] Initial DB connection failed — routes will retry per-request:", error instanceof Error ? error.message : error);
  }
}

bootstrap().catch((error) => {
  console.error("[server] failed to start", error);
  process.exit(1);
});
