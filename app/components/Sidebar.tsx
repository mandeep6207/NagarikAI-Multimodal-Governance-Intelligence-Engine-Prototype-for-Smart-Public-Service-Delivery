"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  BarChart3, 
  Map, 
  FileText, 
  UserCheck, 
  AlertTriangle, 
  Activity, 
  Network
} from "lucide-react";
import clsx from "clsx";

const navItems = [
  { name: "Governance Score", href: "/", icon: Activity },
  { name: "Beneficiary Discovery", href: "/beneficiary", icon: UserCheck },
  { name: "Grievance AI", href: "/grievance", icon: AlertTriangle },
  { name: "CSC Copilot", href: "/csc", icon: FileText },
  { name: "Forecast Analytics", href: "/forecast", icon: BarChart3 },
  { name: "Officer Workload", href: "/workload", icon: Map },
  { name: "Knowledge Graph", href: "/graph", icon: Network },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="w-64 bg-slate-900 min-h-screen text-slate-300 flex flex-col">
      <div className="h-16 flex items-center px-6 border-b border-slate-800">
        <h1 className="text-xl font-bold text-white tracking-wide">NagarikAI</h1>
      </div>
      <div className="p-4 flex-1 space-y-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={clsx(
                "flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors",
                isActive 
                  ? "bg-blue-600 text-white" 
                  : "hover:bg-slate-800 hover:text-white"
              )}
            >
              <Icon size={20} />
              <span className="font-medium">{item.name}</span>
            </Link>
          );
        })}
      </div>
      <div className="p-4 border-t border-slate-800 text-sm flex flex-col items-center">
        <span className="text-slate-500 mb-2">System Status: <span className="text-green-400 font-semibold">Online</span></span>
      </div>
    </div>
  );
}
