"use client";

import { useState } from "react";

export default function AccumulatorBar({ picks, onClear }) {
  const [copied, setCopied] = useState(false);

  if (!picks.length) return null;

  const combinedProb = picks.reduce(
    (acc, p) => acc * (p.win_probability / 100),
    1
  );
  const combinedPct = (combinedProb * 100).toFixed(2);

  const handleCopy = async () => {
    const lines = picks.map(
      (p, i) =>
        `${i + 1}. ${p.predicted_winner} (${p.predicted_side}) — ${p.home_team} vs ${p.away_team} [${p.win_probability}%]`
    );
    const text = `🎯 Maigation Accumulator (${picks.length} picks)\n${"─".repeat(40)}\n${lines.join("\n")}\n${"─".repeat(40)}\nCombined Probability: ${combinedPct}%`;

    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
    }
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-bg-card border-t border-border-custom shadow-[0_-4px_20px_rgba(0,0,0,0.3)] animate-slide-up">
      <div className="max-w-[1100px] mx-auto px-5 py-3.5 flex items-center justify-between gap-4 max-sm:flex-col max-sm:gap-3">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-accent font-bold text-lg">
              {picks.length}
            </span>
            <span className="text-sm text-text-secondary">
              {picks.length === 1 ? "pick" : "picks"} selected
            </span>
          </div>
          <div className="h-5 w-px bg-border-custom max-sm:hidden" />
          <div className="flex items-center gap-2">
            <span className="text-xs text-text-secondary">Combined:</span>
            <span
              className={`text-sm font-bold ${parseFloat(combinedPct) >= 30 ? "text-prob-green" : parseFloat(combinedPct) >= 10 ? "text-prob-yellow" : "text-prob-orange"}`}
            >
              {combinedPct}%
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={onClear}
            className="px-4 py-2 text-sm text-text-secondary hover:text-text-primary border border-border-custom rounded-lg transition-colors cursor-pointer"
          >
            Clear All
          </button>
          <button
            onClick={handleCopy}
            className="px-5 py-2 text-sm font-medium bg-accent text-white rounded-lg hover:bg-accent/90 transition-colors cursor-pointer"
          >
            {copied ? "Copied!" : "Copy Slip"}
          </button>
        </div>
      </div>
    </div>
  );
}
