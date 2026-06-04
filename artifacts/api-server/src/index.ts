import app from "./app.js";
import { logger } from "./lib/logger.js";
import { initDb } from "./lib/init.js";
import { startScheduler } from "./lib/autolike.js";

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error("PORT environment variable is required but was not provided.");
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

async function main() {
  await initDb();
  startScheduler();

  app.listen(port, (err?: Error) => {
    if (err) {
      logger.error({ err }, "Error listening on port");
      process.exit(1);
    }
    logger.info({ port }, "Server listening");
  });
}

main().catch(err => {
  logger.error({ err }, "Fatal startup error");
  process.exit(1);
});
