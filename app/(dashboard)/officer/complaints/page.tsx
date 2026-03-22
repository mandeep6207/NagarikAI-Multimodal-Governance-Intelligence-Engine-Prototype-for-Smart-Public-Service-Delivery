"use client";
import { useCallback, useEffect, useState } from "react";
import { api } from "../../../services/api";
import { Inbox, Search, CheckCircle, AlertTriangle, ArrowLeft, Clock } from "lucide-react";
import { toast } from "sonner";

const DEPARTMENTS = ["Agriculture", "Revenue", "Education", "Panchayat", "Electricity", "Pension", "Health", "Water Supply"];
const PRIORITIES = ["Low", "Medium", "High", "Critical"];
const STATUSES = ["Open", "In Progress", "Under Review", "Resolved", "Escalated"];

function PriorityBadge({ priority }: { priority: string }) {
  const colors: Record<string, string> = {
    Critical: "bg-red-100 text-red-800 border-red-200",
    High: "bg-orange-100 text-orange-800 border-orange-200",
    Medium: "bg-blue-100 text-blue-800 border-blue-200",
    Low: "bg-green-100 text-green-800 border-green-200",
  };
  return (
    <span className={`text-xs font-semibold px-2 py-0.5 rounded border ${colors[priority] || "bg-gray-100 text-gray-700"}`}>
      {priority}
    </span>
  );
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    Open: "bg-yellow-100 text-yellow-800",
    "In Progress": "bg-blue-100 text-blue-800",
    "Under Review": "bg-purple-100 text-purple-800",
    Resolved: "bg-green-100 text-green-800",
    Escalated: "bg-red-100 text-red-800",
  };
  return (
    <span className={`text-xs font-semibold px-2 py-0.5 rounded ${colors[status] || "bg-gray-100 text-gray-700"}`}>
      {status}
    </span>
  );
}

export default function ComplaintInboxPage() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [complaints, setComplaints] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [selectedComplaint, setSelectedComplaint] = useState<any>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [filters, setFilters] = useState({ department: "", priority: "", status: "" });

  const userDistrict =
    typeof window !== "undefined" ? localStorage.getItem("userDistrict") || undefined : undefined;

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.fetchOfficerComplaints({
        district: userDistrict,
        department: filters.department || undefined,
        priority: filters.priority || undefined,
        status: filters.status || undefined,
      });
      setComplaints(res?.complaints ?? []);
      setTotal(res?.total ?? 0);
    } catch (e) {
      toast.error("Failed to load complaints");
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [userDistrict, filters]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleAction = async (id: string, action: string) => {
    setProcessingId(id);
    try {
      await api.officerComplaintAction(id, action);
      toast.success(`Complaint ${id} ${action === "resolve" ? "resolved" : action === "escalate" ? "escalated" : "updated"}`);
      setSelectedComplaint(null);
      await fetchData();
    } catch (e) {
      toast.error(`Action failed: ${e instanceof Error ? e.message : "unknown"}`);
    } finally {
      setProcessingId(null);
    }
  };

  if (selectedComplaint) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <button onClick={() => setSelectedComplaint(null)} className="flex items-center gap-2 text-sm text-[#0B3C5D] hover:underline">
          <ArrowLeft size={16} /> Back to Inbox
        </button>

        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-[#0B3C5D]">{selectedComplaint.id}</h2>
            <div className="flex gap-2">
              <PriorityBadge priority={selectedComplaint.priority} />
              <StatusBadge status={selectedComplaint.status} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm mb-6">
            <div><span className="text-slate-500">Citizen:</span> <span className="font-medium">{selectedComplaint.citizen_name}</span></div>
            <div><span className="text-slate-500">Phone:</span> <span className="font-medium">{selectedComplaint.citizen_phone}</span></div>
            <div><span className="text-slate-500">District:</span> <span className="font-medium">{selectedComplaint.district}</span></div>
            <div><span className="text-slate-500">Department:</span> <span className="font-medium">{selectedComplaint.department}</span></div>
            <div><span className="text-slate-500">Category:</span> <span className="font-medium">{selectedComplaint.category}</span></div>
            <div><span className="text-slate-500">SLA Deadline:</span> <span className={`font-medium ${selectedComplaint.sla_breached ? "text-red-600" : ""}`}>{selectedComplaint.sla_deadline}</span></div>
            <div><span className="text-slate-500">Submitted:</span> <span className="font-medium">{selectedComplaint.submitted_at}</span></div>
            <div><span className="text-slate-500">Assigned Officer:</span> <span className="font-medium">{selectedComplaint.assigned_officer_name || "Unassigned"}</span></div>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 mb-6">
            <h3 className="text-sm font-semibold text-slate-700 mb-2">Description</h3>
            <p className="text-sm text-slate-600">{selectedComplaint.description}</p>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <h3 className="text-sm font-semibold text-[#0B3C5D] mb-2">AI Analysis</h3>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div><span className="text-slate-500">AI Category:</span> <span className="font-medium">{selectedComplaint.ai_category}</span></div>
              <div><span className="text-slate-500">Confidence:</span> <span className="font-medium">{(selectedComplaint.ai_confidence * 100).toFixed(0)}%</span></div>
              <div><span className="text-slate-500">Duplicate:</span> <span className={`font-medium ${selectedComplaint.duplicate_flag ? "text-red-600" : "text-green-600"}`}>{selectedComplaint.duplicate_flag ? "Yes" : "No"}</span></div>
            </div>
          </div>

          {selectedComplaint.sla_breached && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-6 flex items-center gap-2">
              <Clock size={16} className="text-red-600" />
              <span className="text-sm font-semibold text-red-700">SLA Breached — Immediate action required</span>
            </div>
          )}

          {selectedComplaint.status !== "Resolved" && (
            <div className="flex gap-3">
              <button
                disabled={processingId === selectedComplaint.id}
                onClick={() => handleAction(selectedComplaint.id, "resolve")}
                className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-green-700 disabled:opacity-50"
              >
                <CheckCircle size={16} /> Resolve Complaint
              </button>
              <button
                disabled={processingId === selectedComplaint.id}
                onClick={() => handleAction(selectedComplaint.id, "escalate")}
                className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-red-700 disabled:opacity-50"
              >
                <AlertTriangle size={16} /> Escalate
              </button>
              <button
                disabled={processingId === selectedComplaint.id}
                onClick={() => handleAction(selectedComplaint.id, "in_progress")}
                className="flex items-center gap-2 bg-[#0B3C5D] text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-[#0a3350] disabled:opacity-50"
              >
                Mark In Progress
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-[#0B3C5D]">Complaint Inbox</h1>
          <p className="text-slate-500 text-sm mt-1">
            All complaints assigned to the district • {total} total
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
        <div className="flex items-center gap-4 flex-wrap">
          <Search size={16} className="text-slate-400" />
          <select
            value={filters.department}
            onChange={(e) => setFilters((f) => ({ ...f, department: e.target.value }))}
            className="text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white text-slate-700"
          >
            <option value="">All Departments</option>
            {DEPARTMENTS.map((d) => <option key={d} value={d}>{d}</option>)}
          </select>
          <select
            value={filters.priority}
            onChange={(e) => setFilters((f) => ({ ...f, priority: e.target.value }))}
            className="text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white text-slate-700"
          >
            <option value="">All Priorities</option>
            {PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
          <select
            value={filters.status}
            onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value }))}
            className="text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white text-slate-700"
          >
            <option value="">All Statuses</option>
            {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          {(filters.department || filters.priority || filters.status) && (
            <button
              onClick={() => setFilters({ department: "", priority: "", status: "" })}
              className="text-xs text-red-600 hover:underline"
            >
              Clear Filters
            </button>
          )}
        </div>
      </div>

      {/* Complaints Table */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-400">Loading complaints...</div>
        ) : complaints.length === 0 ? (
          <div className="p-8 text-center text-slate-400 flex flex-col items-center">
            <Inbox size={40} className="mb-3 text-slate-300" />
            <p>No complaints match the current filters</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[#0B3C5D] text-white">
                  <th className="text-left px-4 py-3 font-semibold">Complaint ID</th>
                  <th className="text-left px-4 py-3 font-semibold">Citizen Name</th>
                  <th className="text-left px-4 py-3 font-semibold">Department</th>
                  <th className="text-left px-4 py-3 font-semibold">Priority</th>
                  <th className="text-left px-4 py-3 font-semibold">Status</th>
                  <th className="text-left px-4 py-3 font-semibold">Submitted</th>
                  <th className="text-left px-4 py-3 font-semibold">Assigned Officer</th>
                </tr>
              </thead>
              <tbody>
                {complaints.map((c, idx) => (
                  <tr
                    key={c.id}
                    onClick={() => setSelectedComplaint(c)}
                    className={`cursor-pointer hover:bg-blue-50 border-b border-slate-100 ${
                      c.sla_breached ? "bg-red-50" : idx % 2 === 0 ? "bg-white" : "bg-slate-50"
                    }`}
                  >
                    <td className="px-4 py-3 font-mono text-xs text-[#0B3C5D] font-semibold">{c.id}</td>
                    <td className="px-4 py-3">{c.citizen_name}</td>
                    <td className="px-4 py-3">{c.department}</td>
                    <td className="px-4 py-3"><PriorityBadge priority={c.priority} /></td>
                    <td className="px-4 py-3"><StatusBadge status={c.status} /></td>
                    <td className="px-4 py-3 text-slate-500">{c.submitted_at}</td>
                    <td className="px-4 py-3">{c.assigned_officer_name || <span className="text-slate-400 italic">Unassigned</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
