import { NextResponse } from "next/server";
import { getLiveResults } from "@/lib/football-api";

export async function GET() {
  try {
    const results = await getLiveResults();
    return NextResponse.json({ results });
  } catch (error) {
    console.error("Live results error:", error);
    return NextResponse.json({ results: [] });
  }
}
