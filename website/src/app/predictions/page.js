import fs from "fs";
import path from "path";
import PredictionList from "@/components/PredictionList";

export const metadata = {
  title: "Predictions",
};

export default function PredictionsPage() {
  const filePath = path.join(process.cwd(), "public", "data", "predictions.json");

  let data;
  try {
    const raw = fs.readFileSync(filePath, "utf-8");
    data = JSON.parse(raw);
  } catch {
    data = { generated_at: new Date().toISOString(), date: "", total_predictions: 0, predictions: [] };
  }

  return (
    <main className="max-w-[960px] mx-auto px-4 w-full flex-1">
      <h1 className="text-2xl font-bold text-text-primary mt-6 mb-2">
        Today&apos;s Predictions
      </h1>
      <p className="text-sm text-text-secondary mb-4">
        {data.total_predictions} matches analysed &middot; Ranked by win probability
      </p>
      <PredictionList data={data} />
    </main>
  );
}
