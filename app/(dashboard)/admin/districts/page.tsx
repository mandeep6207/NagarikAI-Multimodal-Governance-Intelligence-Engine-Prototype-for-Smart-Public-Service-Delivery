"use client";
import { useCallback, useEffect, useState } from "react";
import { api } from "../../../services/api";
import { Shield, Users, AlertCircle, ArrowLeft } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { toast } from "sonner";


const DISTRICT_COLORS: Record<string, string> = {
  Raipur: "#1e40af", Bilaspur: "#0d9488", Durg: "#7c3aed", Korba: "#c2410c", Jagdalpur: "#15803d",
};

export default function DistrictIntelligencePage() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [districts, setDistricts] = useState<any[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [selectedDistrict, setSelectedDistrict] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchDistricts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.fetchSuperAdminDistricts();
      setDistricts(res.districts ?? []);
    } catch {
      toast.error("Failed to load districts");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchDistricts(); }, [fetchDistricts]);

  const openDetail = async (name: string) => {
    try {
      const res = await api.fetchDistrictDetail(name);
      setSelectedDistrict(res);
    } catch {
      toast.error("Failed to load district detail");
    }
  };

  if (selectedDistrict) {
    return <DistrictDetail data={selectedDistrict} onBack={() => setSelectedDistrict(null)} />;
  }

  return (
    <div className="max-w-[1400px] mx-auto space-y-5">
      <div>
        <h1 className="text-xl font-bold text-[#0B3C5D] uppercase tracking-tight">District Intelligence Panel</h1>
        <p className="text-xs text-slate-500 mt-0.5">Monitor all districts of Chhattisgarh — Click a district for detailed view</p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 animate-pulse">
          {[1,2,3,4,5].map(i => <div key={i} className="h-48 bg-slate-200 rounded" />)}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {districts.map((d: any) => (
              <button key={d.district} onClick={() => openDetail(d.district)} className="gov-card p-0 text-left hover:shadow-md transition-shadow cursor-pointer w-full">
                <div className="p-3 border-b border-[#cfd6e3]" style={{ borderLeft: `4px solid ${DISTRICT_COLORS[d.district] || "#0B3C5D"}` }}>
                  <div className="text-sm font-bold text-[#0B3C5D]">{d.district}</div>
                </div>
                <div className="p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-slate-500 uppercase">Governance Score</span>
                    <span className={`text-sm font-bold ${d.governance_score >= 75 ? "text-green-700" : d.governance_score >= 50 ? "text-amber-700" : "text-red-700"}`}>{d.governance_score}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-slate-500 uppercase">Complaints</span>
                    <span className="text-sm font-semibold text-slate-700">{d.total_complaints}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-slate-500 uppercase">Officers</span>
                    <span className="text-sm font-semibold text-slate-700">{d.active_officers}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-slate-500 uppercase">Scheme Coverage</span>
                    <span className="text-sm font-semibold text-slate-700">{d.scheme_coverage}%</span>
                  </div>
                </div>
              </button>
            ))}
          </div>

          {/* Comparison chart */}
          <div className="gov-card">
            <div className="gov-panel-header"><Shield size={14} /> District Governance Score Comparison</div>
            <div className="p-4">
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={districts}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="district" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} domain={[0, 100]} />
                  <Tooltip contentStyle={{ fontSize: 12 }} />
                  <Bar dataKey="governance_score" name="Governance Score" radius={[2, 2, 0, 0]}>
                    {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                    {districts.map((d: any, i: number) => (
                      <Cell key={i} fill={DISTRICT_COLORS[d.district] || "#0B3C5D"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function DistrictDetail({ data, onBack }: { data: any; onBack: () => void }) {
  return (
    <div className="max-w-[1400px] mx-auto space-y-5">
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="gov-btn-secondary flex items-center gap-1"><ArrowLeft size={14} /> Back</button>
        <div>
          <h1 className="text-xl font-bold text-[#0B3C5D] uppercase tracking-tight">{data.district} — District Intelligence</h1>
          <p className="text-xs text-slate-500">Governance Score: <strong className={data.governance_score >= 75 ? "text-green-700" : data.governance_score >= 50 ? "text-amber-700" : "text-red-700"}>{data.governance_score}</strong></p>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <MiniKPI label="Total Citizens" value={data.total_citizens} />
        <MiniKPI label="Total Complaints" value={data.total_complaints} />
        <MiniKPI label="Open Complaints" value={data.open_complaints} color="text-amber-700" />
        <MiniKPI label="Resolved" value={data.resolved_complaints} color="text-green-700" />
        <MiniKPI label="Escalated" value={data.escalated_complaints} color="text-red-700" />
      </div>

      {/* Officers */}
      <div className="gov-card">
        <div className="gov-panel-header"><Users size={14} /> District Officers</div>
        <div className="overflow-x-auto">
          <table className="gov-table">
            <thead><tr><th>ID</th><th>Name</th><th>Designation</th><th>Department</th><th>Cases Assigned</th><th>Performance</th></tr></thead>
            <tbody>
              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
              {data.officers?.map((o: any) => (
                <tr key={o.id}>
                  <td className="font-mono text-xs">{o.id}</td>
                  <td className="font-semibold">{o.name}</td>
                  <td>{o.designation}</td>
                  <td>{o.department}</td>
                  <td>{o.cases_assigned}</td>
                  <td><span className={`font-bold ${o.performance_score >= 80 ? "text-green-700" : o.performance_score >= 60 ? "text-amber-700" : "text-red-700"}`}>{o.performance_score}%</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Scheme Performance */}
      <div className="gov-card">
        <div className="gov-panel-header"><Shield size={14} /> Scheme Performance</div>
        <div className="overflow-x-auto">
          <table className="gov-table">
            <thead><tr><th>Scheme</th><th>Eligible</th><th>Enrolled</th><th>Coverage %</th></tr></thead>
            <tbody>
              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
              {data.scheme_performance?.map((s: any) => (
                <tr key={s.scheme}>
                  <td className="font-semibold">{s.scheme}</td>
                  <td>{s.eligible}</td>
                  <td>{s.enrolled}</td>
                  <td>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 bg-slate-200 rounded overflow-hidden">
                        <div className="h-full bg-[#0B3C5D] rounded" style={{ width: `${Math.min(100, s.coverage_pct)}%` }} />
                      </div>
                      <span className="text-xs font-bold">{s.coverage_pct}%</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent Complaints */}
      <div className="gov-card">
        <div className="gov-panel-header"><AlertCircle size={14} /> Recent Complaints</div>
        <div className="overflow-x-auto">
          <table className="gov-table">
            <thead><tr><th>ID</th><th>Citizen</th><th>Department</th><th>Priority</th><th>Status</th><th>SLA Deadline</th></tr></thead>
            <tbody>
              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
              {data.recent_complaints?.slice(0, 15).map((c: any) => (
                <tr key={c.complaint_id}>
                  <td className="font-mono text-xs">{c.complaint_id}</td>
                  <td>{c.citizen_name}</td>
                  <td>{c.department}</td>
                  <td><PriorityBadge priority={c.priority} /></td>
                  <td><StatusBadge status={c.status} /></td>
                  <td className="text-xs">{c.sla_deadline}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Escalation Cases */}
      {data.escalation_cases?.length > 0 && (
        <div className="gov-card">
          <div className="gov-panel-header bg-red-50 text-red-800 border-red-200"><AlertCircle size={14} /> Escalation Cases</div>
          <div className="overflow-x-auto">
            <table className="gov-table">
              <thead><tr><th>ID</th><th>Citizen</th><th>Department</th><th>Priority</th><th>Officer Assigned</th><th>Created</th></tr></thead>
              <tbody>
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                {data.escalation_cases.map((c: any) => (
                  <tr key={c.complaint_id} className="bg-red-50/50">
                    <td className="font-mono text-xs">{c.complaint_id}</td>
                    <td>{c.citizen_name}</td>
                    <td>{c.department}</td>
                    <td><PriorityBadge priority={c.priority} /></td>
                    <td>{c.assigned_officer}</td>
                    <td className="text-xs">{c.created_at?.slice(0, 10)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function MiniKPI({ label, value, color = "text-[#0B3C5D]" }: { label: string; value: number | string; color?: string }) {
  return (
    <div className="gov-kpi p-3">
      <div className="text-[11px] text-slate-500 uppercase tracking-wide">{label}</div>
      <div className={`text-xl font-bold ${color}`}>{value}</div>
    </div>
  );
}

function PriorityBadge({ priority }: { priority: string }) {
  const cls: Record<string, string> = {
    Critical: "bg-red-100 text-red-800 border-red-300",
    High: "bg-orange-100 text-orange-800 border-orange-300",
    Medium: "bg-amber-100 text-amber-800 border-amber-300",
    Low: "bg-green-100 text-green-800 border-green-300",
  };
  return <span className={`text-[11px] px-2 py-0.5 font-semibold border rounded ${cls[priority] || cls.Low}`}>{priority}</span>;
}

function StatusBadge({ status }: { status: string }) {
  const cls: Record<string, string> = {
    Open: "badge-open",
    "In Progress": "bg-blue-100 text-blue-800 border border-blue-300 text-[11px] px-2 py-0.5 font-semibold",
    Resolved: "badge-resolved",
    Escalated: "badge-escalated",
  };
  return <span className={cls[status] || "badge-open"}>{status}</span>;
}
