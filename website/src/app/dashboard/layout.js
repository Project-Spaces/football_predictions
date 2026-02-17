import DashboardSidebar from "@/components/DashboardSidebar";
import DashboardMobileNav from "@/components/DashboardMobileNav";

export const metadata = {
  title: "Dashboard",
};

export default function DashboardLayout({ children }) {
  return (
    <div className="flex flex-1">
      <DashboardSidebar />
      <div className="flex-1 flex flex-col">
        <DashboardMobileNav />
        <div className="flex-1 p-6 max-sm:p-4">{children}</div>
      </div>
    </div>
  );
}
