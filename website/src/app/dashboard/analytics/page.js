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
    <div className="max-w-[1100px]">
      <div data-aos="fade-up">
        <h1 className="text-3xl font-bold text-text-primary mb-1">
          Data & Visuals
        </h1>
        <p className="text-sm text-text-secondary mb-10">
          Statistical breakdown of today&apos;s predictions.
        </p>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-4 gap-5 mb-10 max-sm:grid-cols-2" data-aos="fade-up" data-aos-delay="100">
        <div className="bg-bg-card border border-border-custom rounded-xl p-6 text-center">
          <div className="text-3xl font-bold text-text-primary">{avgProb}%</div>
          <div className="text-xs text-text-secondary mt-2">Avg Probability</div>
        </div>
        <div className="bg-bg-card border border-border-custom rounded-xl p-6 text-center">
          <div className="text-3xl font-bold text-text-primary">{uniqueLeagues}</div>
          <div className="text-xs text-text-secondary mt-2">Leagues</div>
        </div>
        <div className="bg-bg-card border border-border-custom rounded-xl p-6 text-center">
          <div className="text-3xl font-bold text-prob-green">{above80}</div>
          <div className="text-xs text-text-secondary mt-2">80%+ Picks</div>
        </div>
        <div className="bg-bg-card border border-border-custom rounded-xl p-6 text-center">
          <div className="text-3xl font-bold text-accent">
            {data.total_predictions}
          </div>
          <div className="text-xs text-text-secondary mt-2">Total Matches</div>
        </div>
      </div>

      {/* Probability distribution */}
      <div className="bg-bg-card border border-border-custom rounded-xl p-7 mb-8" data-aos="fade-up" data-aos-delay="200">
        <h2 className="font-semibold text-text-primary text-lg mb-5">
          Probability Distribution
        </h2>
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <span className="text-sm text-text-secondary w-16">80%+</span>
            <div className="flex-1 bg-bg-primary rounded-full h-7 overflow-hidden">
              <div
                className="h-full bg-prob-green/60 rounded-full flex items-center pl-3"
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
            <div className="flex-1 bg-bg-primary rounded-full h-7 overflow-hidden">
              <div
                className="h-full bg-prob-yellow/60 rounded-full flex items-center pl-3"
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
            <div className="flex-1 bg-bg-primary rounded-full h-7 overflow-hidden">
              <div
                className="h-full bg-prob-orange/60 rounded-full flex items-center pl-3"
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
      <div className="bg-bg-card border border-border-custom rounded-xl p-8 text-center" data-aos="fade-up" data-aos-delay="300">
        <div className="text-4xl mb-4">📊</div>
        <h2 className="text-xl font-semibold text-text-primary mb-3">
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
