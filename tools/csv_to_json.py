"""
Convert soccervista_predictions.xlsx to predictions.json for the website.
Bridge between the prediction pipeline output and the WebPage frontend.
"""

import json
import os
import sys
from datetime import datetime, timezone

import pandas as pd


def csv_to_json(input_path, output_path):
    """Convert SoccerVista predictions to web-ready JSON."""
    if input_path.endswith('.xlsx'):
        df = pd.read_excel(input_path)
    else:
        df = pd.read_csv(input_path)

    predictions = []
    for i, (_, row) in enumerate(df.iterrows(), start=1):
        predictions.append({
            'rank': int(row['Rank']) if 'Rank' in row and pd.notna(row['Rank']) else i,
            'country': row['Country'],
            'league': row['League'],
            'kickoff_utc': row['Kickoff (UTC)'],
            'home_team': row['Home Team'],
            'away_team': row['Away Team'],
            'predicted_winner': row['Predicted Winner'],
            'predicted_side': row.get('Predicted Side', ''),
            'winner_form': row.get('Winner Form (Last 5)', ''),
            'opponent_form': row.get('Opponent Form (Last 5)', ''),
            'win_probability': round(float(row['Win Probability %']), 1),
        })

    data = {
        'generated_at': datetime.now(timezone.utc).isoformat(),
        'date': datetime.now(timezone.utc).strftime('%Y-%m-%d'),
        'total_predictions': len(predictions),
        'predictions': predictions,
    }

    os.makedirs(os.path.dirname(output_path) or '.', exist_ok=True)
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)

    print(f"Converted {len(predictions)} predictions -> {output_path}")
    return data


def main():
    input_path = sys.argv[1] if len(sys.argv) > 1 else '.tmp/soccervista_predictions.xlsx'
    output_path = sys.argv[2] if len(sys.argv) > 2 else 'website/public/data/predictions.json'

    if not os.path.exists(input_path):
        print(f"Error: {input_path} not found. Run scrape_soccervista.py and parse_soccervista.py first.")
        sys.exit(1)

    csv_to_json(input_path, output_path)


if __name__ == "__main__":
    main()
