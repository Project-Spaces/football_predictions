"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import SettingsButton from "./SettingsButton";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Overview", icon: "⚡" },
  { href: "/dashboard/predictions", label: "Picks", icon: "🎯" },
  { href: "/dashboard/insights", label: "Insights", icon: "📈" },
  { href: "/dashboard/alerts", label: "Alerts", icon: "🔔" },
  { href: "/dashboard/analytics", label: "Data", icon: "📊" },
];

export default function DashboardMobileNav() {
  const pathname = usePathname();
  const { data: session } = useSession();

  return (
    <div className="lg:hidden border-b border-border-custom">
      {/* Nav tabs */}
      <div className="overflow-x-auto">
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

      {/* User info row */}
      <div className="flex items-center justify-between px-4 py-2.5 border-t border-border-custom">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-6 h-6 bg-accent/20 text-accent rounded-full flex items-center justify-center text-[10px] font-bold shrink-0">
            {session?.user?.name?.[0]?.toUpperCase() || "U"}
          </div>
          <span className="text-xs text-text-secondary truncate">
            {session?.user?.name}
            {session?.user?.email && (
              <span className="text-text-secondary/60"> · {session.user.email}</span>
            )}
          </span>
        </div>
        <SettingsButton variant="dashboard" />
      </div>
    </div>
  );
}
