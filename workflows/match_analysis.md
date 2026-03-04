# Workflow: Deep Game Market Analysis

## Objective
For every daily prediction in `matched_predictions.csv`, fetch historical H2H and form data from API-Football, compute hit rates for 39 betting markets, and display them in the website's PredictionCard. The next morning, auto-record actual game results to build a hit-rate model over time.

---

## Prerequisites

- `API_FOOTBALL_KEY` set in `.env` (register free at api-football.com — 100 req/day)
- `matched_predictions.csv` exists (run sportybet_predictions workflow first)
- Website dev server running (`cd website && npm run dev`) for uploads

---

## Daily Pre-Game Flow (run before games start)

### Step 1: Generate predictions CSV
```bash
# If not already done today
python3 tools/match_games.py
```

### Step 2: Analyze top predictions
```bash
# Free tier (100 req/day): analyze top 5 by win probability
python3 tools/batch_analyze_predictions.py --top 5 --url http://localhost:3000

# Paid tier ($19/mo, 7500 req/day): analyze all predictions
python3 tools/batch_analyze_predictions.py --top 0 --request-limit 0 --url http://localhost:3000

# Dry run (no upload) to test:
python3 tools/batch_analyze_predictions.py --top 5 --dry-run
```

Expected output:
```
Analyzed: 5/42 predictions (top 5 of 42 available)
Failed: 0–2 (coverage gaps in lower leagues — expected)
Uploaded to http://localhost:3000/api/match-analysis
```

### Step 3: Verify in website
- Open any PredictionCard → expand → click "Deep Market Analysis"
- Should see 10 category tabs with market hit rates
- Green = ≥70% hit rate | Yellow = 55–70% | Orange = <55%

---

## Next-Morning Flow (run after all games from previous day finish)

### Step 4: Auto-record game outcomes
```bash
# Records yesterday's results automatically
python3 tools/batch_record_outcomes.py --url http://localhost:3000

# Specific date
python3 tools/batch_record_outcomes.py --date 2026-03-03 --url http://localhost:3000

# Dry run (fetch but don't POST)
python3 tools/batch_record_outcomes.py --dry-run
```

Expected output:
```
[1/3] Francs Borains vs SK Beveren
  Result: Francs Borains 2-1 SK Beveren | Corners: 8 | Cards: 3
  Recorded: HOME | 2-1 | Markets: 22/39 (56%)
```

---

## API Rate Limits

| Plan | Requests/day | Requests/min | Games/day (with caching) |
|------|-------------|-------------|--------------------------|
| Free | 100 | 10 | 5 (days 1–3), 15+ (day 7+) |
| Pro ($19/mo) | 7,500 | 30 | All 10–20 |

**Key behaviours:**
- `api_get()` automatically sleeps 6.5s after every call — never hits 10 req/min cap
- Fixture stats cached to `.tmp/fixture_stats_{id}.json` — re-runs are instant and free
- On 429 rate limit error: waits 65s and retries automatically
- `--request-limit 90` (default) stops before hitting the 100/day cap

---

## Edge Cases

### Team name not found in API-Football
**Cause:** Team may be in a league with limited API coverage (e.g., Angolan Girabola, Brazilian women's leagues), or the name uses a different format.

**What happens:** `fetch_match_stats.py` exits with error code 1. `batch_analyze_predictions.py` skips the game and continues.

**Variants tried automatically:**
- `Bragantino W` → tries `Bragantino Women` → if still not found, skip
- `Gent U23` → tries `Gent` → found
- `OC Charleroi` → tries `Charleroi` → found

**Manual workaround:** If you know the correct API name, you can run the tool directly:
```bash
python3 tools/fetch_match_stats.py "Red Bull Bragantino" "Ferroviaria" --league "Brasileiro Women" --country Brazil
```

### No H2H data (0 games)
Teams that haven't played each other recently. Analysis still works using only home_form and away_form data. Confidence is lower — all markets will show `[low sample]` warning.

### Missing corners/cards
`fixtures/statistics` is only fetched for the 5 most recent fixtures per context to conserve API quota. Older fixtures have `corners: null`. Markets like `corners_over_9.5` only use games where corner data is available.

### Game not found by batch_record_outcomes
`find_fixture_result()` looks up the game by home team ID + date. If the game was postponed or played on a different date, it won't be found. You can record it manually by POSTing directly:
```bash
curl -X POST http://localhost:3000/api/match-analysis/outcome \
  -H "Content-Type: application/json" \
  -d '{"home_team":"Francs Borains","away_team":"SK Beveren","match_date":"2026-03-04","home_goals":2,"away_goals":1,"total_corners":8,"total_cards":3}'
```

---

## Files

| File | Purpose |
|------|---------|
| `tools/fetch_match_stats.py` | Single-game H2H + form fetcher |
| `tools/analyze_game_markets.py` | Computes 39 market hit rates from stats |
| `tools/batch_analyze_predictions.py` | Runs both tools for all/top-N predictions |
| `tools/batch_record_outcomes.py` | Auto-records actual results next morning |
| `website/src/app/api/match-analysis/route.js` | GET single analysis / GET list by date / POST store |
| `website/src/app/api/match-analysis/outcome/route.js` | POST actual result + evaluate market hits |
| `website/src/app/api/match-analysis/stats/route.js` | GET aggregated market hit rates (last N days) |
| `website/src/components/MatchAnalysisPanel.jsx` | 10-tab market analysis UI in PredictionCard |
| `website/src/components/MarketHitRatesSection.jsx` | Insights page hit rate leaderboard |
| `.tmp/match_stats_*.json` | Cached match stats (safe to delete; re-fetched on demand) |
| `.tmp/fixture_stats_*.json` | Cached per-fixture stats (save these — each costs 1 API req) |
| `.tmp/market_analysis_*.json` | Cached market analyses (re-generated from match_stats) |

---

## Phase Roadmap

| Phase | When | What |
|-------|------|------|
| 1 (now) | Daily | Fetch stats → analyze markets → display in UI → record outcomes |
| 2 (1 week+) | After data accumulates | Scrape SportyBet odds → show alongside hit rates |
| 3 (50+ games) | ~2–3 weeks | Train logistic regression model per market → calibrated predictions |
