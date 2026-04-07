"use client";

import { useState } from "react";
import ProbBadge from "./ProbBadge";
import FormDots from "./FormDots";
import MatchAnalysisPanel from "./MatchAnalysisPanel";

export default function PredictionCard({
  prediction,
  onToggle,
  isSelected,
  liveData,
  voteButtons,
  predictionDate,
}) {
  const [expanded, setExpanded] = useState(false);
  const [showAnalysis, setShowAnalysis] = useState(false);
  const p = prediction;

  const wonPrediction =
    liveData?.status === "FINISHED" &&
    liveData?.winner === p.predicted_winner;

  return (
    <div
      className={`bg-bg-card border rounded-xl transition-all ${
        isSelected
          ? "border-accent ring-1 ring-accent/30"
          : wonPrediction
            ? "border-prob-green/50"
            : "border-border-custom hover:border-accent/40"
      } ${wonPrediction ? "bg-prob-green/5" : ""}`}
    >
      {/* Main row */}
      <div
        className="px-6 py-5 grid grid-cols-[68px_1fr_auto] gap-5 items-center cursor-pointer hover:bg-bg-card-hover/50 transition-colors rounded-xl max-sm:px-4 max-sm:py-4 max-sm:grid-cols-[52px_1fr] max-sm:gap-3"
        onClick={() => setExpanded(!expanded)}
      >
        <ProbBadge probability={p.win_probability} />

        <div className="min-w-0">
          <div className="text-sm text-text-secondary mb-1.5 truncate">
            {p.country} &middot; {p.league}
          </div>
          <div className="text-base font-bold mb-1.5 max-sm:text-sm">
            {p.home_team} vs {p.away_team}
          </div>
          <div className="text-sm text-accent">
            Pick: <strong>{p.predicted_winner}</strong>{" "}
            <span className="text-text-secondary font-normal">
              ({p.predicted_side})
            </span>
          </div>
          <div className="flex gap-5 mt-2 text-sm text-text-secondary">
            <span>Form: {p.winner_form}</span>
            <span>vs {p.opponent_form}</span>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0 max-sm:col-span-full max-sm:flex max-sm:justify-between max-sm:pt-3 max-sm:border-t max-sm:border-border-custom">
          <div className="text-right">
            <div className="flex items-center gap-2 justify-end">
              {liveData && (
                <span
                  className={`text-xs px-2.5 py-1 rounded-lg font-medium ${
                    liveData.status === "IN_PLAY"
                      ? "bg-red-500/15 text-red-400 animate-pulse"
                      : liveData.status === "FINISHED"
                        ? wonPrediction
                          ? "bg-prob-green/15 text-prob-green"
                          : "bg-text-secondary/15 text-text-secondary"
                        : "bg-text-secondary/10 text-text-secondary"
                  }`}
                >
                  {liveData.status === "IN_PLAY"
                    ? `LIVE ${liveData.score}`
                    : liveData.status === "FINISHED"
                      ? `FT ${liveData.score}`
                      : p.kickoff_utc + " UTC"}
                </span>
              )}
              {!liveData && (
                <div className="text-base font-semibold text-text-primary">
                  {p.kickoff_utc} UTC
                </div>
              )}
            </div>
            {!liveData && (
              <div className="text-xs text-text-secondary mt-0.5">
                {predictionDate
                  ? new Date(predictionDate + "T12:00:00").toLocaleDateString("en-GB", { day: "numeric", month: "short" })
                  : "Kickoff"}
              </div>
            )}
          </div>

          {/* Accumulator toggle */}
          {onToggle && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggle(p);
              }}
              className={`w-10 h-10 rounded-full flex items-center justify-center text-base font-bold transition-all cursor-pointer shrink-0 ${
                isSelected
                  ? "bg-accent text-white"
                  : "bg-bg-primary border border-border-custom text-text-secondary hover:border-accent hover:text-accent"
              }`}
              title={isSelected ? "Remove from slip" : "Add to slip"}
            >
              {isSelected ? "✓" : "+"}
            </button>
          )}
        </div>
      </div>

      {/* Expanded section */}
      {expanded && (
        <div className="px-6 pb-5 pt-3 border-t border-border-custom/50 space-y-4 max-sm:px-4">
          <div className="grid grid-cols-2 gap-5 max-sm:grid-cols-1">
            <div>
              <div className="text-sm text-text-secondary mb-2.5 font-medium">
                {p.predicted_winner} Form
              </div>
              <FormDots form={p.winner_form} />
            </div>
            <div>
              <div className="text-sm text-text-secondary mb-2.5 font-medium">
                Opponent Form
              </div>
              <FormDots form={p.opponent_form} />
            </div>
          </div>

          <div className="flex flex-wrap gap-2.5 pt-1">
            <span className="text-xs px-3 py-1.5 rounded-full bg-accent/10 text-accent">
              {p.predicted_side} Win
            </span>
          </div>

          {voteButtons}

          {/* Deep Analysis toggle */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowAnalysis(!showAnalysis);
            }}
            className="w-full py-2.5 text-sm font-medium text-accent border border-accent/30 rounded-lg hover:bg-accent/10 transition-colors cursor-pointer"
          >
            {showAnalysis ? "Hide Market Analysis" : "Deep Market Analysis"}
          </button>

          {showAnalysis && (
            <MatchAnalysisPanel
              homeTeam={p.home_team}
              awayTeam={p.away_team}
              matchDate={null}
            />
          )}
        </div>
      )}
    </div>
  );
}
