"use client";
import { useCallback, useEffect, useState } from "react";
import { api } from "../../../services/api";
import { AlertCircle, Filter, RefreshCw } from "lucide-react";
import { toast } from "sonner";

const DISTRICTS = ["", "Raipur", "Bilaspur", "Durg", "Korba", "Jagdalpur"];
const DEPARTMENTS = ["", "Agriculture", "Revenue", "Education", "Panchayat", "Electricity", "Pension", "Health", "Water Supply"];
const PRIORITIES = ["", "Low", "Medium", "High", "Critical"];
const STATUSES = ["", "Open", "In Progress", "Resolved", "Escalated"];

export default function GrievanceIntelligencePage() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [grievances, setGrievances] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ district: "", department: "", priority: "", status: "" });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const f: Record<string, string> = {};
      if (filters.district) f.district = filters.district;
      if (filters.department) f.department = filters.department;
      if (filters.priority) f.priority = filters.priority;
      if (filters.status) f.status = filters.status;
      const res = await api.fetchSuperAdminGrievances(f);
      setGrievances(res.grievances ?? []);
    } catch {
      toast.error("Failed to load grievances");
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => { fetchData(); }, [fetchData]);

  return (
    <div className="max-w-[1400px] mx-auto space-y-5">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-xl font-bold text-[#0B3C5D] uppercase tracking-tight">Grievance Intelligence System</h1>
          <p className="text-xs text-slate-500 mt-0.5">Master grievance table with AI classification — {grievances.length} records</p>
        </div>
        <button onClick={fetchData} className="gov-btn-secondary flex items-center gap-2">
          <RefreshCw size={13} className={loading ? "animate-spin" : ""} /> Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="gov-card">
        <div className="gov-panel-header"><Filter size={14} /> Filters</div>
        <div className="p-3 grid grid-cols-2 md:grid-cols-4 gap-3">
          <FilterSelect label="District" value={filters.district} options={DISTRICTS} onChange={(v) => setFilters(p => ({ ...p, district: v }))} />
          <FilterSelect label="Department" value={filters.department} options={DEPARTMENTS} onChange={(v) => setFilters(p => ({ ...p, department: v }))} />
          <FilterSelect label="Priority" value={filters.priority} options={PRIORITIES} onChange={(v) => setFilters(p => ({ ...p, priority: v }))} />
          <FilterSelect label="Status" value={filters.status} options={STATUSES} onChange={(v) => setFilters(p => ({ ...p, status: v }))} />
        </div>
      </div>

      {/* Grievance Table */}
      <div className="gov-card">
        <div className="gov-panel-header"><AlertCircle size={14} /> Grievance Records</div>
        <div className="overflow-x-auto">
          <table className="gov-table">
            <thead>
              <tr>
                <th>Complaint ID</th>
                <th>Citizen Name</th>
                <th>District</th>
                <th>Department</th>
                <th>Priority</th>
                <th>AI Classification</th>
                <th>Assigned Officer</th>
                <th>Status</th>
                <th>SLA Deadline</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={9} className="text-center text-slate-400 py-8">Loading…</td></tr>
              ) : grievances.length === 0 ? (
                <tr><td colSpan={9} className="text-center text-slate-400 py-8">No grievances match the selected filters</td></tr>
              ) : (
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                grievances.map((g: any) => (
                  <tr key={g.complaint_id}>
                    <td className="font-mono text-xs">{g.complaint_id}</td>
                    <td>{g.citizen_name}</td>
                    <td>{g.district}</td>
                    <td>{g.department}</td>
                    <td><PriorityBadge priority={g.priority} /></td>
                    <td className="text-xs">{g.ai_classification}</td>
                    <td>{g.assigned_officer}</td>
                    <td><StatusBadge status={g.status} /></td>
                    <td className="text-xs whitespace-nowrap">{g.sla_deadline}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function FilterSelect({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-1 block">{label}</label>
      <select value={value} onChange={(e) => onChange(e.target.value)} className="w-full border border-[#cfd6e3] bg-white px-2 py-1.5 text-sm rounded-sm focus:outline-none focus:border-[#0B3C5D]">
        {options.map((o) => <option key={o} value={o}>{o || `All ${label}s`}</option>)}
      </select>
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
