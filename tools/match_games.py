"""
Cross-reference soccervista predictions with sportybet available games.
Only output games that exist on both platforms.

Two-tier matching:
  1. League matching: Uses sidebar leagues (384+ leagues) for broad coverage
  2. Team matching: Uses match details (when available) for precise verification

If a league is found on SportyBet but match details aren't scraped for it,
the game is still included (marked as "league only" match).
"""

import re
import sys
import os
import pandas as pd
from thefuzz import fuzz

# Thresholds for fuzzy matching (0-100 scale)
LEAGUE_THRESHOLD = 65
TEAM_THRESHOLD = 70

# Common abbreviation expansions for normalization
ABBREVIATIONS = {
    'utd': 'united',
    'fc': '',
    'sc': '',
    'ac': '',
    'cf': '',
    'afc': '',
    'fk': '',
    'bk': '',
    'if': '',
    'man': 'manchester',
}


def normalize(name):
    """Normalize a team/league name for fuzzy comparison."""
    name = name.lower().strip()
    name = re.sub(r'[^\w\s]', '', name)  # Remove punctuation
    name = re.sub(r'\s+', ' ', name)     # Collapse whitespace
    words = name.split()
    words = [ABBREVIATIONS.get(w, w) for w in words]
    return ' '.join(w for w in words if w).strip()


def match_league_sidebar(sv_country, sv_league, sidebar_leagues):
    """Match a SoccerVista league against SportyBet's sidebar league list.

    sidebar_leagues is a list of dicts with 'sb_country', 'sb_league_name', 'sb_full_league'.
    """
    sv_league_norm = normalize(sv_league)
    sv_country_norm = normalize(sv_country)

    best_score = 0
    best_match = None

    for sl in sidebar_leagues:
        sb_country_norm = normalize(sl['sb_country'])
        sb_league_norm = normalize(sl['sb_league_name'])

        # Country must match reasonably well first (gate check)
        country_score = fuzz.token_sort_ratio(sv_country_norm, sb_country_norm)
        if country_score < 60:
            # Also check if sv_country appears within sb_country or vice versa
            if sv_country_norm not in sb_country_norm and sb_country_norm not in sv_country_norm:
                continue

        # Now score the league name match
        league_score = max(
            fuzz.token_sort_ratio(sv_league_norm, sb_league_norm),
            fuzz.token_set_ratio(sv_league_norm, sb_league_norm),
        )

        # Penalize women's/youth league matches against regular leagues
        special_words = ['women', 'u18', 'u19', 'u21', 'u23', 'reserve', 'amateur']
        sv_is_special = any(w in sv_league_norm for w in special_words)
        sb_is_special = any(w in sb_league_norm for w in special_words)
        if sv_is_special != sb_is_special:
            league_score = league_score * 0.5  # Heavy penalty for category mismatch

        # Penalize when sb_league has many extra words not in sv_league
        # E.g., "Liga MX" should prefer "Liga MX, Clausura" over "Liga de Expansion MX, Clausura"
        sv_words = set(sv_league_norm.split())
        sb_words = set(sb_league_norm.split())
        if sv_words and sb_words:
            overlap = len(sv_words & sb_words)
            extra_sb = len(sb_words - sv_words)
            if extra_sb > overlap:
                league_score = league_score * 0.85  # Slight penalty for too many extra words

        # Combined score: country matters
        score = (country_score * 0.3 + league_score * 0.7)

        if score > best_score:
            best_score = score
            best_match = sl

    if best_score >= LEAGUE_THRESHOLD and best_match:
        return best_match, best_score
    return None, best_score


def match_teams(sv_home, sv_away, sb_games_in_league):
    """Find best matching SportyBet game for a SoccerVista match."""
    sv_home_norm = normalize(sv_home)
    sv_away_norm = normalize(sv_away)

    best_combined = 0
    best_game = None
    best_scores = (0, 0)

    for _, game in sb_games_in_league.iterrows():
        sb_home_norm = normalize(game['sb_home_team'])
        sb_away_norm = normalize(game['sb_away_team'])

        home_score = max(
            fuzz.token_sort_ratio(sv_home_norm, sb_home_norm),
            fuzz.partial_ratio(sv_home_norm, sb_home_norm),
        )
        away_score = max(
            fuzz.token_sort_ratio(sv_away_norm, sb_away_norm),
            fuzz.partial_ratio(sv_away_norm, sb_away_norm),
        )
        combined = (home_score + away_score) / 2

        if combined > best_combined:
            best_combined = combined
            best_game = game
            best_scores = (home_score, away_score)

    if best_combined >= TEAM_THRESHOLD and best_game is not None:
        return best_game, best_combined, best_scores
    return None, best_combined, best_scores


def main():
    sv_file = sys.argv[1] if len(sys.argv) > 1 else '.tmp/soccervista_raw.md'
    sb_games_file = sys.argv[2] if len(sys.argv) > 2 else '.tmp/sportybet_games.csv'
    sb_leagues_file = '.tmp/sportybet_leagues.csv'

    # Parse soccervista predictions
    sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
    from parse_soccervista import parse_matches

    if not os.path.exists(sv_file):
        print(f"Error: {sv_file} not found. Run scrape_soccervista.py first.")
        sys.exit(1)

    print(f"Loading SoccerVista predictions from: {sv_file}")
    sv_matches = parse_matches(sv_file)
    sv_df = pd.DataFrame(sv_matches)

    if sv_df.empty:
        print("No SoccerVista predictions found!")
        sys.exit(1)

    # Filter to 60%+ win probability
    sv_df = sv_df[sv_df['Win Probability %'] >= 60]
    sv_df = sv_df.sort_values('Win Probability %', ascending=False)
    print(f"  SoccerVista predictions (60%+): {len(sv_df)}")

    # Load SportyBet sidebar leagues (broad coverage)
    sidebar_leagues = []
    if os.path.exists(sb_leagues_file):
        sidebar_df = pd.read_csv(sb_leagues_file)
        sidebar_leagues = sidebar_df.to_dict('records')
        print(f"\nLoaded {len(sidebar_leagues)} SportyBet sidebar leagues")

    # Load SportyBet match details (narrow but precise)
    sb_games_df = pd.DataFrame()
    if os.path.exists(sb_games_file):
        sb_games_df = pd.read_csv(sb_games_file)
        print(f"Loaded {len(sb_games_df)} SportyBet match details")

    if not sidebar_leagues and sb_games_df.empty:
        print("Error: No SportyBet data found. Run scrape_sportybet.py + parse_sportybet.py first.")
        sys.exit(1)

    # Cross-reference
    print("\n=== MATCHING ===")
    matched = []
    unmatched_leagues = set()
    league_only_matches = 0

    for _, sv_row in sv_df.iterrows():
        sv_country = sv_row['Country']
        sv_league = sv_row['League']

        # Step 1: Match league using sidebar (broad coverage)
        sb_league_info, league_score = match_league_sidebar(
            sv_country, sv_league, sidebar_leagues
        )

        if not sb_league_info:
            league_key = f"{sv_country}: {sv_league}"
            if league_key not in unmatched_leagues:
                unmatched_leagues.add(league_key)
            continue

        sb_full_league = sb_league_info['sb_full_league']

        # Step 2: Try team-level matching if match details available
        # Map sidebar league to match detail leagues
        matched_detail_league = None
        if not sb_games_df.empty:
            for detail_league in sb_games_df['sb_league'].unique():
                detail_norm = normalize(detail_league)
                sidebar_norm = normalize(sb_full_league)
                if fuzz.token_sort_ratio(detail_norm, sidebar_norm) >= 80:
                    matched_detail_league = detail_league
                    break

        if matched_detail_league:
            # We have match details - do precise team matching
            sb_in_league = sb_games_df[sb_games_df['sb_league'] == matched_detail_league]
            game, team_score, (home_sc, away_sc) = match_teams(
                sv_row['Home Team'], sv_row['Away Team'], sb_in_league
            )

            if game is not None:
                row = sv_row.to_dict()
                row['SportyBet League'] = sb_full_league
                row['SportyBet Home'] = game['sb_home_team']
                row['SportyBet Away'] = game['sb_away_team']
                row['League Match %'] = league_score
                row['Team Match %'] = round(team_score, 1)
                row['Match Type'] = 'Full (league + team)'
                matched.append(row)
                print(f"  FULL MATCH: {sv_row['Home Team']} vs {sv_row['Away Team']} "
                      f"-> {game['sb_home_team']} vs {game['sb_away_team']} "
                      f"(league:{league_score:.0f}%, team:{team_score:.0f}%)")
            # If team not found in details, it might not be on this league's page yet
            # Still include as league-only match
            else:
                row = sv_row.to_dict()
                row['SportyBet League'] = sb_full_league
                row['SportyBet Home'] = '(verify on SportyBet)'
                row['SportyBet Away'] = '(verify on SportyBet)'
                row['League Match %'] = league_score
                row['Team Match %'] = 0
                row['Match Type'] = 'League only (team not in scraped page)'
                matched.append(row)
                league_only_matches += 1
                print(f"  LEAGUE MATCH: {sv_row['Home Team']} vs {sv_row['Away Team']} "
                      f"-> {sb_full_league} (league:{league_score:.0f}%, teams not verified)")
        else:
            # No match details for this league - league-only match
            row = sv_row.to_dict()
            row['SportyBet League'] = sb_full_league
            row['SportyBet Home'] = '(verify on SportyBet)'
            row['SportyBet Away'] = '(verify on SportyBet)'
            row['League Match %'] = league_score
            row['Team Match %'] = 0
            row['Match Type'] = 'League only (no match details scraped)'
            matched.append(row)
            league_only_matches += 1
            print(f"  LEAGUE MATCH: {sv_row['Home Team']} vs {sv_row['Away Team']} "
                  f"-> {sb_full_league} (league:{league_score:.0f}%, teams not verified)")

    print(f"\n=== RESULTS ===")
    full_matches = len(matched) - league_only_matches
    print(f"Total matched: {len(matched)} games out of {len(sv_df)} predictions")
    print(f"  Full matches (league + team verified): {full_matches}")
    print(f"  League-only matches (team needs manual verify): {league_only_matches}")

    if unmatched_leagues:
        print(f"\nLeagues not found on SportyBet ({len(unmatched_leagues)}):")
        for league in sorted(unmatched_leagues):
            print(f"  - {league}")

    if not matched:
        print("\nNo matches found.")
        return

    result_df = pd.DataFrame(matched)
    result_df = result_df.sort_values('Win Probability %', ascending=False)
    result_df.insert(0, 'Rank', range(1, len(result_df) + 1))

    # Save outputs
    os.makedirs('.tmp', exist_ok=True)
    result_df.to_excel('.tmp/matched_predictions.xlsx', index=False)
    result_df.to_csv('.tmp/matched_predictions.csv', index=False)

    result_df.to_excel('matched_predictions.xlsx', index=False)
    result_df.to_csv('matched_predictions.csv', index=False)

    print(f"\nSaved to: matched_predictions.xlsx / .csv")
    print(f"\nFinal matched predictions:")
    for _, row in result_df.iterrows():
        match_type = "✓" if row.get('Match Type', '').startswith('Full') else "~"
        print(f"  {match_type} #{row['Rank']}: {row['Predicted Winner']} ({row['Win Probability %']}%) "
              f"| {row['Home Team']} vs {row['Away Team']} "
              f"| {row['Country']}: {row['League']}")


if __name__ == "__main__":
    main()
