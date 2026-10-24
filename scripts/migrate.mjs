import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";
import { pgConfig } from "../lib/pgconfig.mjs";

try { process.loadEnvFile(".env"); } catch (_) {}
try { process.loadEnvFile(".env.local"); } catch (_) {}

const dir = path.dirname(fileURLToPath(import.meta.url));
const sql = fs.readFileSync(path.join(dir, "..", "db", "schema.sql"), "utf8");
const client = new pg.Client(pgConfig());
await client.connect();
try {
  await client.query(sql);
  console.log("Skema database berhasil dibuat.");
} finally {
  await client.end();
}
