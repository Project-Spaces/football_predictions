"use client";

/**
 * Reusable hit rate progress bar for a single market.
 * Shows recommendation, combined hit rate, and per-context breakdown.
 */
export default function MarketHitRateBar({ market }) {
  const { label, combined_hit_rate: rate, confidence_tier: tier, low_sample, h2h, home_form, away_form } = market;

  const colorClass =
    tier === "high"
      ? "text-prob-green"
      : tier === "medium"
      ? "text-prob-yellow"
      : "text-prob-orange";

  const bgClass =
    tier === "high"
      ? "bg-prob-green"
      : tier === "medium"
      ? "bg-prob-yellow"
      : "bg-prob-orange";

  const borderClass =
    tier === "high"
      ? "border-prob-green/30"
      : tier === "medium"
      ? "border-prob-yellow/30"
      : "border-prob-orange/30";

  const displayRate = rate != null ? `${rate}%` : "N/A";
  const barWidth = rate != null ? Math.min(rate, 100) : 0;

  return (
    <div className={`p-3 rounded-lg border ${borderClass} bg-bg-card-hover`}>
      <div className="flex items-center justify-between gap-2 mb-1.5">
        <span className="text-sm text-text-primary font-medium truncate">{label}</span>
        <div className="flex items-center gap-2 shrink-0">
          {low_sample && (
            <span className="text-xs text-text-secondary italic" title="Fewer than 5 games in one or more contexts">
              low sample
            </span>
          )}
          <span className={`text-sm font-bold ${colorClass}`}>{displayRate}</span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 bg-bg-primary rounded-full overflow-hidden mb-2">
        <div
          className={`h-full ${bgClass} rounded-full transition-all duration-500`}
          style={{ width: `${barWidth}%` }}
        />
      </div>

      {/* Context breakdown */}
      <div className="flex gap-3 text-xs text-text-secondary">
        <span>H2H: {h2h?.hit_rate != null ? `${h2h.hit_rate}%` : "—"} ({h2h?.sample_size ?? 0})</span>
        <span>Home: {home_form?.hit_rate != null ? `${home_form.hit_rate}%` : "—"} ({home_form?.sample_size ?? 0})</span>
        <span>Away: {away_form?.hit_rate != null ? `${away_form.hit_rate}%` : "—"} ({away_form?.sample_size ?? 0})</span>
      </div>
    </div>
  );
}
