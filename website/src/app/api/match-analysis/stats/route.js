import { NextResponse } from "next/server";
import sql, { initMarketOutcomesTable, initGameOutcomesTable } from "@/lib/db";

// GET /api/match-analysis/stats?days=7&limit=15
// Returns aggregated market hit rates over the last N days.
export async function GET(request) {
  try {
    await initMarketOutcomesTable();
    await initGameOutcomesTable();

    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get("days") || "7", 10);
    const limit = parseInt(searchParams.get("limit") || "15", 10);

    const rows = await sql`
      SELECT
        market_name,
        COUNT(*)::int AS total,
        SUM(hit::int)::int AS hits,
        ROUND(100.0 * SUM(hit::int) / COUNT(*), 1) AS hit_rate
      FROM market_outcomes
      WHERE created_at > NOW() - (${days} || ' days')::interval
      GROUP BY market_name
      HAVING COUNT(*) >= 3
      ORDER BY hit_rate DESC
      LIMIT ${limit}
    `;

    // Also fetch total games recorded in period
    const summary = await sql`
      SELECT COUNT(*)::int AS total_games
      FROM game_outcomes
      WHERE created_at > NOW() - (${days} || ' days')::interval
    `;

    return NextResponse.json({
      status: "ok",
      days,
      total_games: summary[0]?.total_games ?? 0,
      markets: rows.map((r) => ({
        market_name: r.market_name,
        total: r.total,
        hits: r.hits,
        hit_rate: parseFloat(r.hit_rate),
      })),
    });
  } catch (error) {
    console.error("Market stats GET error:", error);
    return NextResponse.json({ error: "Failed to fetch market stats" }, { status: 500 });
  }
}
