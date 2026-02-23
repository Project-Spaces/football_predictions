"use client";

import { usePathname } from "next/navigation";
import SettingsButton from "./SettingsButton";

export default function HomeSettings() {
  const pathname = usePathname();

  // Dashboard has its own settings in the sidebar
  if (pathname.startsWith("/dashboard")) return null;

  return <SettingsButton variant="home" />;
}
