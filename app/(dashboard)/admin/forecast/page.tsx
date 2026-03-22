"use client";

import { useEffect, useState } from "react";
import { api } from "../../../services/api";
import { Line, LineChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from "recharts";
import SectionDivider from "../../../components/gov/SectionDivider";

type ForecastResponse = {
  past_7_days_grievances: number[];
  next_7_days_forecast: number[];
  upper_bound: number[];
  lower_bound: number[];
  risk_surge_probability: number;
  explainability: string;
};

export default function AdminForecastPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<ForecastResponse | null>(null);
  const [lastUpdated, setLastUpdated] = useState("--:--:--");

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.fetchForecast();
      setData(res);
      setLastUpdated(new Date().toLocaleString());
    } catch {
      setError("Failed to fetch forecast data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const exportCsv = () => {
    if (!data) return;
    const rows = data.next_7_days_forecast.map((value, idx) => [
      `Day +${idx + 1}`,
      data.past_7_days_grievances[idx] ?? "",
      value,
      data.lower_bound[idx],
      data.upper_bound[idx],
    ]);
    const csv = [["Period", "Past Volume", "Forecast", "Lower", "Upper"], ...rows]
      .map((row) => row.map((cell) => `"${String(cell)}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "forecast_mis_report.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const chartData = data
    ? data.next_7_days_forecast.map((forecast, idx) => ({
        day: `D+${idx + 1}`,
        forecast,
        lower: data.lower_bound[idx],
        upper: data.upper_bound[idx],
      }))
    : [];

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[#0B3C5D] tracking-tight">District Forecast Intelligence Report</h1>
          <p className="text-slate-600 text-sm mt-1">Last Updated: {lastUpdated} • Data Source: Governance Forecast Engine</p>
        </div>
        <div className="flex gap-2">
          <button onClick={loadData} className="gov-btn-secondary">Refresh Data</button>
          <button onClick={exportCsv} className="gov-btn-primary">Export CSV</button>
        </div>
      </div>

      <section className="gov-card p-5 space-y-4">
        {loading && <p className="text-slate-500">Loading data...</p>}
        {error && <p className="text-red-600">{error}</p>}
        {!loading && !error && data && (
          <div className="space-y-5">
            <SectionDivider title="Summary KPIs" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="gov-kpi p-4">
                <p className="text-xs uppercase text-slate-500 font-semibold">Risk Surge Probability</p>
                <p className="text-3xl font-bold text-[#C62828] mt-1">{data.risk_surge_probability}%</p>
              </div>
              <div className="gov-kpi p-4">
                <p className="text-xs uppercase text-slate-500 font-semibold">Expected Next 7-Day Total</p>
                <p className="text-3xl font-bold text-slate-800 mt-1">{data.next_7_days_forecast.reduce((a, b) => a + b, 0)}</p>
              </div>
              <div className="gov-kpi p-4">
                <p className="text-xs uppercase text-slate-500 font-semibold">Historical 7-Day Total</p>
                <p className="text-3xl font-bold text-slate-800 mt-1">{data.past_7_days_grievances.reduce((a, b) => a + b, 0)}</p>
              </div>
            </div>

            <SectionDivider title="Detailed MIS Table" />
            <div className="overflow-x-auto border border-[#cfd6e3]">
              <table className="gov-table min-w-[760px]">
                <thead>
                  <tr>
                    <th>Period</th>
                    <th>Past Grievance Volume</th>
                    <th>Forecast Volume</th>
                    <th>Lower Bound</th>
                    <th>Upper Bound</th>
                  </tr>
                </thead>
                <tbody>
                  {data.next_7_days_forecast.map((value, idx) => (
                    <tr key={idx}>
                      <td>Day +{idx + 1}</td>
                      <td>{data.past_7_days_grievances[idx] ?? "—"}</td>
                      <td>{value}</td>
                      <td>{data.lower_bound[idx]}</td>
                      <td>{data.upper_bound[idx]}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <SectionDivider title="Analytical Visual" />
            <div className="gov-card p-4 border-[#cfd6e3]">
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-sm font-semibold text-slate-700">Forecast Trend with Confidence Bands</h3>
                <button onClick={exportCsv} className="gov-btn-secondary">Export CSV</button>
              </div>
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#d9e1ec" />
                  <XAxis dataKey="day" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="forecast" stroke="#0B3C5D" strokeWidth={2} name="Forecast" />
                  <Line type="monotone" dataKey="lower" stroke="#F9A825" strokeDasharray="5 5" name="Lower Bound" />
                  <Line type="monotone" dataKey="upper" stroke="#138808" strokeDasharray="5 5" name="Upper Bound" />
                </LineChart>
              </ResponsiveContainer>
              <p className="text-[11px] text-slate-500 mt-2">Data Source: Forecasting Service • Legend included • Timestamp: {lastUpdated}</p>
            </div>

            <SectionDivider title="Formal Remarks" />
            <div className="border border-[#d3dbe7] bg-[#f8fbff] p-4 text-sm text-slate-700">
              {data.explainability}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
