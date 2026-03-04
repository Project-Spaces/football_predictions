export default function ProbBadge({ probability }) {
  let colorClasses;
  if (probability >= 80) {
    colorClasses =
      "border-prob-green/30 bg-prob-green/15 text-prob-green";
  } else if (probability >= 70) {
    colorClasses =
      "border-prob-yellow/30 bg-prob-yellow/15 text-prob-yellow";
  } else {
    colorClasses =
      "border-prob-orange/30 bg-prob-orange/15 text-prob-orange";
  }

  return (
    <div
      className={`w-16 h-16 rounded-full flex items-center justify-center font-bold text-base shrink-0 border-2 max-sm:w-13 max-sm:h-13 max-sm:text-sm ${colorClasses}`}
    >
      {probability}%
    </div>
  );
}
