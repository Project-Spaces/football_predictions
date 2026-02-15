"""
Parse soccervista scraped markdown data.
Extract matches, form data, and calculate win probabilities.

Supports two SoccerVista formats:
  - Legacy: "10 on XXX" prediction markers
  - Current: 1X2 column with [1], [X], or [2] predictions
"""

import re
import pandas as pd
import sys


def parse_form(text):
    """Extract W/D/L form indicators from text."""
    results = re.findall(r'\b([WDL])\b', text)
    return results


def calculate_win_probability(team_form, opponent_form):
    """
    Calculate win probability based on form.
    Uses points-based rating: W=3, D=1, L=0 over last 5 matches.
    Composite probability = (team_strength + (1 - opponent_strength)) / 2
    """
    points_map = {'W': 3, 'D': 1, 'L': 0}

    if not team_form or not opponent_form:
        return 0.0

    team_points = sum(points_map.get(r, 0) for r in team_form)
    team_max = len(team_form) * 3
    team_strength = team_points / team_max if team_max > 0 else 0

    opp_points = sum(points_map.get(r, 0) for r in opponent_form)
    opp_max = len(opponent_form) * 3
    opp_strength = opp_points / opp_max if opp_max > 0 else 0

    # Composite probability
    win_prob = (team_strength + (1 - opp_strength)) / 2
    return round(win_prob * 100, 1)


def form_string(form_list):
    """Convert form list to readable string."""
    return '-'.join(form_list) if form_list else ''


def count_form(form_list):
    """Count W, D, L in form."""
    w = form_list.count('W')
    d = form_list.count('D')
    l = form_list.count('L')
    return w, d, l


def extract_team_and_form(col_text):
    """Extract team name and form from a column containing form+team data.
    Pattern: [L\\<br>\\<br>D\\<br>\\<br>W\\<br>\\<br>TeamName](url)
    or: [TeamName\\<br>\\<br>W\\<br>\\<br>D\\<br>\\<br>L](url)
    """
    text = re.sub(r'\[|\]\([^\)]*\)', '', col_text)
    text = text.replace('\\<br>\\<br>', '|').replace('\\<br>', '|')
    parts = [p.strip() for p in text.split('|') if p.strip()]
    form_raw = [p for p in parts if p in ('W', 'D', 'L')]
    name_parts = [p for p in parts if p not in ('W', 'D', 'L')]
    team_name = ' '.join(name_parts).strip()
    return team_name, form_raw


def parse_matches(filepath):
    """Parse the scraped markdown file and extract match data."""
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    matches = []
    current_league = ""
    current_country = ""

    lines = content.split('\n')

    for line in lines:
        # Check for league header
        league_match = re.search(
            r'!\[Country flag\].*?\[([^\]]+)\]\(https://www\.soccervista\.com/([^/]+)/',
            line
        )
        if league_match and '| ---' not in line and 'View details' not in line:
            league_info = league_match.group(1)
            country_slug = league_match.group(2)
            if ':' in league_info:
                parts = league_info.split(':', 1)
                current_country = parts[0].strip()
                current_league = parts[1].strip()
            else:
                current_country = country_slug.replace('-', ' ').title()
                current_league = league_info
            continue

        # Skip rows without form data (W/D/L indicators)
        if not re.search(r'[WDL].*\\<br>', line) and not re.search(r'\\<br>.*[WDL]', line):
            continue

        # Skip finished matches (FT) and live matches (with minute markers like 27')
        # Only process upcoming matches with kickoff times
        time_match = re.search(r'\[(\d{2}:\d{2})\]', line)
        if not time_match:
            continue
        kickoff_time = time_match.group(1)

        # Split by | to get columns
        cols = line.split('|')

        # Find form columns (home and away) and prediction
        home_col = ''
        away_col = ''
        prediction = ''

        for col in cols:
            col_stripped = col.strip()
            if not col_stripped or col_stripped == '---':
                continue

            # Legacy format: "10 on XXX"
            if '10 on' in col_stripped:
                pred_match = re.search(r'10 on (\w+)', col_stripped)
                prediction = pred_match.group(1) if pred_match else ''
                continue

            if 'View details' in col_stripped:
                continue

            # Skip time column
            if re.search(r'^\[?\d{2}:\d{2}\]?', col_stripped) and not home_col:
                continue

            # Form+team columns
            if re.search(r'[WDL].*\\<br>', col_stripped) or re.search(r'\\<br>.*[WDL]', col_stripped):
                if not home_col:
                    home_col = col_stripped
                elif not away_col:
                    away_col = col_stripped

        if not home_col or not away_col:
            continue

        home_team, home_form_raw = extract_team_and_form(home_col)
        away_team, away_form_raw = extract_team_and_form(away_col)

        if not home_team or not away_team:
            continue

        # Determine prediction - check for new format (1X2 column)
        if not prediction:
            # New format: look for standalone [1], [X], or [2] in the columns
            # These appear after the away team column
            for col in cols:
                col_stripped = col.strip()
                # Match exactly [1] or [2] (not odds like [1.79])
                if re.match(r'^\[([12X])\]\(', col_stripped):
                    pred_val = re.match(r'^\[([12X])\]', col_stripped).group(1)
                    if pred_val == '1':
                        prediction = 'HOME'
                    elif pred_val == '2':
                        prediction = 'AWAY'
                    elif pred_val == 'X':
                        prediction = 'DRAW'
                    break

        # Skip draws - we only want win predictions
        if prediction == 'DRAW' or prediction == 'X':
            continue

        # Determine predicted winner
        if prediction in ('HOME', '1') or (prediction and prediction not in ('AWAY', '2', 'DRAW', 'X')):
            # Legacy: check if prediction abbreviation matches home or away
            if prediction not in ('HOME', '1', 'AWAY', '2'):
                pred_upper = prediction.upper()
                home_upper = home_team.upper()[:3]
                if pred_upper == home_upper or home_upper.startswith(pred_upper) or pred_upper in home_team.upper().replace(' ', ''):
                    predicted_team = home_team
                    predicted_form = home_form_raw
                    opponent_form = away_form_raw
                    opponent_team = away_team
                    side = 'Home'
                else:
                    predicted_team = away_team
                    predicted_form = away_form_raw
                    opponent_form = home_form_raw
                    opponent_team = home_team
                    side = 'Away'
            else:
                predicted_team = home_team
                predicted_form = home_form_raw
                opponent_form = away_form_raw
                opponent_team = away_team
                side = 'Home'
        elif prediction in ('AWAY', '2'):
            predicted_team = away_team
            predicted_form = away_form_raw
            opponent_form = home_form_raw
            opponent_team = home_team
            side = 'Away'
        else:
            continue

        win_prob = calculate_win_probability(predicted_form, opponent_form)
        pw, pd_count, pl = count_form(predicted_form)
        ow, od, ol = count_form(opponent_form)

        matches.append({
            'Country': current_country,
            'League': current_league,
            'Kickoff (UTC)': kickoff_time,
            'Home Team': home_team,
            'Away Team': away_team,
            'Predicted Winner': predicted_team,
            'Predicted Side': side,
            'Winner Form (Last 5)': form_string(predicted_form),
            'Winner W-D-L': f'{pw}-{pd_count}-{pl}',
            'Opponent': opponent_team,
            'Opponent Form (Last 5)': form_string(opponent_form),
            'Opponent W-D-L': f'{ow}-{od}-{ol}',
            'Win Probability %': win_prob,
        })

    return matches


def main():
    filepath = sys.argv[1] if len(sys.argv) > 1 else '.tmp/soccervista_raw.md'
    output = sys.argv[2] if len(sys.argv) > 2 else '.tmp/soccervista_predictions.xlsx'

    print(f"Parsing: {filepath}")
    matches = parse_matches(filepath)
    print(f"Total matches parsed: {len(matches)}")

    if not matches:
        print("No matches found!")
        return

    df = pd.DataFrame(matches)
    df = df.sort_values('Win Probability %', ascending=False)

    # Show all matches
    print("\n=== ALL MATCHES ===")
    for i, row in df.iterrows():
        print(f"  {row['Predicted Winner']:25s} ({row['Win Probability %']:5.1f}%) | "
              f"{row['Winner Form (Last 5)']:11s} vs {row['Opponent Form (Last 5)']:11s} | "
              f"{row['Country']} - {row['League']}")

    # Filter 60%+ (no upper ceiling - matching step reduces pool)
    filtered = df[df['Win Probability %'] >= 60]
    print(f"\n=== MATCHES WITH 60%+ WIN PROBABILITY: {len(filtered)} ===")
    for i, row in filtered.iterrows():
        print(f"  {row['Predicted Winner']:25s} ({row['Win Probability %']:5.1f}%) | "
              f"{row['Winner Form (Last 5)']:11s} vs {row['Opponent Form (Last 5)']:11s} | "
              f"{row['Country']} - {row['League']}")

    # Save to Excel
    filtered.to_excel(output, index=False, sheet_name='Predictions 60%+')
    print(f"\nFiltered predictions saved to: {output}")

    # Also save full dataset
    full_output = output.replace('.xlsx', '_full.xlsx')
    df.to_excel(full_output, index=False, sheet_name='All Predictions')
    print(f"Full dataset saved to: {full_output}")


if __name__ == "__main__":
    main()
