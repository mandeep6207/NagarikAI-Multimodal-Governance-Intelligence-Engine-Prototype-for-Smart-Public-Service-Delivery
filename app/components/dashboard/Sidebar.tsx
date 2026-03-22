"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { X, LogOut } from "lucide-react";
import { ROLE_CONFIG, getRoleHome } from "../../config/roleConfig";

type SidebarProps = {
  isOpen?: boolean;
  onClose?: () => void;
};

export default function Sidebar({ isOpen = true, onClose }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [role, setRole] = useState("super_admin");
  const [district, setDistrict] = useState("");
  const [name, setName] = useState("");

  useEffect(() => {
    const storedRole = localStorage.getItem("userRole") || "super_admin";
    const storedDistrict = localStorage.getItem("userDistrict") || "";
    const storedName = localStorage.getItem("userName") || "";
    setRole(storedRole);
    setDistrict(storedDistrict);
    setName(storedName);
  }, []);

  const config = ROLE_CONFIG[role] ?? ROLE_CONFIG.super_admin;
  const navItems = config.nav;

  const handleLogout = () => {
    localStorage.clear();
    router.replace("/login");
  };

  return (
    <aside
      className={`fixed md:static inset-y-0 left-0 w-64 bg-[#F4F6F9] border-r border-[#cfd6e3] flex flex-col h-full text-slate-700 z-40 transform transition-transform duration-200 ${
        isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
      }`}
    >
      {/* Logo / Title */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-[#cfd6e3] shrink-0 bg-white">
        <div>
          <div className="text-[10px] uppercase tracking-widest text-slate-500">
            Government of Chhattisgarh
          </div>
          <div className="text-sm font-bold text-[#0B3C5D]">NagarikAI Portal</div>
        </div>
        <button
          className="md:hidden text-slate-500"
          onClick={onClose}
          aria-label="Close sidebar"
        >
          <X size={18} />
        </button>
      </div>

      {/* Role + District badge */}
      <div className="px-4 py-3 bg-white border-b border-[#d8dee8]">
        <div className="text-xs font-bold text-[#0B3C5D] truncate">{name || config.label}</div>
        <div className="text-[11px] text-slate-500 mt-0.5">
          {config.label}
          {district ? ` • ${district}` : ""}
        </div>
      </div>

      {/* Navigation — only shows pages allowed for this role */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        <div className="text-[10px] uppercase tracking-[0.12em] text-slate-400 mb-2 px-1">
          Navigation
        </div>
        {navItems.map((item) => {
          const isActive =
            pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={onClose}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                isActive
                  ? "bg-[#0B3C5D] text-white shadow-sm"
                  : "text-slate-600 hover:bg-[#e8eef5] hover:text-[#0B3C5D]"
              }`}
            >
              <item.icon
                size={16}
                className={isActive ? "text-white" : "text-slate-500"}
              />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* Sign out */}
      <div className="p-3 border-t border-[#d8dee8] bg-white shrink-0">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium text-slate-500 hover:bg-red-50 hover:text-red-600 transition-all"
        >
          <LogOut size={16} />
          <span>Sign Out</span>
        </button>
        <div className="text-[10px] text-slate-400 text-center mt-2">
          {getRoleHome(role).replace("/", "").toUpperCase()} WORKSPACE
        </div>
      </div>
    </aside>
  );
}
