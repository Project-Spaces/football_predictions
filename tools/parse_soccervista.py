"""
Parse soccervista scraped markdown data.
Extract matches, form data, and calculate win probabilities.
Output top 20 clubs with 60-70% win chance to Excel.
"""

import re
import pandas as pd
import sys


def parse_form(text):
    """Extract W/D/L form indicators from text."""
    # Form appears as W, D, or L separated by \<br>\<br>
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


def parse_matches(filepath):
    """Parse the scraped markdown file and extract match data."""
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    matches = []
    current_league = ""
    current_country = ""

    # Find league headers: ![Country flag](...)[Country: League](...)
    # and match rows with form data

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

        # Check for match row with form data and prediction
        if '10 on' not in line:
            continue

        # Extract time
        time_match = re.search(r'\[(\d{2}:\d{2})\]', line)
        kickoff_time = time_match.group(1) if time_match else ''

        # Split by | to get columns
        cols = line.split('|')

        # We need to find the home team col, away team col, and prediction col
        home_col = ''
        away_col = ''
        prediction = ''

        for col in cols:
            col_stripped = col.strip()
            if not col_stripped or col_stripped == '---':
                continue

            if '10 on' in col_stripped:
                pred_match = re.search(r'10 on (\w+)', col_stripped)
                prediction = pred_match.group(1) if pred_match else ''

            elif 'View details' in col_stripped:
                continue

            elif re.search(r'\d{2}:\d{2}', col_stripped) and not home_col:
                # This is likely the time column, next form column is home
                continue

            elif re.search(r'[WDL].*\\<br>', col_stripped) or re.search(r'\\<br>.*[WDL]', col_stripped):
                if not home_col:
                    home_col = col_stripped
                elif not away_col:
                    away_col = col_stripped

        if not home_col or not away_col:
            continue

        # Extract home team name and form
        # Home team: form comes first, team name last
        # Pattern: [L\<br>\<br>D\<br>\<br>W\<br>\<br>D\<br>\<br>W\<br>\<br>Tottenham](url)
        home_text = re.sub(r'\[|\]\([^\)]*\)', '', home_col)
        home_text = home_text.replace('\\<br>\\<br>', '|').replace('\\<br>', '|')
        home_parts = [p.strip() for p in home_text.split('|') if p.strip()]
        home_form_raw = [p for p in home_parts if p in ('W', 'D', 'L')]
        home_name_parts = [p for p in home_parts if p not in ('W', 'D', 'L')]
        home_team = ' '.join(home_name_parts).strip()

        # Extract away team name and form
        away_text = re.sub(r'\[|\]\([^\)]*\)', '', away_col)
        away_text = away_text.replace('\\<br>\\<br>', '|').replace('\\<br>', '|')
        away_parts = [p.strip() for p in away_text.split('|') if p.strip()]
        away_form_raw = [p for p in away_parts if p in ('W', 'D', 'L')]
        away_name_parts = [p for p in away_parts if p not in ('W', 'D', 'L')]
        away_team = ' '.join(away_name_parts).strip()

        # Determine predicted winner
        if prediction:
            # Check which team the prediction favors
            # "10 on TOT" means predicted = home team (Tottenham)
            # We need to figure out if predicted team is home or away
            pred_upper = prediction.upper()
            home_upper = home_team.upper()[:3]
            away_upper = away_team.upper()[:3]

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
            continue

        win_prob = calculate_win_probability(predicted_form, opponent_form)
        pw, pd, pl = count_form(predicted_form)
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
            'Winner W-D-L': f'{pw}-{pd}-{pl}',
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

    # Filter 60-70% range
    filtered = df[(df['Win Probability %'] >= 60) & (df['Win Probability %'] <= 70)]
    print(f"\n=== MATCHES WITH 60-70% WIN PROBABILITY: {len(filtered)} ===")
    for i, row in filtered.iterrows():
        print(f"  {row['Predicted Winner']:25s} ({row['Win Probability %']:5.1f}%) | "
              f"{row['Winner Form (Last 5)']:11s} vs {row['Opponent Form (Last 5)']:11s} | "
              f"{row['Country']} - {row['League']}")

    # Top 20 from 60-70% range
    top20 = filtered.head(20)

    # Save to Excel
    top20.to_excel(output, index=False, sheet_name='Top 20 Predictions')
    print(f"\nTop 20 saved to: {output}")

    # Also save full dataset
    full_output = output.replace('.xlsx', '_full.xlsx')
    df.to_excel(full_output, index=False, sheet_name='All Predictions')
    print(f"Full dataset saved to: {full_output}")


if __name__ == "__main__":
    main()
