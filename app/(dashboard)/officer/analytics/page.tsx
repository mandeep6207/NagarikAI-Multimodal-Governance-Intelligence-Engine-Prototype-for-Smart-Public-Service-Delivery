"use client";
import { useCallback, useEffect, useState } from "react";
import { api } from "../../../services/api";
import { BarChart3, TrendingUp, AlertTriangle, Brain, Shield } from "lucide-react";
import { toast } from "sonner";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend
} from "recharts";

const COLORS = ["#0B3C5D", "#1A6FA0", "#328CC1", "#FF9933", "#D9534F", "#5CB85C", "#F0AD4E", "#5BC0DE"];
const PRIORITY_COLORS: Record<string, string> = {
  Critical: "#DC2626",
  High: "#F59E0B",
  Medium: "#3B82F6",
  Low: "#22C55E",
};

export default function DistrictPerformanceAnalyticsPage() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [analytics, setAnalytics] = useState<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [aiFeatures, setAiFeatures] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const userDistrict =
    typeof window !== "undefined" ? localStorage.getItem("userDistrict") || undefined : undefined;

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [analyticsRes, aiRes] = await Promise.all([
        api.fetchOfficerAnalytics(userDistrict),
        api.fetchOfficerAiFeatures(userDistrict),
      ]);
      setAnalytics(analyticsRes);
      setAiFeatures(aiRes);
    } catch (e) {
      toast.error("Failed to load analytics");
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [userDistrict]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const summary = analytics?.summary;

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#0B3C5D]">District Performance Analytics</h1>
        <p className="text-slate-500 text-sm mt-1">
          Comprehensive service metrics and AI-powered insights
          {userDistrict && <span className="ml-2 font-semibold text-[#0B3C5D]">• {userDistrict}</span>}
        </p>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-pulse">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => <div key={i} className="h-24 bg-slate-200 rounded-xl" />)}
        </div>
      ) : (
        <>
          {/* Summary KPIs */}
          {summary && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: "Complaint Backlog", value: summary.backlog, color: "text-red-600", bg: "bg-red-50 border-red-200" },
                { label: "Resolution Rate", value: `${summary.resolution_rate}%`, color: "text-green-600", bg: "bg-green-50 border-green-200" },
                { label: "SLA Compliance", value: `${summary.sla_compliance}%`, color: "text-blue-600", bg: "bg-blue-50 border-blue-200" },
                { label: "SLA Breached", value: summary.sla_breached, color: "text-red-600", bg: "bg-red-50 border-red-200" },
                { label: "Total Complaints", value: summary.total_complaints, color: "text-[#0B3C5D]", bg: "bg-slate-50 border-slate-200" },
                { label: "Resolved", value: summary.resolved, color: "text-green-600", bg: "bg-green-50 border-green-200" },
                { label: "Pending", value: summary.pending, color: "text-amber-600", bg: "bg-amber-50 border-amber-200" },
                { label: "Escalated", value: summary.escalated, color: "text-red-600", bg: "bg-red-50 border-red-200" },
              ].map((card) => (
                <div key={card.label} className={`${card.bg} border rounded-xl p-4`}>
                  <p className={`text-2xl font-bold ${card.color}`}>{card.value}</p>
                  <p className="text-xs text-slate-500 mt-1">{card.label}</p>
                </div>
              ))}
            </div>
          )}

          {/* Department Workload + Priority */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
              <h2 className="text-sm font-bold text-[#0B3C5D] uppercase tracking-wide mb-4 flex items-center gap-2">
                <BarChart3 size={16} /> Department Workload
              </h2>
              {analytics?.department_workload && (
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={analytics.department_workload} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis type="number" tick={{ fontSize: 10 }} />
                    <YAxis dataKey="department" type="category" tick={{ fontSize: 10 }} width={80} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="pending" fill="#F59E0B" name="Pending" stackId="a" />
                    <Bar dataKey="resolved" fill="#22C55E" name="Resolved" stackId="a" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
              <h2 className="text-sm font-bold text-[#0B3C5D] uppercase tracking-wide mb-4">
                Priority Breakdown
              </h2>
              {analytics?.priority_breakdown && (
                <div className="flex items-center gap-6">
                  <ResponsiveContainer width="50%" height={200}>
                    <PieChart>
                      <Pie
                        data={analytics.priority_breakdown}
                        dataKey="count"
                        nameKey="priority"
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        innerRadius={35}
                      >
                        {analytics.priority_breakdown.map(
                          // eslint-disable-next-line @typescript-eslint/no-explicit-any
                          (entry: any, idx: number) => (
                            <Cell key={idx} fill={PRIORITY_COLORS[entry.priority] || COLORS[idx % COLORS.length]} />
                          )
                        )}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="space-y-3">
                    {analytics.priority_breakdown.map(
                      // eslint-disable-next-line @typescript-eslint/no-explicit-any
                      (p: any) => (
                        <div key={p.priority} className="flex items-center gap-3 text-sm">
                          <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: PRIORITY_COLORS[p.priority] || "#94a3b8" }} />
                          <span className="text-slate-600">{p.priority}</span>
                          <span className="ml-auto font-bold text-slate-800">{p.count}</span>
                        </div>
                      )
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Officer Performance Table */}
          {analytics?.officer_performance && analytics.officer_performance.length > 0 && (
            <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-200">
                <h2 className="text-sm font-bold text-[#0B3C5D] uppercase tracking-wide flex items-center gap-2">
                  <TrendingUp size={16} /> Officer Performance
                </h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50">
                      <th className="text-left px-4 py-3 font-semibold text-slate-600">Officer</th>
                      <th className="text-left px-4 py-3 font-semibold text-slate-600">Department</th>
                      <th className="text-center px-4 py-3 font-semibold text-slate-600">Active</th>
                      <th className="text-center px-4 py-3 font-semibold text-slate-600">Resolved</th>
                      <th className="text-center px-4 py-3 font-semibold text-slate-600">Total</th>
                      <th className="text-center px-4 py-3 font-semibold text-slate-600">Resolution %</th>
                      <th className="text-center px-4 py-3 font-semibold text-slate-600">Score</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analytics.officer_performance.map(
                      // eslint-disable-next-line @typescript-eslint/no-explicit-any
                      (o: any, idx: number) => (
                        <tr key={o.id} className={idx % 2 === 0 ? "bg-white" : "bg-slate-50"}>
                          <td className="px-4 py-3 font-medium text-[#0B3C5D]">{o.name}</td>
                          <td className="px-4 py-3 text-slate-600">{o.department}</td>
                          <td className="px-4 py-3 text-center">{o.active_cases}</td>
                          <td className="px-4 py-3 text-center text-green-600 font-semibold">{o.resolved}</td>
                          <td className="px-4 py-3 text-center">{o.total_assigned}</td>
                          <td className="px-4 py-3 text-center">
                            <span className={`font-semibold ${o.resolution_rate >= 70 ? "text-green-600" : o.resolution_rate >= 40 ? "text-amber-600" : "text-red-600"}`}>
                              {o.resolution_rate}%
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                              o.performance_score >= 85 ? "bg-green-100 text-green-800" :
                              o.performance_score >= 70 ? "bg-blue-100 text-blue-800" :
                              "bg-amber-100 text-amber-800"
                            }`}>
                              {o.performance_score}
                            </span>
                          </td>
                        </tr>
                      )
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Scheme Stats */}
          {analytics?.scheme_stats && (
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
              <h2 className="text-sm font-bold text-[#0B3C5D] uppercase tracking-wide mb-4">
                Scheme Application Statistics
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {[
                  { label: "Total Applications", value: analytics.scheme_stats.total_applications, color: "text-[#0B3C5D]" },
                  { label: "Approved", value: analytics.scheme_stats.approved, color: "text-green-600" },
                  { label: "Rejected", value: analytics.scheme_stats.rejected, color: "text-red-600" },
                  { label: "Pending", value: analytics.scheme_stats.pending, color: "text-amber-600" },
                  { label: "Approval Rate", value: `${analytics.scheme_stats.approval_rate}%`, color: "text-blue-600" },
                ].map((s) => (
                  <div key={s.label} className="bg-slate-50 rounded-lg p-4 text-center">
                    <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                    <p className="text-xs text-slate-500 mt-1">{s.label}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* AI Features */}
          {aiFeatures && (
            <div className="space-y-6">
              <h2 className="text-sm font-bold text-[#0B3C5D] uppercase tracking-wide flex items-center gap-2">
                <Brain size={16} /> AI Intelligence Features
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Grievance Classification */}
                <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
                  <h3 className="text-sm font-semibold text-[#0B3C5D] mb-3">Grievance Classification</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-blue-50 rounded-lg p-3 text-center">
                      <p className="text-xl font-bold text-blue-700">{aiFeatures.grievance_classification?.total_classified}</p>
                      <p className="text-xs text-slate-500">Total Classified</p>
                    </div>
                    <div className="bg-green-50 rounded-lg p-3 text-center">
                      <p className="text-xl font-bold text-green-700">{aiFeatures.grievance_classification?.accuracy_rate}%</p>
                      <p className="text-xs text-slate-500">Accuracy Rate</p>
                    </div>
                  </div>
                </div>

                {/* Speech-to-Text */}
                <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
                  <h3 className="text-sm font-semibold text-[#0B3C5D] mb-3">Speech-to-Text Processing</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-purple-50 rounded-lg p-3 text-center">
                      <p className="text-xl font-bold text-purple-700">{aiFeatures.speech_to_text?.total_processed}</p>
                      <p className="text-xs text-slate-500">Videos Processed</p>
                    </div>
                    <div className="bg-indigo-50 rounded-lg p-3 text-center">
                      <p className="text-xl font-bold text-indigo-700">{(aiFeatures.speech_to_text?.avg_confidence * 100)?.toFixed(0)}%</p>
                      <p className="text-xs text-slate-500">Avg Confidence</p>
                    </div>
                  </div>
                </div>

                {/* Duplicate Detection */}
                <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
                  <h3 className="text-sm font-semibold text-[#0B3C5D] mb-3 flex items-center gap-2">
                    <AlertTriangle size={14} /> Duplicate Detection
                  </h3>
                  <p className="text-sm text-slate-600 mb-3">
                    <span className="font-bold text-amber-600">{aiFeatures.duplicate_detection?.total_flagged}</span> potential duplicates flagged
                  </p>
                  {aiFeatures.duplicate_detection?.duplicates?.length > 0 && (
                    <div className="space-y-2 max-h-32 overflow-y-auto">
                      {aiFeatures.duplicate_detection.duplicates.slice(0, 5).map(
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        (d: any) => (
                          <div key={d.id} className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 text-xs">
                            <span className="font-mono text-amber-700">{d.id}</span>{" "}
                            <span className="text-slate-600">— {d.citizen} • {d.category}</span>
                          </div>
                        )
                      )}
                    </div>
                  )}
                </div>

                {/* SLA Breach Prediction */}
                <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
                  <h3 className="text-sm font-semibold text-[#0B3C5D] mb-3 flex items-center gap-2">
                    <Shield size={14} /> SLA Breach Prediction
                  </h3>
                  <p className="text-sm text-slate-600 mb-3">
                    <span className="font-bold text-red-600">{aiFeatures.sla_breach_prediction?.at_risk_count}</span> cases at risk of SLA breach
                  </p>
                  {aiFeatures.sla_breach_prediction?.cases_at_risk?.length > 0 && (
                    <div className="space-y-2 max-h-32 overflow-y-auto">
                      {aiFeatures.sla_breach_prediction.cases_at_risk.slice(0, 5).map(
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        (c: any) => (
                          <div key={c.id} className={`border rounded-lg px-3 py-2 text-xs ${c.risk_level === "Critical" ? "bg-red-50 border-red-200" : "bg-amber-50 border-amber-200"}`}>
                            <span className="font-mono">{c.id}</span>{" "}
                            <span className={`font-semibold ${c.risk_level === "Critical" ? "text-red-600" : "text-amber-600"}`}>{c.risk_level}</span>{" "}
                            <span className="text-slate-600">— {c.days_until_breach}d left • {c.department}</span>
                          </div>
                        )
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Active AI Capabilities */}
              {aiFeatures.capabilities && (
                <div className="bg-[#0B3C5D] rounded-xl p-6">
                  <h3 className="text-sm font-bold text-white uppercase tracking-wide mb-4">Active AI Capabilities</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {aiFeatures.capabilities.map(
                      // eslint-disable-next-line @typescript-eslint/no-explicit-any
                      (cap: any) => (
                        <div key={cap.name} className="bg-white/10 backdrop-blur rounded-lg p-4">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="w-2 h-2 bg-green-400 rounded-full" />
                            <span className="text-sm font-semibold text-white">{cap.name}</span>
                          </div>
                          <p className="text-xs text-white/70">{cap.description}</p>
                        </div>
                      )
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
