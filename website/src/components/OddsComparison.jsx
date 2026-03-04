export default function OddsComparison() {
  const mockOdds = [
    { match: "Lyon vs Nice", sportybet: "1.45", bet365: "1.50", oneXbet: "1.48" },
    { match: "Augsburg vs Heidenheim", sportybet: "1.65", bet365: "1.60", oneXbet: "1.62" },
    { match: "Atl. Madrid vs Rayo", sportybet: "1.55", bet365: "1.52", oneXbet: "1.54" },
  ];

  return (
    <div className="bg-bg-card border border-border-custom rounded-xl p-6 mt-8">
      <div className="flex items-center justify-between mb-5">
        <h2 className="font-semibold text-text-primary text-lg">
          Odds Comparison
        </h2>
        <span className="text-[11px] px-3 py-1 rounded-full bg-accent/10 text-accent font-medium">
          Coming Soon
        </span>
      </div>

      <p className="text-sm text-text-secondary mb-5">
        Compare odds across bookmakers to find the best value for each pick.
      </p>

      {/* Preview table (blurred) */}
      <div className="relative overflow-hidden rounded-lg">
        <div className="blur-[2px] opacity-60 pointer-events-none">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border-custom">
                <th className="text-left py-2.5 px-3 text-text-secondary font-medium text-xs">
                  Match
                </th>
                <th className="text-center py-2.5 px-3 text-text-secondary font-medium text-xs">
                  SportyBet
                </th>
                <th className="text-center py-2.5 px-3 text-text-secondary font-medium text-xs">
                  Bet365
                </th>
                <th className="text-center py-2.5 px-3 text-text-secondary font-medium text-xs">
                  1xBet
                </th>
              </tr>
            </thead>
            <tbody>
              {mockOdds.map((row) => (
                <tr key={row.match} className="border-b border-border-custom/50">
                  <td className="py-2.5 px-3 text-text-primary text-xs">
                    {row.match}
                  </td>
                  <td className="py-2.5 px-3 text-center text-accent font-medium text-xs">
                    {row.sportybet}
                  </td>
                  <td className="py-2.5 px-3 text-center text-text-primary text-xs">
                    {row.bet365}
                  </td>
                  <td className="py-2.5 px-3 text-center text-text-primary text-xs">
                    {row.oneXbet}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Overlay */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="bg-bg-card/90 border border-border-custom px-6 py-3 rounded-xl text-center">
            <div className="text-2xl mb-1">📊</div>
            <div className="text-sm font-medium text-text-primary">
              Live Odds Integration
            </div>
            <div className="text-xs text-text-secondary">In Development</div>
          </div>
        </div>
      </div>
    </div>
  );
}
