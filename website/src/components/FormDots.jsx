export default function FormDots({ form, label }) {
  const results = form.split("-");

  const colorMap = {
    W: "bg-prob-green",
    D: "bg-prob-yellow",
    L: "bg-prob-orange",
  };

  return (
    <div className="flex items-center gap-2">
      {label && (
        <span className="text-xs text-text-secondary w-10 shrink-0">
          {label}
        </span>
      )}
      <div className="flex gap-1.5">
        {results.map((r, i) => (
          <div key={i} className="flex flex-col items-center gap-0.5">
            <div
              className={`w-5 h-5 rounded-full ${colorMap[r] || "bg-text-secondary"} flex items-center justify-center`}
            >
              <span className="text-[9px] font-bold text-white">{r}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
