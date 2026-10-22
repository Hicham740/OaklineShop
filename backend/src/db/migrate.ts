import { readFile } from "node:fs/promises";
import path from "node:path";
import { pool } from "./pool";

/**
 * Apply sql/schema.sql.
 *
 * Every statement uses `IF NOT EXISTS`, so this is safe to run more than once.
 * For real schema changes over time you would switch to numbered migration
 * files; this single file is enough for the current project.
 */
async function main() {
  const schemaPath = path.resolve(process.cwd(), "sql", "schema.sql");
  const sql = await readFile(schemaPath, "utf8");

  console.log(`[db] applying ${schemaPath}`);
  await pool.query(sql);
  console.log("[db] schema is up to date");
}

main()
  .catch((error) => {
    console.error("[db] migration failed", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });
