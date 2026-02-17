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

const PL_TABLE = [
  { pos: 1, team: "Arsenal", p: 26, gd: "+32", pts: 57, color: "#ef0107" },
  { pos: 2, team: "Man City", p: 26, gd: "+30", pts: 53, color: "#6cabdd" },
  { pos: 3, team: "Aston Villa", p: 26, gd: "+10", pts: 50, color: "#670e36" },
  { pos: 4, team: "Man United", p: 26, gd: "+10", pts: 45, color: "#da291c" },
  { pos: 5, team: "Chelsea", p: 26, gd: "+17", pts: 44, color: "#034694" },
  { pos: 6, team: "Liverpool", p: 26, gd: "+6", pts: 42, color: "#c8102e" },
];

const PLAYER_STATS = {
  name: "Erling Haaland",
  team: "Man City",
  position: "ST",
  number: 9,
  stats: [
    { label: "Goals", value: "22" },
    { label: "Assists", value: "6" },
    { label: "Matches", value: "26" },
    { label: "Form", value: "W-W-W" },
  ],
  form: ["W", "W", "W", "D", "W"],
};

const RANK_STYLES = [
  { border: "border-gold/40", bg: "bg-gold/10", text: "text-gold", label: "1st", glow: "rank-1-glow" },
  { border: "border-silver/40", bg: "bg-silver/10", text: "text-silver", label: "2nd", glow: "" },
  { border: "border-bronze/40", bg: "bg-bronze/10", text: "text-bronze", label: "3rd", glow: "" },
];

export default function Home() {
  const data = getPredictions();
  const top3 = data.predictions.slice(0, 3);

  return (
    <main className="flex-1">
      {/* Hero — full viewport, bold, Outlier-style */}
      <section className="relative min-h-[85vh] flex items-center justify-center px-4 overflow-hidden hero-grid-bg">
        {/* Glow orbs */}
        <div className="absolute top-1/2 left-1/2 w-[600px] h-[600px] rounded-full bg-accent/20 blur-[120px] hero-glow-orb pointer-events-none" />
        <div className="absolute top-[40%] left-[30%] w-[400px] h-[400px] rounded-full bg-purple-500/10 blur-[100px] hero-glow-orb-2 pointer-events-none" />

        <div className="relative z-10 max-w-[1100px] mx-auto text-center">
          <div data-aos="fade-down" data-aos-duration="600">
            <span className="inline-block px-4 py-1.5 text-xs font-semibold tracking-widest uppercase text-accent border border-accent/30 rounded-full mb-8 bg-accent/5">
              AI-Powered Football Predictions
            </span>
          </div>

          <h1
            data-aos="fade-up"
            data-aos-duration="800"
            className="text-7xl font-extrabold text-text-primary mb-6 leading-[1.1] tracking-tight max-lg:text-5xl max-sm:text-4xl"
          >
            Analyze Trends.
            <br />
            No Matter the League.{" "}
            <span className="bg-gradient-to-r from-accent via-blue-400 to-cyan-400 bg-clip-text text-transparent">
              Start Winning.
            </span>
          </h1>

          <p
            data-aos="fade-up"
            data-aos-delay="200"
            className="text-xl text-text-secondary max-w-2xl mx-auto mb-12 leading-relaxed max-sm:text-base"
          >
            AI-powered football predictions across 20+ countries. Every pick
            ranked by win probability and verified on SportyBet Nigeria.
          </p>

          <div
            data-aos="fade-up"
            data-aos-delay="400"
            className="flex gap-4 justify-center max-sm:flex-col max-sm:px-4"
          >
            <Link
              href="/signup"
              className="px-10 py-4 bg-accent text-white font-bold rounded-xl hover:bg-accent/90 transition-all text-lg shadow-[0_0_30px_rgba(59,130,246,0.3)] hover:shadow-[0_0_40px_rgba(59,130,246,0.5)]"
            >
              Get Started Free
            </Link>
            <a
              href="#preview"
              className="px-10 py-4 border border-border-custom text-text-primary font-bold rounded-xl hover:bg-bg-card hover:border-accent/40 transition-all text-lg"
            >
              See Today&apos;s Preview
            </a>
          </div>

          {/* Floating stat badges */}
          <div
            data-aos="fade-up"
            data-aos-delay="600"
            className="flex gap-6 justify-center mt-14 max-sm:gap-3 max-sm:mt-10"
          >
            {[
              { value: "20+", label: "Countries" },
              { value: "60%+", label: "Accuracy" },
              { value: "Daily", label: "Updates" },
            ].map((s) => (
              <div
                key={s.label}
                className="flex items-center gap-2 px-5 py-2.5 bg-bg-card/60 border border-border-custom rounded-full backdrop-blur-sm max-sm:px-3 max-sm:py-2"
              >
                <span className="text-lg font-bold text-accent max-sm:text-base">
                  {s.value}
                </span>
                <span className="text-sm text-text-secondary max-sm:text-xs">
                  {s.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Premier League Featured Match Visualization */}
      <section className="px-4 py-20 border-t border-border-custom" data-aos="fade-up">
        <div className="max-w-[1100px] mx-auto">
          <div className="text-center mb-10" data-aos="fade-up">
            <span className="inline-block px-3 py-1 text-xs font-semibold tracking-wider uppercase text-prob-green border border-prob-green/30 rounded-full mb-4 bg-prob-green/5">
              Featured Match Preview
            </span>
            <h2 className="text-3xl font-bold text-text-primary max-sm:text-2xl">
              Premier League Spotlight
            </h2>
          </div>

          <div className="grid grid-cols-2 gap-6 max-lg:grid-cols-1">
            {/* Match Card + Player Stats */}
            <div data-aos="fade-right" data-aos-delay="200">
              {/* Match header */}
              <div className="bg-bg-card border border-border-custom rounded-xl overflow-hidden">
                <div className="bg-gradient-to-r from-[#ef0107]/20 to-[#034694]/20 px-6 py-4 border-b border-border-custom">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-text-secondary uppercase tracking-wider">
                      Premier League — Matchweek 27 · Sun 1 Mar
                    </span>
                    <span className="text-xs text-prob-green font-semibold">
                      UPCOMING
                    </span>
                  </div>
                </div>

                {/* Teams */}
                <div className="px-6 py-6">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-[#ef0107]/20 flex items-center justify-center text-lg font-bold text-[#ef0107]">
                        ARS
                      </div>
                      <div>
                        <div className="font-bold text-text-primary">Arsenal</div>
                        <div className="text-xs text-text-secondary">Home</div>
                      </div>
                    </div>
                    <div className="text-2xl font-bold text-text-secondary">VS</div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <div className="font-bold text-text-primary">Chelsea</div>
                        <div className="text-xs text-text-secondary">Away</div>
                      </div>
                      <div className="w-12 h-12 rounded-full bg-[#034694]/20 flex items-center justify-center text-lg font-bold text-[#034694]">
                        CHE
                      </div>
                    </div>
                  </div>

                  {/* AI Prediction bar */}
                  <div className="bg-bg-primary rounded-lg p-4">
                    <div className="flex justify-between text-xs text-text-secondary mb-2">
                      <span>Arsenal Win</span>
                      <span>Draw</span>
                      <span>Chelsea Win</span>
                    </div>
                    <div className="flex h-2.5 rounded-full overflow-hidden gap-0.5">
                      <div className="bg-prob-green rounded-l-full" style={{ width: "55%" }} />
                      <div className="bg-prob-yellow" style={{ width: "22%" }} />
                      <div className="bg-accent rounded-r-full" style={{ width: "23%" }} />
                    </div>
                    <div className="flex justify-between text-sm font-bold mt-2">
                      <span className="text-prob-green">55%</span>
                      <span className="text-prob-yellow">22%</span>
                      <span className="text-accent">23%</span>
                    </div>
                  </div>
                </div>

                {/* Player stat card */}
                <div className="px-6 pb-6">
                  <div className="bg-gradient-to-br from-bg-card-hover to-bg-card border border-border-custom rounded-lg p-4">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <div className="text-sm text-text-secondary">
                          Player to Watch
                        </div>
                        <div className="text-lg font-bold text-text-primary">
                          {PLAYER_STATS.name}
                        </div>
                        <div className="text-xs text-accent">
                          #{PLAYER_STATS.number} · {PLAYER_STATS.position} · {PLAYER_STATS.team}
                        </div>
                      </div>
                      <div className="flex gap-1">
                        {PLAYER_STATS.form.map((f, i) => (
                          <span
                            key={i}
                            className={`w-7 h-7 rounded text-xs font-bold flex items-center justify-center ${
                              f === "W"
                                ? "bg-prob-green/20 text-prob-green"
                                : f === "D"
                                ? "bg-prob-yellow/20 text-prob-yellow"
                                : "bg-red-500/20 text-red-400"
                            }`}
                          >
                            {f}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="grid grid-cols-4 gap-3">
                      {PLAYER_STATS.stats.map((s) => (
                        <div
                          key={s.label}
                          className="text-center bg-bg-primary rounded-lg py-2.5"
                        >
                          <div className="text-xl font-bold text-text-primary">
                            {s.value}
                          </div>
                          <div className="text-[10px] text-text-secondary uppercase tracking-wider">
                            {s.label}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Mini League Table */}
            <div data-aos="fade-left" data-aos-delay="400">
              <div className="bg-bg-card border border-border-custom rounded-xl overflow-hidden h-full">
                <div className="px-6 py-4 border-b border-border-custom">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-text-primary">
                      Premier League Standings
                    </h3>
                    <span className="text-xs text-text-secondary">2025/26</span>
                  </div>
                </div>

                <div className="px-6 py-3">
                  {/* Table header */}
                  <div className="grid grid-cols-[30px_1fr_40px_50px_50px] gap-2 text-xs text-text-secondary uppercase tracking-wider pb-3 border-b border-border-custom">
                    <span>#</span>
                    <span>Team</span>
                    <span className="text-center">P</span>
                    <span className="text-center">GD</span>
                    <span className="text-center">Pts</span>
                  </div>

                  {PL_TABLE.map((row) => (
                    <div
                      key={row.pos}
                      className={`grid grid-cols-[30px_1fr_40px_50px_50px] gap-2 items-center py-3.5 border-b border-border-custom/50 last:border-0 ${
                        row.team === "Arsenal"
                          ? "bg-[#ef0107]/5 -mx-6 px-6 rounded"
                          : ""
                      }`}
                    >
                      <span
                        className={`text-sm font-bold ${
                          row.pos <= 4
                            ? "text-prob-green"
                            : "text-text-secondary"
                        }`}
                      >
                        {row.pos}
                      </span>
                      <div className="flex items-center gap-2">
                        <div
                          className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold text-white"
                          style={{ backgroundColor: row.color }}
                        >
                          {row.team.slice(0, 2).toUpperCase()}
                        </div>
                        <span
                          className={`text-sm ${
                            row.team === "Arsenal"
                              ? "font-bold text-text-primary"
                              : "text-text-secondary"
                          }`}
                        >
                          {row.team}
                        </span>
                      </div>
                      <span className="text-sm text-text-secondary text-center">
                        {row.p}
                      </span>
                      <span
                        className={`text-sm text-center ${
                          row.gd.startsWith("+")
                            ? "text-prob-green"
                            : "text-red-400"
                        }`}
                      >
                        {row.gd}
                      </span>
                      <span className="text-sm font-bold text-text-primary text-center">
                        {row.pts}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Disclaimer */}
                <div className="px-6 py-3 border-t border-border-custom">
                  <p className="text-[10px] text-text-secondary text-center">
                    Standings as of Matchweek 26. Sign up for live match predictions.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Today's Top Picks — Enhanced */}
      <section id="preview" className="px-4 py-20 relative">
        {/* Gradient top accent */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-accent to-transparent" />

        <div className="max-w-[1100px] mx-auto">
          <div className="flex items-center justify-between mb-8" data-aos="fade-up">
            <div className="flex items-center gap-3">
              <h2 className="text-3xl font-bold text-text-primary max-sm:text-2xl">
                Today&apos;s Top Picks
              </h2>
              <span className="px-2.5 py-1 text-xs font-bold bg-prob-green/20 text-prob-green rounded-full border border-prob-green/30 uppercase tracking-wider">
                Live
              </span>
            </div>
            <span className="text-sm text-text-secondary bg-bg-card px-3 py-1.5 rounded-full border border-border-custom max-sm:hidden">
              {data.total_predictions} predictions available
            </span>
          </div>

          <div className="flex flex-col gap-3">
            {top3.map((p, i) => (
              <div
                key={p.rank}
                data-aos="fade-up"
                data-aos-delay={i * 100}
                className={`relative ${RANK_STYLES[i]?.glow || ""}`}
              >
                {/* Rank badge */}
                <div className="flex items-stretch gap-3 max-sm:flex-col max-sm:gap-0">
                  <div
                    className={`flex items-center justify-center w-14 rounded-l-xl border-r-0 border ${RANK_STYLES[i]?.border} ${RANK_STYLES[i]?.bg} max-sm:w-full max-sm:rounded-l-none max-sm:rounded-t-xl max-sm:py-2 max-sm:border-b-0`}
                  >
                    <div className="text-center">
                      <div className={`text-xl font-extrabold ${RANK_STYLES[i]?.text}`}>
                        #{i + 1}
                      </div>
                    </div>
                  </div>
                  <div className="flex-1">
                    <PredictionCard prediction={p} />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Blurred teaser — dramatic */}
          <div className="relative mt-3" data-aos="fade-up" data-aos-delay="300">
            <div className="bg-bg-card border border-border-custom rounded-xl p-5 blur-sm pointer-events-none">
              <div className="h-16 bg-bg-card-hover rounded-lg" />
            </div>
            <div className="absolute inset-0 bg-gradient-to-t from-bg-primary/90 to-transparent rounded-xl flex items-center justify-center">
              <Link
                href="/signup"
                className="px-8 py-3.5 bg-accent text-white font-bold rounded-xl hover:bg-accent/90 transition-all text-sm shadow-[0_0_25px_rgba(59,130,246,0.3)]"
              >
                Sign up to see all {data.total_predictions} predictions →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="px-4 py-20 border-t border-border-custom">
        <div className="max-w-[1100px] mx-auto">
          <div data-aos="fade-up">
            <h2 className="text-3xl font-bold text-text-primary text-center mb-3">
              Everything You Need to Win
            </h2>
            <p className="text-text-secondary text-center mb-12 max-w-xl mx-auto">
              From data-driven predictions to real-time alerts — your edge in one
              dashboard.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-5 max-sm:grid-cols-1">
            {FEATURES.map((f, i) => (
              <div
                key={f.title}
                data-aos="fade-up"
                data-aos-delay={i * 100}
                className="bg-bg-card border border-border-custom rounded-xl p-7 hover:border-accent/40 transition-all group"
              >
                <div className="text-4xl mb-4 group-hover:scale-110 transition-transform">
                  {f.icon}
                </div>
                <h3 className="text-lg font-bold text-text-primary mb-2">
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
      <section className="px-4 py-20 border-t border-border-custom">
        <div className="max-w-[1100px] mx-auto">
          <h2
            data-aos="fade-up"
            className="text-3xl font-bold text-text-primary text-center mb-12"
          >
            How It Works
          </h2>
          <div className="grid grid-cols-3 gap-8 max-sm:grid-cols-1">
            {[
              {
                step: 1,
                title: "Analyse Form",
                desc: "We scrape match data and filter for games with 60%+ win probability based on recent form.",
              },
              {
                step: 2,
                title: "Verify on SportyBet",
                desc: "Each prediction is cross-referenced against SportyBet Nigeria to confirm availability.",
              },
              {
                step: 3,
                title: "Pick & Win",
                desc: "Browse ranked predictions, check form data, and make informed decisions. Updated daily.",
              },
            ].map((item, i) => (
              <div
                key={item.step}
                data-aos="fade-up"
                data-aos-delay={i * 150}
                className="text-center"
              >
                <div className="w-14 h-14 bg-accent/10 text-accent rounded-2xl flex items-center justify-center text-2xl font-bold mx-auto mb-5 border border-accent/20">
                  {item.step}
                </div>
                <h3 className="font-bold text-text-primary mb-2 text-lg">
                  {item.title}
                </h3>
                <p className="text-sm text-text-secondary leading-relaxed">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Banner */}
      <section className="px-4 py-20 border-t border-border-custom">
        <div
          data-aos="fade-up"
          className="max-w-[1100px] mx-auto text-center bg-gradient-to-br from-bg-card to-bg-card-hover border border-border-custom rounded-2xl py-16 px-8 relative overflow-hidden"
        >
          {/* Background glow */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-accent/10 rounded-full blur-[80px] pointer-events-none" />

          <div className="relative z-10">
            <h2 className="text-4xl font-bold text-text-primary mb-4 max-sm:text-2xl">
              Ready to start winning?
            </h2>
            <p className="text-text-secondary mb-8 max-w-lg mx-auto text-lg">
              Join Pindexa and get instant access to today&apos;s highest-probability
              predictions.
            </p>
            <Link
              href="/signup"
              className="inline-block px-10 py-4 bg-accent text-white font-bold rounded-xl hover:bg-accent/90 transition-all text-lg shadow-[0_0_30px_rgba(59,130,246,0.3)] hover:shadow-[0_0_40px_rgba(59,130,246,0.5)]"
            >
              Create Free Account
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
