import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL);

// Initialize the users table (safe to call multiple times)
export async function initDb() {
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

export default sql;
