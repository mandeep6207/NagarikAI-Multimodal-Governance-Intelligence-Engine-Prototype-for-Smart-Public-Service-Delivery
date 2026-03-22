"use client";

import { Suspense, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Sidebar from "../components/dashboard/Sidebar";
import Topbar from "../components/dashboard/Topbar";
import { isRouteAllowed, getRoleHome, ROLE_CONFIG } from "../config/roleConfig";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [role, setRole] = useState("super_admin");

  useEffect(() => {
    const token = localStorage.getItem("authToken");
    const storedRole = localStorage.getItem("userRole") || "";
    if (!token || !storedRole) { router.replace("/login"); return; }
    if (!isRouteAllowed(storedRole, pathname)) { router.replace(getRoleHome(storedRole)); return; }
    setRole(storedRole);
    setReady(true);
  }, [pathname, router]);

  if (!ready) return <div className="min-h-screen bg-[#F4F6F9] animate-pulse" />;

  // Breadcrumb segments
  const segments = pathname.split("/").filter(Boolean);

  return (
    <div className="flex h-screen bg-[#F4F6F9] overflow-hidden">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/30 z-30 md:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Government Topbar */}
        <Topbar onMenuToggle={() => setSidebarOpen((p) => !p)} />

        {/* Saffron accent line */}
        <div className="h-0.5 bg-[#FF9933] shrink-0" />

        {/* Breadcrumb */}
        <div className="bg-[#e7edf5] border-b border-[#cfd6e3] px-4 md:px-6 py-1.5 text-[11px] text-[#555] flex items-center gap-1 shrink-0">
          <span className="text-[#0B3C5D] font-semibold">Home</span>
          {segments.map((seg, i) => (
            <span key={i} className="flex items-center gap-1">
              <span className="text-[#aaa]">▸</span>
              <span className={i === segments.length - 1 ? "text-[#0B3C5D] font-bold uppercase tracking-wide" : "text-[#666]"}>
                {seg.replace(/-/g, " ")}
              </span>
            </span>
          ))}
          <span className="ml-auto text-[#999] font-medium">
            {ROLE_CONFIG[role]?.label ?? "Portal"}
          </span>
        </div>

        {/* Page title bar */}
        <div className="bg-white border-b border-[#cfd6e3] px-4 md:px-6 py-2 shrink-0 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-4 w-1 bg-[#FF9933]" />
            <h2 className="text-[13px] font-bold text-[#0B3C5D] uppercase tracking-wide">
              {segments[segments.length - 1]?.replace(/-/g, " ") ?? "Dashboard"}
            </h2>
          </div>
          <span className="text-[11px] text-[#999]">NagarikAI v2.0</span>
        </div>

        {/* Main content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 custom-scrollbar">
          <Suspense
            fallback={
              <div className="animate-pulse space-y-4">
                <div className="h-6 bg-[#e0e7ee] rounded w-48" />
                <div className="grid grid-cols-3 gap-4">
                  {[1, 2, 3].map((i) => <div key={i} className="h-24 bg-[#e0e7ee] rounded" />)}
                </div>
              </div>
            }
          >
            {children}
          </Suspense>
        </main>

        {/* Government Footer */}
        <footer className="bg-[#0B3C5D] text-white shrink-0">
          <div className="px-4 md:px-6 py-2 flex flex-col md:flex-row items-center justify-between gap-1 text-[11px] text-white/70">
            <span>NagarikAI Governance Intelligence Portal — Government of Chhattisgarh</span>
            <span>v2.0.0 · Official Administrative System · All data is confidential</span>
          </div>
          <div className="h-1 bg-[#FF9933]" />
        </footer>
      </div>
    </div>
  );
}
