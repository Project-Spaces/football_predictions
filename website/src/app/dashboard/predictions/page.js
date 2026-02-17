import { getPredictions } from "@/lib/predictions";
import PredictionList from "@/components/PredictionList";

export const metadata = {
  title: "Predictions",
};

export default function DashboardPredictionsPage() {
  const data = getPredictions();

  return (
    <div className="max-w-[800px]">
      <h1 className="text-2xl font-bold text-text-primary mb-1">
        Today&apos;s Predictions
      </h1>
      <p className="text-sm text-text-secondary mb-4">
        {data.total_predictions} matches analysed &middot; Ranked by win
        probability
      </p>
      <PredictionList data={data} />
    </div>
  );
}
