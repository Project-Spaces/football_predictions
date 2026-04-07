"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import FilterButtons from "./FilterButtons";
import PredictionCard from "./PredictionCard";
import ConfidenceTier from "./ConfidenceTier";
import AccumulatorBar from "./AccumulatorBar";
import MarketTabs from "./MarketTabs";
import MarketCard from "./MarketCard";

function getTimeSlot(kickoff) {
  const hour = parseInt(kickoff.split(":")[0], 10);
  if (hour < 12) return "morning";
  if (hour < 17) return "afternoon";
  return "evening";
}

export default function PredictionList({ data }) {
  const [activeFilter, setActiveFilter] = useState("all");
  const [viewMode, setViewMode] = useState("grouped");
  const [selectedCountry, setSelectedCountry] = useState("all");
  const [selectedLeague, setSelectedLeague] = useState("all");
  const [selectedTime, setSelectedTime] = useState("all");
  const [selectedPicks, setSelectedPicks] = useState([]);
  const [activeMarket, setActiveMarket] = useState("winner");
  const [liveResults, setLiveResults] = useState(null);

  const predictions = data.predictions;

  // Extract unique countries and leagues for dropdowns
  const countries = useMemo(
    () => [...new Set(predictions.map((p) => p.country))].sort(),
    [predictions]
  );
  const leagues = useMemo(
    () => [...new Set(predictions.map((p) => p.league))].sort(),
    [predictions]
  );

  // Apply all filters
  const filtered = useMemo(() => {
    let result = predictions;

    if (selectedCountry !== "all") {
      result = result.filter((p) => p.country === selectedCountry);
    }
    if (selectedLeague !== "all") {
      result = result.filter((p) => p.league === selectedLeague);
    }
    if (selectedTime !== "all") {
      result = result.filter((p) => getTimeSlot(p.kickoff_utc) === selectedTime);
    }
    if (activeFilter !== "all") {
      result = result.slice(0, activeFilter);
    }

    return result;
  }, [predictions, selectedCountry, selectedLeague, selectedTime, activeFilter]);

  // Group by confidence tier
  const grouped = useMemo(() => {
    const high = filtered.filter((p) => p.win_probability >= 80);
    const medium = filtered.filter(
      (p) => p.win_probability >= 70 && p.win_probability < 80
    );
    const standard = filtered.filter((p) => p.win_probability < 70);
    return { high, medium, standard };
  }, [filtered]);

  // Accumulator handlers
  const togglePick = useCallback((prediction) => {
    setSelectedPicks((prev) => {
      const exists = prev.find((p) => p.rank === prediction.rank);
      if (exists) return prev.filter((p) => p.rank !== prediction.rank);
      return [...prev, prediction];
    });
  }, []);

  const clearPicks = useCallback(() => setSelectedPicks([]), []);

  const isSelected = useCallback(
    (rank) => selectedPicks.some((p) => p.rank === rank),
    [selectedPicks]
  );

  // Live results polling
  useEffect(() => {
    let interval;
    async function fetchLive() {
      try {
        const res = await fetch("/api/live-results");
        if (res.ok) {
          const data = await res.json();
          setLiveResults(data.results);
        }
      } catch {
        // Silently fail — live data is optional
      }
    }
    fetchLive();
    interval = setInterval(fetchLive, 60000);
    return () => clearInterval(interval);
  }, []);

  const getLiveData = useCallback(
    (prediction) => {
      if (!liveResults) return null;
      return liveResults.find(
        (r) =>
          r.homeTeam === prediction.home_team ||
          r.awayTeam === prediction.away_team
      );
    },
    [liveResults]
  );

  const updatedDate = new Date(data.generated_at).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const renderCard = (p) => (
    <PredictionCard
      key={p.rank}
      prediction={p}
      onToggle={togglePick}
      isSelected={isSelected(p.rank)}
      liveData={getLiveData(p)}
      predictionDate={data.date}
    />
  );

  const renderMarketCard = (p) => (
    <MarketCard key={p.rank} prediction={p} market={activeMarket} />
  );

  const isMarketView = activeMarket !== "winner";

  return (
    <>
      {/* Market tabs */}
      <MarketTabs active={activeMarket} onChange={setActiveMarket} />

      {/* Filters */}
      <div className="py-4 flex flex-col gap-3">
        <FilterButtons
          activeFilter={activeFilter}
          onFilterChange={setActiveFilter}
          countries={countries}
          leagues={leagues}
          selectedCountry={selectedCountry}
          onCountryChange={setSelectedCountry}
          selectedLeague={selectedLeague}
          onLeagueChange={setSelectedLeague}
          selectedTime={selectedTime}
          onTimeChange={setSelectedTime}
          viewMode={viewMode}
          onViewModeChange={!isMarketView ? setViewMode : undefined}
        />
        <div className="flex gap-4 text-[13px] text-text-secondary">
          <span>Updated: {updatedDate}</span>
          <span>
            Showing {filtered.length} of {predictions.length}
          </span>
        </div>
      </div>

      {/* Predictions */}
      <div className={`pb-8 ${selectedPicks.length > 0 ? "pb-24" : ""}`}>
        {filtered.length === 0 ? (
          <div className="text-center py-12 text-text-secondary">
            No predictions match your filters.
          </div>
        ) : isMarketView ? (
          <div className="flex flex-col gap-2.5">
            {filtered.map(renderMarketCard)}
          </div>
        ) : viewMode === "grouped" ? (
          <>
            <ConfidenceTier tier="high" predictions={grouped.high}>
              {grouped.high.map(renderCard)}
            </ConfidenceTier>
            <ConfidenceTier tier="medium" predictions={grouped.medium}>
              {grouped.medium.map(renderCard)}
            </ConfidenceTier>
            <ConfidenceTier tier="standard" predictions={grouped.standard}>
              {grouped.standard.map(renderCard)}
            </ConfidenceTier>
          </>
        ) : (
          <div className="flex flex-col gap-2.5">
            {filtered.map(renderCard)}
          </div>
        )}
      </div>

      {/* Accumulator bar */}
      <AccumulatorBar picks={selectedPicks} onClear={clearPicks} />
    </>
  );
}
