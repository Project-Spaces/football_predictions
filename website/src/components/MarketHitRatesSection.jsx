"use client";

import { useState, useEffect } from "react";

const TIER_COLOR = {
  high: "text-prob-green",
  medium: "text-prob-yellow",
  low: "text-prob-orange",
};

function tier(rate) {
  if (rate >= 70) return "high";
  if (rate >= 55) return "medium";
  return "low";
}

function formatMarketName(name) {
  return name
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .replace(/\bBtts\b/, "BTTS")
    .replace(/\bDc\b/, "DC");
}

export default function MarketHitRatesSection({ days = 7 }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/match-analysis/stats?days=${days}&limit=15`)
      .then((r) => r.json())
      .then((d) => {
        setData(d);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [days]);

  // Don't render the section at all if no data yet
  if (!loading && (!data || data.total_games === 0)) return null;

  return (
    <div
      className="bg-bg-card border border-border-custom rounded-xl p-8 mt-8 hover:border-accent/40 transition-all"
      data-aos="fade-up"
      data-aos-delay="150"
    >
      <div className="flex items-baseline justify-between mb-6">
        <h2 className="font-bold text-text-primary text-xl">
          Market Hit Rates
        </h2>
        {!loading && data && (
          <span className="text-sm text-text-secondary">
            Last {days} days &middot; {data.total_games} game{data.total_games !== 1 ? "s" : ""}
          </span>
        )}
      </div>

      {loading && (
        <div className="text-sm text-text-secondary animate-pulse">Loading market performance...</div>
      )}

      {!loading && data && data.markets?.length > 0 && (
        <div className="space-y-3">
          {data.markets.map((m) => {
            const t = tier(m.hit_rate);
            return (
              <div key={m.market_name} className="flex items-center gap-4">
                <div className="w-44 shrink-0 text-sm text-text-primary truncate">
                  {formatMarketName(m.market_name)}
                </div>
                <div className="flex-1 h-2 bg-bg-primary rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      t === "high"
                        ? "bg-prob-green"
                        : t === "medium"
                          ? "bg-prob-yellow"
                          : "bg-prob-orange"
                    }`}
                    style={{ width: `${m.hit_rate}%` }}
                  />
                </div>
                <span className={`text-sm font-bold shrink-0 w-12 text-right ${TIER_COLOR[t]}`}>
                  {m.hit_rate}%
                </span>
                <span className="text-xs text-text-secondary shrink-0 w-14 text-right">
                  {m.hits}/{m.total}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
