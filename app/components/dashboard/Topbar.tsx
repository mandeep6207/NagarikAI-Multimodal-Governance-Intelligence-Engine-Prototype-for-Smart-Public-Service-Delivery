"use client";
import { useEffect, useState } from "react";
import { Bell, ChevronDown, Menu, UserCircle2 } from "lucide-react";
import { useRouter } from "next/navigation";
import Emblem from "../gov/Emblem";

type TopbarProps = {
  onMenuToggle?: () => void;
};

export default function Topbar({ onMenuToggle }: TopbarProps) {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [role, setRole] = useState("super_admin");
  const [userName, setUserName] = useState("System User");
  const [openNotices, setOpenNotices] = useState(false);
  const [openUserMenu, setOpenUserMenu] = useState(false);
  const [syncTime, setSyncTime] = useState("--:--:--");

  useEffect(() => {
    const stored = localStorage.getItem("userRole");
    const nameStored = localStorage.getItem("userName");
    if (stored) setRole(stored);
    if (nameStored) setUserName(nameStored);
    setSyncTime(new Date().toLocaleTimeString());
    setMounted(true);
  }, []);

  const roleBadges: Record<string, string> = {
    super_admin: "Super Administrator",
    district_officer: "District Officer",
    csc_operator: "CSC Operator",
    analyst: "Department Analyst",
  };

  const handleLogout = () => {
    localStorage.removeItem("authToken");
    localStorage.removeItem("userRole");
    localStorage.removeItem("userName");
    localStorage.removeItem("userDistrict");
    router.push("/login");
  };

  return (
    <header className="bg-[#0B3C5D] text-white border-b border-[#072f49] z-30 shrink-0">
      <div className="h-16 px-3 md:px-6 flex items-center justify-between">
        <div className="flex items-center gap-3 min-w-0">
          <button className="md:hidden" onClick={onMenuToggle} aria-label="Open sidebar">
            <Menu size={20} />
          </button>
          <div className="w-9 h-9 border border-white/70 rounded-full flex items-center justify-center">
            <Emblem className="w-6 h-6 text-white" />
          </div>
          <div className="hidden sm:block">
            <div className="text-[11px] tracking-wider uppercase text-white/80">Government of Chhattisgarh</div>
            <div className="text-xs">State Digital Governance Infrastructure</div>
          </div>
        </div>

        <div className="hidden lg:block text-center px-4 min-w-0">
          <div className="text-sm font-semibold tracking-wide truncate">NagarikAI – Governance Intelligence Portal</div>
          <div className="text-[11px] text-white/80">Official e-District Decision Support Platform</div>
        </div>

        <div className="flex items-center gap-2 md:gap-3">
          <div className="hidden xl:flex items-center gap-2 text-[11px] border border-white/35 bg-white/10 px-2 py-1">
            <span>AI Model Status: Active</span>
            <span className="text-white/60">|</span>
            <span>Data Freshness: 20s</span>
            <span className="text-white/60">|</span>
            <span>Last Sync: {mounted ? syncTime : "--:--:--"}</span>
          </div>
          <span className="gov-badge bg-white/15 border-white/30 text-white whitespace-nowrap">{mounted ? roleBadges[role] || "Authorized Role" : "Authorized Role"}</span>

          <div className="relative">
            <button className="h-9 w-9 border border-white/40 flex items-center justify-center" onClick={() => { setOpenNotices((p) => !p); setOpenUserMenu(false); }}>
              <Bell size={18} />
            </button>
            {openNotices && (
              <div className="absolute right-0 top-11 w-80 bg-white text-slate-800 border border-[#c8d3e2] shadow-sm z-50">
                <div className="px-3 py-2 text-xs uppercase tracking-wider border-b border-[#d7dfe9] font-semibold">System Notices</div>
                <Notice label="Escalation Alert" detail="Three unresolved cases exceed district threshold." tone="text-[#C62828]" />
                <Notice label="SLA Warning" detail="Two grievances are at risk of service-level breach." tone="text-[#F9A825]" />
                <Notice label="Governance Score Update" detail="Current composite score is under active recalculation." tone="text-[#2E7D32]" />
              </div>
            )}
          </div>

          <div className="relative">
            <button className="h-9 px-2 border border-white/40 flex items-center gap-1" onClick={() => { setOpenUserMenu((p) => !p); setOpenNotices(false); }}>
              <UserCircle2 size={18} />
              <ChevronDown size={14} />
            </button>
            {openUserMenu && (
              <div className="absolute right-0 top-11 w-56 bg-white text-slate-800 border border-[#c8d3e2] shadow-sm z-50">
                <div className="px-3 py-2 border-b border-[#d7dfe9]">
                  <div className="text-sm font-semibold">{mounted ? userName : "Authorized User"}</div>
                  <div className="text-xs text-slate-500">{mounted ? roleBadges[role] || "Administrative Role" : "Administrative Role"}</div>
                </div>
                <button className="w-full text-left px-3 py-2 text-sm hover:bg-slate-50" onClick={handleLogout}>Sign out</button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

function Notice({ label, detail, tone }: { label: string; detail: string; tone: string }) {
  return (
    <div className="px-3 py-2 border-b border-[#ecf0f5] last:border-b-0">
      <div className={`text-xs font-semibold uppercase tracking-wide ${tone}`}>{label}</div>
      <div className="text-xs text-slate-600 mt-0.5">{detail}</div>
    </div>
  );
}
