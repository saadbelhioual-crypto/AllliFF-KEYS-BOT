import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "../drizzle/schema";
import * as localDb from "./localDb";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error("DATABASE_URL is not set");
}

const client = postgres(connectionString || "", { 
  ssl: 'require',
  connect_timeout: 10,
});

export const db = drizzle(client, { schema });

// تصدير دوال localDb عبر db للتوافق مع sdk.ts و oauth.ts
export const getUserByOpenId = localDb.getUserByOpenId;
export const upsertUser = localDb.upsertUser;

export async function checkConnection() {
  try {
    await client`SELECT 1`;
    return true;
  } catch (err) {
    console.error("Database connection failed:", err);
    return false;
  }
}
