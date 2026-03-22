"use client";
import { useCallback, useEffect, useState } from "react";
import { api } from "../../services/api";
import {
  Shield,
  AlertCircle,
  TrendingUp,
  Users,
  Video,
  FileWarning,
  RefreshCw,
  Building2,
  Activity,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  PieChart,
  Pie,
} from "recharts";
import { toast } from "sonner";

const DISTRICT_COLORS: Record<string, string> = {
  Raipur: "#1e40af",
  Bilaspur: "#0d9488",
  Durg: "#7c3aed",
  Korba: "#c2410c",
  Jagdalpur: "#15803d",
};

export default function StateGovernanceDashboard() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.fetchSuperAdminDashboard();
      setData(res);
    } catch {
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const kpis = data?.kpis;
  const districtScores = data?.district_scores ?? [];
  const grievanceTrend = data?.grievance_trend ?? [];
  const deptDistribution = data?.department_distribution ?? [];

  return (
    <div className="max-w-[1400px] mx-auto space-y-5">
      {/* Header */}
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-xl font-bold text-[#0B3C5D] tracking-tight uppercase">
            State Governance Dashboard
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Chhattisgarh e‑District Monitoring — Real-time State Analytics
          </p>
        </div>
        <button onClick={fetchData} className="gov-btn-secondary flex items-center gap-2">
          <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      {loading && !data ? (
        <div className="grid grid-cols-6 gap-4 animate-pulse">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-24 bg-slate-200 rounded" />
          ))}
        </div>
      ) : (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            <KPICard label="Governance Score" value={kpis?.governance_score ?? "—"} suffix="/ 100" icon={<Shield size={18} />} color="text-[#0B3C5D]" bg="bg-blue-50" />
            <KPICard label="Active Complaints" value={kpis?.total_active_complaints ?? 0} icon={<AlertCircle size={18} />} color="text-amber-700" bg="bg-amber-50" />
            <KPICard label="Pending Escalations" value={kpis?.pending_escalations ?? 0} icon={<TrendingUp size={18} />} color="text-red-700" bg="bg-red-50" />
            <KPICard label="Scheme Coverage" value={`${kpis?.scheme_coverage_pct ?? 0}%`} icon={<Users size={18} />} color="text-green-700" bg="bg-green-50" />
            <KPICard label="Fraud Alerts" value={kpis?.fraud_alerts ?? 0} icon={<FileWarning size={18} />} color="text-red-700" bg="bg-red-50" />
            <KPICard label="Video Pending" value={kpis?.video_pending_review ?? 0} icon={<Video size={18} />} color="text-purple-700" bg="bg-purple-50" />
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Grievance Trend */}
            <div className="lg:col-span-2 gov-card">
              <div className="gov-panel-header">
                <Activity size={14} />
                Grievance Trend — Last 14 Days
              </div>
              <div className="p-4">
                {grievanceTrend.length > 0 ? (
                  <ResponsiveContainer width="100%" height={220}>
                    <LineChart data={grievanceTrend}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={(v: string) => v.slice(5)} />
                      <YAxis tick={{ fontSize: 10 }} />
                      <Tooltip contentStyle={{ fontSize: 12, border: "1px solid #cfd6e3" }} />
                      <Line type="monotone" dataKey="count" stroke="#0B3C5D" strokeWidth={2} dot={{ r: 2 }} name="Grievances" />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-52 flex items-center justify-center text-slate-400 text-sm">No trend data</div>
                )}
              </div>
            </div>

            {/* Department Distribution */}
            <div className="gov-card">
              <div className="gov-panel-header">
                <Building2 size={14} />
                Department Distribution
              </div>
              <div className="p-4">
                {deptDistribution.length > 0 ? (
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                      <Pie
                        data={deptDistribution}
                        cx="50%"
                        cy="50%"
                        outerRadius={75}
                        dataKey="count"
                        nameKey="department"
                        label={({ name, percent }: { name?: string; percent?: number }) =>
                          `${(name || "").slice(0, 6)} ${((percent || 0) * 100).toFixed(0)}%`
                        }
                        labelLine={false}
                      >
                        {deptDistribution.map((_: unknown, i: number) => (
                          <Cell key={i} fill={["#0B3C5D", "#1e40af", "#0d9488", "#7c3aed", "#c2410c", "#15803d", "#b45309", "#6b21a8"][i % 8]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-52 flex items-center justify-center text-slate-400 text-sm">Loading…</div>
                )}
              </div>
            </div>
          </div>

          {/* District Performance Comparison */}
          <div className="gov-card">
            <div className="gov-panel-header">
              <Shield size={14} />
              District Performance Comparison
            </div>
            <div className="p-4">
              {districtScores.length > 0 ? (
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={districtScores}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="district" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} domain={[0, 100]} />
                    <Tooltip contentStyle={{ fontSize: 12 }} />
                    <Bar dataKey="governance_score" name="Governance Score" radius={[2, 2, 0, 0]}>
                      {districtScores.map((d: { district: string }, i: number) => (
                        <Cell key={i} fill={DISTRICT_COLORS[d.district] || "#0B3C5D"} />
                      ))}
                    </Bar>
                    <Bar dataKey="scheme_coverage" name="Scheme Coverage %" fill="#FF9933" opacity={0.7} radius={[2, 2, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-64 flex items-center justify-center text-slate-400 text-sm">Loading…</div>
              )}
            </div>
          </div>

          {/* District Summary Table */}
          <div className="gov-card">
            <div className="gov-panel-header">
              <Building2 size={14} />
              District Summary
            </div>
            <div className="overflow-x-auto">
              <table className="gov-table">
                <thead>
                  <tr>
                    <th>District</th>
                    <th>Governance Score</th>
                    <th>Active Officers</th>
                    <th>Total Complaints</th>
                    <th>Open</th>
                    <th>Escalated</th>
                    <th>Scheme Coverage</th>
                  </tr>
                </thead>
                <tbody>
                  {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                  {districtScores.map((d: any) => (
                    <tr key={d.district}>
                      <td className="font-semibold text-[#0B3C5D]">{d.district}</td>
                      <td>
                        <span className={`inline-block px-2 py-0.5 text-xs font-bold rounded ${
                          d.governance_score >= 75 ? "bg-green-100 text-green-800" : d.governance_score >= 50 ? "bg-amber-100 text-amber-800" : "bg-red-100 text-red-800"
                        }`}>{d.governance_score}</span>
                      </td>
                      <td>{d.active_officers}</td>
                      <td>{d.total_complaints}</td>
                      <td className="text-amber-700 font-semibold">{d.open_complaints}</td>
                      <td className="text-red-700 font-semibold">{d.escalated}</td>
                      <td>{d.scheme_coverage}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function KPICard({ label, value, suffix, icon, color, bg }: {
  label: string; value: string | number; suffix?: string; icon: React.ReactNode; color: string; bg: string;
}) {
  return (
    <div className="gov-kpi p-4 flex flex-col justify-between min-h-[100px]">
      <div className="flex items-center justify-between mb-2">
        <div className={`p-1.5 rounded ${bg}`}><span className={color}>{icon}</span></div>
      </div>
      <div>
        <div className={`text-2xl font-bold ${color}`}>
          {value}{suffix && <span className="text-sm text-slate-400 font-normal ml-1">{suffix}</span>}
        </div>
        <div className="text-[11px] font-medium text-slate-500 mt-0.5 uppercase tracking-wide">{label}</div>
      </div>
    </div>
  );
}
