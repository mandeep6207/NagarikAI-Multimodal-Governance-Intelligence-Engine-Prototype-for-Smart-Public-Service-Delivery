"use client";
import { useCallback, useEffect, useState } from "react";
import { api } from "../../services/api";
import {
  AlertTriangle, Clock, CheckCircle, TrendingUp,
  ShieldAlert, BarChart3, RefreshCw, FileText
} from "lucide-react";
import { toast } from "sonner";
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from "recharts";

const COLORS = ["#0B3C5D", "#1A6FA0", "#328CC1", "#FF9933", "#D9534F", "#5CB85C", "#F0AD4E", "#5BC0DE"];

export default function DistrictOperationsDashboard() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [dashboard, setDashboard] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const userDistrict =
    typeof window !== "undefined" ? localStorage.getItem("userDistrict") || undefined : undefined;

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.fetchOfficerDashboard(userDistrict);
      setDashboard(data);
    } catch (e) {
      toast.error("Failed to load dashboard data");
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [userDistrict]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const kpis = dashboard?.kpis;

  const kpiCards = kpis
    ? [
        { label: "Total Complaints", value: kpis.total_complaints, icon: FileText, color: "bg-[#0B3C5D]", textColor: "text-white" },
        { label: "Pending Complaints", value: kpis.pending_complaints, icon: Clock, color: "bg-amber-50 border-amber-200", textColor: "text-amber-700" },
        { label: "Resolved Today", value: kpis.resolved_today, icon: CheckCircle, color: "bg-green-50 border-green-200", textColor: "text-green-700" },
        { label: "Escalated Cases", value: kpis.escalated_cases, icon: AlertTriangle, color: "bg-red-50 border-red-200", textColor: "text-red-700" },
        { label: "High Priority", value: kpis.high_priority, icon: ShieldAlert, color: "bg-orange-50 border-orange-200", textColor: "text-orange-700" },
        { label: "SLA Compliance", value: `${kpis.sla_compliance_rate}%`, icon: TrendingUp, color: "bg-blue-50 border-blue-200", textColor: "text-blue-700" },
      ]
    : [];

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-[#0B3C5D]">District Operations Dashboard</h1>
          <p className="text-slate-500 text-sm mt-1">
            Monitoring complaint resolution and district service management
            {userDistrict && <span className="ml-2 font-semibold text-[#0B3C5D]">• {userDistrict}</span>}
          </p>
        </div>
        <button
          onClick={fetchData}
          className="flex items-center gap-2 bg-white border border-slate-200 px-4 py-2 rounded-lg text-sm text-slate-600 hover:bg-slate-50"
        >
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      {loading && !dashboard ? (
        <div className="grid grid-cols-3 gap-4 animate-pulse">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-28 bg-slate-200 rounded-xl" />
          ))}
        </div>
      ) : (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {kpiCards.map((card) => {
              const Icon = card.icon;
              const isDark = card.color === "bg-[#0B3C5D]";
              return (
                <div
                  key={card.label}
                  className={`${card.color} ${isDark ? "" : "border"} rounded-xl p-4 shadow-sm`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <Icon size={18} className={isDark ? "text-white/70" : card.textColor} />
                  </div>
                  <p className={`text-2xl font-bold ${isDark ? "text-white" : card.textColor}`}>
                    {card.value}
                  </p>
                  <p className={`text-xs mt-1 ${isDark ? "text-white/70" : "text-slate-500"}`}>
                    {card.label}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Complaint Trends */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
              <h2 className="text-sm font-bold text-[#0B3C5D] uppercase tracking-wide mb-4 flex items-center gap-2">
                <BarChart3 size={16} /> Complaint Trends (14 Days)
              </h2>
              {dashboard?.complaint_trends && (
                <ResponsiveContainer width="100%" height={240}>
                  <LineChart data={dashboard.complaint_trends}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="submitted" stroke="#0B3C5D" strokeWidth={2} dot={{ r: 3 }} name="Submitted" />
                    <Line type="monotone" dataKey="resolved" stroke="#5CB85C" strokeWidth={2} dot={{ r: 3 }} name="Resolved" />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Department Distribution */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
              <h2 className="text-sm font-bold text-[#0B3C5D] uppercase tracking-wide mb-4">
                Department Complaint Distribution
              </h2>
              <div className="grid grid-cols-2 gap-4">
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={dashboard?.department_distribution || []}
                      dataKey="count"
                      nameKey="department"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      innerRadius={40}
                    >
                      {(dashboard?.department_distribution || []).map((_: unknown, idx: number) => (
                        <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-2 flex flex-col justify-center">
                  {(dashboard?.department_distribution || []).slice(0, 6).map(
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    (d: any, idx: number) => (
                      <div key={d.department} className="flex items-center gap-2 text-xs">
                        <div
                          className="w-3 h-3 rounded-sm flex-shrink-0"
                          style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                        />
                        <span className="text-slate-600 truncate">{d.department}</span>
                        <span className="ml-auto font-semibold text-slate-800">{d.count}</span>
                      </div>
                    )
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* SLA Compliance Bar + Priority Distribution */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* SLA Compliance */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
              <h2 className="text-sm font-bold text-[#0B3C5D] uppercase tracking-wide mb-4">
                SLA Compliance Rate
              </h2>
              <div className="flex items-center gap-6">
                <div className="relative w-32 h-32">
                  <svg viewBox="0 0 36 36" className="w-full h-full">
                    <path
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none"
                      stroke="#e2e8f0"
                      strokeWidth="3"
                    />
                    <path
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none"
                      stroke={kpis?.sla_compliance_rate >= 80 ? "#22c55e" : kpis?.sla_compliance_rate >= 60 ? "#f59e0b" : "#ef4444"}
                      strokeWidth="3"
                      strokeDasharray={`${kpis?.sla_compliance_rate || 0}, 100`}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-xl font-bold text-[#0B3C5D]">{kpis?.sla_compliance_rate}%</span>
                  </div>
                </div>
                <div className="space-y-3 flex-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">SLA Breached</span>
                    <span className="font-semibold text-red-600">{kpis?.sla_breached}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Pending</span>
                    <span className="font-semibold text-amber-600">{kpis?.pending_complaints}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Escalated</span>
                    <span className="font-semibold text-red-600">{kpis?.escalated_cases}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Priority Distribution */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
              <h2 className="text-sm font-bold text-[#0B3C5D] uppercase tracking-wide mb-4">
                Priority Distribution
              </h2>
              {dashboard?.priority_distribution && (
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={dashboard.priority_distribution} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis type="number" tick={{ fontSize: 10 }} />
                    <YAxis dataKey="priority" type="category" tick={{ fontSize: 11 }} width={60} />
                    <Tooltip />
                    <Bar dataKey="count" radius={[0, 4, 4, 0]} name="Complaints">
                      {(dashboard.priority_distribution || []).map(
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        (entry: any, idx: number) => (
                          <Cell
                            key={idx}
                            fill={
                              entry.priority === "Critical" ? "#DC2626" :
                              entry.priority === "High" ? "#F59E0B" :
                              entry.priority === "Medium" ? "#3B82F6" : "#22C55E"
                            }
                          />
                        )
                      )}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
