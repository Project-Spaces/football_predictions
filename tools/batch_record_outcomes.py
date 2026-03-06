"""
Auto-record actual game outcomes for yesterday's analyzed predictions.

Runs the morning after predictions were made. Queries the Neon game_analyses table
for yesterday's games, fetches actual results from API-Football, and POSTs each
outcome to /api/match-analysis/outcome which evaluates market hits.

Usage:
  python3 tools/batch_record_outcomes.py                          # yesterday's games
  python3 tools/batch_record_outcomes.py --date 2026-03-03       # specific date
  python3 tools/batch_record_outcomes.py --url https://yoursite.com
  python3 tools/batch_record_outcomes.py --dry-run               # fetch but don't POST

Output: prints hit/miss summary per game and total market accuracy.
"""

import os
import sys
import json
import time
import argparse
import re
import requests
from datetime import datetime, date, timedelta
from dotenv import load_dotenv

load_dotenv()

API_KEY = os.getenv("API_FOOTBALL_KEY")
DATABASE_URL = os.getenv("DATABASE_URL") or os.getenv("POSTGRES_URL")
SITE_API_TOKEN = os.getenv("SITE_API_TOKEN", "")

USE_RAPIDAPI = os.getenv("API_FOOTBALL_VIA_RAPIDAPI", "false").lower() == "true"
if USE_RAPIDAPI:
    BASE_URL = "https://api-football-v1.p.rapidapi.com/v3"
    HEADERS = {
        "x-rapidapi-key": API_KEY,
        "x-rapidapi-host": "api-football-v1.p.rapidapi.com",
    }
else:
    BASE_URL = "https://v3.football.api-sports.io"
    HEADERS = {"x-apisports-key": API_KEY}


def api_get(endpoint: str, params: dict, retries: int = 2) -> dict:
    """Call API-Football. Sleeps 6.5s after each call (10 req/min free plan limit)."""
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
        time.sleep(6.5)
        return data
    raise RuntimeError(f"Failed after {retries} retries: {endpoint}")


def fetch_game_analyses_from_db(target_date: str) -> list:
    """Fetch yesterday's game analyses from Neon via the website API."""
    # We query the DB through the website's API to avoid needing psycopg2 here.
    # The /api/match-analysis?date=YYYY-MM-DD endpoint returns all analyses for a date.
    return []  # placeholder — see fetch_from_site() below


def fetch_analyses_for_date(site_url: str, target_date: str) -> list:
    """GET /api/match-analysis?date={target_date} to retrieve all analyses for that day."""
    url = f"{site_url}/api/match-analysis"
    headers = {"Content-Type": "application/json"}
    if SITE_API_TOKEN:
        headers["Authorization"] = f"Bearer {SITE_API_TOKEN}"

    try:
        resp = requests.get(url, params={"date": target_date}, headers=headers, timeout=15)
        if resp.status_code == 200:
            data = resp.json()
            return data.get("analyses", []) if isinstance(data, dict) else data
        print(f"  Could not fetch analyses: HTTP {resp.status_code}")
        return []
    except Exception as e:
        print(f"  Error fetching analyses: {e}")
        return []


def find_fixture_result(home_team_id: int, target_date: str) -> dict | None:
    """Find a finished fixture for the home team on a given date.

    Returns dict with: home_goals, away_goals, total_corners, total_cards, status
    Returns None if not found or not finished.
    """
    # Derive season from date (season = year, or year-1 if month <= 6 for mid-season leagues)
    year = int(target_date[:4])
    month = int(target_date[5:7])
    season = year if month >= 7 else year - 1
    data = api_get("fixtures", {"team": home_team_id, "date": target_date, "season": season})
    fixtures = data.get("response", [])

    for fix in fixtures:
        status = fix["fixture"]["status"]["short"]
        if status not in ("FT", "AET", "PEN"):
            continue

        goals = fix.get("goals", {})
        home_goals = goals.get("home") or 0
        away_goals = goals.get("away") or 0
        fixture_id = fix["fixture"]["id"]

        # Fetch stats for corners and cards
        total_corners = None
        total_cards = None
        try:
            stats_data = api_get("fixtures/statistics", {"fixture": fixture_id})
            stats = stats_data.get("response", [])

            def get_stat(team_id, stat_name):
                for entry in stats:
                    if entry.get("team", {}).get("id") == team_id:
                        for s in entry.get("statistics", []):
                            if s["type"] == stat_name:
                                val = s["value"]
                                if val is None:
                                    return None
                                return int(val) if str(val).isdigit() else None
                return None

            home_team_id_fix = fix["teams"]["home"]["id"]
            away_team_id_fix = fix["teams"]["away"]["id"]

            hc = get_stat(home_team_id_fix, "Corner Kicks")
            ac = get_stat(away_team_id_fix, "Corner Kicks")
            if hc is not None and ac is not None:
                total_corners = hc + ac

            hy = get_stat(home_team_id_fix, "Yellow Cards") or 0
            ay = get_stat(away_team_id_fix, "Yellow Cards") or 0
            hr = get_stat(home_team_id_fix, "Red Cards") or 0
            ar = get_stat(away_team_id_fix, "Red Cards") or 0
            total_cards = hy + ay + hr + ar
        except Exception as e:
            print(f"    Warning: Could not fetch fixture stats for {fixture_id}: {e}")

        return {
            "home_goals": home_goals,
            "away_goals": away_goals,
            "total_corners": total_corners,
            "total_cards": total_cards,
            "fixture_id": fixture_id,
        }

    return None


def find_team_id_from_name(name: str) -> int | None:
    """Quick team ID lookup by name (no league filter). Returns None if not found."""
    # Try name variants (strip suffixes/prefixes like U23, W, OC, FC)
    variants = [name]
    stripped = re.sub(r"\s+(W|Women|U\d{2}|B|II)$", "", name, flags=re.IGNORECASE).strip()
    if stripped != name:
        variants.append(stripped)
    prefix_stripped = re.sub(r"^(OC|FC|SC|AC|RC|FK|SK|AS|US|SS|CD|CF|AFC|RFC)\s+", "", name, flags=re.IGNORECASE).strip()
    if prefix_stripped != name and prefix_stripped not in variants:
        variants.append(prefix_stripped)

    for variant in variants:
        try:
            data = api_get("teams", {"name": variant})
            teams = data.get("response", [])
            if teams:
                return teams[0]["team"]["id"]
        except Exception:
            pass
    return None


def post_outcome(site_url: str, payload: dict) -> bool:
    """POST actual game outcome to /api/match-analysis/outcome."""
    url = f"{site_url}/api/match-analysis/outcome"
    headers = {"Content-Type": "application/json"}
    if SITE_API_TOKEN:
        headers["Authorization"] = f"Bearer {SITE_API_TOKEN}"

    try:
        resp = requests.post(url, json=payload, headers=headers, timeout=15)
        if resp.status_code in (200, 201):
            result = resp.json()
            hit_rate = result.get("hit_rate")
            markets_hit = result.get("markets_hit", 0)
            markets_total = result.get("markets_evaluated", 0)
            print(f"    Recorded: {result.get('result', '?').upper()} | "
                  f"{payload['home_goals']}-{payload['away_goals']} | "
                  f"Markets: {markets_hit}/{markets_total}"
                  + (f" ({hit_rate}%)" if hit_rate is not None else ""))
            return True
        print(f"    Upload failed: HTTP {resp.status_code} — {resp.text[:200]}")
        return False
    except Exception as e:
        print(f"    Upload error: {e}")
        return False


def main():
    parser = argparse.ArgumentParser(description="Auto-record yesterday's game outcomes")
    parser.add_argument("--date", default=None,
                        help="Target date YYYY-MM-DD (default: yesterday)")
    parser.add_argument("--url", default="http://localhost:3000",
                        help="Website base URL (default: http://localhost:3000)")
    parser.add_argument("--dry-run", action="store_true",
                        help="Fetch results but don't POST to website")
    args = parser.parse_args()

    if not API_KEY:
        print("Error: API_FOOTBALL_KEY not set in .env")
        sys.exit(1)

    target_date = args.date or str(date.today() - timedelta(days=1))
    print(f"\nRecording outcomes for: {target_date}")
    print(f"Website URL: {args.url}")
    print(f"Dry run: {args.dry_run}")
    print("=" * 60)

    # Step 1: Fetch yesterday's analyzed games from the website
    print(f"\nFetching analyzed games for {target_date}...")
    analyses = fetch_analyses_for_date(args.url, target_date)

    if not analyses:
        print("  No analyzed games found for this date.")
        print("  Tip: Run batch_analyze_predictions.py first to generate analyses,")
        print("       then run this script the next morning.")
        sys.exit(0)

    print(f"  Found {len(analyses)} analyzed games")

    recorded = 0
    failed = 0
    not_found = 0
    total_markets_hit = 0
    total_markets_evaluated = 0

    for i, analysis in enumerate(analyses):
        home = analysis.get("home_team", "")
        away = analysis.get("away_team", "")
        league = analysis.get("league", "")
        home_team_id = analysis.get("home_team_id")

        print(f"\n[{i+1}/{len(analyses)}] {home} vs {away}")

        # Step 2: Find the home team ID if not stored in analysis
        if not home_team_id:
            print(f"  Looking up team ID for: {home}...")
            home_team_id = find_team_id_from_name(home)
            if not home_team_id:
                print(f"  Could not find team ID for '{home}' — skipping")
                not_found += 1
                continue

        # Step 3: Fetch actual result from API-Football
        print(f"  Fetching result from API-Football...")
        result = find_fixture_result(home_team_id, target_date)

        if result is None:
            print(f"  No finished fixture found for {home} on {target_date}")
            not_found += 1
            continue

        print(f"  Result: {home} {result['home_goals']}-{result['away_goals']} {away}"
              + (f" | Corners: {result['total_corners']}" if result['total_corners'] is not None else "")
              + (f" | Cards: {result['total_cards']}" if result['total_cards'] is not None else ""))

        if args.dry_run:
            print("  [dry-run] Skipping POST")
            recorded += 1
            continue

        # Step 4: POST outcome to website
        payload = {
            "home_team": home,
            "away_team": away,
            "match_date": target_date,
            "league": league,
            "home_goals": result["home_goals"],
            "away_goals": result["away_goals"],
            "total_corners": result["total_corners"],
            "total_cards": result["total_cards"],
        }

        success = post_outcome(args.url, payload)
        if success:
            recorded += 1
        else:
            failed += 1

    print(f"\n{'=' * 60}")
    print(f"OUTCOME RECORDING COMPLETE — {target_date}")
    print(f"  Recorded:  {recorded}/{len(analyses)}")
    print(f"  Not found: {not_found} (no API-Football result for date)")
    print(f"  Failed:    {failed} (upload errors)")
    if not args.dry_run and recorded > 0:
        print(f"\nCheck /dashboard/insights for market hit rate trends.")
    print("=" * 60)


if __name__ == "__main__":
    main()
