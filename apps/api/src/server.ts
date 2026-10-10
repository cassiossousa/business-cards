import "dotenv/config";
import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";

import { buildApp } from "./app.js";
import { createDatabase } from "./db/database.js";

const port = Number(process.env.PORT ?? 8787);
const host = process.env.HOST ?? "localhost";
const databasePath = resolve(
  process.env.DATABASE_PATH ?? "data/business-cards.db",
);
const corsOrigin = process.env.CORS_ORIGIN ?? "http://localhost:5173";

mkdirSync(dirname(databasePath), { recursive: true });

const database = createDatabase(databasePath);
const app = await buildApp({ database, corsOrigin, logger: true });

async function shutdown(signal: string): Promise<void> {
  app.log.info(`Received ${signal}, shutting down.`);
  await app.close();
  database.close();
  process.exit(0);
}

process.on("SIGINT", () => void shutdown("SIGINT"));
process.on("SIGTERM", () => void shutdown("SIGTERM"));

try {
  await app.listen({ port, host });
} catch (error) {
  app.log.error(error);
  process.exit(1);
}
