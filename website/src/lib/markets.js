/**
 * Compute additional betting markets from existing prediction data.
 * These are estimates derived from form and probability — not external API data.
 */

function countResults(form) {
  const results = form.split("-");
  return {
    wins: results.filter((r) => r === "W").length,
    draws: results.filter((r) => r === "D").length,
    losses: results.filter((r) => r === "L").length,
    total: results.length,
  };
}

/**
 * Over/Under 2.5 Goals estimate.
 * Logic: Strong winner form + weak opponent → likely high-scoring (Over).
 * Close forms → tighter game (Under).
 */
export function computeOverUnder(prediction) {
  const winner = countResults(prediction.winner_form);
  const opponent = countResults(prediction.opponent_form);

  // Score based on attacking indicators
  const winnerAttack = winner.wins * 20 + winner.draws * 5;
  const opponentVulnerability = opponent.losses * 15 + opponent.draws * 5;
  const overScore = (winnerAttack + opponentVulnerability) / 2;

  // Normalize to 0-100 range
  const overProb = Math.min(Math.max(overScore, 30), 85);

  return {
    market: "Over/Under 2.5",
    prediction: overProb >= 55 ? "Over 2.5" : "Under 2.5",
    confidence: Math.round(overProb >= 55 ? overProb : 100 - overProb),
  };
}

/**
 * Both Teams to Score (BTTS) estimate.
 * Logic: If opponent has wins/draws, they can score.
 * If winner has losses/draws, they concede.
 */
export function computeBTTS(prediction) {
  const winner = countResults(prediction.winner_form);
  const opponent = countResults(prediction.opponent_form);

  // Can the opponent score? (their wins + draws indicate scoring ability)
  const opponentScoring = (opponent.wins + opponent.draws) / opponent.total;
  // Does the winner concede? (their losses + draws indicate vulnerability)
  const winnerConceding = (winner.losses + winner.draws) / winner.total;

  const bttsProb = ((opponentScoring + winnerConceding) / 2) * 100;
  const normalizedProb = Math.min(Math.max(bttsProb, 25), 80);

  return {
    market: "BTTS",
    prediction: normalizedProb >= 50 ? "Yes" : "No",
    confidence: Math.round(
      normalizedProb >= 50 ? normalizedProb : 100 - normalizedProb
    ),
  };
}

/**
 * Double Chance estimate.
 * Simply derived from win probability — if 70% win, double chance (win or draw) ≈ 85%.
 */
export function computeDoubleChance(prediction) {
  const winProb = prediction.win_probability;
  // Double chance adds draw probability (estimated from remaining probability)
  const drawEstimate = (100 - winProb) * 0.35;
  const doubleChanceProb = Math.min(winProb + drawEstimate, 95);

  const side = prediction.predicted_side;
  const dcLabel = side === "Home" ? "1X (Home or Draw)" : "X2 (Away or Draw)";

  return {
    market: "Double Chance",
    prediction: dcLabel,
    confidence: Math.round(doubleChanceProb),
  };
}
