import { getPredictions } from "@/lib/predictions";

export const metadata = {
  title: "Analytics",
};

export default function AnalyticsPage() {
  const data = getPredictions();
  const predictions = data.predictions;

  // Basic stats we can compute from existing data
  const avgProb =
    predictions.length > 0
      ? (
          predictions.reduce((s, p) => s + p.win_probability, 0) /
          predictions.length
        ).toFixed(1)
      : 0;
  const above80 = predictions.filter((p) => p.win_probability >= 80).length;
  const above70 = predictions.filter(
    (p) => p.win_probability >= 70 && p.win_probability < 80
  ).length;
  const below70 = predictions.filter((p) => p.win_probability < 70).length;
  const uniqueLeagues = new Set(predictions.map((p) => p.league)).size;

  return (
    <div className="max-w-[800px]">
      <h1 className="text-2xl font-bold text-text-primary mb-1">
        Data & Visuals
      </h1>
      <p className="text-sm text-text-secondary mb-8">
        Statistical breakdown of today&apos;s predictions.
      </p>

      {/* Quick stats */}
      <div className="grid grid-cols-4 gap-4 mb-8 max-sm:grid-cols-2">
        <div className="bg-bg-card border border-border-custom rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-text-primary">{avgProb}%</div>
          <div className="text-xs text-text-secondary mt-1">Avg Probability</div>
        </div>
        <div className="bg-bg-card border border-border-custom rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-text-primary">{uniqueLeagues}</div>
          <div className="text-xs text-text-secondary mt-1">Leagues</div>
        </div>
        <div className="bg-bg-card border border-border-custom rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-prob-green">{above80}</div>
          <div className="text-xs text-text-secondary mt-1">80%+ Picks</div>
        </div>
        <div className="bg-bg-card border border-border-custom rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-accent">
            {data.total_predictions}
          </div>
          <div className="text-xs text-text-secondary mt-1">Total Matches</div>
        </div>
      </div>

      {/* Probability distribution */}
      <div className="bg-bg-card border border-border-custom rounded-lg p-5 mb-6">
        <h2 className="font-semibold text-text-primary mb-4">
          Probability Distribution
        </h2>
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <span className="text-sm text-text-secondary w-16">80%+</span>
            <div className="flex-1 bg-bg-primary rounded-full h-6 overflow-hidden">
              <div
                className="h-full bg-prob-green/60 rounded-full flex items-center pl-2"
                style={{
                  width: `${predictions.length ? (above80 / predictions.length) * 100 : 0}%`,
                }}
              >
                <span className="text-xs text-text-primary font-medium">
                  {above80}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-text-secondary w-16">70-79%</span>
            <div className="flex-1 bg-bg-primary rounded-full h-6 overflow-hidden">
              <div
                className="h-full bg-prob-yellow/60 rounded-full flex items-center pl-2"
                style={{
                  width: `${predictions.length ? (above70 / predictions.length) * 100 : 0}%`,
                }}
              >
                <span className="text-xs text-text-primary font-medium">
                  {above70}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-text-secondary w-16">60-69%</span>
            <div className="flex-1 bg-bg-primary rounded-full h-6 overflow-hidden">
              <div
                className="h-full bg-prob-orange/60 rounded-full flex items-center pl-2"
                style={{
                  width: `${predictions.length ? (below70 / predictions.length) * 100 : 0}%`,
                }}
              >
                <span className="text-xs text-text-primary font-medium">
                  {below70}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Coming soon teaser */}
      <div className="bg-bg-card border border-border-custom rounded-xl p-6 text-center">
        <div className="text-3xl mb-3">📊</div>
        <h2 className="text-lg font-semibold text-text-primary mb-2">
          Advanced Charts Coming Soon
        </h2>
        <p className="text-sm text-text-secondary max-w-md mx-auto">
          Interactive visualizations, historical accuracy tracking, and
          over/under analysis are in development.
        </p>
      </div>
    </div>
  );
}
