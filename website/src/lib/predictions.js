import fs from "fs";
import path from "path";

export function getPredictions() {
  const filePath = path.join(process.cwd(), "public", "data", "predictions.json");

  try {
    const raw = fs.readFileSync(filePath, "utf-8");
    return JSON.parse(raw);
  } catch {
    return {
      generated_at: new Date().toISOString(),
      date: "",
      total_predictions: 0,
      predictions: [],
    };
  }
}
