"use client";

import { useEffect, useState } from "react";
import { api } from "../../../services/api";

type ForecastResponse = {
  risk_surge_probability: number;
  next_7_days_forecast: number[];
};

type OfficerStats = {
  id: string;
  name: string;
  open_cases: number;
  avg_resolution_time: number;
};

type WorkloadResponse = {
  officer_stats: OfficerStats[];
};

type HeatmapResponse = {
  forecast: ForecastResponse;
  workload: WorkloadResponse;
};

export default function AnalystHeatmapsPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<HeatmapResponse | null>(null);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [forecast, workload] = await Promise.all([api.fetchForecast(), api.fetchWorkload()]);
      setData({ forecast, workload });
    } catch {
      setError("Failed to fetch heatmap source data.");
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
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">System Heatmaps</h1>
          <p className="text-slate-500 text-sm mt-1">Visual risk concentration and performance heatmap insights.</p>
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                <p className="text-xs uppercase text-slate-500 font-semibold">Surge Probability</p>
                <p className="text-3xl font-bold text-slate-800 mt-1">{data.forecast.risk_surge_probability}%</p>
              </div>
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                <p className="text-xs uppercase text-slate-500 font-semibold">Forecast Total (7 days)</p>
                <p className="text-3xl font-bold text-slate-800 mt-1">{data.forecast.next_7_days_forecast.reduce((a, b) => a + b, 0)}</p>
              </div>
            </div>

            <div className="border border-slate-200 rounded-xl p-4">
              <p className="text-sm font-semibold text-slate-700 mb-3">Officer Load Heatmap</p>
              <div className="space-y-3">
                {data.workload.officer_stats.map((officer) => {
                  const ratio = Math.min(100, officer.open_cases);
                  return (
                    <div key={officer.id}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-slate-700 font-medium">{officer.name}</span>
                        <span className="text-slate-500">{officer.open_cases} cases</span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                        <div className={`h-2 ${ratio > 70 ? "bg-red-500" : ratio > 40 ? "bg-amber-500" : "bg-green-500"}`} style={{ width: `${ratio}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
