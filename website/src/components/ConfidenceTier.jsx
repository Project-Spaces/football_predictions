"use client";

import { useState } from "react";

const TIER_CONFIG = {
  high: {
    label: "High Confidence",
    border: "border-l-prob-green",
    badge: "bg-prob-green/15 text-prob-green",
    icon: "👑",
  },
  medium: {
    label: "Medium Confidence",
    border: "border-l-prob-yellow",
    badge: "bg-prob-yellow/15 text-prob-yellow",
    icon: "🎯",
  },
  standard: {
    label: "Standard Picks",
    border: "border-l-prob-orange",
    badge: "bg-prob-orange/15 text-prob-orange",
    icon: "📊",
  },
};

export default function ConfidenceTier({ tier, predictions, children }) {
  const [expanded, setExpanded] = useState(true);
  const config = TIER_CONFIG[tier];

  if (!predictions.length) return null;

  const avgProb = (
    predictions.reduce((s, p) => s + p.win_probability, 0) /
    predictions.length
  ).toFixed(1);

  return (
    <div
      className={`border-l-4 ${config.border} rounded-r-xl bg-bg-card/30 mb-8`}
    >
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-6 py-5 cursor-pointer hover:bg-bg-card-hover/30 transition-colors rounded-tr-xl"
      >
        <div className="flex items-center gap-3">
          <span className="text-xl">{config.icon}</span>
          <span className="text-lg font-semibold text-text-primary">
            {config.label}
          </span>
          <span
            className={`text-sm px-3 py-1 rounded-full font-medium ${config.badge}`}
          >
            {predictions.length} picks · avg {avgProb}%
          </span>
        </div>
        <svg
          className={`w-5 h-5 text-text-secondary transition-transform ${expanded ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {expanded && (
        <div className="px-5 pb-5 flex flex-col gap-3 max-sm:px-3">
          {children}
        </div>
      )}
    </div>
  );
}
