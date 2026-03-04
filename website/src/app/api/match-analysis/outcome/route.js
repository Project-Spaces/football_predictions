import { NextResponse } from "next/server";
import sql, { initGameOutcomesTable, initMarketOutcomesTable } from "@/lib/db";

// POST /api/match-analysis/outcome — record actual game result + evaluate market hits
export async function POST(request) {
  try {
    await initGameOutcomesTable();
    await initMarketOutcomesTable();

    const body = await request.json();
    const {
      home_team,
      away_team,
      match_date,
      league,
      home_goals,
      away_goals,
      total_corners,
      total_cards,
    } = body;

    if (!home_team || !away_team || !match_date || home_goals == null || away_goals == null) {
      return NextResponse.json(
        { error: "Missing required fields: home_team, away_team, match_date, home_goals, away_goals" },
        { status: 400 }
      );
    }

    // Derive computed fields
    const btts = home_goals > 0 && away_goals > 0;
    let result;
    if (home_goals > away_goals) result = "home";
    else if (away_goals > home_goals) result = "away";
    else result = "draw";

    // Upsert game outcome
    const outcomeRows = await sql`
      INSERT INTO game_outcomes (
        home_team, away_team, match_date, league,
        home_goals, away_goals, total_corners, total_cards, btts, result
      ) VALUES (
        ${home_team}, ${away_team}, ${match_date}, ${league || null},
        ${home_goals}, ${away_goals}, ${total_corners || null}, ${total_cards || null},
        ${btts}, ${result}
      )
      ON CONFLICT (home_team, away_team, match_date)
      DO UPDATE SET
        home_goals = EXCLUDED.home_goals,
        away_goals = EXCLUDED.away_goals,
        total_corners = EXCLUDED.total_corners,
        total_cards = EXCLUDED.total_cards,
        btts = EXCLUDED.btts,
        result = EXCLUDED.result
      RETURNING id
    `;
    const outcomeId = outcomeRows[0].id;

    // Load analysis for this game (if exists) to evaluate market hits
    const analysisRows = await sql`
      SELECT analysis_json FROM game_analyses
      WHERE LOWER(home_team) = LOWER(${home_team})
        AND LOWER(away_team) = LOWER(${away_team})
      ORDER BY created_at DESC
      LIMIT 1
    `;

    let marketsHit = 0;
    let marketsTotal = 0;

    if (analysisRows.length > 0) {
      const analysis = analysisRows[0].analysis_json;
      const markets = analysis?.markets || [];

      // Delete existing market_outcomes for this game (idempotent re-recording)
      await sql`
        DELETE FROM market_outcomes WHERE game_outcome_id = ${outcomeId}
      `;

      // Evaluate each market against actual result
      const marketRows = [];
      for (const market of markets) {
        if (market.confidence_tier === "insufficient_data") continue;

        const actual = evaluateMarket(market.market_name, {
          home_goals,
          away_goals,
          total_corners: total_corners || null,
          total_cards: total_cards || null,
          result,
          btts,
        });

        if (actual === null) continue; // Can't evaluate (missing data)

        const hit = market.combined_hit_rate >= 55
          ? actual === true
          : actual === false; // Low-confidence markets: opposite is our pick

        marketRows.push({
          game_outcome_id: outcomeId,
          market_name: market.market_name,
          recommendation: market.label,
          actual_value: String(actual),
          hit,
          confidence_at_time: market.combined_hit_rate,
        });

        if (hit) marketsHit++;
        marketsTotal++;
      }

      // Bulk insert
      for (const row of marketRows) {
        await sql`
          INSERT INTO market_outcomes (
            game_outcome_id, market_name, recommendation, actual_value, hit, confidence_at_time
          ) VALUES (
            ${row.game_outcome_id}, ${row.market_name}, ${row.recommendation},
            ${row.actual_value}, ${row.hit}, ${row.confidence_at_time}
          )
        `;
      }
    }

    return NextResponse.json({
      status: "ok",
      outcome_id: outcomeId,
      result,
      btts,
      markets_evaluated: marketsTotal,
      markets_hit: marketsHit,
      hit_rate: marketsTotal > 0 ? Math.round((marketsHit / marketsTotal) * 100) : null,
    });
  } catch (error) {
    console.error("Outcome POST error:", error);
    return NextResponse.json({ error: "Failed to record outcome" }, { status: 500 });
  }
}

function evaluateMarket(marketName, actual) {
  const { home_goals, away_goals, total_corners, total_cards, result, btts } = actual;
  const totalGoals = home_goals + away_goals;
  const goalDiff = home_goals - away_goals;

  const map = {
    "over_0.5": totalGoals > 0,
    "over_1.5": totalGoals > 1,
    "over_2.5": totalGoals > 2,
    "over_3.5": totalGoals > 3,
    "under_0.5": totalGoals < 1,
    "under_1.5": totalGoals < 2,
    "under_2.5": totalGoals < 3,
    "under_3.5": totalGoals < 4,
    "btts_yes": btts,
    "btts_no": !btts,
    "home_win": result === "home",
    "draw": result === "draw",
    "away_win": result === "away",
    "dc_1x": result === "home" || result === "draw",
    "dc_x2": result === "away" || result === "draw",
    "dc_12": result === "home" || result === "away",
    "handicap_home_-1.5": goalDiff > 1,
    "handicap_home_-1.0": goalDiff > 0,
    "handicap_home_-0.5": goalDiff > 0,
    "handicap_home_+0.5": goalDiff >= 0,
    "handicap_home_+1.0": goalDiff >= -1,
    "handicap_home_+1.5": goalDiff > -2,
    "home_win_to_nil": result === "home" && away_goals === 0,
    "away_win_to_nil": result === "away" && home_goals === 0,
    "home_clean_sheet": away_goals === 0,
    "away_clean_sheet": home_goals === 0,
  };

  // Corner markets (need corner data)
  if (total_corners !== null) {
    map["corners_over_8.5"] = total_corners > 8;
    map["corners_over_9.5"] = total_corners > 9;
    map["corners_over_10.5"] = total_corners > 10;
    map["corners_under_8.5"] = total_corners < 9;
    map["corners_under_9.5"] = total_corners < 10;
    map["corners_under_10.5"] = total_corners < 11;
  }

  // Card markets (need card data)
  if (total_cards !== null) {
    map["cards_over_2.5"] = total_cards > 2;
    map["cards_over_3.5"] = total_cards > 3;
    map["cards_under_2.5"] = total_cards < 3;
    map["cards_under_3.5"] = total_cards < 4;
  }

  const val = map[marketName];
  return val !== undefined ? val : null;
}
