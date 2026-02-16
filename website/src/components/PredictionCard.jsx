import ProbBadge from "./ProbBadge";

export default function PredictionCard({ prediction }) {
  const p = prediction;

  return (
    <div className="bg-bg-card border border-border-custom rounded-[10px] p-4 grid grid-cols-[60px_1fr_auto] gap-3.5 items-center hover:bg-bg-card-hover transition-colors max-sm:grid-cols-[48px_1fr] max-sm:gap-2.5">
      <ProbBadge probability={p.win_probability} />

      <div className="min-w-0">
        <div className="text-xs text-text-secondary mb-1 truncate">
          {p.country} &middot; {p.league}
        </div>
        <div className="text-[15px] font-semibold mb-1 max-sm:text-sm">
          {p.home_team} vs {p.away_team}
        </div>
        <div className="text-[13px] text-accent">
          Pick: <strong>{p.predicted_winner}</strong>{" "}
          <span className="text-text-secondary font-normal">
            ({p.predicted_side})
          </span>
        </div>
        <div className="flex gap-4 mt-1.5 text-xs text-text-secondary">
          <span>Form: {p.winner_form}</span>
          <span>vs {p.opponent_form}</span>
        </div>
      </div>

      <div className="text-right shrink-0 max-sm:col-span-full max-sm:flex max-sm:justify-between max-sm:items-center max-sm:text-left max-sm:pt-2 max-sm:border-t max-sm:border-border-custom">
        <div>
          <div className="text-sm font-semibold text-text-primary mb-1">
            {p.kickoff_utc} UTC
          </div>
          <div className="text-[11px] text-text-secondary">Kickoff</div>
        </div>
        <span
          className={`inline-block text-[11px] px-2 py-0.5 rounded mt-1.5 ${
            p.verified
              ? "bg-prob-green/15 text-prob-green"
              : "bg-prob-yellow/10 text-prob-yellow"
          }`}
        >
          {p.verified ? "Verified" : "League Match"}
        </span>
      </div>
    </div>
  );
}
