import { getPredictions } from "@/lib/predictions";
import PredictionList from "@/components/PredictionList";

export const metadata = {
  title: "Predictions",
};

export default function DashboardPredictionsPage() {
  const data = getPredictions();

  return (
    <div className="max-w-[1100px]">
      <div data-aos="fade-up">
        <h1 className="text-3xl font-bold text-text-primary mb-1">
          Today&apos;s Predictions
        </h1>
        <p className="text-sm text-text-secondary mb-6">
          {data.total_predictions} matches analysed &middot; Ranked by win
          probability
        </p>
      </div>
      <div data-aos="fade-up" data-aos-delay="100">
        <PredictionList data={data} />
      </div>
    </div>
  );
}
