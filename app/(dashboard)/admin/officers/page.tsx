"use client";
import { useCallback, useEffect, useState } from "react";
import { api } from "../../../services/api";
import { UserCog, RefreshCw, ArrowRightLeft, UserCircle2 } from "lucide-react";
import { toast } from "sonner";

const DISTRICTS = ["Raipur", "Bilaspur", "Durg", "Korba", "Jagdalpur"];

export default function OfficerManagementPage() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [officers, setOfficers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterDistrict, setFilterDistrict] = useState("");
  const [reassigning, setReassigning] = useState<string | null>(null);
  const [newDistrict, setNewDistrict] = useState("");

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.fetchSuperAdminOfficers(filterDistrict || undefined);
      setOfficers(res.officers ?? []);
    } catch {
      toast.error("Failed to load officers");
    } finally {
      setLoading(false);
    }
  }, [filterDistrict]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleReassign = async (officerId: string) => {
    if (!newDistrict) return;
    try {
      await api.reassignOfficer(officerId, newDistrict);
      toast.success("Officer reassigned successfully");
      setReassigning(null);
      setNewDistrict("");
      fetchData();
    } catch {
      toast.error("Failed to reassign officer");
    }
  };

  return (
    <div className="max-w-[1400px] mx-auto space-y-5">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-xl font-bold text-[#0B3C5D] uppercase tracking-tight">Officer Management Panel</h1>
          <p className="text-xs text-slate-500 mt-0.5">Manage and reassign officers across districts — {officers.length} officers</p>
        </div>
        <button onClick={fetchData} className="gov-btn-secondary flex items-center gap-2">
          <RefreshCw size={13} className={loading ? "animate-spin" : ""} /> Refresh
        </button>
      </div>

      {/* Filter */}
      <div className="gov-card">
        <div className="gov-panel-header"><UserCog size={14} /> Filter by District</div>
        <div className="p-3">
          <select value={filterDistrict} onChange={(e) => setFilterDistrict(e.target.value)} className="border border-[#cfd6e3] bg-white px-3 py-1.5 text-sm rounded-sm focus:outline-none focus:border-[#0B3C5D]">
            <option value="">All Districts</option>
            {DISTRICTS.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>
      </div>

      {/* Officers Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-pulse">
          {[1,2,3,4,5,6].map(i => <div key={i} className="h-56 bg-slate-200 rounded" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
          {officers.map((o: any) => (
            <div key={o.id} className="gov-card">
              <div className="p-4">
                <div className="flex items-start gap-3">
                  {/* Photo placeholder */}
                  <div className="w-14 h-14 bg-[#0B3C5D] rounded flex items-center justify-center shrink-0">
                    <UserCircle2 size={28} className="text-white/80" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-bold text-[#0B3C5D] truncate">{o.name}</div>
                    <div className="text-xs text-slate-500">{o.designation}</div>
                    <div className="text-[11px] text-slate-400 mt-0.5">{o.id}</div>
                  </div>
                </div>

                <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-slate-500 uppercase font-semibold block text-[10px]">District</span>
                    <span className="font-semibold text-[#0B3C5D]">{o.district}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 uppercase font-semibold block text-[10px]">Department</span>
                    <span className="font-semibold">{o.department}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 uppercase font-semibold block text-[10px]">Cases Assigned</span>
                    <span className="font-bold text-amber-700">{o.cases_assigned}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 uppercase font-semibold block text-[10px]">Performance</span>
                    <span className={`font-bold ${o.performance_score >= 80 ? "text-green-700" : o.performance_score >= 60 ? "text-amber-700" : "text-red-700"}`}>{o.performance_score}%</span>
                  </div>
                </div>

                {/* Contact */}
                <div className="mt-2 text-[11px] text-slate-500 space-y-0.5">
                  <div>{o.phone}</div>
                  <div>{o.email}</div>
                </div>

                {/* Reassign */}
                <div className="mt-3 pt-3 border-t border-[#cfd6e3]">
                  {reassigning === o.id ? (
                    <div className="flex gap-2">
                      <select value={newDistrict} onChange={(e) => setNewDistrict(e.target.value)} className="flex-1 border border-[#cfd6e3] bg-white px-2 py-1 text-xs rounded-sm">
                        <option value="">Select district</option>
                        {DISTRICTS.filter(d => d !== o.district).map(d => <option key={d} value={d}>{d}</option>)}
                      </select>
                      <button onClick={() => handleReassign(o.id)} className="gov-btn-primary text-[11px] px-3 py-1">Assign</button>
                      <button onClick={() => { setReassigning(null); setNewDistrict(""); }} className="gov-btn-secondary text-[11px] px-3 py-1">Cancel</button>
                    </div>
                  ) : (
                    <button onClick={() => setReassigning(o.id)} className="gov-btn-secondary flex items-center gap-1.5 text-[11px] w-full justify-center">
                      <ArrowRightLeft size={12} /> Reassign District
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
