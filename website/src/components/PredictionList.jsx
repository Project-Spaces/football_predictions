"use client";

import { useState } from "react";
import FilterButtons from "./FilterButtons";
import PredictionCard from "./PredictionCard";

export default function PredictionList({ data }) {
  const [activeFilter, setActiveFilter] = useState(10);

  const predictions = data.predictions;
  const filtered =
    activeFilter === "all" ? predictions : predictions.slice(0, activeFilter);

  const updatedDate = new Date(data.generated_at).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <>
      <div className="py-4 flex justify-between items-center flex-wrap gap-3 max-sm:flex-col max-sm:items-start">
        <FilterButtons
          activeFilter={activeFilter}
          onFilterChange={setActiveFilter}
        />
        <div className="flex gap-4 text-[13px] text-text-secondary">
          <span>Updated: {updatedDate}</span>
          <span>
            Showing {filtered.length} of {predictions.length}
          </span>
        </div>
      </div>

      <div className="flex flex-col gap-2.5 pb-8">
        {filtered.length === 0 ? (
          <div className="text-center py-12 text-text-secondary">
            No predictions available.
          </div>
        ) : (
          filtered.map((p) => <PredictionCard key={p.rank} prediction={p} />)
        )}
      </div>
    </>
  );
}
