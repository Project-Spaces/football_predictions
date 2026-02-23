"use client";

import { usePathname } from "next/navigation";
import SettingsButton from "./SettingsButton";

export default function HomeSettings() {
  const pathname = usePathname();
  const isDashboard = pathname.startsWith("/dashboard");
  const variant = isDashboard ? "dashboard" : "home";

  return (
    <div className={isDashboard ? "lg:hidden" : ""}>
      <SettingsButton variant={variant} />
    </div>
  );
}
