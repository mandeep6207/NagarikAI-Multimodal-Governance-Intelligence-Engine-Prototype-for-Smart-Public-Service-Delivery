"use client";
import { useCallback, useEffect, useState } from "react";
import { api } from "../../../services/api";
import { Users, Briefcase, CheckCircle, UserPlus } from "lucide-react";
import { toast } from "sonner";

export default function FieldOfficerAssignmentPage() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [officers, setOfficers] = useState<any[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [unassigned, setUnassigned] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [assigningId, setAssigningId] = useState<string | null>(null);
  const [selectedOfficer, setSelectedOfficer] = useState<string>("");

  const userDistrict =
    typeof window !== "undefined" ? localStorage.getItem("userDistrict") || undefined : undefined;

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [officerRes, complaintsRes] = await Promise.all([
        api.fetchFieldOfficers(userDistrict),
        api.fetchOfficerComplaints({ district: userDistrict, status: "Open" }),
      ]);
      setOfficers(officerRes?.officers ?? []);
      setUnassigned(complaintsRes?.complaints ?? []);
    } catch (e) {
      toast.error("Failed to load data");
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [userDistrict]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleAssign = async (complaintId: string) => {
    if (!selectedOfficer) {
      toast.error("Select a field officer first");
      return;
    }
    setAssigningId(complaintId);
    try {
      await api.assignComplaintToOfficer(complaintId, selectedOfficer);
      toast.success(`Complaint ${complaintId} assigned successfully`);
      setSelectedOfficer("");
      await fetchData();
    } catch (e) {
      toast.error(`Assignment failed: ${e instanceof Error ? e.message : "unknown"}`);
    } finally {
      setAssigningId(null);
    }
  };

  const loadColor = (cases: number) => {
    if (cases >= 8) return "bg-red-500";
    if (cases >= 4) return "bg-amber-500";
    return "bg-green-500";
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#0B3C5D]">Field Officer Assignment</h1>
        <p className="text-slate-500 text-sm mt-1">
          Manage field officers and assign complaints
          {userDistrict && <span className="ml-2 font-semibold text-[#0B3C5D]">• {userDistrict}</span>}
        </p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-pulse">
          {[1, 2, 3, 4, 5, 6].map((i) => <div key={i} className="h-48 bg-slate-200 rounded-xl" />)}
        </div>
      ) : (
        <>
          {/* Officer Cards */}
          <div>
            <h2 className="text-sm font-bold text-[#0B3C5D] uppercase tracking-wide mb-4 flex items-center gap-2">
              <Users size={16} /> Available Field Officers ({officers.length})
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {officers.map((o) => (
                <div key={o.id} className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
                  <div className="flex items-start gap-4">
                    {/* Photo Placeholder */}
                    <div className="w-14 h-14 bg-[#0B3C5D] rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-white font-bold text-lg">
                        {o.name.split(" ").map((w: string) => w[0]).join("").slice(0, 2)}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-[#0B3C5D] truncate">{o.name}</h3>
                      <p className="text-xs text-slate-500">{o.designation}</p>
                      <p className="text-xs text-slate-500">{o.department} • {o.district}</p>
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-3">
                    <div className="bg-slate-50 rounded-lg p-2 text-center">
                      <p className="text-lg font-bold text-[#0B3C5D]">{o.active_cases}</p>
                      <p className="text-xs text-slate-500">Active Cases</p>
                    </div>
                    <div className="bg-slate-50 rounded-lg p-2 text-center">
                      <p className="text-lg font-bold text-green-600">{o.resolved_cases}</p>
                      <p className="text-xs text-slate-500">Resolved</p>
                    </div>
                  </div>

                  {/* Workload Bar */}
                  <div className="mt-3">
                    <div className="flex justify-between text-xs text-slate-500 mb-1">
                      <span>Workload</span>
                      <span>Score: {o.performance_score}%</span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-2 rounded-full ${loadColor(o.active_cases)}`}
                        style={{ width: `${Math.min(100, (o.active_cases / 12) * 100)}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Unassigned Complaints */}
          <div>
            <h2 className="text-sm font-bold text-[#0B3C5D] uppercase tracking-wide mb-4 flex items-center gap-2">
              <Briefcase size={16} /> Unassigned Complaints ({unassigned.length})
            </h2>

            {unassigned.length === 0 ? (
              <div className="bg-white border border-slate-200 rounded-xl p-8 text-center text-slate-400">
                <CheckCircle size={40} className="mx-auto mb-3 text-green-400" />
                <p>All complaints have been assigned</p>
              </div>
            ) : (
              <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-[#0B3C5D] text-white">
                        <th className="text-left px-4 py-3 font-semibold">Complaint ID</th>
                        <th className="text-left px-4 py-3 font-semibold">Citizen</th>
                        <th className="text-left px-4 py-3 font-semibold">Department</th>
                        <th className="text-left px-4 py-3 font-semibold">Priority</th>
                        <th className="text-left px-4 py-3 font-semibold">Submitted</th>
                        <th className="text-left px-4 py-3 font-semibold">Assign To</th>
                        <th className="text-left px-4 py-3 font-semibold">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {unassigned.map((c, idx) => (
                        <tr key={c.id} className={idx % 2 === 0 ? "bg-white" : "bg-slate-50"}>
                          <td className="px-4 py-3 font-mono text-xs text-[#0B3C5D] font-semibold">{c.id}</td>
                          <td className="px-4 py-3">{c.citizen_name}</td>
                          <td className="px-4 py-3">{c.department}</td>
                          <td className="px-4 py-3">
                            <span className={`text-xs font-semibold px-2 py-0.5 rounded ${
                              c.priority === "Critical" ? "bg-red-100 text-red-800" :
                              c.priority === "High" ? "bg-orange-100 text-orange-800" :
                              c.priority === "Medium" ? "bg-blue-100 text-blue-800" :
                              "bg-green-100 text-green-800"
                            }`}>{c.priority}</span>
                          </td>
                          <td className="px-4 py-3 text-slate-500">{c.submitted_at}</td>
                          <td className="px-4 py-3">
                            <select
                              value={assigningId === c.id ? selectedOfficer : ""}
                              onChange={(e) => { setAssigningId(c.id); setSelectedOfficer(e.target.value); }}
                              className="text-xs border border-slate-200 rounded px-2 py-1.5 bg-white w-full max-w-[160px]"
                            >
                              <option value="">Select Officer</option>
                              {officers.map((o) => (
                                <option key={o.id} value={o.id}>
                                  {o.name} ({o.active_cases} cases)
                                </option>
                              ))}
                            </select>
                          </td>
                          <td className="px-4 py-3">
                            <button
                              onClick={() => { setAssigningId(c.id); handleAssign(c.id); }}
                              disabled={assigningId === c.id && !selectedOfficer}
                              className="flex items-center gap-1 bg-[#0B3C5D] text-white px-3 py-1.5 rounded text-xs font-semibold hover:bg-[#0a3350] disabled:opacity-50"
                            >
                              <UserPlus size={12} /> Assign
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
