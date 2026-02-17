import { getPredictions } from "@/lib/predictions";

export const metadata = {
  title: "Insights",
};

export default function InsightsPage() {
  const data = getPredictions();
  const predictions = data.predictions;

  // Top 5 by probability
  const topPicks = predictions.slice(0, 5);

  // Best form streaks (most W's in last 5)
  const byStreak = [...predictions]
    .map((p) => ({
      ...p,
      wins: (p.winner_form.match(/W/g) || []).length,
    }))
    .sort((a, b) => b.wins - a.wins)
    .slice(0, 5);

  // Group by country
  const countryMap = {};
  predictions.forEach((p) => {
    if (!countryMap[p.country]) countryMap[p.country] = [];
    countryMap[p.country].push(p);
  });
  const topCountries = Object.entries(countryMap)
    .map(([country, preds]) => ({
      country,
      count: preds.length,
      avgProb: (
        preds.reduce((s, p) => s + p.win_probability, 0) / preds.length
      ).toFixed(1),
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);

  return (
    <div className="max-w-[800px]">
      <h1 className="text-2xl font-bold text-text-primary mb-1">
        Trending Insights
      </h1>
      <p className="text-sm text-text-secondary mb-8">
        Form streaks, top movers, and league breakdowns from today&apos;s data.
      </p>

      <div className="grid grid-cols-2 gap-6 max-sm:grid-cols-1">
        {/* Top Picks */}
        <div className="bg-bg-card border border-border-custom rounded-lg p-5">
          <h2 className="font-semibold text-text-primary mb-4">
            Highest Probability
          </h2>
          <div className="space-y-3">
            {topPicks.map((p) => (
              <div key={p.rank} className="flex items-center justify-between">
                <div className="min-w-0">
                  <div className="text-sm text-text-primary font-medium truncate">
                    {p.predicted_winner}
                  </div>
                  <div className="text-xs text-text-secondary truncate">
                    {p.league}
                  </div>
                </div>
                <span className="text-sm font-bold text-prob-green ml-3 shrink-0">
                  {p.win_probability}%
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Best Form */}
        <div className="bg-bg-card border border-border-custom rounded-lg p-5">
          <h2 className="font-semibold text-text-primary mb-4">
            Best Form Streaks
          </h2>
          <div className="space-y-3">
            {byStreak.map((p) => (
              <div key={p.rank} className="flex items-center justify-between">
                <div className="min-w-0">
                  <div className="text-sm text-text-primary font-medium truncate">
                    {p.predicted_winner}
                  </div>
                  <div className="text-xs text-text-secondary">
                    {p.winner_form}
                  </div>
                </div>
                <span className="text-sm font-bold text-accent ml-3 shrink-0">
                  {p.wins}/5 W
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Countries */}
      <div className="bg-bg-card border border-border-custom rounded-lg p-5 mt-6">
        <h2 className="font-semibold text-text-primary mb-4">
          Predictions by Country
        </h2>
        <div className="grid grid-cols-2 gap-3 max-sm:grid-cols-1">
          {topCountries.map((c) => (
            <div
              key={c.country}
              className="flex items-center justify-between py-2 border-b border-border-custom last:border-0"
            >
              <span className="text-sm text-text-primary">{c.country}</span>
              <div className="text-xs text-text-secondary">
                {c.count} picks &middot; avg {c.avgProb}%
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
