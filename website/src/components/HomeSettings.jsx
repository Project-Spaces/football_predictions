"use client";

import { usePathname } from "next/navigation";
import SettingsButton from "./SettingsButton";

export default function HomeSettings() {
  const pathname = usePathname();

  // Don't render on dashboard pages — dashboard has its own settings
  if (pathname.startsWith("/dashboard")) return null;

  return <SettingsButton variant="home" />;
}
