import { auth } from "@/lib/auth";
import { getPredictions } from "@/lib/predictions";
import Link from "next/link";

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
    <div className="max-w-[800px]">
      <h1 className="text-2xl font-bold text-text-primary mb-1">
        Welcome back, {session?.user?.name?.split(" ")[0] || "there"}
      </h1>
      <p className="text-text-secondary text-sm mb-8">
        Here&apos;s your overview for today.
      </p>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8 max-sm:grid-cols-1">
        <div className="bg-bg-card border border-border-custom rounded-lg p-5">
          <div className="text-3xl font-bold text-text-primary">
            {data.total_predictions}
          </div>
          <div className="text-sm text-text-secondary mt-1">
            Total predictions
          </div>
        </div>
        <div className="bg-bg-card border border-border-custom rounded-lg p-5">
          <div className="text-3xl font-bold text-prob-green">{topProb}%</div>
          <div className="text-sm text-text-secondary mt-1">
            Highest probability
          </div>
        </div>
        <div className="bg-bg-card border border-border-custom rounded-lg p-5">
          <div className="text-3xl font-bold text-accent">{verified}</div>
          <div className="text-sm text-text-secondary mt-1">
            Fully verified
          </div>
        </div>
      </div>

      {/* Quick Links */}
      <h2 className="text-lg font-semibold text-text-primary mb-4">
        Quick Access
      </h2>
      <div className="grid grid-cols-2 gap-4 max-sm:grid-cols-1">
        {quickLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="bg-bg-card border border-border-custom rounded-lg p-5 hover:border-accent/40 transition-colors"
          >
            <div className="text-2xl mb-2">{link.icon}</div>
            <div className="font-semibold text-text-primary text-sm">
              {link.label}
            </div>
            <div className="text-xs text-text-secondary mt-1">{link.desc}</div>
          </Link>
        ))}
      </div>
    </div>
  );
}
