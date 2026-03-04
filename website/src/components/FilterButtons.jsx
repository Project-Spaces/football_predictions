"use client";

const COUNT_FILTERS = [
  { label: "Top 5", value: 5 },
  { label: "Top 10", value: 10 },
  { label: "Top 20", value: 20 },
  { label: "All", value: "all" },
];

const TIME_FILTERS = [
  { label: "Any Time", value: "all" },
  { label: "Morning", value: "morning" },
  { label: "Afternoon", value: "afternoon" },
  { label: "Evening", value: "evening" },
];

export default function FilterButtons({
  activeFilter,
  onFilterChange,
  countries = [],
  leagues = [],
  selectedCountry,
  onCountryChange,
  selectedLeague,
  onLeagueChange,
  selectedTime,
  onTimeChange,
  viewMode,
  onViewModeChange,
}) {
  return (
    <div className="flex flex-col gap-3 w-full">
      {/* Row 1: Count filters + View toggle */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex gap-2">
          {COUNT_FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => onFilterChange(f.value)}
              className={`px-4 py-2 border rounded-lg text-sm cursor-pointer transition-all max-sm:px-3 max-sm:py-1.5 max-sm:text-[13px] ${
                activeFilter === f.value
                  ? "bg-accent border-accent text-white"
                  : "bg-bg-card border-border-custom text-text-secondary hover:border-accent hover:text-text-primary"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {onViewModeChange && (
          <div className="flex gap-1 bg-bg-card border border-border-custom rounded-lg p-0.5">
            <button
              onClick={() => onViewModeChange("list")}
              className={`px-3 py-1.5 text-xs rounded-md cursor-pointer transition-colors ${
                viewMode === "list"
                  ? "bg-accent text-white"
                  : "text-text-secondary hover:text-text-primary"
              }`}
            >
              List
            </button>
            <button
              onClick={() => onViewModeChange("grouped")}
              className={`px-3 py-1.5 text-xs rounded-md cursor-pointer transition-colors ${
                viewMode === "grouped"
                  ? "bg-accent text-white"
                  : "text-text-secondary hover:text-text-primary"
              }`}
            >
              Grouped
            </button>
          </div>
        )}
      </div>

      {/* Row 2: Dropdowns */}
      {(countries.length > 0 || leagues.length > 0) && (
        <div className="flex gap-2 flex-wrap">
          {countries.length > 0 && (
            <select
              value={selectedCountry || "all"}
              onChange={(e) => onCountryChange?.(e.target.value)}
              className="px-3 py-2 text-sm bg-bg-card border border-border-custom rounded-lg text-text-primary cursor-pointer max-sm:text-[13px] max-w-[160px]"
            >
              <option value="all">All Countries</option>
              {countries.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          )}

          {leagues.length > 0 && (
            <select
              value={selectedLeague || "all"}
              onChange={(e) => onLeagueChange?.(e.target.value)}
              className="px-3 py-2 text-sm bg-bg-card border border-border-custom rounded-lg text-text-primary cursor-pointer max-sm:text-[13px] max-w-[200px]"
            >
              <option value="all">All Leagues</option>
              {leagues.map((l) => (
                <option key={l} value={l}>
                  {l}
                </option>
              ))}
            </select>
          )}

          <select
            value={selectedTime || "all"}
            onChange={(e) => onTimeChange?.(e.target.value)}
            className="px-3 py-2 text-sm bg-bg-card border border-border-custom rounded-lg text-text-primary cursor-pointer max-sm:text-[13px]"
          >
            {TIME_FILTERS.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
}
