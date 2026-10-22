import { Pool, type PoolClient, type QueryResultRow } from "pg";
import { config } from "../config";

/**
 * One connection pool for the whole process.
 *
 * A pool reuses a handful of TCP connections instead of opening a new one for
 * every request. Postgres can handle far more requests than it can handle
 * simultaneous connections, so pooling is essential under load.
 */
export const pool = new Pool({
  connectionString: config.databaseUrl,
  max: 10,
  idleTimeoutMillis: 30_000,
});

pool.on("error", (error) => {
  // A background client failed (for example the database restarted).
  // Log it instead of crashing the whole API.
  console.error("[db] unexpected idle client error", error);
});

/** Typed helper for one-off queries. */
export function query<T extends QueryResultRow = QueryResultRow>(
  text: string,
  values: unknown[] = [],
) {
  return pool.query<T>(text, values);
}

/**
 * Run several queries as one transaction.
 *
 * `withTransaction` always releases the client, and rolls back if the callback
 * throws. Order creation uses this so stock updates and order rows succeed or
 * fail together ("all-or-nothing").
 */
export async function withTransaction<T>(
  callback: (client: PoolClient) => Promise<T>,
): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await callback(client);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}
