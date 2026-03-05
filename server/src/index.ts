import "dotenv/config";

import app from "./app";
import { connectToDatabase } from "./lib/db";

const port = Number(process.env.PORT ?? 8000);

async function bootstrap() {
  await connectToDatabase();

  app.listen(port, () => {
    console.log(`[server] listening on http://localhost:${port}`);
  });
}

bootstrap().catch((error) => {
  console.error("[server] failed to start", error);
  process.exit(1);
});
