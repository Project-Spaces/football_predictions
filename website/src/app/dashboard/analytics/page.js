import { getPredictions } from "@/lib/predictions";

export const metadata = {
  title: "Analytics",
};

export default function AnalyticsPage() {
  const data = getPredictions();
  const predictions = data.predictions;

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
    <div className="max-w-[1400px]">
      <div data-aos="fade-up">
        <h1 className="text-4xl font-bold text-text-primary mb-2 max-sm:text-3xl">
          Data & Visuals
        </h1>
        <p className="text-base text-text-secondary mb-12 max-sm:text-sm max-sm:mb-8">
          Statistical breakdown of today&apos;s predictions.
        </p>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-4 gap-6 mb-12 max-sm:grid-cols-2 max-sm:gap-4" data-aos="fade-up" data-aos-delay="100">
        <div className="bg-bg-card border border-border-custom rounded-xl p-7 text-center hover:border-accent/40 transition-all">
          <div className="text-4xl font-bold text-text-primary max-sm:text-3xl">{avgProb}%</div>
          <div className="text-sm text-text-secondary mt-3">Avg Probability</div>
        </div>
        <div className="bg-bg-card border border-border-custom rounded-xl p-7 text-center hover:border-accent/40 transition-all">
          <div className="text-4xl font-bold text-text-primary max-sm:text-3xl">{uniqueLeagues}</div>
          <div className="text-sm text-text-secondary mt-3">Leagues</div>
        </div>
        <div className="bg-bg-card border border-border-custom rounded-xl p-7 text-center hover:border-accent/40 transition-all">
          <div className="text-4xl font-bold text-prob-green max-sm:text-3xl">{above80}</div>
          <div className="text-sm text-text-secondary mt-3">80%+ Picks</div>
        </div>
        <div className="bg-bg-card border border-border-custom rounded-xl p-7 text-center hover:border-accent/40 transition-all">
          <div className="text-4xl font-bold text-accent max-sm:text-3xl">
            {data.total_predictions}
          </div>
          <div className="text-sm text-text-secondary mt-3">Total Matches</div>
        </div>
      </div>

      {/* Probability distribution */}
      <div className="bg-bg-card border border-border-custom rounded-xl p-8 mb-8 hover:border-accent/40 transition-all" data-aos="fade-up" data-aos-delay="200">
        <h2 className="font-bold text-text-primary text-xl mb-6">
          Probability Distribution
        </h2>
        <div className="space-y-5">
          <div className="flex items-center gap-4">
            <span className="text-base text-text-secondary w-20 max-sm:text-sm max-sm:w-16">80%+</span>
            <div className="flex-1 bg-bg-primary rounded-full h-8 overflow-hidden">
              <div
                className="h-full bg-prob-green/60 rounded-full flex items-center pl-4"
                style={{
                  width: `${predictions.length ? (above80 / predictions.length) * 100 : 0}%`,
                }}
              >
                <span className="text-sm text-text-primary font-medium">
                  {above80}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-base text-text-secondary w-20 max-sm:text-sm max-sm:w-16">70-79%</span>
            <div className="flex-1 bg-bg-primary rounded-full h-8 overflow-hidden">
              <div
                className="h-full bg-prob-yellow/60 rounded-full flex items-center pl-4"
                style={{
                  width: `${predictions.length ? (above70 / predictions.length) * 100 : 0}%`,
                }}
              >
                <span className="text-sm text-text-primary font-medium">
                  {above70}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-base text-text-secondary w-20 max-sm:text-sm max-sm:w-16">60-69%</span>
            <div className="flex-1 bg-bg-primary rounded-full h-8 overflow-hidden">
              <div
                className="h-full bg-prob-orange/60 rounded-full flex items-center pl-4"
                style={{
                  width: `${predictions.length ? (below70 / predictions.length) * 100 : 0}%`,
                }}
              >
                <span className="text-sm text-text-primary font-medium">
                  {below70}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Coming soon teaser */}
      <div className="bg-bg-card border border-border-custom rounded-xl p-10 text-center hover:border-accent/40 transition-all" data-aos="fade-up" data-aos-delay="300">
        <div className="text-5xl mb-5">📊</div>
        <h2 className="text-2xl font-bold text-text-primary mb-4 max-sm:text-xl">
          Advanced Charts Coming Soon
        </h2>
        <p className="text-base text-text-secondary max-w-lg mx-auto leading-relaxed max-sm:text-sm">
          Interactive visualizations, historical accuracy tracking, and
          over/under analysis are in development.
        </p>
      </div>
    </div>
  );
}
