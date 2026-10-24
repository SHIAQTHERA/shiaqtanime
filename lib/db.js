import pg from "pg";
import { pgConfig } from "./pgconfig.mjs";

const globalForPg = globalThis;

export const pool =
  globalForPg.__shqPool ||
  new pg.Pool(pgConfig({
    // Supabase membatasi jumlah koneksi; pool kecil cukup (gunakan pooler port 6543 untuk hosting serverless)
    max: Number(process.env.DATABASE_POOL_MAX) || 5,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 15000
  }));
if (process.env.NODE_ENV !== "production") globalForPg.__shqPool = pool;

export const query = (text, params) => pool.query(text, params);

export async function tx(fn) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const out = await fn(client);
    await client.query("COMMIT");
    return out;
  } catch (e) {
    try { await client.query("ROLLBACK"); } catch (_) {}
    throw e;
  } finally {
    client.release();
  }
}
