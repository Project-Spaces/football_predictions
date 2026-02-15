"""
Parse sportybet scraped markdown data into structured match list.
Extracts:
  1. Sidebar leagues (country + league name + game count) for league-level matching
  2. Match details (home/away teams) from the main content area
"""

import re
import sys
import os
import pandas as pd


def parse_sidebar_leagues(content):
    """Extract all available leagues from the SportyBet sidebar.

    Sidebar format:
    - Country<count>
      - League Name(<count>)

    E.g.:
    - England80
      - Premier League(22)
      - Championship(15)
    """
    leagues = []
    lines = content.split('\n')
    current_country = None

    for line in lines:
        stripped = line.strip()

        # Country header: "- England80" or "- Brazil111"
        country_match = re.match(r'^-\s+([A-Za-z\s&,]+?)(\d+)\s*$', stripped)
        if country_match:
            current_country = country_match.group(1).strip()
            # Skip non-country entries
            if current_country in ('Odds Filter', 'A-Z', 'Odd/Even'):
                current_country = None
                continue
            continue

        # League entry: "  - Premier League(22)" or "  - Serie A(18)"
        league_match = re.match(r'^-\s+(.+?)\((\d+)\)\s*$', stripped)
        if league_match and current_country:
            league_name = league_match.group(1).strip()
            game_count = int(league_match.group(2))
            # Skip filter/structural entries
            if league_name in ('10 options is the maximum allowed',):
                continue
            leagues.append({
                'sb_country': current_country,
                'sb_league_name': league_name,
                'sb_full_league': f"{current_country} {league_name}",
                'sb_game_count': game_count,
            })

        # Reset country on non-indented, non-matching lines
        if stripped and not stripped.startswith('-') and not stripped.startswith('10 options'):
            if not re.match(r'^-\s+', stripped):
                current_country = None

    return leagues


def parse_sportybet_markdown(filepath):
    """Parse FireCrawl markdown output from SportyBet into match records."""
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    lines = content.split('\n')
    matches = []
    current_league = None
    current_date = None

    # League headers contain unicode icon chars between underscores: _\ue6a3_League Name
    league_pattern = re.compile(r'^_[^\w\s]*_(.+)$')

    i = 0
    while i < len(lines):
        line = lines[i].strip()

        # Detect league headers like: _<icon>_England Premier League
        league_match = league_pattern.match(line)
        if league_match:
            league_text = league_match.group(1).strip()
            if not league_text.startswith('Live'):
                current_league = league_text
            i += 1
            continue

        # Detect date headers like: 21/02 Saturday, 14/02 Saturday
        date_match = re.match(r'^(\d{2}/\d{2})\s+\w+day$', line)
        if date_match:
            current_date = date_match.group(1)
            i += 1
            continue

        # Detect match entries by ID line pattern
        id_match = re.match(r'^ID:\s*(\d+)$', line)
        if id_match and current_league:
            match_id = id_match.group(1)

            # Look backward for kickoff time
            kickoff = ''
            for back in range(1, 5):
                prev = lines[i - back].strip() if i - back >= 0 else ''
                time_match = re.match(r'^(\d{2}:\d{2})$', prev)
                if time_match:
                    kickoff = time_match.group(1)
                    break

            # Next two non-empty lines are home and away teams
            teams = []
            k = i + 1
            while k < len(lines) and len(teams) < 2:
                team_line = lines[k].strip()
                if team_line:
                    if re.match(r'^[\d.]+$', team_line):
                        break
                    if re.match(r'^ID:', team_line):
                        break
                    if team_line in ('View All', 'Matches', 'Outrights'):
                        break
                    teams.append(team_line)
                k += 1

            if len(teams) == 2:
                matches.append({
                    'sb_league': current_league,
                    'sb_home_team': teams[0],
                    'sb_away_team': teams[1],
                    'sb_kickoff': kickoff,
                    'sb_date': current_date or '',
                    'sb_match_id': match_id,
                })
            i = k
            continue

        i += 1

    return matches


def main():
    filepath = sys.argv[1] if len(sys.argv) > 1 else '.tmp/sportybet_raw.md'

    if not os.path.exists(filepath):
        print(f"Error: {filepath} not found. Run scrape_sportybet.py first.")
        sys.exit(1)

    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Parse sidebar leagues
    sidebar_leagues = parse_sidebar_leagues(content)
    if sidebar_leagues:
        sidebar_df = pd.DataFrame(sidebar_leagues)
        sidebar_output = '.tmp/sportybet_leagues.csv'
        sidebar_df.to_csv(sidebar_output, index=False)
        print(f"Parsed {len(sidebar_leagues)} sidebar leagues -> {sidebar_output}")
        print(f"  Countries: {sidebar_df['sb_country'].nunique()}")
        total_games = sidebar_df['sb_game_count'].sum()
        print(f"  Total games across all leagues: {total_games}")

    # Parse match details
    matches = parse_sportybet_markdown(filepath)

    os.makedirs('.tmp', exist_ok=True)

    if matches:
        df = pd.DataFrame(matches)
        output = '.tmp/sportybet_games.csv'
        df.to_csv(output, index=False)

        print(f"\nParsed {len(matches)} match details -> {output}")
        print(f"  Leagues with details: {df['sb_league'].nunique()}")
        for league in df['sb_league'].unique():
            count = len(df[df['sb_league'] == league])
            print(f"    {league}: {count} games")
    else:
        print("\nNo match details parsed (only sidebar leagues available).")

    print(f"\nSample sidebar leagues:")
    if sidebar_leagues:
        for l in sidebar_leagues[:15]:
            print(f"  {l['sb_country']}: {l['sb_league_name']} ({l['sb_game_count']} games)")


if __name__ == "__main__":
    main()
