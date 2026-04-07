"use client";

import { useEffect, useState } from "react";


function ProbBadge({ prob }) {
  if (prob == null) return null;
  const color =
    prob >= 75 ? "text-prob-green" : prob >= 65 ? "text-prob-mid" : "text-prob-low";
  return <span className={`font-bold text-sm ${color}`}>{prob}%</span>;
}

export default function DailyPredictionsSection() {
  const [predictions, setPredictions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [date, setDate] = useState("");
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    fetch("/api/daily-predictions")
      .then((r) => r.json())
      .then((data) => {
        if (data.predictions) {
          setPredictions(data.predictions);
          setDate(data.date || "");
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return null;
  if (predictions.length === 0) return null;

  const visible = expanded ? predictions : predictions.slice(0, 8);

  return (
    <div className="mt-12" data-aos="fade-up" data-aos-delay="400">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div>
          <h2 className="text-2xl font-bold text-text-primary max-sm:text-xl">
            Today&apos;s Predictions
          </h2>
          <p className="text-text-secondary text-sm mt-1">
            {predictions.length} matches · {date}
          </p>
        </div>
        <a
          href="/dashboard/predictions"
          className="text-sm text-accent hover:underline"
        >
          Full list →
        </a>
      </div>

      <div className="flex flex-col gap-2">
        {visible.map((p, i) => (
          <div
            key={`${p.home_team}-${p.away_team}`}
            className="bg-bg-card border border-border-custom rounded-xl px-5 py-4 flex items-center justify-between gap-4 hover:border-accent/30 transition-all"
          >
            <div className="flex items-center gap-3 min-w-0">
              <span className="text-text-secondary text-sm w-5 shrink-0">
                {i + 1}
              </span>
              <div className="min-w-0">
                <div className="text-text-primary font-medium text-sm truncate">
                  {p.home_team}{" "}
                  <span className="text-text-secondary font-normal">vs</span>{" "}
                  {p.away_team}
                </div>
                <div className="text-text-secondary text-xs mt-0.5 truncate">
                  {p.country && `${p.country} · `}
                  {p.league}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <ProbBadge prob={p.win_probability} />
            </div>
          </div>
        ))}
      </div>

      {predictions.length > 8 && (
        <button
          onClick={() => setExpanded((e) => !e)}
          className="mt-4 text-sm text-text-secondary hover:text-text-primary transition-colors w-full text-center py-2"
        >
          {expanded
            ? "Show less"
            : `Show all ${predictions.length} predictions`}
        </button>
      )}
    </div>
  );
}
