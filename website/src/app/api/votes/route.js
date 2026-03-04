import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import sql, { initVotesTable } from "@/lib/db";

export async function GET(request) {
  try {
    await initVotesTable();

    const { searchParams } = new URL(request.url);
    const date = searchParams.get("date") || new Date().toISOString().split("T")[0];

    const votes = await sql`
      SELECT prediction_rank,
        COUNT(*) FILTER (WHERE vote = 'up') AS upvotes,
        COUNT(*) FILTER (WHERE vote = 'down') AS downvotes
      FROM prediction_votes
      WHERE prediction_date = ${date}
      GROUP BY prediction_rank
    `;

    // Get current user's votes if authenticated
    const session = await auth();
    let userVotes = [];
    if (session?.user?.email) {
      const users = await sql`SELECT id FROM users WHERE email = ${session.user.email}`;
      if (users.length > 0) {
        userVotes = await sql`
          SELECT prediction_rank, vote
          FROM prediction_votes
          WHERE user_id = ${users[0].id} AND prediction_date = ${date}
        `;
      }
    }

    return NextResponse.json({ votes, userVotes });
  } catch (error) {
    console.error("Votes GET error:", error);
    return NextResponse.json({ votes: [], userVotes: [] });
  }
}

export async function POST(request) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Sign in to vote" }, { status: 401 });
    }

    await initVotesTable();

    const { predictionRank, vote } = await request.json();
    if (!predictionRank || !["up", "down"].includes(vote)) {
      return NextResponse.json({ error: "Invalid vote" }, { status: 400 });
    }

    const users = await sql`SELECT id FROM users WHERE email = ${session.user.email}`;
    if (users.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    const userId = users[0].id;
    const today = new Date().toISOString().split("T")[0];

    // Upsert: update vote if exists, insert if not
    const existing = await sql`
      SELECT id, vote FROM prediction_votes
      WHERE user_id = ${userId} AND prediction_rank = ${predictionRank} AND prediction_date = ${today}
    `;

    if (existing.length > 0) {
      if (existing[0].vote === vote) {
        // Same vote — remove it (toggle off)
        await sql`DELETE FROM prediction_votes WHERE id = ${existing[0].id}`;
        return NextResponse.json({ action: "removed" });
      } else {
        // Different vote — update
        await sql`UPDATE prediction_votes SET vote = ${vote} WHERE id = ${existing[0].id}`;
        return NextResponse.json({ action: "updated" });
      }
    }

    await sql`
      INSERT INTO prediction_votes (user_id, prediction_rank, prediction_date, vote)
      VALUES (${userId}, ${predictionRank}, ${today}, ${vote})
    `;
    return NextResponse.json({ action: "created" });
  } catch (error) {
    console.error("Votes POST error:", error);
    return NextResponse.json({ error: "Failed to vote" }, { status: 500 });
  }
}
