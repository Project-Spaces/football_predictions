import Link from "next/link";
import { getPredictions } from "@/lib/predictions";
import PredictionCard from "@/components/PredictionCard";

const FEATURES = [
  {
    title: "AI Win Probabilities",
    description:
      "Every match ranked by win probability. Only 60%+ predictions make the cut, verified against real form data.",
    icon: "🎯",
  },
  {
    title: "Trending Insights",
    description:
      "Spot teams on hot streaks, form patterns, and momentum shifts before the odds move.",
    icon: "📈",
  },
  {
    title: "Real-time Alerts",
    description:
      "Get notified when high-value picks drop. Never miss a top prediction again.",
    icon: "🔔",
  },
  {
    title: "Data & Visuals",
    description:
      "League breakdowns, probability distributions, and performance charts — all in one dashboard.",
    icon: "📊",
  },
];

export default function Home() {
  const data = getPredictions();
  const top3 = data.predictions.slice(0, 3);

  return (
    <main className="flex-1">
      {/* Hero */}
      <section className="py-20 px-4 max-sm:py-14">
        <div className="max-w-[960px] mx-auto text-center">
          <h1 className="text-5xl font-bold text-text-primary mb-6 leading-tight max-sm:text-3xl">
            Analyze Trends.
            <br />
            No Matter the League.{" "}
            <span className="bg-gradient-to-r from-accent to-blue-400 bg-clip-text text-transparent">
              Start Winning.
            </span>
          </h1>
          <p className="text-lg text-text-secondary max-w-2xl mx-auto mb-10 max-sm:text-base">
            AI-powered football predictions across 20+ countries. Every pick
            ranked by win probability and verified on SportyBet Nigeria.
          </p>
          <div className="flex gap-4 justify-center max-sm:flex-col max-sm:px-4">
            <Link
              href="/signup"
              className="px-8 py-3.5 bg-accent text-white font-semibold rounded-lg hover:bg-accent/90 transition-colors text-base"
            >
              Get Started Free
            </Link>
            <a
              href="#preview"
              className="px-8 py-3.5 border border-border-custom text-text-primary font-semibold rounded-lg hover:bg-bg-card transition-colors text-base"
            >
              See Today&apos;s Preview
            </a>
          </div>
        </div>
      </section>

      {/* Top 3 Preview */}
      <section id="preview" className="px-4 pb-16">
        <div className="max-w-[960px] mx-auto">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-2xl font-bold text-text-primary">
              Today&apos;s Top Picks
            </h2>
            <span className="text-sm text-text-secondary">
              {data.total_predictions} predictions available
            </span>
          </div>

          <div className="flex flex-col gap-2.5">
            {top3.map((p) => (
              <PredictionCard key={p.rank} prediction={p} />
            ))}
          </div>

          {/* Blurred teaser */}
          <div className="relative mt-2.5">
            <div className="bg-bg-card border border-border-custom rounded-[10px] p-4 blur-sm pointer-events-none">
              <div className="h-14 bg-bg-card-hover rounded" />
            </div>
            <div className="absolute inset-0 flex items-center justify-center">
              <Link
                href="/signup"
                className="px-6 py-3 bg-accent text-white font-semibold rounded-lg hover:bg-accent/90 transition-colors text-sm"
              >
                Sign up to see all {data.total_predictions} predictions →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="px-4 py-16 border-t border-border-custom">
        <div className="max-w-[960px] mx-auto">
          <h2 className="text-2xl font-bold text-text-primary text-center mb-3">
            Everything You Need to Win
          </h2>
          <p className="text-text-secondary text-center mb-10 max-w-xl mx-auto">
            From data-driven predictions to real-time alerts — your edge in one
            dashboard.
          </p>
          <div className="grid grid-cols-2 gap-5 max-sm:grid-cols-1">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className="bg-bg-card border border-border-custom rounded-xl p-6 hover:border-accent/40 transition-colors"
              >
                <div className="text-3xl mb-4">{f.icon}</div>
                <h3 className="text-lg font-semibold text-text-primary mb-2">
                  {f.title}
                </h3>
                <p className="text-sm text-text-secondary leading-relaxed">
                  {f.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="px-4 py-16 border-t border-border-custom">
        <div className="max-w-[960px] mx-auto">
          <h2 className="text-2xl font-bold text-text-primary text-center mb-10">
            How It Works
          </h2>
          <div className="grid grid-cols-3 gap-6 max-sm:grid-cols-1">
            <div className="text-center">
              <div className="w-12 h-12 bg-accent/10 text-accent rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4">
                1
              </div>
              <h3 className="font-semibold text-text-primary mb-2">
                Analyse Form
              </h3>
              <p className="text-sm text-text-secondary">
                We scrape match data and filter for games with 60%+ win
                probability based on recent form.
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-accent/10 text-accent rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4">
                2
              </div>
              <h3 className="font-semibold text-text-primary mb-2">
                Verify on SportyBet
              </h3>
              <p className="text-sm text-text-secondary">
                Each prediction is cross-referenced against SportyBet Nigeria to
                confirm availability.
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-accent/10 text-accent rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4">
                3
              </div>
              <h3 className="font-semibold text-text-primary mb-2">
                Pick & Win
              </h3>
              <p className="text-sm text-text-secondary">
                Browse ranked predictions, check form data, and make informed
                decisions. Updated daily.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Banner */}
      <section className="px-4 py-16 border-t border-border-custom">
        <div className="max-w-[960px] mx-auto text-center">
          <h2 className="text-3xl font-bold text-text-primary mb-4 max-sm:text-2xl">
            Ready to start winning?
          </h2>
          <p className="text-text-secondary mb-8 max-w-lg mx-auto">
            Join Pindexa and get instant access to today&apos;s highest-probability
            predictions.
          </p>
          <Link
            href="/signup"
            className="inline-block px-8 py-3.5 bg-accent text-white font-semibold rounded-lg hover:bg-accent/90 transition-colors text-base"
          >
            Create Free Account
          </Link>
        </div>
      </section>
    </main>
  );
}
