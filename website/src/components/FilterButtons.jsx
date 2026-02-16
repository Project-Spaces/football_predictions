"use client";

const FILTERS = [
  { label: "Top 5", value: 5 },
  { label: "Top 10", value: 10 },
  { label: "Top 20", value: 20 },
  { label: "All", value: "all" },
];

export default function FilterButtons({ activeFilter, onFilterChange }) {
  return (
    <div className="flex gap-2">
      {FILTERS.map((f) => (
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
  );
}
