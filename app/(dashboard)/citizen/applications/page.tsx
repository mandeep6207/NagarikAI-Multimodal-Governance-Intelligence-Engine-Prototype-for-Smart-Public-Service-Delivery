"use client";
import { useCallback, useEffect, useState } from "react";
import { api } from "../../../services/api";
import {
  Landmark, Clock, CheckCircle2, XCircle, User,
  Search, ArrowUpDown, ChevronDown,
} from "lucide-react";

export default function CitizenApplicationsPage() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortField, setSortField] = useState("applied_at");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [expanded, setExpanded] = useState<string | null>(null);

  const fetchApps = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.fetchCitizenApplications();
      setApplications(data);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchApps(); }, [fetchApps]);

  const filtered = statusFilter === "all" ? applications : applications.filter(a => a.status === statusFilter);

  const sorted = [...filtered].sort((a, b) => {
    const va = a[sortField] || "";
    const vb = b[sortField] || "";
    return sortDir === "asc" ? (va > vb ? 1 : -1) : (va < vb ? 1 : -1);
  });

  const toggleSort = (field: string) => {
    if (sortField === field) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortField(field); setSortDir("desc"); }
  };

  const counts = {
    total: applications.length,
    approved: applications.filter(a => a.status === "approved").length,
    pending: applications.filter(a => a.status === "pending_review").length,
    rejected: applications.filter(a => a.status === "rejected").length,
  };

  const statusBadge = (status: string) => {
    const map: Record<string, string> = {
      approved: "bg-green-100 text-green-800",
      pending_review: "bg-amber-100 text-amber-800",
      rejected: "bg-red-100 text-red-800",
      under_review: "bg-blue-100 text-blue-800",
    };
    return map[status] || "bg-slate-100 text-slate-600";
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#0B3C5D]">Application Status</h1>
        <p className="text-slate-500 text-sm mt-1">Track and monitor your scheme application statuses</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Total Applications", value: counts.total, icon: Landmark, color: "bg-blue-500" },
          { label: "Approved", value: counts.approved, icon: CheckCircle2, color: "bg-green-500" },
          { label: "Pending Review", value: counts.pending, icon: Clock, color: "bg-amber-500" },
          { label: "Rejected", value: counts.rejected, icon: XCircle, color: "bg-red-500" },
        ].map(c => (
          <div key={c.label} className="bg-white border border-slate-200 rounded-xl p-4 flex items-center gap-3 shadow-sm">
            <div className={`w-10 h-10 ${c.color} rounded-lg flex items-center justify-center`}>
              <c.icon size={18} className="text-white" />
            </div>
            <div>
              <div className="text-xl font-bold text-slate-900">{c.value}</div>
              <div className="text-xs text-slate-500">{c.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Actions Bar */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2 text-sm text-slate-600">
          <Search size={14} />
          <span>{sorted.length} application{sorted.length !== 1 ? "s" : ""}</span>
        </div>
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="border border-slate-300 rounded-lg px-3 py-1.5 text-xs focus:ring-2 focus:ring-[#0B3C5D]/30"
        >
          <option value="all">All Status</option>
          <option value="approved">Approved</option>
          <option value="pending_review">Pending Review</option>
          <option value="under_review">Under Review</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-10 text-center text-sm text-slate-400">Loading applications...</div>
        ) : sorted.length === 0 ? (
          <div className="p-10 text-center text-sm text-slate-400">No applications found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[#0B3C5D] text-white text-xs">
                  {[
                    { key: "id", label: "Application ID" },
                    { key: "scheme_name", label: "Scheme" },
                    { key: "status", label: "Status" },
                    { key: "assigned_officer", label: "Assigned Officer" },
                    { key: "ai_eligible", label: "AI Eligibility" },
                    { key: "applied_at", label: "Date" },
                  ].map(col => (
                    <th
                      key={col.key}
                      className="px-4 py-2 text-left cursor-pointer hover:bg-white/10 select-none"
                      onClick={() => toggleSort(col.key)}
                    >
                      <div className="flex items-center gap-1">
                        {col.label}
                        <ArrowUpDown size={10} className={sortField === col.key ? "text-white" : "text-white/40"} />
                      </div>
                    </th>
                  ))}
                  <th className="px-4 py-2 text-left">Details</th>
                </tr>
              </thead>
              <tbody>
                {sorted.map((app, i) => (
                  <>
                    <tr key={app.id || i} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="px-4 py-2 font-mono text-xs font-bold text-[#0B3C5D]">{app.id}</td>
                      <td className="px-4 py-2">{app.scheme_name}</td>
                      <td className="px-4 py-2">
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded ${statusBadge(app.status)}`}>
                          {app.status?.replace(/_/g, " ")}
                        </span>
                      </td>
                      <td className="px-4 py-2 flex items-center gap-1.5">
                        <User size={12} className="text-slate-400" /> {app.assigned_officer || "—"}
                      </td>
                      <td className="px-4 py-2">
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded ${
                          app.ai_eligible ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                        }`}>
                          {app.ai_eligible ? "Eligible" : "Not Eligible"}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-xs text-slate-500">
                        {app.applied_at ? new Date(app.applied_at).toLocaleDateString("en-IN") : "—"}
                      </td>
                      <td className="px-4 py-2">
                        <button
                          onClick={() => setExpanded(expanded === app.id ? null : app.id)}
                          className="text-[#0B3C5D] hover:bg-slate-100 rounded-lg px-2 py-1 text-xs flex items-center gap-1"
                        >
                          <ChevronDown size={12} className={expanded === app.id ? "rotate-180 transition-transform" : "transition-transform"} />
                          {expanded === app.id ? "Hide" : "View"}
                        </button>
                      </td>
                    </tr>
                    {expanded === app.id && (
                      <tr key={`detail-${app.id}`} className="bg-slate-50">
                        <td colSpan={7} className="px-6 py-4">
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div><span className="text-slate-500 text-xs">AI Confidence:</span> <div className="font-medium">{((app.ai_confidence || 0) * 100).toFixed(0)}%</div></div>
                            <div><span className="text-slate-500 text-xs">Risk Score:</span> <div className="font-medium">{((app.ai_risk_score || 0) * 100).toFixed(0)}%</div></div>
                            <div><span className="text-slate-500 text-xs">Documents:</span> <div className="font-medium">{app.docs_uploaded}/{app.docs_total}</div></div>
                            <div><span className="text-slate-500 text-xs">District:</span> <div className="font-medium">{app.district || "—"}</div></div>
                          </div>
                          {app.ai_mismatches?.length > 0 && (
                            <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                              <div className="text-xs font-bold text-red-700 mb-1">Document Mismatches</div>
                              {app.ai_mismatches.map((m: string, idx: number) => (
                                <div key={idx} className="text-xs text-red-700 flex items-center gap-1">
                                  <XCircle size={10} /> {m}
                                </div>
                              ))}
                            </div>
                          )}
                        </td>
                      </tr>
                    )}
                  </>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
