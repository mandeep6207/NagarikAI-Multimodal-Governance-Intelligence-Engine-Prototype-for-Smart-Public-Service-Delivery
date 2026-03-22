"use client";
import { useCallback, useEffect, useState } from "react";
import { api } from "../../services/api";
import {
  FileText, AlertTriangle, CheckCircle2, ClipboardList,
  TrendingUp, ShieldAlert, ArrowRight, Users,
} from "lucide-react";
import { toast } from "sonner";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip,
  PieChart, Pie, Cell, Legend,
} from "recharts";
import Link from "next/link";

const PIE_COLORS = ["#0B3C5D", "#1B6B93", "#4A9FCA", "#7BC4E0", "#A8D8EA", "#D4ECFA"];

export default function CSCDashboardPage() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const userDistrict =
    typeof window !== "undefined" ? localStorage.getItem("userDistrict") || undefined : undefined;

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.fetchCscDashboard(userDistrict);
      setData(res);
    } catch (e) {
      toast.error("Failed to load CSC dashboard");
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [userDistrict]);

  useEffect(() => { fetchData(); }, [fetchData]);

  if (loading || !data) {
    return (
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-slate-200 rounded w-64" />
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {[1,2,3,4,5].map(i => <div key={i} className="h-24 bg-slate-200 rounded-xl" />)}
          </div>
        </div>
      </div>
    );
  }

  const kpis = data.kpis || {};

  const kpiCards = [
    { label: "Complaints Today", value: kpis.total_complaints_today, icon: FileText, color: "text-blue-600", bg: "bg-blue-50" },
    { label: "Applications Today", value: kpis.total_applications_today, icon: ClipboardList, color: "text-emerald-600", bg: "bg-emerald-50" },
    { label: "Pending Applications", value: kpis.pending_applications, icon: TrendingUp, color: "text-amber-600", bg: "bg-amber-50" },
    { label: "Rejected Applications", value: kpis.rejected_applications, icon: AlertTriangle, color: "text-red-600", bg: "bg-red-50" },
    { label: "Doc Mismatch Alerts", value: kpis.doc_mismatch_alerts, icon: ShieldAlert, color: "text-purple-600", bg: "bg-purple-50" },
  ];

  const quickLinks = [
    { label: "Submit New Complaint", href: "/csc/new-complaint", icon: FileText },
    { label: "Record Video Complaint", href: "/csc/video-complaint", icon: Users },
    { label: "Upload Documents", href: "/csc/documents", icon: CheckCircle2 },
    { label: "Scheme Applications", href: "/csc/schemes", icon: ClipboardList },
    { label: "Fraud Detection", href: "/csc/fraud-detection", icon: ShieldAlert },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[#0B3C5D]">CSC Operations Dashboard</h1>
        <p className="text-slate-500 text-sm mt-1">
          Common Service Centre — Citizen Service Intake Portal • District: {data.district || "All"}
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {kpiCards.map((kpi) => (
          <div key={kpi.label} className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <div className={`w-8 h-8 rounded-lg ${kpi.bg} flex items-center justify-center`}>
                <kpi.icon size={16} className={kpi.color} />
              </div>
            </div>
            <div className="text-2xl font-bold text-[#0B3C5D]">{kpi.value ?? 0}</div>
            <div className="text-xs text-slate-500 mt-1">{kpi.label}</div>
          </div>
        ))}
      </div>

      {/* Additional Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
          <div className="text-xs text-slate-500 uppercase font-semibold">Total Complaints</div>
          <div className="text-xl font-bold text-[#0B3C5D] mt-1">{kpis.total_complaints ?? 0}</div>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
          <div className="text-xs text-slate-500 uppercase font-semibold">Total Applications</div>
          <div className="text-xl font-bold text-[#0B3C5D] mt-1">{kpis.total_applications ?? 0}</div>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
          <div className="text-xs text-slate-500 uppercase font-semibold">Forwarded to Officer</div>
          <div className="text-xl font-bold text-[#0B3C5D] mt-1">{kpis.forwarded_to_officer ?? 0}</div>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
          <div className="text-xs text-slate-500 uppercase font-semibold">Active Fraud Alerts</div>
          <div className="text-xl font-bold text-red-600 mt-1">{kpis.active_fraud_alerts ?? 0}</div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <h3 className="text-sm font-bold text-[#0B3C5D] mb-4 uppercase">7-Day Activity Trend</h3>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={data.recent_activity || []}>
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="complaints" fill="#0B3C5D" name="Complaints" radius={[4, 4, 0, 0]} />
              <Bar dataKey="applications" fill="#4A9FCA" name="Applications" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Scheme Distribution */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <h3 className="text-sm font-bold text-[#0B3C5D] mb-4 uppercase">Scheme Application Distribution</h3>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie
                data={data.scheme_distribution || []}
                dataKey="count"
                nameKey="scheme"
                outerRadius={85}
                label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
              >
                {(data.scheme_distribution || []).map((_: unknown, i: number) => (
                  <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Department Complaint Breakdown */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
        <h3 className="text-sm font-bold text-[#0B3C5D] mb-4 uppercase">Complaints by Department</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {(data.department_complaints || []).map((d: { department: string; count: number }) => (
            <div key={d.department} className="bg-slate-50 border border-slate-200 rounded-lg p-3">
              <div className="text-xs text-slate-500">{d.department}</div>
              <div className="text-lg font-bold text-[#0B3C5D]">{d.count}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
        <h3 className="text-sm font-bold text-[#0B3C5D] mb-4 uppercase">Quick Actions</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {quickLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="flex items-center gap-3 bg-[#0B3C5D] text-white rounded-lg px-4 py-3 hover:bg-[#0a3350] transition-colors"
            >
              <link.icon size={18} />
              <span className="text-sm font-medium flex-1">{link.label}</span>
              <ArrowRight size={14} />
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
