import fs from "fs";
import path from "path";
import PredictionList from "@/components/PredictionList";

export default function Home() {
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
      <PredictionList data={data} />
    </main>
  );
}
