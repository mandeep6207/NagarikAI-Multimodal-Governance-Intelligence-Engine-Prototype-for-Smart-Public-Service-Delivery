"use client";

import { useEffect, useState } from "react";
import { api } from "../../../services/api";
import SectionDivider from "../../../components/gov/SectionDivider";
import { ResponsiveContainer, PieChart, Pie, Tooltip, Legend, Cell } from "recharts";

type CscResponse = {
  rejection_probability: number;
  risk_level: string;
  mismatch_fields: string[];
  explainable_contributions: string[];
  what_if_simulation: string;
};

export default function CscCopilotPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<CscResponse | null>(null);
  const [lastUpdated, setLastUpdated] = useState("--:--:--");

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.validateCSC({
        aadhaar_name: "Sita Devi",
        ration_name: "Sita Devi",
        aadhaar_address: "Ward 4, Raipur",
        ration_address: "Ward 4, Raipur",
        income: 42000,
        documents_complete: true,
      });
      setData(res);
      setLastUpdated(new Date().toLocaleString());
    } catch {
      setError("Failed to fetch CSC copilot validation.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const exportCsv = () => {
    if (!data) return;
    const rows = [
      ["Rejection Probability", `${data.rejection_probability.toFixed(1)}%`],
      ["Risk Level", data.risk_level],
      ["Mismatch Count", String(data.mismatch_fields.length)],
      ["Mismatch Fields", data.mismatch_fields.join(" | ") || "None"],
      ["Simulation", data.what_if_simulation],
    ];
    const csv = [["Field", "Value"], ...rows].map((row) => row.map((cell) => `"${String(cell)}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "csc_copilot_report.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const pieData = data
    ? [
        { name: "Mismatch", value: data.mismatch_fields.length },
        { name: "Matched", value: Math.max(0, 6 - data.mismatch_fields.length) },
      ]
    : [];

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[#0B3C5D] tracking-tight">CSC Validation Copilot Assessment Report</h1>
          <p className="text-slate-600 text-sm mt-1">Last Updated: {lastUpdated} • Data Source: Cross-document Validation Engine</p>
        </div>
        <div className="flex gap-2">
          <button onClick={loadData} className="gov-btn-secondary">Refresh</button>
          <button onClick={exportCsv} className="gov-btn-primary">Export CSV</button>
        </div>
      </div>

      <section className="gov-card p-5">
        {loading && <p className="text-slate-500">Loading data...</p>}
        {error && <p className="text-red-600">{error}</p>}
        {!loading && !error && data && (
          <div className="space-y-5">
            <SectionDivider title="Summary KPIs" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="gov-kpi p-4">
                <p className="text-xs uppercase text-slate-500 font-semibold">Rejection Probability</p>
                <p className="text-3xl font-bold text-slate-800 mt-1">{data.rejection_probability.toFixed(1)}%</p>
              </div>
              <div className="gov-kpi p-4">
                <p className="text-xs uppercase text-slate-500 font-semibold">Risk Level</p>
                <p className={`text-2xl font-bold mt-1 ${data.risk_level.includes("High") ? "text-red-600" : data.risk_level.includes("Medium") ? "text-amber-600" : "text-green-600"}`}>
                  {data.risk_level}
                </p>
              </div>
              <div className="gov-kpi p-4">
                <p className="text-xs uppercase text-slate-500 font-semibold">Mismatch Flags</p>
                <p className="text-3xl font-bold text-slate-800 mt-1">{data.mismatch_fields.length}</p>
              </div>
            </div>

            <SectionDivider title="Detailed MIS Table" />
            <div className="overflow-x-auto border border-[#cfd6e3]">
              <table className="gov-table min-w-[720px]">
                <thead>
                  <tr>
                    <th>Field</th>
                    <th>Value</th>
                  </tr>
                </thead>
                <tbody>
                  <tr><td>Rejection Probability</td><td>{data.rejection_probability.toFixed(1)}%</td></tr>
                  <tr><td>Risk Level</td><td>{data.risk_level}</td></tr>
                  <tr><td>Mismatch Count</td><td>{data.mismatch_fields.length}</td></tr>
                  <tr><td>Mismatch Fields</td><td>{data.mismatch_fields.join(", ") || "None"}</td></tr>
                  <tr><td>What-if Simulation</td><td>{data.what_if_simulation}</td></tr>
                </tbody>
              </table>
            </div>

            <SectionDivider title="Analytical Visual" />
            <div className="gov-card p-4 border-[#cfd6e3]">
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-sm font-semibold text-slate-700">Field Match vs Mismatch Distribution</h3>
                <button onClick={exportCsv} className="gov-btn-secondary">Export CSV</button>
              </div>
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie data={pieData} dataKey="value" nameKey="name" outerRadius={82} label>
                    <Cell fill="#C62828" />
                    <Cell fill="#2E7D32" />
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
              <p className="text-[11px] text-slate-500 mt-2">Data Source: CSC Validation Engine • Legend included • Timestamp: {lastUpdated}</p>
            </div>

            <SectionDivider title="Formal Remarks" />
            <div className="border border-[#d3dbe7] bg-[#f8fbff] p-4 text-sm text-slate-700 space-y-2">
              {data.explainable_contributions.map((reason, idx) => (
                <p key={idx}>• {reason}</p>
              ))}
              <p className="text-[#0B3C5D]">{data.what_if_simulation}</p>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
