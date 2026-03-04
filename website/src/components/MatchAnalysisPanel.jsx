"use client";

import { useState, useEffect } from "react";
import MarketHitRateBar from "./MarketHitRateBar";

const CATEGORIES = [
  { key: "goals",         label: "Goals" },
  { key: "btts",          label: "BTTS" },
  { key: "1x2",           label: "1X2" },
  { key: "double_chance", label: "Double Chance" },
  { key: "handicap",      label: "Handicap" },
  { key: "corners",       label: "Corners" },
  { key: "cards",         label: "Cards" },
  { key: "halves",        label: "Halves" },
  { key: "win_to_nil",    label: "Win to Nil" },
  { key: "clean_sheet",   label: "Clean Sheet" },
];

export default function MatchAnalysisPanel({ homeTeam, awayTeam, matchDate }) {
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeCategory, setActiveCategory] = useState("goals");

  useEffect(() => {
    if (!homeTeam || !awayTeam) return;

    const params = new URLSearchParams({ home: homeTeam, away: awayTeam });
    if (matchDate) params.set("date", matchDate);

    fetch(`/api/match-analysis?${params}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.status === "not_cached") {
          setError("No analysis available yet. Run batch_analyze_predictions.py to generate.");
        } else {
          setAnalysis(data.analysis);
        }
      })
      .catch(() => setError("Failed to load analysis."))
      .finally(() => setLoading(false));
  }, [homeTeam, awayTeam, matchDate]);

  if (loading) {
    return (
      <div className="mt-3 p-4 rounded-xl border border-border-custom bg-bg-card-hover animate-pulse">
        <div className="h-4 bg-bg-primary rounded w-1/2 mb-3" />
        <div className="h-3 bg-bg-primary rounded w-full mb-2" />
        <div className="h-3 bg-bg-primary rounded w-3/4" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="mt-3 p-4 rounded-xl border border-border-custom bg-bg-card-hover">
        <p className="text-sm text-text-secondary italic">{error}</p>
      </div>
    );
  }

  if (!analysis) return null;

  const markets = analysis.markets || [];
  const summary = analysis.summary || {};

  // Filter to active category
  const filtered = markets.filter((m) => m.category === activeCategory);

  // Categories that have at least one market
  const availableCategories = CATEGORIES.filter((cat) =>
    markets.some((m) => m.category === cat.key)
  );

  const highCount = markets.filter((m) => m.confidence_tier === "high").length;

  return (
    <div className="mt-3 rounded-xl border border-border-custom bg-bg-card overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-border-custom flex items-center justify-between gap-2">
        <div>
          <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
            Deep Market Analysis
          </p>
          <p className="text-xs text-text-secondary mt-0.5">
            {summary.total_markets_analyzed} markets · {summary.h2h_count} H2H · {summary.home_form_count} home · {summary.away_form_count} away games
            {highCount > 0 && (
              <span className="ml-2 text-prob-green font-semibold">{highCount} high confidence</span>
            )}
          </p>
        </div>
        <span className="text-xs text-text-secondary shrink-0">
          via API-Football
        </span>
      </div>

      {/* Category tabs */}
      <div className="flex gap-1 px-3 pt-3 pb-1 flex-wrap">
        {availableCategories.map((cat) => {
          const catMarkets = markets.filter((m) => m.category === cat.key);
          const hasHigh = catMarkets.some((m) => m.confidence_tier === "high");
          return (
            <button
              key={cat.key}
              onClick={() => setActiveCategory(cat.key)}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                activeCategory === cat.key
                  ? "bg-accent text-white"
                  : hasHigh
                  ? "bg-prob-green/15 text-prob-green border border-prob-green/30 hover:bg-prob-green/25"
                  : "bg-bg-card-hover text-text-secondary hover:text-text-primary"
              }`}
            >
              {cat.label}
              {hasHigh && activeCategory !== cat.key && (
                <span className="ml-1 text-prob-green">●</span>
              )}
            </button>
          );
        })}
      </div>

      {/* Market rows */}
      <div className="px-3 pb-3 space-y-2 mt-2">
        {filtered.length === 0 ? (
          <p className="text-sm text-text-secondary italic py-2">
            No data available for this category.
          </p>
        ) : (
          filtered.map((market) => (
            <MarketHitRateBar key={market.market_name} market={market} />
          ))
        )}
      </div>

      {/* Footer */}
      <div className="px-4 py-2 border-t border-border-custom">
        <p className="text-xs text-text-secondary">
          Hit rate = historical frequency from H2H (30%) + home form (35%) + away form (35%).
          {" "}<span className="text-prob-green">Green ≥70%</span>{" · "}
          <span className="text-prob-yellow">Yellow 55-70%</span>{" · "}
          <span className="text-prob-orange">Orange &lt;55%</span>
        </p>
      </div>
    </div>
  );
}
