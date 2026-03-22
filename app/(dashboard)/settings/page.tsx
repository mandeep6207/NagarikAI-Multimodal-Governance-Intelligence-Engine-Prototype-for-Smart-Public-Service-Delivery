"use client";

import { useEffect, useState } from "react";
import { api } from "../../services/api";

type GovernanceResponse = {
  score: number;
  category: string;
  metrics: {
    grievance_volume: number;
    rejection_rate: number;
    unresolved_cases: number;
    escalation_count: number;
    scheme_coverage_gap: number;
  };
};

type ForecastResponse = {
  risk_surge_probability: number;
};

type SettingsResponse = {
  governance: GovernanceResponse;
  forecast: ForecastResponse;
};

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<SettingsResponse | null>(null);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [governance, forecast] = await Promise.all([api.fetchGovernanceScore(), api.fetchForecast()]);
      setData({ governance, forecast });
    } catch {
      setError("Failed to fetch system settings health data.");
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
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">System Settings</h1>
          <p className="text-slate-500 text-sm mt-1">Manage dashboard-level settings and configuration access.</p>
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                <p className="text-xs uppercase text-slate-500 font-semibold">Governance Score</p>
                <p className="text-3xl font-bold text-slate-800 mt-1">{data.governance.score}</p>
              </div>
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                <p className="text-xs uppercase text-slate-500 font-semibold">Risk Category</p>
                <p className="text-2xl font-bold text-slate-800 mt-1">{data.governance.category}</p>
              </div>
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                <p className="text-xs uppercase text-slate-500 font-semibold">Forecast Surge Risk</p>
                <p className="text-3xl font-bold text-slate-800 mt-1">{data.forecast.risk_surge_probability}%</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="border border-slate-200 rounded-xl p-4">
                <p className="text-sm font-semibold text-slate-700 mb-3">Operational Metrics</p>
                <div className="space-y-2 text-sm text-slate-700">
                  <div className="flex justify-between"><span>Grievance Volume</span><span>{data.governance.metrics.grievance_volume}</span></div>
                  <div className="flex justify-between"><span>Unresolved Cases</span><span>{data.governance.metrics.unresolved_cases}</span></div>
                  <div className="flex justify-between"><span>Escalations</span><span>{data.governance.metrics.escalation_count}</span></div>
                </div>
              </div>
              <div className="border border-slate-200 rounded-xl p-4">
                <p className="text-sm font-semibold text-slate-700 mb-3">Policy Health</p>
                <div className="space-y-2 text-sm text-slate-700">
                  <div className="flex justify-between"><span>Rejection Rate</span><span>{data.governance.metrics.rejection_rate}%</span></div>
                  <div className="flex justify-between"><span>Coverage Gap</span><span>{data.governance.metrics.scheme_coverage_gap}%</span></div>
                </div>
              </div>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
