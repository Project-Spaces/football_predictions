import { getPredictions } from "@/lib/predictions";
import MarketHitRatesSection from "@/components/MarketHitRatesSection";

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
    <div className="max-w-[1400px]">
      <div data-aos="fade-up">
        <h1 className="text-4xl font-bold text-text-primary mb-2 max-sm:text-3xl">
          Trending Insights
        </h1>
        <p className="text-base text-text-secondary mb-12 max-sm:text-sm max-sm:mb-8">
          Form streaks, top movers, and league breakdowns from today&apos;s data.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-6 max-sm:grid-cols-1" data-aos="fade-up" data-aos-delay="100">
        {/* Top Picks */}
        <div className="bg-bg-card border border-border-custom rounded-xl p-8 hover:border-accent/40 transition-all">
          <h2 className="font-bold text-text-primary text-xl mb-6">
            Highest Probability
          </h2>
          <div className="space-y-5">
            {topPicks.map((p) => (
              <div key={p.rank} className="flex items-center justify-between">
                <div className="min-w-0">
                  <div className="text-base text-text-primary font-medium truncate">
                    {p.predicted_winner}
                  </div>
                  <div className="text-sm text-text-secondary truncate">
                    {p.league}
                  </div>
                </div>
                <span className="text-base font-bold text-prob-green ml-3 shrink-0">
                  {p.win_probability}%
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Best Form */}
        <div className="bg-bg-card border border-border-custom rounded-xl p-8 hover:border-accent/40 transition-all">
          <h2 className="font-bold text-text-primary text-xl mb-6">
            Best Form Streaks
          </h2>
          <div className="space-y-5">
            {byStreak.map((p) => (
              <div key={p.rank} className="flex items-center justify-between">
                <div className="min-w-0">
                  <div className="text-base text-text-primary font-medium truncate">
                    {p.predicted_winner}
                  </div>
                  <div className="text-sm text-text-secondary">
                    {p.winner_form}
                  </div>
                </div>
                <span className="text-base font-bold text-accent ml-3 shrink-0">
                  {p.wins}/5 W
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Market Hit Rates */}
      <MarketHitRatesSection />

      {/* Countries */}
      <div className="bg-bg-card border border-border-custom rounded-xl p-8 mt-8 hover:border-accent/40 transition-all" data-aos="fade-up" data-aos-delay="200">
        <h2 className="font-bold text-text-primary text-xl mb-6">
          Predictions by Country
        </h2>
        <div className="grid grid-cols-2 gap-5 max-sm:grid-cols-1">
          {topCountries.map((c) => (
            <div
              key={c.country}
              className="flex items-center justify-between py-3 border-b border-border-custom last:border-0"
            >
              <span className="text-base text-text-primary">{c.country}</span>
              <div className="text-sm text-text-secondary">
                {c.count} picks &middot; avg {c.avgProb}%
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
