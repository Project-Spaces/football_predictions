export default function Footer() {
  return (
    <footer className="mt-auto border-t border-border-custom">
      {/* Main footer content */}
      <div className="max-w-[960px] mx-auto px-4 w-full py-10 grid grid-cols-3 gap-8 max-sm:grid-cols-1 max-sm:gap-6">

        {/* Column 1 — Brand */}
        <div>
          <div className="text-base font-bold text-accent mb-2">Maigation</div>
          <p className="text-xs text-text-secondary leading-relaxed">
            High-probability football predictions for informed betting, verified on SportyBet daily.
          </p>
        </div>

        {/* Column 2 — About */}
        <div>
          <div className="text-xs font-semibold text-text-primary uppercase tracking-wider mb-3">
            About
          </div>
          <a
            href="https://www.maigaonline.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-text-secondary hover:text-accent transition-colors"
          >
            About Me →
          </a>
        </div>

        {/* Column 3 — Disclaimer */}
        <div>
          <div className="text-xs font-semibold text-text-primary uppercase tracking-wider mb-3">
            Disclaimer
          </div>
          <p className="text-xs text-text-secondary leading-relaxed">
            Predictions are based on recent form analysis and are for informational purposes only.
            Please gamble responsibly. 18+
          </p>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-border-custom py-4">
        <p className="text-center text-xs text-text-secondary opacity-50">
          &copy; 2026 Maigation
        </p>
      </div>
    </footer>
  );
}
