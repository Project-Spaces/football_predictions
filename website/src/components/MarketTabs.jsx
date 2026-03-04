"use client";

const MARKETS = [
  { key: "winner", label: "Match Winner" },
  { key: "overunder", label: "Over/Under" },
  { key: "btts", label: "BTTS" },
  { key: "doublechance", label: "Double Chance" },
];

export default function MarketTabs({ active, onChange }) {
  return (
    <div className="flex gap-1 overflow-x-auto pb-1 -mx-1 px-1">
      {MARKETS.map((m) => (
        <button
          key={m.key}
          onClick={() => onChange(m.key)}
          className={`px-4 py-2.5 text-sm font-medium rounded-lg whitespace-nowrap cursor-pointer transition-all ${
            active === m.key
              ? "bg-accent text-white"
              : "text-text-secondary hover:text-text-primary hover:bg-bg-card"
          }`}
        >
          {m.label}
        </button>
      ))}
    </div>
  );
}
