"use client";

import { useEffect, useState } from "react";
import { api } from "../../../services/api";

type OfficerStats = {
  id: string;
  name: string;
  open_cases: number;
  avg_resolution_time: number;
};

type WorkloadResponse = {
  officer_stats: OfficerStats[];
  redistribution_recommendation: {
    from_officer: string;
    to_officer: string;
    suggested_transfer_count: number;
    reason: string;
  };
};

export default function OfficerWorkloadPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<WorkloadResponse | null>(null);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.fetchWorkload();
      setData(res);
    } catch {
      setError("Failed to fetch workload data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Workload Balancer</h1>
          <p className="text-slate-500 text-sm mt-1">Balance officer assignment load and improve SLA coverage.</p>
        </div>
        <button onClick={loadData} className="bg-white border border-slate-200 px-4 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50">
          Refresh
        </button>
      </div>

      <section className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        {loading && <p className="text-slate-500">Loading data...</p>}
        {error && <p className="text-red-600">{error}</p>}
        {!loading && !error && data && (
          <div className="space-y-5">
            <div className="space-y-3">
              {data.officer_stats.map((officer) => {
                const pct = Math.min(100, (officer.open_cases / 100) * 100);
                return (
                  <div key={officer.id} className="border border-slate-200 rounded-xl p-4">
                    <div className="flex justify-between text-sm mb-2">
                      <span className="font-semibold text-slate-700">{officer.name}</span>
                      <span className="text-slate-500">{officer.open_cases} open • avg {officer.avg_resolution_time.toFixed(1)} days</span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div className={`h-2 ${pct > 70 ? "bg-red-500" : pct > 40 ? "bg-amber-500" : "bg-green-500"}`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="border border-indigo-200 bg-indigo-50 rounded-xl p-4">
              <p className="text-sm font-semibold text-indigo-800">Redistribution Recommendation</p>
              <p className="text-sm text-indigo-700 mt-1">
                Move {data.redistribution_recommendation.suggested_transfer_count} cases from {data.redistribution_recommendation.from_officer} to {data.redistribution_recommendation.to_officer}.
              </p>
              <p className="text-xs text-indigo-700 mt-2">{data.redistribution_recommendation.reason}</p>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
