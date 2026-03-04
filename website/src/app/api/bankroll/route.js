import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import sql, { initBankrollTable } from "@/lib/db";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Sign in required" }, { status: 401 });
    }

    await initBankrollTable();

    const users = await sql`SELECT id FROM users WHERE email = ${session.user.email}`;
    if (users.length === 0) {
      return NextResponse.json({ entries: [], summary: null });
    }

    const entries = await sql`
      SELECT * FROM bankroll_entries
      WHERE user_id = ${users[0].id}
      ORDER BY created_at DESC
      LIMIT 20
    `;

    // Compute summary
    const allEntries = await sql`
      SELECT result, profit_loss, balance FROM bankroll_entries
      WHERE user_id = ${users[0].id}
      ORDER BY created_at DESC
    `;

    const currentBalance = allEntries.length > 0 ? parseFloat(allEntries[0].balance) : 0;
    const totalBets = allEntries.length;
    const wins = allEntries.filter((e) => e.result === "win").length;
    const losses = allEntries.filter((e) => e.result === "loss").length;
    const todayPL = allEntries
      .filter((e) => {
        const d = new Date(e.date || e.created_at);
        const today = new Date();
        return d.toDateString() === today.toDateString();
      })
      .reduce((sum, e) => sum + parseFloat(e.profit_loss || 0), 0);

    return NextResponse.json({
      entries,
      summary: { currentBalance, totalBets, wins, losses, todayPL },
    });
  } catch (error) {
    console.error("Bankroll GET error:", error);
    return NextResponse.json({ entries: [], summary: null });
  }
}

export async function POST(request) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Sign in required" }, { status: 401 });
    }

    await initBankrollTable();

    const { stake, result, profitLoss, balance, note } = await request.json();
    if (!stake || !result || balance === undefined) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const users = await sql`SELECT id FROM users WHERE email = ${session.user.email}`;
    if (users.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    await sql`
      INSERT INTO bankroll_entries (user_id, stake, result, profit_loss, balance, note)
      VALUES (${users[0].id}, ${stake}, ${result}, ${profitLoss || 0}, ${balance}, ${note || ""})
    `;

    return NextResponse.json({ message: "Entry added" });
  } catch (error) {
    console.error("Bankroll POST error:", error);
    return NextResponse.json({ error: "Failed to add entry" }, { status: 500 });
  }
}
