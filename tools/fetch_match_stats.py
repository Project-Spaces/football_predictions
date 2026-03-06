"""
Fetch H2H history and recent form stats from API-Football for a specific match.
Uses caching to avoid re-fetching already-retrieved fixture stats.

Usage:
  python3 tools/fetch_match_stats.py "Brighton" "Arsenal" --league "Premier League" --country England --season 2024

Output: .tmp/match_stats_{home}_vs_{away}.json
"""

import os
import sys
import json
import time
import argparse
import re
from datetime import datetime
from concurrent.futures import ThreadPoolExecutor
from dotenv import load_dotenv
import requests

load_dotenv()

API_KEY = os.getenv("API_FOOTBALL_KEY")

# Supports both subscription methods:
#   Direct (api-football.com / api-sports.io): uses x-apisports-key header
#   RapidAPI: uses x-rapidapi-key header + different host
# Set API_FOOTBALL_VIA_RAPIDAPI=true in .env to use RapidAPI routing.
USE_RAPIDAPI = os.getenv("API_FOOTBALL_VIA_RAPIDAPI", "false").lower() == "true"

if USE_RAPIDAPI:
    BASE_URL = "https://api-football-v1.p.rapidapi.com/v3"
    HEADERS = {
        "x-rapidapi-key": API_KEY,
        "x-rapidapi-host": "api-football-v1.p.rapidapi.com",
    }
else:
    BASE_URL = "https://v3.football.api-sports.io"
    HEADERS = {
        "x-apisports-key": API_KEY,
    }


def api_get(endpoint: str, params: dict, retries: int = 2) -> dict:
    """Call API-Football endpoint. Retries once on 429 rate-limit.
    Always sleeps 6.5s after a successful call to stay within 10 req/min free plan limit.
    """
    for attempt in range(retries + 1):
        resp = requests.get(f"{BASE_URL}/{endpoint}", headers=HEADERS, params=params, timeout=30)
        if resp.status_code == 429:
            print("  Rate limited — waiting 65s before retry...")
            time.sleep(65)
            continue
        resp.raise_for_status()
        data = resp.json()
        if data.get("errors"):
            raise ValueError(f"API error: {data['errors']}")
        time.sleep(6.5)  # 10 req/min cap → ~9 req/min with this gap
        return data
    raise RuntimeError(f"Failed after {retries} retries: {endpoint}")


def normalize(name: str) -> str:
    """Normalize team/league name for fuzzy matching."""
    name = name.lower().strip()
    name = re.sub(r"[^\w\s]", "", name)
    name = re.sub(r"\s+", " ", name)
    abbrevs = {"utd": "united", "fc": "", "sc": "", "ac": "", "cf": "", "afc": "", "man": "manchester"}
    words = [abbrevs.get(w, w) for w in name.split()]
    return " ".join(w for w in words if w).strip()


def find_team_id(name: str, league_id: int = None, season: int = None) -> tuple[int, str]:
    """Search for team ID. Returns (team_id, official_name) or raises.

    Tries multiple name variants to handle women's (W/Women), youth (U23/U21/U18/U17),
    and reserve (B/II) team suffixes common in prediction data.
    """
    def _search(query: str, with_league: bool = True) -> list:
        params = {"name": query}
        if with_league and league_id:
            params["league"] = league_id
        if with_league and season:
            params["season"] = season
        try:
            data = api_get("teams", params)
            return data.get("response", [])
        except ValueError as e:
            # API requires league param when searching by name on free tier;
            # if we don't have a valid league_id, treat as not found.
            if "league" in str(e).lower():
                return []
            raise

    # Build ordered list of name variants to try
    variants = [name]
    # Strip trailing suffixes: W/Women (women's teams), U23/U21/U18/U17 (youth), B/II (reserves)
    stripped = re.sub(r"\s+(W|Women|U\d{2}|B|II)$", "", name, flags=re.IGNORECASE).strip()
    if stripped != name:
        variants.append(stripped)
    if name.endswith(" W"):
        variants.append(name[:-2] + " Women")
    # Strip leading prefixes: OC/FC/SC/AC/RC/FK/SK/AS/US/SS/CD/CF (common club abbreviations)
    prefix_stripped = re.sub(r"^(OC|FC|SC|AC|RC|FK|SK|AS|US|SS|CD|CF|AFC|RFC)\s+", "", name, flags=re.IGNORECASE).strip()
    if prefix_stripped != name and prefix_stripped not in variants:
        variants.append(prefix_stripped)
    # Add first-word-only variant: "Bayern Munich" → "Bayern", "Daring Brussels U21" → "Daring"
    # Helps when the API name uses a different city/language (e.g. "FC Bayern München")
    first_word = name.split()[0]
    if first_word not in variants and len(first_word) > 4:
        variants.append(first_word)

    teams = []
    for variant in variants:
        teams = _search(variant, with_league=True)
        if teams:
            break
        teams = _search(variant, with_league=False)
        if teams:
            break

    if not teams:
        raise ValueError(f"Team not found: '{name}'")

    norm_input = normalize(name)
    best = None
    best_score = 0
    for t in teams:
        t_name = t["team"]["name"]
        score = sum(1 for a, b in zip(normalize(t_name), norm_input) if a == b)
        # Simple overlap score; prefer exact match
        if normalize(t_name) == norm_input:
            return t["team"]["id"], t_name
        if score > best_score:
            best_score = score
            best = t

    if best:
        return best["team"]["id"], best["team"]["name"]
    raise ValueError(f"No good match for team: '{name}'")


def find_league_id(league_name: str, country: str, season: int) -> int:
    """Find league ID from name + country."""
    data = api_get("leagues", {"name": league_name, "country": country, "season": season})
    results = data.get("response", [])
    if results:
        return results[0]["league"]["id"]
    # Try without country
    data = api_get("leagues", {"name": league_name, "season": season})
    results = data.get("response", [])
    if results:
        return results[0]["league"]["id"]
    return None


def load_cached_fixture_stats(fixture_id: int) -> dict | None:
    """Load fixture stats from disk cache if available."""
    path = f".tmp/fixture_stats_{fixture_id}.json"
    if os.path.exists(path):
        with open(path, "r") as f:
            return json.load(f)
    return None


def save_cached_fixture_stats(fixture_id: int, stats: dict):
    """Save fixture stats to disk cache."""
    os.makedirs(".tmp", exist_ok=True)
    path = f".tmp/fixture_stats_{fixture_id}.json"
    with open(path, "w") as f:
        json.dump(stats, f)


def fetch_fixture_stats(fixture_id: int) -> dict:
    """Fetch per-fixture statistics (corners, cards, etc.). Uses disk cache."""
    cached = load_cached_fixture_stats(fixture_id)
    if cached is not None:
        return cached

    data = api_get("fixtures/statistics", {"fixture": fixture_id})
    stats = data.get("response", [])
    save_cached_fixture_stats(fixture_id, stats)
    return stats


def extract_stat(stats_list: list, team_name: str, stat_name: str) -> int | None:
    """Extract a named stat value for a team from the statistics response."""
    for entry in stats_list:
        if entry.get("team", {}).get("name", "").lower() == team_name.lower():
            for s in entry.get("statistics", []):
                if s["type"] == stat_name:
                    val = s["value"]
                    if val is None:
                        return None
                    return int(val) if str(val).isdigit() else None
    return None


def parse_fixture(fixture_data: dict, stats_list: list, context: str) -> dict:
    """Convert raw fixture + stats into a structured record."""
    fix = fixture_data["fixture"]
    goals = fixture_data["goals"]
    score = fixture_data["score"]
    home = fixture_data["teams"]["home"]["name"]
    away = fixture_data["teams"]["away"]["name"]

    home_goals = goals.get("home") or 0
    away_goals = goals.get("away") or 0
    total_goals = home_goals + away_goals

    # Determine result
    if home_goals > away_goals:
        result = "home"
    elif away_goals > home_goals:
        result = "away"
    else:
        result = "draw"

    # Half-time scores
    ht = score.get("halftime", {}) or {}
    ht_home = ht.get("home") or 0
    ht_away = ht.get("away") or 0

    # Second half goals
    sh_home = home_goals - ht_home
    sh_away = away_goals - ht_away

    # Highest scoring half
    ht_goals = ht_home + ht_away
    sh_goals = sh_home + sh_away
    if ht_goals > sh_goals:
        highest_scoring_half = "first"
    elif sh_goals > ht_goals:
        highest_scoring_half = "second"
    else:
        highest_scoring_half = "equal"

    # Stats from fixture/statistics endpoint
    home_corners = extract_stat(stats_list, home, "Corner Kicks")
    away_corners = extract_stat(stats_list, away, "Corner Kicks")
    total_corners = None
    if home_corners is not None and away_corners is not None:
        total_corners = home_corners + away_corners

    home_yellow = extract_stat(stats_list, home, "Yellow Cards") or 0
    away_yellow = extract_stat(stats_list, away, "Yellow Cards") or 0
    home_red = extract_stat(stats_list, home, "Red Cards") or 0
    away_red = extract_stat(stats_list, away, "Red Cards") or 0
    total_cards = home_yellow + away_yellow + home_red + away_red

    return {
        "fixture_id": fix["id"],
        "date": fix["date"][:10],
        "home_team": home,
        "away_team": away,
        "home_goals": home_goals,
        "away_goals": away_goals,
        "total_goals": total_goals,
        "ht_home_goals": ht_home,
        "ht_away_goals": ht_away,
        "sh_home_goals": sh_home,
        "sh_away_goals": sh_away,
        "highest_scoring_half": highest_scoring_half,
        "home_corners": home_corners,
        "away_corners": away_corners,
        "total_corners": total_corners,
        "home_yellow": home_yellow,
        "away_yellow": away_yellow,
        "home_red": home_red,
        "away_red": away_red,
        "total_cards": total_cards,
        "btts": home_goals > 0 and away_goals > 0,
        "result": result,
        "context": context,
    }


def fetch_fixtures_with_stats(fixtures_response: list, context: str, max_stats: int = 5) -> list:
    """Given a list of fixture dicts from API, fetch stats for each and parse.

    Goals, BTTS, result, and halftime data come from the base fixture response (no extra
    API calls needed). The fixtures/statistics endpoint is only called for the most recent
    max_stats fixtures to obtain corner and card counts — older fixtures get corners=None.
    api_get() already sleeps 6.5s after each call, so no extra delays needed here.
    """
    finished = [f for f in fixtures_response if f["fixture"]["status"]["short"] == "FT"]
    if not finished:
        return []

    fixture_ids = [f["fixture"]["id"] for f in finished]
    fixture_map = {f["fixture"]["id"]: f for f in finished}

    # Only fetch fixture/statistics for the most recent max_stats fixtures to conserve
    # daily API quota. Cached fixtures are free and don't count against the limit.
    stats_map = {}
    stats_ids = fixture_ids[:max_stats]
    for fid in stats_ids:
        stats = fetch_fixture_stats(fid)  # uses disk cache; api_get sleeps 6.5s if uncached
        stats_map[fid] = stats

    results = []
    for fid in fixture_ids:
        try:
            # Fixtures without stats get corners/cards = None (acceptable for older games)
            record = parse_fixture(fixture_map[fid], stats_map.get(fid, []), context)
            results.append(record)
        except Exception as e:
            print(f"  Warning: Could not parse fixture {fid}: {e}")

    return results


def main():
    parser = argparse.ArgumentParser(description="Fetch H2H + form stats from API-Football")
    parser.add_argument("home_team", help="Home team name")
    parser.add_argument("away_team", help="Away team name")
    parser.add_argument("--league", default=None, help="League name")
    parser.add_argument("--country", default=None, help="Country name")
    parser.add_argument("--season", type=int, default=2024, help="Season year (default: 2024)")
    args = parser.parse_args()

    if not API_KEY:
        print("Error: API_FOOTBALL_KEY not set in .env")
        sys.exit(1)

    os.makedirs(".tmp", exist_ok=True)
    home = args.home_team
    away = args.away_team
    season = args.season

    print(f"Fetching match stats: {home} vs {away}")
    print(f"  League: {args.league or 'any'} | Country: {args.country or 'any'} | Season: {season}")

    # Step 1: Find team IDs
    league_id = None
    if args.league:
        print(f"  Looking up league: {args.league}...")
        league_id = find_league_id(args.league, args.country, season)
        if league_id:
            print(f"  League ID: {league_id}")
        else:
            print(f"  Warning: League not found, proceeding without league filter")

    print(f"  Looking up home team: {home}...")
    home_id, home_official = find_team_id(home, league_id, season)
    print(f"  Home team: {home_official} (ID: {home_id})")

    print(f"  Looking up away team: {away}...")
    away_id, away_official = find_team_id(away, league_id, season)
    print(f"  Away team: {away_official} (ID: {away_id})")

    # Step 2: Fetch H2H and team season fixtures
    # Note: Free plan does not support `last` or `venue` query params.
    # We fetch the full season and filter/slice in Python.
    FORM_LIMIT = 10  # last N finished home/away games to use

    print("  Fetching H2H history...")
    print(f"  Fetching home team season fixtures (will filter last {FORM_LIMIT} home games)...")
    print(f"  Fetching away team season fixtures (will filter last {FORM_LIMIT} away games)...")

    def fetch_h2h():
        data = api_get("fixtures/headtohead", {"h2h": f"{home_id}-{away_id}", "season": season})
        rows = data.get("response", [])
        # Sort by date descending, take last FORM_LIMIT finished games
        finished = [r for r in rows if r["fixture"]["status"]["short"] == "FT"]
        finished.sort(key=lambda r: r["fixture"]["date"], reverse=True)
        return finished[:FORM_LIMIT]

    def fetch_home_form():
        data = api_get("fixtures", {"team": home_id, "season": season})
        rows = data.get("response", [])
        # Filter: finished home games where this team is the home side
        finished = [
            r for r in rows
            if r["fixture"]["status"]["short"] == "FT"
            and r["teams"]["home"]["id"] == home_id
        ]
        finished.sort(key=lambda r: r["fixture"]["date"], reverse=True)
        return finished[:FORM_LIMIT]

    def fetch_away_form():
        data = api_get("fixtures", {"team": away_id, "season": season})
        rows = data.get("response", [])
        # Filter: finished away games where this team is the away side
        finished = [
            r for r in rows
            if r["fixture"]["status"]["short"] == "FT"
            and r["teams"]["away"]["id"] == away_id
        ]
        finished.sort(key=lambda r: r["fixture"]["date"], reverse=True)
        return finished[:FORM_LIMIT]

    # Run sequentially. api_get() sleeps 6.5s after each call automatically.
    h2h_raw = fetch_h2h()
    home_raw = fetch_home_form()
    away_raw = fetch_away_form()

    print(f"  H2H fixtures found: {len(h2h_raw)}")
    print(f"  Home form fixtures found: {len(home_raw)}")
    print(f"  Away form fixtures found: {len(away_raw)}")

    # Step 3: Fetch stats for all unique fixtures
    print("  Fetching per-fixture statistics (corners, cards, etc.)...")
    h2h_records = fetch_fixtures_with_stats(h2h_raw, "h2h")
    home_records = fetch_fixtures_with_stats(home_raw, "home_form")
    away_records = fetch_fixtures_with_stats(away_raw, "away_form")

    print(f"  Parsed: {len(h2h_records)} H2H | {len(home_records)} home form | {len(away_records)} away form")

    # Step 4: Save output
    output = {
        "home_team": home,
        "away_team": away,
        "home_team_official": home_official,
        "away_team_official": away_official,
        "home_team_id": home_id,
        "away_team_id": away_id,
        "league_id": league_id,
        "league": args.league,
        "country": args.country,
        "season": season,
        "fetched_at": datetime.utcnow().isoformat() + "Z",
        "h2h": h2h_records,
        "home_form": home_records,
        "away_form": away_records,
    }

    safe_home = re.sub(r"[^\w]", "_", home)
    safe_away = re.sub(r"[^\w]", "_", away)
    output_path = f".tmp/match_stats_{safe_home}_vs_{safe_away}.json"
    with open(output_path, "w") as f:
        json.dump(output, f, indent=2)

    print(f"\nSaved to: {output_path}")
    print(f"Total fixtures used: {len(h2h_records) + len(home_records) + len(away_records)}")

    # Warn on low sample sizes
    for label, records in [("H2H", h2h_records), ("Home form", home_records), ("Away form", away_records)]:
        if len(records) < 5:
            print(f"  Warning: {label} has only {len(records)} games (< 5 recommended for reliable analysis)")


if __name__ == "__main__":
    main()
