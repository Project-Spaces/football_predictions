export const metadata = {
  title: "Alerts",
};

export default function AlertsPage() {
  return (
    <div className="max-w-[1400px]">
      <div data-aos="fade-up">
        <h1 className="text-4xl font-bold text-text-primary mb-2 max-sm:text-3xl">
          Betting Alerts
        </h1>
        <p className="text-base text-text-secondary mb-12 max-sm:text-sm max-sm:mb-8">
          Real-time notifications for high-value picks.
        </p>
      </div>

      <div className="bg-bg-card border border-border-custom rounded-xl p-14 text-center hover:border-accent/40 transition-all max-sm:p-8" data-aos="fade-up" data-aos-delay="100">
        <div className="text-6xl mb-6">🔔</div>
        <h2 className="text-3xl font-bold text-text-primary mb-4 max-sm:text-2xl">
          Coming Soon
        </h2>
        <p className="text-base text-text-secondary max-w-lg mx-auto mb-10 leading-relaxed max-sm:text-sm">
          Get notified instantly when a prediction with 80%+ probability drops.
          We&apos;re building real-time alerts so you never miss a top pick.
        </p>
        <div className="inline-block px-8 py-3 bg-accent/10 text-accent text-base font-medium rounded-xl">
          In Development
        </div>
      </div>
    </div>
  );
}
