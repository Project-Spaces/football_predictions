export const metadata = {
  title: "Alerts",
};

export default function AlertsPage() {
  return (
    <div className="max-w-[1100px]">
      <div data-aos="fade-up">
        <h1 className="text-3xl font-bold text-text-primary mb-1">
          Betting Alerts
        </h1>
        <p className="text-sm text-text-secondary mb-10">
          Real-time notifications for high-value picks.
        </p>
      </div>

      <div className="bg-bg-card border border-border-custom rounded-xl p-10 text-center" data-aos="fade-up" data-aos-delay="100">
        <div className="text-5xl mb-5">🔔</div>
        <h2 className="text-2xl font-semibold text-text-primary mb-3">
          Coming Soon
        </h2>
        <p className="text-sm text-text-secondary max-w-md mx-auto mb-8">
          Get notified instantly when a prediction with 80%+ probability drops.
          We&apos;re building real-time alerts so you never miss a top pick.
        </p>
        <div className="inline-block px-6 py-2.5 bg-accent/10 text-accent text-sm font-medium rounded-lg">
          In Development
        </div>
      </div>
    </div>
  );
}
