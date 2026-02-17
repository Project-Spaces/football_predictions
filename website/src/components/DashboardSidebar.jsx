"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Overview", icon: "⚡" },
  { href: "/dashboard/predictions", label: "Predictions", icon: "🎯" },
  { href: "/dashboard/insights", label: "Insights", icon: "📈" },
  { href: "/dashboard/alerts", label: "Alerts", icon: "🔔" },
  { href: "/dashboard/analytics", label: "Analytics", icon: "📊" },
];

export default function DashboardSidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();

  return (
    <aside className="w-56 shrink-0 border-r border-border-custom bg-bg-primary min-h-[calc(100vh-64px)] max-lg:hidden flex flex-col">
      <nav className="flex-1 py-4 px-3">
        <div className="space-y-1">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                  isActive
                    ? "bg-accent/10 text-accent"
                    : "text-text-secondary hover:text-text-primary hover:bg-bg-card"
                }`}
              >
                <span>{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>

      <div className="p-4 border-t border-border-custom">
        <div className="text-sm text-text-primary font-medium truncate">
          {session?.user?.name}
        </div>
        <div className="text-xs text-text-secondary truncate mb-3">
          {session?.user?.email}
        </div>
        <button
          onClick={() => signOut({ callbackUrl: "/" })}
          className="text-xs text-text-secondary hover:text-red-400 transition-colors"
        >
          Sign out
        </button>
      </div>
    </aside>
  );
}
