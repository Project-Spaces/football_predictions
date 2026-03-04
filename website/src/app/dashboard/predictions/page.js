import { getPredictions } from "@/lib/predictions";
import PredictionList from "@/components/PredictionList";
import BankrollTracker from "@/components/BankrollTracker";
import OddsComparison from "@/components/OddsComparison";

export const metadata = {
  title: "Predictions",
};

export default function DashboardPredictionsPage() {
  const data = getPredictions();

  return (
    <div className="max-w-[1400px]">
      <div data-aos="fade-up">
        <h1 className="text-3xl font-bold text-text-primary mb-1">
          Today&apos;s Predictions
        </h1>
        <p className="text-sm text-text-secondary mb-6">
          {data.total_predictions} matches analysed &middot; Ranked by win
          probability
        </p>
      </div>

      <div className="flex gap-4 max-lg:flex-col">
        {/* Main predictions area */}
        <div className="flex-1 min-w-0" data-aos="fade-up" data-aos-delay="100">
          <PredictionList data={data} />
        </div>

        {/* Sidebar — flush to top right */}
        <div className="w-64 shrink-0 max-lg:w-full" data-aos="fade-up" data-aos-delay="200">
          <div className="sticky top-[80px]">
            <BankrollTracker />
          </div>
        </div>
      </div>

      <div data-aos="fade-up" data-aos-delay="300">
        <OddsComparison />
      </div>
    </div>
  );
}
