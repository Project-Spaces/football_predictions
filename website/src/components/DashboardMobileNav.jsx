"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Overview", icon: "⚡" },
  { href: "/dashboard/predictions", label: "Picks", icon: "🎯" },
  { href: "/dashboard/insights", label: "Insights", icon: "📈" },
  { href: "/dashboard/alerts", label: "Alerts", icon: "🔔" },
  { href: "/dashboard/analytics", label: "Data", icon: "📊" },
];

export default function DashboardMobileNav() {
  const pathname = usePathname();

  return (
    <div className="lg:hidden border-b border-border-custom overflow-x-auto">
      <div className="flex px-2 py-2 gap-1 min-w-max">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs whitespace-nowrap transition-colors ${
                isActive
                  ? "bg-accent/10 text-accent"
                  : "text-text-secondary hover:text-text-primary"
              }`}
            >
              <span>{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
