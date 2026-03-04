"""
Calculate historical hit rates for 30+ betting markets from match stats JSON.

Usage:
  python3 tools/analyze_game_markets.py .tmp/match_stats_Brighton_vs_Arsenal.json

Output: .tmp/market_analysis_{home}_vs_{away}.json
"""

import json
import sys
import os
import re
from datetime import datetime


# --- Market definitions ---

def total_goals(f):
    return f["home_goals"] + f["away_goals"]


MARKET_FUNCTIONS = {
    # Goals Over
    "over_0.5":  lambda f: total_goals(f) > 0,
    "over_1.5":  lambda f: total_goals(f) > 1,
    "over_2.5":  lambda f: total_goals(f) > 2,
    "over_3.5":  lambda f: total_goals(f) > 3,
    # Goals Under
    "under_0.5": lambda f: total_goals(f) < 1,
    "under_1.5": lambda f: total_goals(f) < 2,
    "under_2.5": lambda f: total_goals(f) < 3,
    "under_3.5": lambda f: total_goals(f) < 4,
    # BTTS
    "btts_yes":  lambda f: f["home_goals"] > 0 and f["away_goals"] > 0,
    "btts_no":   lambda f: not (f["home_goals"] > 0 and f["away_goals"] > 0),
    # 1X2
    "home_win":  lambda f: f["result"] == "home",
    "draw":      lambda f: f["result"] == "draw",
    "away_win":  lambda f: f["result"] == "away",
    # Double Chance
    "dc_1x":     lambda f: f["result"] in ("home", "draw"),
    "dc_x2":     lambda f: f["result"] in ("away", "draw"),
    "dc_12":     lambda f: f["result"] in ("home", "away"),
    # Handicap (home team perspective: positive margin = home win by that margin)
    "handicap_home_-1.5": lambda f: (f["home_goals"] - f["away_goals"]) > 1,
    "handicap_home_-1.0": lambda f: (f["home_goals"] - f["away_goals"]) > 0,
    "handicap_home_-0.5": lambda f: (f["home_goals"] - f["away_goals"]) > 0,
    "handicap_home_+0.5": lambda f: (f["home_goals"] - f["away_goals"]) >= 0,
    "handicap_home_+1.0": lambda f: (f["home_goals"] - f["away_goals"]) >= -1,
    "handicap_home_+1.5": lambda f: (f["home_goals"] - f["away_goals"]) > -2,
    # Corners (only computed when corner data is available)
    "corners_over_8.5":  lambda f: f.get("total_corners") is not None and f["total_corners"] > 8,
    "corners_over_9.5":  lambda f: f.get("total_corners") is not None and f["total_corners"] > 9,
    "corners_over_10.5": lambda f: f.get("total_corners") is not None and f["total_corners"] > 10,
    "corners_under_8.5": lambda f: f.get("total_corners") is not None and f["total_corners"] < 9,
    "corners_under_9.5": lambda f: f.get("total_corners") is not None and f["total_corners"] < 10,
    "corners_under_10.5":lambda f: f.get("total_corners") is not None and f["total_corners"] < 11,
    # Bookings/Cards
    "cards_over_2.5":  lambda f: f.get("total_cards") is not None and f["total_cards"] > 2,
    "cards_over_3.5":  lambda f: f.get("total_cards") is not None and f["total_cards"] > 3,
    "cards_under_2.5": lambda f: f.get("total_cards") is not None and f["total_cards"] < 3,
    "cards_under_3.5": lambda f: f.get("total_cards") is not None and f["total_cards"] < 4,
    # Highest Scoring Half
    "first_half_highest":  lambda f: f.get("highest_scoring_half") == "first",
    "second_half_highest": lambda f: f.get("highest_scoring_half") == "second",
    "equal_halves":        lambda f: f.get("highest_scoring_half") == "equal",
    # Win to Nil
    "home_win_to_nil": lambda f: f["result"] == "home" and f["away_goals"] == 0,
    "away_win_to_nil": lambda f: f["result"] == "away" and f["home_goals"] == 0,
    # Clean Sheet
    "home_clean_sheet": lambda f: f["away_goals"] == 0,
    "away_clean_sheet": lambda f: f["home_goals"] == 0,
}

MARKET_LABELS = {
    "over_0.5": "Over 0.5 Goals",
    "over_1.5": "Over 1.5 Goals",
    "over_2.5": "Over 2.5 Goals",
    "over_3.5": "Over 3.5 Goals",
    "under_0.5": "Under 0.5 Goals",
    "under_1.5": "Under 1.5 Goals",
    "under_2.5": "Under 2.5 Goals",
    "under_3.5": "Under 3.5 Goals",
    "btts_yes": "BTTS - Yes",
    "btts_no": "BTTS - No",
    "home_win": "Home Win (1)",
    "draw": "Draw (X)",
    "away_win": "Away Win (2)",
    "dc_1x": "Double Chance 1X",
    "dc_x2": "Double Chance X2",
    "dc_12": "Double Chance 12",
    "handicap_home_-1.5": "Handicap Home -1.5",
    "handicap_home_-1.0": "Handicap Home -1.0",
    "handicap_home_-0.5": "Handicap Home -0.5",
    "handicap_home_+0.5": "Handicap Home +0.5",
    "handicap_home_+1.0": "Handicap Home +1.0",
    "handicap_home_+1.5": "Handicap Home +1.5",
    "corners_over_8.5": "Corners Over 8.5",
    "corners_over_9.5": "Corners Over 9.5",
    "corners_over_10.5": "Corners Over 10.5",
    "corners_under_8.5": "Corners Under 8.5",
    "corners_under_9.5": "Corners Under 9.5",
    "corners_under_10.5": "Corners Under 10.5",
    "cards_over_2.5": "Cards Over 2.5",
    "cards_over_3.5": "Cards Over 3.5",
    "cards_under_2.5": "Cards Under 2.5",
    "cards_under_3.5": "Cards Under 3.5",
    "first_half_highest": "First Half Highest Scoring",
    "second_half_highest": "Second Half Highest Scoring",
    "equal_halves": "Both Halves Equal",
    "home_win_to_nil": "Home Win to Nil",
    "away_win_to_nil": "Away Win to Nil",
    "home_clean_sheet": "Home Clean Sheet",
    "away_clean_sheet": "Away Clean Sheet",
}

MARKET_CATEGORIES = {
    "goals": ["over_0.5", "over_1.5", "over_2.5", "over_3.5",
              "under_0.5", "under_1.5", "under_2.5", "under_3.5"],
    "btts": ["btts_yes", "btts_no"],
    "1x2": ["home_win", "draw", "away_win"],
    "double_chance": ["dc_1x", "dc_x2", "dc_12"],
    "handicap": ["handicap_home_-1.5", "handicap_home_-1.0", "handicap_home_-0.5",
                 "handicap_home_+0.5", "handicap_home_+1.0", "handicap_home_+1.5"],
    "corners": ["corners_over_8.5", "corners_over_9.5", "corners_over_10.5",
                "corners_under_8.5", "corners_under_9.5", "corners_under_10.5"],
    "cards": ["cards_over_2.5", "cards_over_3.5", "cards_under_2.5", "cards_under_3.5"],
    "halves": ["first_half_highest", "second_half_highest", "equal_halves"],
    "win_to_nil": ["home_win_to_nil", "away_win_to_nil"],
    "clean_sheet": ["home_clean_sheet", "away_clean_sheet"],
}


# --- Hit rate computation ---

def requires_corners(market_name: str) -> bool:
    return "corner" in market_name

def requires_cards(market_name: str) -> bool:
    return "card" in market_name

def requires_halves(market_name: str) -> bool:
    return "half" in market_name or "halves" in market_name


def fixtures_valid_for_market(fixtures: list, market_name: str) -> list:
    """Filter fixtures that have the data required for this market."""
    if requires_corners(market_name):
        return [f for f in fixtures if f.get("total_corners") is not None]
    if requires_cards(market_name):
        return [f for f in fixtures if f.get("total_cards") is not None]
    return fixtures


def compute_hit_rate(fixtures: list, market_name: str) -> dict:
    """Compute hit rate for one market across the given fixtures."""
    valid = fixtures_valid_for_market(fixtures, market_name)
    n = len(valid)
    if n == 0:
        return {"hit_rate": None, "sample_size": 0, "hits": 0}

    fn = MARKET_FUNCTIONS[market_name]
    hits = 0
    for f in valid:
        try:
            if fn(f):
                hits += 1
        except Exception:
            n -= 1  # skip broken records
            continue

    if n == 0:
        return {"hit_rate": None, "sample_size": 0, "hits": 0}

    return {
        "hit_rate": round(hits / n * 100, 1),
        "sample_size": n,
        "hits": hits,
    }


def sample_confidence(n: int) -> float:
    """Returns 0.0–1.0. Full confidence at 5+ games."""
    return min(n / 5.0, 1.0)


def weighted_combined_score(
    h2h: dict, home: dict, away: dict
) -> float | None:
    """Compute weighted hit rate combining three contexts."""
    base = {"h2h": 0.30, "home_form": 0.35, "away_form": 0.35}

    effective = {
        "h2h":       base["h2h"]       * sample_confidence(h2h["sample_size"]),
        "home_form": base["home_form"] * sample_confidence(home["sample_size"]),
        "away_form": base["away_form"] * sample_confidence(away["sample_size"]),
    }
    total_w = sum(effective.values())
    if total_w == 0:
        return None

    rates = {
        "h2h":       h2h["hit_rate"] or 0,
        "home_form": home["hit_rate"] or 0,
        "away_form": away["hit_rate"] or 0,
    }
    score = sum(rates[k] * effective[k] for k in rates) / total_w
    return round(score, 1)


def confidence_tier(score: float | None) -> str:
    if score is None:
        return "insufficient_data"
    if score >= 70:
        return "high"
    if score >= 55:
        return "medium"
    return "low"


def low_sample_flag(h2h: dict, home: dict, away: dict) -> bool:
    """True if any context has fewer than 5 games."""
    return any(
        ctx["sample_size"] < 5
        for ctx in [h2h, home, away]
        if ctx["sample_size"] > 0
    )


# --- Main analysis ---

def analyze(stats: dict) -> dict:
    h2h_fixtures = stats["h2h"]
    home_fixtures = stats["home_form"]
    away_fixtures = stats["away_form"]

    markets = []
    for market_name, label in MARKET_LABELS.items():
        h2h_rate = compute_hit_rate(h2h_fixtures, market_name)
        home_rate = compute_hit_rate(home_fixtures, market_name)
        away_rate = compute_hit_rate(away_fixtures, market_name)

        # Skip markets where ALL contexts have no data
        if h2h_rate["sample_size"] == 0 and home_rate["sample_size"] == 0 and away_rate["sample_size"] == 0:
            continue

        combined = weighted_combined_score(h2h_rate, home_rate, away_rate)

        # Determine category
        category = next(
            (cat for cat, names in MARKET_CATEGORIES.items() if market_name in names),
            "other"
        )

        markets.append({
            "market_name": market_name,
            "label": label,
            "category": category,
            "combined_hit_rate": combined,
            "confidence_tier": confidence_tier(combined),
            "low_sample": low_sample_flag(h2h_rate, home_rate, away_rate),
            "h2h": h2h_rate,
            "home_form": home_rate,
            "away_form": away_rate,
        })

    # Sort: high tier first, then by hit rate descending
    tier_order = {"high": 0, "medium": 1, "low": 2, "insufficient_data": 3}
    markets.sort(key=lambda m: (
        tier_order.get(m["confidence_tier"], 3),
        -(m["combined_hit_rate"] or 0),
        -(m["h2h"]["sample_size"] + m["home_form"]["sample_size"] + m["away_form"]["sample_size"])
    ))

    total_fixtures = (
        len(h2h_fixtures) + len(home_fixtures) + len(away_fixtures)
    )
    high_count = sum(1 for m in markets if m["confidence_tier"] == "high")

    return {
        "home_team": stats["home_team"],
        "away_team": stats["away_team"],
        "league": stats.get("league"),
        "country": stats.get("country"),
        "season": stats.get("season"),
        "generated_at": datetime.utcnow().isoformat() + "Z",
        "markets": markets,
        "summary": {
            "total_markets_analyzed": len(markets),
            "high_confidence_count": high_count,
            "total_fixtures_used": total_fixtures,
            "h2h_count": len(h2h_fixtures),
            "home_form_count": len(home_fixtures),
            "away_form_count": len(away_fixtures),
        },
    }


def main():
    if len(sys.argv) < 2:
        print("Usage: python3 tools/analyze_game_markets.py <path_to_match_stats.json>")
        sys.exit(1)

    stats_path = sys.argv[1]
    if not os.path.exists(stats_path):
        print(f"Error: File not found: {stats_path}")
        sys.exit(1)

    with open(stats_path, "r") as f:
        stats = json.load(f)

    print(f"Analyzing markets: {stats['home_team']} vs {stats['away_team']}")
    print(f"  H2H games: {len(stats['h2h'])} | Home form: {len(stats['home_form'])} | Away form: {len(stats['away_form'])}")

    result = analyze(stats)

    # Save output
    home = re.sub(r"[^\w]", "_", stats["home_team"])
    away = re.sub(r"[^\w]", "_", stats["away_team"])
    os.makedirs(".tmp", exist_ok=True)
    output_path = f".tmp/market_analysis_{home}_vs_{away}.json"
    with open(output_path, "w") as f:
        json.dump(result, f, indent=2)

    print(f"\nSaved to: {output_path}")
    print(f"Markets analyzed: {result['summary']['total_markets_analyzed']}")
    print(f"High confidence: {result['summary']['high_confidence_count']}")
    print("\nTop 5 markets:")
    for m in result["markets"][:5]:
        rate = m["combined_hit_rate"]
        rate_str = f"{rate}%" if rate is not None else "N/A"
        low_str = " [low sample]" if m["low_sample"] else ""
        print(f"  [{m['confidence_tier'].upper():8}] {rate_str:6} — {m['label']}{low_str}")


if __name__ == "__main__":
    main()
