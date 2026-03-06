import { auth } from "@/lib/auth";
import { getPredictions } from "@/lib/predictions";
import Link from "next/link";
import DailyPredictionsSection from "@/components/DailyPredictionsSection";

export default async function DashboardPage() {
  const session = await auth();
  const data = getPredictions();

  const verified = data.predictions.filter((p) => p.verified).length;
  const topProb = data.predictions.length
    ? Math.max(...data.predictions.map((p) => p.win_probability))
    : 0;

  const quickLinks = [
    { href: "/dashboard/predictions", label: "View Predictions", icon: "🎯", desc: "Full ranked list with filters" },
    { href: "/dashboard/insights", label: "Trending Insights", icon: "📈", desc: "Form streaks and top movers" },
    { href: "/dashboard/alerts", label: "Betting Alerts", icon: "🔔", desc: "Real-time notifications" },
    { href: "/dashboard/analytics", label: "Data & Visuals", icon: "📊", desc: "Charts and breakdowns" },
  ];

  return (
    <div className="max-w-[1400px]">
      <div data-aos="fade-up">
        <h1 className="text-4xl font-bold text-text-primary mb-2 max-sm:text-3xl">
          Welcome back, {session?.user?.name?.split(" ")[0] || "there"}
        </h1>
        <p className="text-text-secondary text-base mb-12 max-sm:text-sm max-sm:mb-8">
          Here&apos;s your overview for today.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-6 mb-12 max-sm:grid-cols-1 max-sm:gap-4" data-aos="fade-up" data-aos-delay="100">
        <div className="bg-bg-card border border-border-custom rounded-xl p-8 hover:border-accent/40 transition-all">
          <div className="text-5xl font-bold text-text-primary max-sm:text-4xl">
            {data.total_predictions}
          </div>
          <div className="text-base text-text-secondary mt-3 max-sm:text-sm">
            Total predictions
          </div>
        </div>
        <div className="bg-bg-card border border-border-custom rounded-xl p-8 hover:border-accent/40 transition-all">
          <div className="text-5xl font-bold text-prob-green max-sm:text-4xl">{topProb}%</div>
          <div className="text-base text-text-secondary mt-3 max-sm:text-sm">
            Highest probability
          </div>
        </div>
        <div className="bg-bg-card border border-border-custom rounded-xl p-8 hover:border-accent/40 transition-all">
          <div className="text-5xl font-bold text-accent max-sm:text-4xl">{verified}</div>
          <div className="text-base text-text-secondary mt-3 max-sm:text-sm">
            Fully verified
          </div>
        </div>
      </div>

      {/* Quick Links */}
      <h2 className="text-2xl font-bold text-text-primary mb-6 max-sm:text-xl" data-aos="fade-up" data-aos-delay="200">
        Quick Access
      </h2>
      <div className="grid grid-cols-2 gap-6 max-sm:grid-cols-1 max-sm:gap-4" data-aos="fade-up" data-aos-delay="300">
        {quickLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="bg-bg-card border border-border-custom rounded-xl p-8 hover:border-accent/40 transition-all"
          >
            <div className="text-4xl mb-4">{link.icon}</div>
            <div className="text-lg font-bold text-text-primary">
              {link.label}
            </div>
            <div className="text-base text-text-secondary mt-2 max-sm:text-sm">{link.desc}</div>
          </Link>
        ))}
      </div>

      <DailyPredictionsSection />
    </div>
  );
}
