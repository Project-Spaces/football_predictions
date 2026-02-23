import { neon } from "@neondatabase/serverless";

function getSQL() {
  const url = process.env.DATABASE_URL || process.env.POSTGRES_URL;
  if (!url) {
    throw new Error("DATABASE_URL or POSTGRES_URL environment variable is not set");
  }
  return neon(url);
}

// Initialize the users table (safe to call multiple times)
export async function initDb() {
  const sql = getSQL();
  await sql`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;
}

export default function sql(strings, ...values) {
  return getSQL()(strings, ...values);
}
