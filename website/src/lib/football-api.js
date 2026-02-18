/**
 * football-api.js
 *
 * Fetches live Premier League data from football-data.org (free tier).
 * - 10 requests/minute rate limit
 * - Uses in-memory cache with 1-hour TTL to stay well within limits
 * - Falls back to hardcoded data if the API fails
 *
 * API docs: https://www.football-data.org/documentation/api
 */

const API_BASE = "https://api.football-data.org/v4";
const API_KEY = process.env.FOOTBALL_DATA_API_KEY;

// ─── Simple in-memory cache ───────────────────────────────────────────────────
// Each entry: { data, timestamp }
const cache = {};
const CACHE_TTL = 60 * 60 * 1000; // 1 hour in milliseconds

function getCached(key) {
  const entry = cache[key];
  if (entry && Date.now() - entry.timestamp < CACHE_TTL) {
    return entry.data;
  }
  return null;
}

function setCache(key, data) {
  cache[key] = { data, timestamp: Date.now() };
}

// ─── Generic fetch helper ─────────────────────────────────────────────────────
async function apiFetch(endpoint) {
  const res = await fetch(`${API_BASE}${endpoint}`, {
    headers: { "X-Auth-Token": API_KEY },
    next: { revalidate: 3600 }, // Next.js fetch cache: 1 hour
  });

  if (!res.ok) {
    throw new Error(`football-data.org ${res.status}: ${res.statusText}`);
  }

  return res.json();
}

// ─── Team colors (for the UI badges) ─────────────────────────────────────────
const TEAM_COLORS = {
  "Arsenal FC": "#ef0107",
  "Manchester City FC": "#6cabdd",
  "Aston Villa FC": "#670e36",
  "Manchester United FC": "#da291c",
  "Chelsea FC": "#034694",
  "Liverpool FC": "#c8102e",
  "Newcastle United FC": "#241f20",
  "Tottenham Hotspur FC": "#132257",
  "Brighton & Hove Albion FC": "#0057b8",
  "West Ham United FC": "#7a263a",
  "AFC Bournemouth": "#da291c",
  "Wolverhampton Wanderers FC": "#fdb913",
  "Fulham FC": "#000000",
  "Crystal Palace FC": "#1b458f",
  "Brentford FC": "#e30613",
  "Everton FC": "#003399",
  "Nottingham Forest FC": "#dd0000",
  "Leicester City FC": "#003090",
  "Ipswich Town FC": "#0033a0",
  "Southampton FC": "#d71920",
};

// Short names for display
const SHORT_NAMES = {
  "Arsenal FC": "Arsenal",
  "Manchester City FC": "Man City",
  "Aston Villa FC": "Aston Villa",
  "Manchester United FC": "Man United",
  "Chelsea FC": "Chelsea",
  "Liverpool FC": "Liverpool",
  "Newcastle United FC": "Newcastle",
  "Tottenham Hotspur FC": "Spurs",
  "Brighton & Hove Albion FC": "Brighton",
  "West Ham United FC": "West Ham",
  "AFC Bournemouth": "Bournemouth",
  "Wolverhampton Wanderers FC": "Wolves",
  "Fulham FC": "Fulham",
  "Crystal Palace FC": "Crystal Palace",
  "Brentford FC": "Brentford",
  "Everton FC": "Everton",
  "Nottingham Forest FC": "Nott'm Forest",
  "Leicester City FC": "Leicester",
  "Ipswich Town FC": "Ipswich",
  "Southampton FC": "Southampton",
};

// 3-letter abbreviations
const ABBREVS = {
  "Arsenal FC": "ARS",
  "Manchester City FC": "MCI",
  "Aston Villa FC": "AVL",
  "Manchester United FC": "MUN",
  "Chelsea FC": "CHE",
  "Liverpool FC": "LIV",
  "Newcastle United FC": "NEW",
  "Tottenham Hotspur FC": "TOT",
  "Brighton & Hove Albion FC": "BHA",
  "West Ham United FC": "WHU",
  "AFC Bournemouth": "BOU",
  "Wolverhampton Wanderers FC": "WOL",
  "Fulham FC": "FUL",
  "Crystal Palace FC": "CRY",
  "Brentford FC": "BRE",
  "Everton FC": "EVE",
  "Nottingham Forest FC": "NFO",
  "Leicester City FC": "LEI",
  "Ipswich Town FC": "IPS",
  "Southampton FC": "SOU",
};

// ─── Fallback data (current as of MW26, 2025-26 season) ──────────────────────
const FALLBACK_STANDINGS = [
  { pos: 1, team: "Arsenal", p: 26, gd: "+32", pts: 57, color: "#ef0107" },
  { pos: 2, team: "Man City", p: 26, gd: "+30", pts: 53, color: "#6cabdd" },
  { pos: 3, team: "Aston Villa", p: 26, gd: "+10", pts: 50, color: "#670e36" },
  { pos: 4, team: "Man United", p: 26, gd: "+10", pts: 45, color: "#da291c" },
  { pos: 5, team: "Chelsea", p: 26, gd: "+17", pts: 44, color: "#034694" },
  { pos: 6, team: "Liverpool", p: 26, gd: "+6", pts: 42, color: "#c8102e" },
];

const FALLBACK_SCORER = {
  name: "Erling Haaland",
  team: "Man City",
  position: "ST",
  number: 9,
  stats: [
    { label: "Goals", value: "22" },
    { label: "Assists", value: "6" },
    { label: "Matches", value: "26" },
    { label: "Form", value: "W-W-W" },
  ],
  form: ["W", "W", "W", "D", "W"],
};

const FALLBACK_FIXTURE = {
  homeTeam: "Arsenal",
  awayTeam: "Chelsea",
  homeAbbrev: "ARS",
  awayAbbrev: "CHE",
  homeColor: "#ef0107",
  awayColor: "#034694",
  matchweek: 27,
  date: "Sun 1 Mar",
  status: "UPCOMING",
};

// ─── 1. Standings ─────────────────────────────────────────────────────────────
export async function getStandings() {
  const cached = getCached("standings");
  if (cached) return cached;

  try {
    const data = await apiFetch("/competitions/PL/standings");

    // The API returns standings.standings[0].table for the overall table
    const table = data.standings[0].table.slice(0, 6).map((row, i) => ({
      pos: i + 1,
      team: SHORT_NAMES[row.team.name] || row.team.name,
      p: row.playedGames,
      gd: row.goalDifference >= 0 ? `+${row.goalDifference}` : `${row.goalDifference}`,
      pts: row.points,
      color: TEAM_COLORS[row.team.name] || "#3b82f6",
    }));

    setCache("standings", table);
    return table;
  } catch (err) {
    console.error("[football-api] Standings fetch failed:", err.message);
    return FALLBACK_STANDINGS;
  }
}

// ─── 2. Top Scorer ────────────────────────────────────────────────────────────
export async function getTopScorer() {
  const cached = getCached("topScorer");
  if (cached) return cached;

  try {
    const data = await apiFetch("/competitions/PL/scorers?limit=1");
    const scorer = data.scorers[0];

    const result = {
      name: scorer.player.name,
      team: SHORT_NAMES[scorer.team.name] || scorer.team.name,
      position: scorer.player.position === "Centre-Forward" ? "ST"
        : scorer.player.position === "Right Winger" ? "RW"
        : scorer.player.position === "Left Winger" ? "LW"
        : scorer.player.position === "Attacking Midfield" ? "AM"
        : scorer.player.position || "FW",
      number: scorer.player.shirtNumber || 0,
      stats: [
        { label: "Goals", value: String(scorer.goals || 0) },
        { label: "Assists", value: String(scorer.assists || 0) },
        { label: "Matches", value: String(scorer.playedMatches || 0) },
        { label: "Penalties", value: String(scorer.penalties || 0) },
      ],
      form: [], // API doesn't provide form per player; we'll leave empty
    };

    setCache("topScorer", result);
    return result;
  } catch (err) {
    console.error("[football-api] Top scorer fetch failed:", err.message);
    return FALLBACK_SCORER;
  }
}

// ─── 3. Next Fixture ──────────────────────────────────────────────────────────
export async function getNextFixture() {
  const cached = getCached("nextFixture");
  if (cached) return cached;

  try {
    const data = await apiFetch("/competitions/PL/matches?status=SCHEDULED&limit=1");

    if (!data.matches || data.matches.length === 0) {
      return FALLBACK_FIXTURE;
    }

    const match = data.matches[0];
    const dateObj = new Date(match.utcDate);
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const dateStr = `${days[dateObj.getUTCDay()]} ${dateObj.getUTCDate()} ${months[dateObj.getUTCMonth()]}`;

    const result = {
      homeTeam: SHORT_NAMES[match.homeTeam.name] || match.homeTeam.name,
      awayTeam: SHORT_NAMES[match.awayTeam.name] || match.awayTeam.name,
      homeAbbrev: ABBREVS[match.homeTeam.name] || match.homeTeam.tla,
      awayAbbrev: ABBREVS[match.awayTeam.name] || match.awayTeam.tla,
      homeColor: TEAM_COLORS[match.homeTeam.name] || "#3b82f6",
      awayColor: TEAM_COLORS[match.awayTeam.name] || "#3b82f6",
      matchweek: match.matchday,
      date: dateStr,
      status: "UPCOMING",
    };

    setCache("nextFixture", result);
    return result;
  } catch (err) {
    console.error("[football-api] Next fixture fetch failed:", err.message);
    return FALLBACK_FIXTURE;
  }
}
