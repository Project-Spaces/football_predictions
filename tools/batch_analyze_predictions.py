"""
Process predictions from matched_predictions.csv through the market analysis pipeline.

Reads each prediction, runs fetch_match_stats.py + analyze_game_markets.py for each game,
then uploads the analysis to the website via POST /api/match-analysis.

Usage:
  python3 tools/batch_analyze_predictions.py                   # top 5 (free tier safe)
  python3 tools/batch_analyze_predictions.py --top 20          # paid tier: all predictions
  python3 tools/batch_analyze_predictions.py --top 0           # no limit (paid tier)
  python3 tools/batch_analyze_predictions.py --dry-run         # analyze but don't upload

Options:
  --input PATH         Path to matched_predictions.csv (default: matched_predictions.csv)
  --season YEAR        Season year for API-Football lookup (default: 2024)
  --url URL            Website base URL for uploading analyses (default: http://localhost:3000)
  --top N              Analyze top N predictions by win probability (default: 5)
                       Set to 0 for no limit. Free tier: keep at 5. Paid tier: use 0 or 20.
  --request-limit N    Hard stop after N API requests (default: 90 for free tier safety)
                       Set to 0 for no limit on paid tier.
  --dry-run            Fetch and analyze but don't upload to website
  --skip-existing      Skip games that already have a cached .tmp/market_analysis_*.json
"""

import os
import sys
import json
import re
import argparse
import subprocess
import pandas as pd
import requests
from datetime import datetime, date
from dotenv import load_dotenv

load_dotenv()

API_KEY = os.getenv("API_FOOTBALL_KEY")
SITE_API_TOKEN = os.getenv("SITE_API_TOKEN", "")  # optional auth token for the upload


def safe_name(name: str) -> str:
    return re.sub(r"[^\w]", "_", name)


def analysis_cache_path(home: str, away: str) -> str:
    return f".tmp/market_analysis_{safe_name(home)}_vs_{safe_name(away)}.json"


def stats_cache_path(home: str, away: str) -> str:
    return f".tmp/match_stats_{safe_name(home)}_vs_{safe_name(away)}.json"


def run_tool(cmd: list, label: str) -> bool:
    """Run a subprocess tool. Returns True on success."""
    print(f"  Running: {' '.join(cmd)}")
    result = subprocess.run(cmd, capture_output=False, text=True)
    if result.returncode != 0:
        print(f"  ERROR in {label} (exit code {result.returncode})")
        return False
    return True


def upload_analysis(analysis: dict, base_url: str) -> bool:
    """POST analysis JSON to the website API."""
    url = f"{base_url}/api/match-analysis"
    headers = {"Content-Type": "application/json"}
    if SITE_API_TOKEN:
        headers["Authorization"] = f"Bearer {SITE_API_TOKEN}"

    payload = {
        "home_team": analysis["home_team"],
        "away_team": analysis["away_team"],
        "match_date": str(date.today()),
        "league": analysis.get("league"),
        "season": str(analysis.get("season", "")),
        "analysis_json": analysis,
    }

    try:
        resp = requests.post(url, json=payload, headers=headers, timeout=15)
        if resp.status_code in (200, 201):
            return True
        print(f"  Upload failed: HTTP {resp.status_code} — {resp.text[:200]}")
        return False
    except Exception as e:
        print(f"  Upload error: {e}")
        return False


def main():
    parser = argparse.ArgumentParser(description="Batch analyze daily predictions")
    parser.add_argument("--input", default="matched_predictions.csv",
                        help="Path to matched_predictions.csv")
    parser.add_argument("--season", type=int, default=2024,
                        help="Season year for API-Football (default: 2024)")
    parser.add_argument("--url", default="http://localhost:3000",
                        help="Website base URL for uploading analyses")
    parser.add_argument("--top", type=int, default=5,
                        help="Analyze top N predictions by win probability (default: 5). "
                             "Use 0 for no limit (paid tier).")
    parser.add_argument("--request-limit", type=int, default=90,
                        help="Stop after this many API requests (default: 90 for free tier). "
                             "Use 0 for no limit (paid tier).")
    parser.add_argument("--dry-run", action="store_true",
                        help="Analyze but don't upload to website")
    parser.add_argument("--skip-existing", action="store_true",
                        help="Skip games with an existing .tmp/market_analysis_*.json")
    args = parser.parse_args()

    if not API_KEY:
        print("Error: API_FOOTBALL_KEY not set in .env")
        sys.exit(1)

    if not os.path.exists(args.input):
        print(f"Error: Input file not found: {args.input}")
        print("Run the sportybet_predictions pipeline first to generate matched_predictions.csv")
        sys.exit(1)

    os.makedirs(".tmp", exist_ok=True)

    # Load predictions
    df = pd.read_csv(args.input)
    print(f"Loaded {len(df)} predictions from {args.input}")

    # Identify the column names (handle variations)
    col_map = {c.lower().replace(" ", "_"): c for c in df.columns}
    home_col = col_map.get("home_team", col_map.get("home", None))
    away_col = col_map.get("away_team", col_map.get("away", None))
    league_col = col_map.get("league", None)
    country_col = col_map.get("country", None)
    prob_col = col_map.get("win_probability_%", col_map.get("win_probability", None))

    if not home_col or not away_col:
        print(f"Error: Cannot find home/away team columns. Found: {list(df.columns)}")
        sys.exit(1)

    # Sort by win probability descending (highest confidence first)
    if prob_col:
        df = df.sort_values(by=prob_col, ascending=False)

    # Apply --top N limit
    total_available = len(df)
    if args.top > 0:
        df = df.head(args.top)
        top_label = f"top {args.top}"
    else:
        top_label = "all"

    leagues_seen = set()
    analyzed = 0
    skipped = 0
    uploaded = 0
    failed = 0
    api_requests_used = 0  # rough estimate: 6 base + ~20 fixture stats per game
    REQUEST_ESTIMATE_PER_GAME = 26

    print(f"\n{'='*60}")
    print(f"Starting analysis: {top_label} of {total_available} predictions")
    if args.top > 0:
        est_requests = min(len(df), args.top) * REQUEST_ESTIMATE_PER_GAME
        print(f"Estimated API requests: ~{est_requests} (limit: {args.request_limit or 'none'})")
    print(f"Dry run: {args.dry_run}")
    print(f"{'='*60}\n")

    for idx, row in df.iterrows():
        home = str(row[home_col]).strip()
        away = str(row[away_col]).strip()
        league = str(row[league_col]).strip() if league_col and pd.notna(row.get(league_col)) else ""
        country = str(row[country_col]).strip() if country_col and pd.notna(row.get(country_col)) else ""
        prob = row.get(prob_col, "?") if prob_col else "?"

        print(f"\n[{analyzed+skipped+failed+1}/{len(df)}] {home} vs {away}")
        print(f"  League: {country} / {league} | Win prob: {prob}%")

        # Skip if already analyzed (--skip-existing flag)
        analysis_path = analysis_cache_path(home, away)
        if args.skip_existing and os.path.exists(analysis_path):
            print(f"  Skipping — analysis already cached at {analysis_path}")
            skipped += 1
            continue

        # Check request budget before fetching (only for non-cached games)
        stats_path = stats_cache_path(home, away)
        if args.request_limit > 0 and not os.path.exists(stats_path):
            if api_requests_used + REQUEST_ESTIMATE_PER_GAME > args.request_limit:
                print(f"  Stopping — request limit ({args.request_limit}) would be exceeded")
                print(f"  Tip: Use --request-limit 0 on paid tier to remove this cap")
                break

        leagues_seen.add(f"{country}/{league}")

        # Step 1: Fetch match stats (skip if already cached)
        if os.path.exists(stats_path):
            print(f"  Stats cache found: {stats_path}")
        else:
            cmd = [
                sys.executable, "tools/fetch_match_stats.py",
                home, away,
                "--season", str(args.season),
            ]
            if league:
                cmd += ["--league", league]
            if country:
                cmd += ["--country", country]

            ok = run_tool(cmd, "fetch_match_stats")
            if not ok or not os.path.exists(stats_path):
                print(f"  Skipping {home} vs {away} — stats fetch failed")
                failed += 1
                continue

        # Step 2: Analyze markets
        cmd = [sys.executable, "tools/analyze_game_markets.py", stats_path]
        ok = run_tool(cmd, "analyze_game_markets")
        if not ok or not os.path.exists(analysis_path):
            print(f"  Skipping {home} vs {away} — market analysis failed")
            failed += 1
            continue

        analyzed += 1
        if not os.path.exists(stats_path):  # only count if we actually fetched (not cached)
            api_requests_used += REQUEST_ESTIMATE_PER_GAME

        # Step 3: Upload to website
        if not args.dry_run:
            with open(analysis_path, "r") as f:
                analysis = json.load(f)
            success = upload_analysis(analysis, args.url)
            if success:
                print(f"  Uploaded to {args.url}/api/match-analysis")
                uploaded += 1
            else:
                print(f"  Upload failed — analysis saved locally at {analysis_path}")

    print(f"\n{'='*60}")
    print(f"BATCH ANALYSIS COMPLETE")
    print(f"  Analyzed:  {analyzed}/{len(df)} predictions ({top_label} of {total_available} available)")
    print(f"  Skipped:   {skipped} (already cached)")
    print(f"  Failed:    {failed}")
    print(f"  Est. API requests used: ~{api_requests_used} (cached games don't count)")
    if not args.dry_run:
        print(f"  Uploaded:  {uploaded}")
    print(f"  Leagues:   {len(leagues_seen)} unique")
    print(f"  Leagues covered:")
    for l in sorted(leagues_seen):
        print(f"    - {l}")
    print(f"{'='*60}")


if __name__ == "__main__":
    main()
