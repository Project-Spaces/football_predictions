# Workflow: SportyBet-Validated Predictions

## Objective
Generate a list of high-probability football predictions from SoccerVista that are confirmed to be available for betting on SportyBet Nigeria. Only games present on both platforms make the final output.

## Required Inputs
- SoccerVista predictions URL (defaults to today: https://www.soccervista.com)
- SportyBet football page (defaults to: https://www.sportybet.com/ng/sport/football)

## Tools Used
- `tools/scrape_soccervista.py` — Scrape SoccerVista predictions via FireCrawl
- `tools/scrape_sportybet.py` — Scrape SportyBet available games via FireCrawl
- `tools/parse_soccervista.py` — Parse SoccerVista markdown into predictions with win probability
- `tools/parse_sportybet.py` — Parse SportyBet data into sidebar leagues + match details
- `tools/match_games.py` — Cross-reference and fuzzy-match games between platforms

## Steps
1. Scrape SoccerVista for today's predictions:
   `python3 tools/scrape_soccervista.py`
2. Scrape SportyBet for today's available football matches:
   `python3 tools/scrape_sportybet.py`
3. Parse SportyBet data (sidebar leagues + match details):
   `python3 tools/parse_sportybet.py`
4. Cross-reference and generate final output:
   `python3 tools/match_games.py`
5. Review `matched_predictions.xlsx`:
   - Games marked with "Full" match type are verified at both league and team level
   - Games marked with "League only" need manual verification on sportybet.com/ng
   - Check League Match % and Team Match % columns for confidence

## Expected Output
- `matched_predictions.xlsx` / `.csv` — Final predictions available on SportyBet
- `.tmp/matched_predictions.xlsx` — Same data in temp directory
- Columns: Rank, Country, League, Kickoff, Predicted Winner, Side, Form, Win Probability,
  SportyBet League, SportyBet Home/Away, League Match %, Team Match %, Match Type

## Edge Cases & Lessons Learned
- **SportyBet blocks direct HTTP**: FireCrawl with 10s JS wait works. If it fails, check API key.
- **SportyBet paginates match details**: The main page only shows ~8 top leagues with full match details. The sidebar shows all 384+ leagues. Games in non-top leagues get "league only" match status.
- **SoccerVista format changed (Feb 2025)**: Old format used "10 on XXX" predictions. New format uses 1/X/2 columns. Parser handles both formats.
- **League name mismatches**: Fuzzy matching handles most differences (e.g., "Bundesliga" vs "Germany Bundesliga"). Country matching is enforced to prevent false positives.
- **Women's/Youth leagues**: The matcher penalizes cross-category matches (e.g., won't match "Liga MX" to "Liga MX, Women").
- **Finished matches on SoccerVista**: Today's page includes FT (finished) matches. Parser skips these and only keeps upcoming matches with kickoff times.
- **Team name abbreviations**: "Utd" -> "United", "FC"/"SC" stripped. Handled by normalize() in match_games.py.
