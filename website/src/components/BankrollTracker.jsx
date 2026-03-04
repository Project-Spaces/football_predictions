"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";

export default function BankrollTracker() {
  const { data: session } = useSession();
  const [summary, setSummary] = useState(null);
  const [entries, setEntries] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [stake, setStake] = useState("");
  const [result, setResult] = useState("win");
  const [profitLoss, setProfitLoss] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!session) return;
    fetchData();
  }, [session]);

  async function fetchData() {
    try {
      const res = await fetch("/api/bankroll");
      if (res.ok) {
        const data = await res.json();
        setSummary(data.summary);
        setEntries(data.entries || []);
      }
    } catch {
      // Silently fail
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!stake) return;
    setSubmitting(true);

    const pl = result === "win" ? parseFloat(profitLoss || stake) : -parseFloat(profitLoss || stake);
    const newBalance = (summary?.currentBalance || 0) + pl;

    try {
      const res = await fetch("/api/bankroll", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          stake: parseFloat(stake),
          result,
          profitLoss: pl,
          balance: newBalance,
        }),
      });
      if (res.ok) {
        setStake("");
        setProfitLoss("");
        setShowForm(false);
        fetchData();
      }
    } catch {
      // Handle error silently
    } finally {
      setSubmitting(false);
    }
  }

  if (!session) {
    return (
      <div className="bg-bg-card border border-border-custom rounded-xl p-5">
        <h3 className="font-semibold text-text-primary text-sm mb-2">
          Bankroll Tracker
        </h3>
        <p className="text-xs text-text-secondary">
          Sign in to track your betting performance.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-bg-card border border-border-custom rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-text-primary text-sm">
          Bankroll Tracker
        </h3>
        <button
          onClick={() => setShowForm(!showForm)}
          className="text-xs text-accent hover:text-accent/80 cursor-pointer"
        >
          {showForm ? "Cancel" : "+ Add Bet"}
        </button>
      </div>

      {/* Summary */}
      {summary && (
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="text-center p-2.5 bg-bg-primary rounded-lg">
            <div className="text-lg font-bold text-text-primary">
              ${summary.currentBalance.toFixed(2)}
            </div>
            <div className="text-[10px] text-text-secondary">Balance</div>
          </div>
          <div className="text-center p-2.5 bg-bg-primary rounded-lg">
            <div
              className={`text-lg font-bold ${summary.todayPL >= 0 ? "text-prob-green" : "text-prob-orange"}`}
            >
              {summary.todayPL >= 0 ? "+" : ""}${summary.todayPL.toFixed(2)}
            </div>
            <div className="text-[10px] text-text-secondary">Today P/L</div>
          </div>
          <div className="text-center p-2 bg-bg-primary rounded-lg">
            <div className="text-sm font-bold text-prob-green">
              {summary.wins}
            </div>
            <div className="text-[10px] text-text-secondary">Wins</div>
          </div>
          <div className="text-center p-2 bg-bg-primary rounded-lg">
            <div className="text-sm font-bold text-prob-orange">
              {summary.losses}
            </div>
            <div className="text-[10px] text-text-secondary">Losses</div>
          </div>
        </div>
      )}

      {/* Add bet form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="space-y-2.5 mb-4">
          <input
            type="number"
            step="0.01"
            value={stake}
            onChange={(e) => setStake(e.target.value)}
            placeholder="Stake amount"
            className="w-full px-3 py-2 text-sm bg-bg-primary border border-border-custom rounded-lg text-text-primary placeholder:text-text-secondary/50"
            required
          />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setResult("win")}
              className={`flex-1 py-2 text-xs rounded-lg cursor-pointer transition-colors ${
                result === "win"
                  ? "bg-prob-green/15 text-prob-green border border-prob-green/30"
                  : "bg-bg-primary text-text-secondary border border-border-custom"
              }`}
            >
              Win
            </button>
            <button
              type="button"
              onClick={() => setResult("loss")}
              className={`flex-1 py-2 text-xs rounded-lg cursor-pointer transition-colors ${
                result === "loss"
                  ? "bg-prob-orange/15 text-prob-orange border border-prob-orange/30"
                  : "bg-bg-primary text-text-secondary border border-border-custom"
              }`}
            >
              Loss
            </button>
          </div>
          <input
            type="number"
            step="0.01"
            value={profitLoss}
            onChange={(e) => setProfitLoss(e.target.value)}
            placeholder="Profit/loss amount (optional)"
            className="w-full px-3 py-2 text-sm bg-bg-primary border border-border-custom rounded-lg text-text-primary placeholder:text-text-secondary/50"
          />
          <button
            type="submit"
            disabled={submitting}
            className="w-full py-2 text-sm font-medium bg-accent text-white rounded-lg hover:bg-accent/90 transition-colors cursor-pointer disabled:opacity-50"
          >
            {submitting ? "Adding..." : "Add Entry"}
          </button>
        </form>
      )}

      {/* Recent entries */}
      {entries.length > 0 && (
        <div className="space-y-1.5">
          <div className="text-[11px] text-text-secondary font-medium mb-2">
            Recent
          </div>
          {entries.slice(0, 5).map((e) => (
            <div
              key={e.id}
              className="flex items-center justify-between py-1.5 text-xs"
            >
              <span
                className={
                  e.result === "win" ? "text-prob-green" : "text-prob-orange"
                }
              >
                {e.result === "win" ? "W" : "L"} · ${parseFloat(e.stake).toFixed(2)}
              </span>
              <span className="text-text-secondary">
                {e.profit_loss >= 0 ? "+" : ""}${parseFloat(e.profit_loss).toFixed(2)}
              </span>
            </div>
          ))}
        </div>
      )}

      {!summary && entries.length === 0 && (
        <p className="text-xs text-text-secondary text-center py-4">
          No bets logged yet. Click &quot;+ Add Bet&quot; to start tracking.
        </p>
      )}
    </div>
  );
}
