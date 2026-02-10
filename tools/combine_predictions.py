"""
Combine soccervista predictions from multiple days.
Filter 60-70% win probability and output top 20 to Excel.
"""

import pandas as pd
from parse_soccervista import parse_matches
import sys
import os

sys.path.insert(0, os.path.dirname(__file__))


def main():
    base_dir = os.path.join(os.path.dirname(__file__), '..', '.tmp')

    files_with_dates = [
        ('.tmp/soccervista_raw.md', 'Tue, 10 Feb'),
        ('.tmp/soccervista_tomorrow.md', 'Wed, 11 Feb'),
        ('.tmp/soccervista_thursday.md', 'Thu, 12 Feb'),
    ]

    all_matches = []
    for filepath, date_label in files_with_dates:
        matches = parse_matches(filepath)
        for m in matches:
            m['Match Date'] = date_label
        all_matches.extend(matches)
        print(f"{date_label}: {len(matches)} matches parsed")

    print(f"\nTotal matches across all days: {len(all_matches)}")

    df = pd.DataFrame(all_matches)

    # Filter 60-70% range
    filtered = df[(df['Win Probability %'] >= 60) & (df['Win Probability %'] <= 70)].copy()
    filtered = filtered.sort_values('Win Probability %', ascending=False)

    print(f"Matches in 60-70% range: {len(filtered)}")

    # Take top 20
    top20 = filtered.head(20).copy()
    top20.insert(0, 'Rank', range(1, len(top20) + 1))

    # Reorder columns for the final sheet
    column_order = [
        'Rank',
        'Match Date',
        'Country',
        'League',
        'Kickoff (UTC)',
        'Predicted Winner',
        'Predicted Side',
        'Winner Form (Last 5)',
        'Winner W-D-L',
        'Opponent',
        'Opponent Form (Last 5)',
        'Opponent W-D-L',
        'Win Probability %',
        'Home Team',
        'Away Team',
    ]
    top20 = top20[column_order]

    print("\n=== TOP 20 CLUBS WITH 60-70% WIN PROBABILITY ===")
    print(f"{'#':>2} {'Date':>12} {'Predicted Winner':25s} {'Prob%':>5} {'Form':11s} {'vs Opp Form':11s} {'Country':20s} {'League'}")
    print("-" * 120)
    for _, row in top20.iterrows():
        print(f"{row['Rank']:2d} {row['Match Date']:>12} {row['Predicted Winner']:25s} {row['Win Probability %']:5.1f} "
              f"{row['Winner Form (Last 5)']:11s} {row['Opponent Form (Last 5)']:11s} "
              f"{row['Country']:20s} {row['League']}")

    # Save to Excel with formatting
    output_path = '.tmp/soccervista_top20.xlsx'
    with pd.ExcelWriter(output_path, engine='openpyxl') as writer:
        top20.to_excel(writer, index=False, sheet_name='Top 20 (60-70% Win)')

        # Auto-fit column widths
        worksheet = writer.sheets['Top 20 (60-70% Win)']
        for col_idx, col in enumerate(top20.columns):
            max_len = max(
                top20[col].astype(str).apply(len).max(),
                len(col)
            ) + 2
            worksheet.column_dimensions[chr(65 + col_idx) if col_idx < 26 else 'A' + chr(65 + col_idx - 26)].width = max_len

    print(f"\nSaved to: {output_path}")


if __name__ == "__main__":
    main()
