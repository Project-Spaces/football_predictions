export const metadata = {
  title: "Alerts",
};

export default function AlertsPage() {
  return (
    <div className="max-w-[800px]">
      <h1 className="text-2xl font-bold text-text-primary mb-1">
        Betting Alerts
      </h1>
      <p className="text-sm text-text-secondary mb-8">
        Real-time notifications for high-value picks.
      </p>

      <div className="bg-bg-card border border-border-custom rounded-xl p-8 text-center">
        <div className="text-4xl mb-4">🔔</div>
        <h2 className="text-xl font-semibold text-text-primary mb-2">
          Coming Soon
        </h2>
        <p className="text-sm text-text-secondary max-w-md mx-auto mb-6">
          Get notified instantly when a prediction with 80%+ probability drops.
          We&apos;re building real-time alerts so you never miss a top pick.
        </p>
        <div className="inline-block px-5 py-2 bg-accent/10 text-accent text-sm rounded-lg">
          In Development
        </div>
      </div>
    </div>
  );
}
