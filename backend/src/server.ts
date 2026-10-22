import { createApp } from "./app";
import { cleanupExpiredSessions } from "./auth";
import { config } from "./config";
import { pool } from "./db/pool";

const app = createApp();

const server = app.listen(config.port, () => {
  console.log(`[api] listening on http://localhost:${config.port}`);
});

// Clean up expired sessions at startup and once per hour after that.
void cleanupExpiredSessions().catch((error) => {
  console.error("[api] could not clean expired sessions", error);
});
const cleanupTimer = setInterval(() => {
  void cleanupExpiredSessions().catch((error) => {
    console.error("[api] could not clean expired sessions", error);
  });
}, 60 * 60 * 1000);
cleanupTimer.unref();

/**
 * Graceful shutdown: stop accepting requests, close the database pool, then
 * exit. This avoids leaving half-finished queries behind when you restart.
 */
async function shutdown(signal: string) {
  console.log(`[api] ${signal} received, shutting down…`);
  server.close(async () => {
    await pool.end();
    process.exit(0);
  });

  // Force-exit if a connection refuses to close.
  setTimeout(() => process.exit(1), 10_000).unref();
}

process.on("SIGINT", () => void shutdown("SIGINT"));
process.on("SIGTERM", () => void shutdown("SIGTERM"));
