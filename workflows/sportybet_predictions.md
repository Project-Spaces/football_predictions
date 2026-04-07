# Workflow: SoccerVista Predictions

## Objective
Generate a list of high-probability football predictions from SoccerVista and publish them to the website.

## Required Inputs
- SoccerVista predictions URL (defaults to today: https://www.soccervista.com)

## Tools Used
- `tools/scrape_soccervista.py` — Scrape SoccerVista predictions via FireCrawl
- `tools/parse_soccervista.py` — Parse SoccerVista markdown into predictions with win probability
- `tools/csv_to_json.py` — Convert predictions to JSON for the website

## Steps
1. Scrape SoccerVista for today's predictions:
   `python3 tools/scrape_soccervista.py`
2. Parse and filter predictions (60%+ win probability):
   `python3 tools/parse_soccervista.py`
3. Convert to website JSON:
   `python3 tools/csv_to_json.py`

## Expected Output
- `.tmp/soccervista_predictions.xlsx` — Filtered predictions (60%+ win probability)
- `website/public/data/predictions.json` — Web-ready JSON for the frontend
- Columns: Rank, Country, League, Kickoff (UTC), Home Team, Away Team, Predicted Winner, Predicted Side, Winner Form (Last 5), Win Probability %

## Edge Cases & Lessons Learned
- **SoccerVista format changed (Feb 2025)**: Old format used "10 on XXX" predictions. New format uses 1/X/2 columns. Parser handles both formats.
- **Finished matches on SoccerVista**: Today's page includes FT (finished) matches. Parser skips these and only keeps upcoming matches with kickoff times.
- **FireCrawl JS wait**: SoccerVista requires 5s wait for JS rendering. If results are empty, check FireCrawl API key in `.env`.
