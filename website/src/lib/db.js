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

// Initialize votes table
export async function initVotesTable() {
  const sql = getSQL();
  await sql`
    CREATE TABLE IF NOT EXISTS prediction_votes (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id),
      prediction_rank INTEGER NOT NULL,
      prediction_date DATE NOT NULL,
      vote TEXT NOT NULL CHECK (vote IN ('up', 'down')),
      created_at TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE(user_id, prediction_rank, prediction_date)
    )
  `;
}

// Initialize bankroll table
export async function initBankrollTable() {
  const sql = getSQL();
  await sql`
    CREATE TABLE IF NOT EXISTS bankroll_entries (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id),
      date DATE NOT NULL DEFAULT CURRENT_DATE,
      stake NUMERIC(10,2) NOT NULL,
      result TEXT NOT NULL CHECK (result IN ('win', 'loss', 'pending')),
      profit_loss NUMERIC(10,2) DEFAULT 0,
      balance NUMERIC(10,2) NOT NULL,
      note TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;
}

// Initialize game_analyses table (pre-game market analysis cache)
export async function initGameAnalysesTable() {
  const sql = getSQL();
  await sql`
    CREATE TABLE IF NOT EXISTS game_analyses (
      id SERIAL PRIMARY KEY,
      home_team TEXT NOT NULL,
      away_team TEXT NOT NULL,
      match_date DATE,
      league TEXT,
      season TEXT,
      analysis_json JSONB NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE(home_team, away_team, match_date)
    )
  `;
  await sql`
    CREATE INDEX IF NOT EXISTS idx_game_analyses_lookup
      ON game_analyses(home_team, away_team, match_date)
  `;
}

// Initialize game_outcomes table (actual results after games end)
export async function initGameOutcomesTable() {
  const sql = getSQL();
  await sql`
    CREATE TABLE IF NOT EXISTS game_outcomes (
      id SERIAL PRIMARY KEY,
      home_team TEXT NOT NULL,
      away_team TEXT NOT NULL,
      match_date DATE NOT NULL,
      league TEXT,
      home_goals INT,
      away_goals INT,
      total_corners INT,
      total_cards INT,
      btts BOOLEAN,
      result TEXT CHECK (result IN ('home', 'away', 'draw')),
      raw_stats JSONB,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE(home_team, away_team, match_date)
    )
  `;
}

// Initialize market_outcomes table (per-market hit/miss per game)
export async function initMarketOutcomesTable() {
  const sql = getSQL();
  await sql`
    CREATE TABLE IF NOT EXISTS market_outcomes (
      id SERIAL PRIMARY KEY,
      game_outcome_id INT NOT NULL REFERENCES game_outcomes(id) ON DELETE CASCADE,
      market_name TEXT NOT NULL,
      recommendation TEXT NOT NULL,
      actual_value TEXT NOT NULL,
      hit BOOLEAN NOT NULL,
      confidence_at_time NUMERIC(5,2),
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;
  await sql`
    CREATE INDEX IF NOT EXISTS idx_market_outcomes_name
      ON market_outcomes(market_name, hit)
  `;
}

// Initialize daily_predictions table (all matched predictions, lightweight — no API calls)
export async function initDailyPredictionsTable() {
  const sql = getSQL();
  await sql`
    CREATE TABLE IF NOT EXISTS daily_predictions (
      id SERIAL PRIMARY KEY,
      match_date DATE NOT NULL,
      home_team TEXT NOT NULL,
      away_team TEXT NOT NULL,
      league TEXT,
      country TEXT,
      win_probability NUMERIC(5,2),
      created_at TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE(home_team, away_team, match_date)
    )
  `;
  await sql`
    CREATE INDEX IF NOT EXISTS idx_daily_predictions_date
      ON daily_predictions(match_date DESC)
  `;
}

export default function sql(strings, ...values) {
  return getSQL()(strings, ...values);
}
