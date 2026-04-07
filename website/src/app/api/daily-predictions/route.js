import { NextResponse } from "next/server";
import sql, { initDailyPredictionsTable } from "@/lib/db";

// GET /api/daily-predictions?date=YYYY-MM-DD  → all predictions for a date
// GET /api/daily-predictions                  → today's predictions
export async function GET(request) {
  try {
    await initDailyPredictionsTable();

    const { searchParams } = new URL(request.url);
    const dateParam = searchParams.get("date");

    const rows = dateParam
      ? await sql`
          SELECT * FROM daily_predictions
          WHERE match_date = ${dateParam}
          ORDER BY win_probability DESC NULLS LAST
        `
      : await sql`
          SELECT * FROM daily_predictions
          WHERE match_date = CURRENT_DATE
          ORDER BY win_probability DESC NULLS LAST
        `;

    return NextResponse.json({
      status: "ok",
      date: dateParam || new Date().toISOString().slice(0, 10),
      count: rows.length,
      predictions: rows,
    });
  } catch (error) {
    console.error("Daily predictions GET error:", error);
    return NextResponse.json({ error: "Failed to fetch predictions" }, { status: 500 });
  }
}

// POST /api/daily-predictions — bulk upsert (called by batch_analyze_predictions.py)
// Body: { predictions: [{ home_team, away_team, league, country, win_probability }] }
export async function POST(request) {
  try {
    await initDailyPredictionsTable();

    const body = await request.json();
    const { predictions, match_date } = body;

    if (!Array.isArray(predictions) || predictions.length === 0) {
      return NextResponse.json({ error: "predictions array required" }, { status: 400 });
    }

    const date = match_date || new Date().toISOString().slice(0, 10);
    let inserted = 0;

    for (const p of predictions) {
      await sql`
        INSERT INTO daily_predictions
          (match_date, home_team, away_team, league, country, win_probability)
        VALUES
          (${date}, ${p.home_team}, ${p.away_team},
           ${p.league || null}, ${p.country || null},
           ${p.win_probability ?? null})
        ON CONFLICT (home_team, away_team, match_date)
        DO UPDATE SET
          league = EXCLUDED.league,
          country = EXCLUDED.country,
          win_probability = EXCLUDED.win_probability,
          created_at = NOW()
      `;
      inserted++;
    }

    return NextResponse.json({ status: "ok", inserted, date });
  } catch (error) {
    console.error("Daily predictions POST error:", error);
    return NextResponse.json({ error: "Failed to store predictions" }, { status: 500 });
  }
}
