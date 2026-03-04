import { NextResponse } from "next/server";
import sql, { initGameAnalysesTable, initGameOutcomesTable, initMarketOutcomesTable } from "@/lib/db";

async function initTables() {
  await initGameAnalysesTable();
  await initGameOutcomesTable();
  await initMarketOutcomesTable();
}

// GET /api/match-analysis?home=Brighton&away=Arsenal       → single analysis (most recent)
// GET /api/match-analysis?home=Brighton&away=Arsenal&date=2026-03-15 → specific date
// GET /api/match-analysis?date=2026-03-15                 → all analyses for a date (for batch_record_outcomes)
export async function GET(request) {
  try {
    await initTables();

    const { searchParams } = new URL(request.url);
    const home = searchParams.get("home");
    const away = searchParams.get("away");
    const matchDate = searchParams.get("date");

    // List all analyses for a date (used by batch_record_outcomes.py)
    if (!home && !away && matchDate) {
      const rows = await sql`
        SELECT id, home_team, away_team, match_date, league, season,
               analysis_json->>'home_team_id' AS home_team_id,
               created_at
        FROM game_analyses
        WHERE match_date = ${matchDate}
        ORDER BY created_at DESC
      `;
      return NextResponse.json({
        status: "ok",
        date: matchDate,
        analyses: rows.map((r) => ({
          id: r.id,
          home_team: r.home_team,
          away_team: r.away_team,
          match_date: r.match_date,
          league: r.league,
          season: r.season,
          home_team_id: r.home_team_id ? Number(r.home_team_id) : null,
        })),
      });
    }

    if (!home || !away) {
      return NextResponse.json(
        { error: "Provide home+away for single analysis, or date for listing all analyses that day." },
        { status: 400 }
      );
    }

    // Single analysis lookup
    let rows;
    if (matchDate) {
      rows = await sql`
        SELECT * FROM game_analyses
        WHERE LOWER(home_team) = LOWER(${home})
          AND LOWER(away_team) = LOWER(${away})
          AND match_date = ${matchDate}
        ORDER BY created_at DESC
        LIMIT 1
      `;
    } else {
      rows = await sql`
        SELECT * FROM game_analyses
        WHERE LOWER(home_team) = LOWER(${home})
          AND LOWER(away_team) = LOWER(${away})
        ORDER BY created_at DESC
        LIMIT 1
      `;
    }

    if (rows.length === 0) {
      return NextResponse.json(
        {
          status: "not_cached",
          message: "No analysis found. Run batch_analyze_predictions.py to generate market analysis.",
        },
        { status: 202 }
      );
    }

    const row = rows[0];
    return NextResponse.json({
      status: "ok",
      id: row.id,
      home_team: row.home_team,
      away_team: row.away_team,
      match_date: row.match_date,
      league: row.league,
      season: row.season,
      created_at: row.created_at,
      analysis: row.analysis_json,
    });
  } catch (error) {
    console.error("Match analysis GET error:", error);
    return NextResponse.json({ error: "Failed to fetch analysis" }, { status: 500 });
  }
}

// POST /api/match-analysis — store a pre-computed analysis (called by batch_analyze_predictions.py)
export async function POST(request) {
  try {
    await initTables();

    const body = await request.json();
    const { home_team, away_team, match_date, league, season, analysis_json } = body;

    if (!home_team || !away_team || !analysis_json) {
      return NextResponse.json({ error: "Missing required fields: home_team, away_team, analysis_json" }, { status: 400 });
    }

    const rows = await sql`
      INSERT INTO game_analyses (home_team, away_team, match_date, league, season, analysis_json)
      VALUES (
        ${home_team},
        ${away_team},
        ${match_date || null},
        ${league || null},
        ${season || null},
        ${JSON.stringify(analysis_json)}
      )
      ON CONFLICT (home_team, away_team, match_date)
      DO UPDATE SET
        league = EXCLUDED.league,
        season = EXCLUDED.season,
        analysis_json = EXCLUDED.analysis_json,
        created_at = NOW()
      RETURNING id
    `;

    return NextResponse.json({ status: "ok", id: rows[0].id });
  } catch (error) {
    console.error("Match analysis POST error:", error);
    return NextResponse.json({ error: "Failed to store analysis" }, { status: 500 });
  }
}
