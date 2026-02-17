export const metadata = {
  title: "About",
};

export default function AboutPage() {
  return (
    <main className="max-w-[960px] mx-auto px-4 w-full flex-1 py-10">
      <h1 className="text-3xl font-bold text-text-primary mb-6">
        About Maigation & Winning
      </h1>

      <div className="space-y-6 text-text-secondary text-[15px] leading-relaxed">
        <p>
          Maigation & Winning is a football predictions platform that saves
          bettors hours of manual research. We use data-driven analysis to
          identify high-probability match outcomes across 20+ countries and
          leagues worldwide.
        </p>

        <h2 className="text-xl font-semibold text-text-primary pt-2">
          Our Methodology
        </h2>
        <p>
          Every day, we analyse recent form data from SoccerVista — looking at
          the last 5 matches for each team, win/draw/loss records, and
          historical patterns. We filter for matches where one team has a 60% or
          higher win probability.
        </p>
        <p>
          These predictions are then cross-referenced against SportyBet Nigeria
          to verify that each match is actually available for betting. Matches
          that pass both checks are ranked by win probability and published here.
        </p>

        <h2 className="text-xl font-semibold text-text-primary pt-2">
          Match Types
        </h2>
        <div className="space-y-3">
          <div className="bg-bg-card border border-border-custom rounded-lg p-4">
            <span className="inline-block text-[11px] px-2 py-0.5 rounded bg-prob-green/15 text-prob-green mb-2">
              Verified
            </span>
            <p className="text-sm">
              Both the league and team names have been confirmed on SportyBet.
              You can find and bet on this match directly.
            </p>
          </div>
          <div className="bg-bg-card border border-border-custom rounded-lg p-4">
            <span className="inline-block text-[11px] px-2 py-0.5 rounded bg-prob-yellow/10 text-prob-yellow mb-2">
              League Match
            </span>
            <p className="text-sm">
              The league is confirmed on SportyBet, but team names may differ
              slightly. Search for the league on SportyBet and look for the
              matching fixture.
            </p>
          </div>
        </div>

        <h2 className="text-xl font-semibold text-text-primary pt-2">
          Responsible Gambling
        </h2>
        <p>
          Our predictions are for informational purposes only. Past performance
          does not guarantee future results. Always gamble responsibly and never
          bet more than you can afford to lose. You must be 18 or older to use
          betting services.
        </p>
      </div>
    </main>
  );
}
