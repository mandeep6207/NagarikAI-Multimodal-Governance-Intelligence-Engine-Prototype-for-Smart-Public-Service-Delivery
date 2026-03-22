"use client";
import { useCallback, useEffect, useState } from "react";
import { api } from "../../../services/api";
import { Landmark, RefreshCw, ArrowLeft, FileText, CheckCircle } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { toast } from "sonner";

const SCHEME_COLORS = ["#0B3C5D", "#1e40af", "#0d9488", "#7c3aed"];

export default function SchemeIntelligencePage() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [data, setData] = useState<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [selectedScheme, setSelectedScheme] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.fetchSchemeAnalytics();
      setData(res);
    } catch {
      toast.error("Failed to load scheme data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const schemes = data?.schemes ?? [];

  if (selectedScheme) {
    return <SchemeDetail scheme={selectedScheme} onBack={() => setSelectedScheme(null)} />;
  }

  return (
    <div className="max-w-[1400px] mx-auto space-y-5">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-xl font-bold text-[#0B3C5D] uppercase tracking-tight">Scheme Intelligence Panel</h1>
          <p className="text-xs text-slate-500 mt-0.5">Government scheme analytics — Eligibility, enrollment, and coverage</p>
        </div>
        <button onClick={fetchData} className="gov-btn-secondary flex items-center gap-2">
          <RefreshCw size={13} className={loading ? "animate-spin" : ""} /> Refresh
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-pulse">
          {[1,2,3,4].map(i => <div key={i} className="h-56 bg-slate-200 rounded" />)}
        </div>
      ) : (
        <>
          {/* Overview chart */}
          <div className="gov-card">
            <div className="gov-panel-header"><Landmark size={14} /> Scheme Coverage Overview</div>
            <div className="p-4">
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={schemes}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={{ fontSize: 12 }} />
                  <Bar dataKey="total_eligible" name="Eligible" fill="#0B3C5D" radius={[2, 2, 0, 0]} />
                  <Bar dataKey="total_enrolled" name="Enrolled" fill="#FF9933" radius={[2, 2, 0, 0]} />
                  <Bar dataKey="uncovered" name="Uncovered" fill="#C62828" opacity={0.7} radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Scheme Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {schemes.map((s: any, i: number) => (
              <button key={s.id} onClick={() => setSelectedScheme(s)} className="gov-card text-left hover:shadow-md transition-shadow cursor-pointer w-full">
                <div className="p-0">
                  <div className="p-3 border-b border-[#cfd6e3]" style={{ borderLeft: `4px solid ${SCHEME_COLORS[i % SCHEME_COLORS.length]}` }}>
                    <div className="text-sm font-bold text-[#0B3C5D]">{s.name}</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">{s.description}</div>
                  </div>
                  <div className="p-3 grid grid-cols-3 gap-3 text-xs">
                    <div>
                      <span className="text-slate-500 uppercase font-semibold block text-[10px]">Total Eligible</span>
                      <span className="text-lg font-bold text-[#0B3C5D]">{s.total_eligible}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 uppercase font-semibold block text-[10px]">Enrolled</span>
                      <span className="text-lg font-bold text-green-700">{s.total_enrolled}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 uppercase font-semibold block text-[10px]">Uncovered</span>
                      <span className="text-lg font-bold text-red-700">{s.uncovered}</span>
                    </div>
                  </div>
                  <div className="px-3 pb-3">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2.5 bg-slate-200 rounded overflow-hidden">
                        <div className="h-full bg-[#0B3C5D] rounded" style={{ width: `${Math.min(100, s.coverage_pct)}%` }} />
                      </div>
                      <span className="text-xs font-bold text-[#0B3C5D]">{s.coverage_pct}%</span>
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function SchemeDetail({ scheme, onBack }: { scheme: any; onBack: () => void }) {
  return (
    <div className="max-w-[1400px] mx-auto space-y-5">
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="gov-btn-secondary flex items-center gap-1"><ArrowLeft size={14} /> Back</button>
        <div>
          <h1 className="text-xl font-bold text-[#0B3C5D] uppercase tracking-tight">{scheme.name}</h1>
          <p className="text-xs text-slate-500">{scheme.description}</p>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="gov-kpi p-3">
          <div className="text-[11px] text-slate-500 uppercase">Total Eligible</div>
          <div className="text-xl font-bold text-[#0B3C5D]">{scheme.total_eligible}</div>
        </div>
        <div className="gov-kpi p-3">
          <div className="text-[11px] text-slate-500 uppercase">Enrolled</div>
          <div className="text-xl font-bold text-green-700">{scheme.total_enrolled}</div>
        </div>
        <div className="gov-kpi p-3">
          <div className="text-[11px] text-slate-500 uppercase">Uncovered</div>
          <div className="text-xl font-bold text-red-700">{scheme.uncovered}</div>
        </div>
        <div className="gov-kpi p-3">
          <div className="text-[11px] text-slate-500 uppercase">Coverage</div>
          <div className="text-xl font-bold text-[#0B3C5D]">{scheme.coverage_pct}%</div>
        </div>
      </div>

      {/* Required Documents */}
      <div className="gov-card">
        <div className="gov-panel-header"><FileText size={14} /> Required Documents</div>
        <div className="p-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {scheme.required_documents?.map((doc: string, i: number) => (
              <div key={i} className="flex items-center gap-2 text-sm text-slate-700 bg-slate-50 border border-[#cfd6e3] p-2 rounded-sm">
                <CheckCircle size={14} className="text-green-600 shrink-0" />
                {doc}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Eligibility Rules */}
      <div className="gov-card">
        <div className="gov-panel-header"><FileText size={14} /> Eligibility Rules</div>
        <div className="p-3 space-y-1.5">
          {scheme.eligibility_rules?.map((rule: string, i: number) => (
            <div key={i} className="flex items-start gap-2 text-sm text-slate-700">
              <span className="text-[#0B3C5D] font-bold mt-0.5">{i + 1}.</span>
              {rule}
            </div>
          ))}
        </div>
      </div>

      {/* District Coverage */}
      <div className="gov-card">
        <div className="gov-panel-header"><Landmark size={14} /> District-wise Coverage</div>
        <div className="overflow-x-auto">
          <table className="gov-table">
            <thead><tr><th>District</th><th>Eligible</th><th>Enrolled</th><th>Coverage %</th></tr></thead>
            <tbody>
              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
              {scheme.district_coverage?.map((d: any) => (
                <tr key={d.district}>
                  <td className="font-semibold text-[#0B3C5D]">{d.district}</td>
                  <td>{d.eligible}</td>
                  <td>{d.enrolled}</td>
                  <td>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 bg-slate-200 rounded overflow-hidden">
                        <div className="h-full bg-[#0B3C5D] rounded" style={{ width: `${Math.min(100, d.coverage_pct)}%` }} />
                      </div>
                      <span className="text-xs font-bold">{d.coverage_pct}%</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
