import { computeOverUnder, computeBTTS, computeDoubleChance } from "@/lib/markets";

const marketComputers = {
  overunder: computeOverUnder,
  btts: computeBTTS,
  doublechance: computeDoubleChance,
};

export default function MarketCard({ prediction, market }) {
  const compute = marketComputers[market];
  if (!compute) return null;

  const result = compute(prediction);
  const p = prediction;

  let confidenceColor;
  if (result.confidence >= 70) {
    confidenceColor = "text-prob-green border-prob-green/30 bg-prob-green/15";
  } else if (result.confidence >= 55) {
    confidenceColor = "text-prob-yellow border-prob-yellow/30 bg-prob-yellow/15";
  } else {
    confidenceColor = "text-prob-orange border-prob-orange/30 bg-prob-orange/15";
  }

  return (
    <div className="bg-bg-card border border-border-custom rounded-xl px-6 py-5 grid grid-cols-[1fr_auto] gap-5 items-center hover:bg-bg-card-hover/50 hover:border-accent/40 transition-all max-sm:px-4 max-sm:py-4">
      <div className="min-w-0">
        <div className="text-sm text-text-secondary mb-1.5 truncate">
          {p.country} &middot; {p.league}
        </div>
        <div className="text-base font-bold mb-2 max-sm:text-sm">
          {p.home_team} vs {p.away_team}
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-accent font-medium">
            {result.prediction}
          </span>
          <span className="text-xs text-text-secondary px-2.5 py-1 rounded-lg bg-bg-primary">
            {result.market}
          </span>
        </div>
      </div>

      <div className="flex flex-col items-center gap-1.5 shrink-0">
        <div
          className={`w-16 h-16 rounded-full flex items-center justify-center font-bold text-base border-2 ${confidenceColor}`}
        >
          {result.confidence}%
        </div>
        <span className="text-[11px] text-text-secondary">Estimate</span>
      </div>
    </div>
  );
}
