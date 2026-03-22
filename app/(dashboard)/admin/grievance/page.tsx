"use client";

import { useEffect, useState } from "react";
import { api } from "../../../services/api";
import SectionDivider from "../../../components/gov/SectionDivider";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";

type GrievanceResponse = {
  department: string;
  confidence_score: number;
  predicted_resolution_days: number;
  duplicate_flag: boolean;
  escalation_recommended: boolean;
  explainability_reason: string;
};

export default function AdminGrievancePage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<GrievanceResponse | null>(null);
  const [lastUpdated, setLastUpdated] = useState("--:--:--");

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.analyzeGrievance("पेयजल सप्लाई 7 दिनों से बाधित है, कृपया तत्काल कार्रवाई करें।", 4);
      setData(res);
      setLastUpdated(new Date().toLocaleString());
    } catch {
      setError("Failed to analyze grievance.");
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
      ["Department", data.department],
      ["Confidence", `${(data.confidence_score * 100).toFixed(1)}%`],
      ["Predicted Resolution Days", String(data.predicted_resolution_days)],
      ["Duplicate Flag", data.duplicate_flag ? "Yes" : "No"],
      ["Escalation Recommended", data.escalation_recommended ? "Yes" : "No"],
      ["Explainability", data.explainability_reason],
    ];
    const csv = [["Field", "Value"], ...rows].map((row) => row.map((cell) => `"${String(cell)}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "grievance_ai_report.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const pieData = data
    ? [
        { name: "Escalation", value: data.escalation_recommended ? 1 : 0 },
        { name: "No Escalation", value: data.escalation_recommended ? 0 : 1 },
      ]
    : [];

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[#0B3C5D] tracking-tight">Grievance Intelligence Assessment Report</h1>
          <p className="text-slate-600 text-sm mt-1">Last Updated: {lastUpdated} • Data Source: NLP Grievance Classification Service</p>
        </div>
        <div className="flex gap-2">
          <button onClick={loadData} className="gov-btn-secondary">Re-run Analysis</button>
          <button onClick={exportCsv} className="gov-btn-primary">Export CSV</button>
        </div>
      </div>

      <section className="gov-card p-5">
        {loading && <p className="text-slate-500">Loading data...</p>}
        {error && <p className="text-red-600">{error}</p>}
        {!loading && !error && data && (
          <div className="space-y-4">
            <SectionDivider title="Summary KPIs" />
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div className="gov-kpi p-4">
                <p className="text-xs uppercase text-slate-500 font-semibold">Assigned Department</p>
                <p className="text-lg font-bold text-slate-800 mt-1">{data.department}</p>
              </div>
              <div className="gov-kpi p-4">
                <p className="text-xs uppercase text-slate-500 font-semibold">Confidence</p>
                <p className="text-lg font-bold text-slate-800 mt-1">{(data.confidence_score * 100).toFixed(1)}%</p>
              </div>
              <div className="gov-kpi p-4">
                <p className="text-xs uppercase text-slate-500 font-semibold">Predicted SLA</p>
                <p className="text-lg font-bold text-slate-800 mt-1">{data.predicted_resolution_days} days</p>
              </div>
              <div className="gov-kpi p-4">
                <p className="text-xs uppercase text-slate-500 font-semibold">Escalation</p>
                <p className={`text-lg font-bold mt-1 ${data.escalation_recommended ? "text-red-600" : "text-green-600"}`}>
                  {data.escalation_recommended ? "Recommended" : "Not Required"}
                </p>
              </div>
            </div>

            <SectionDivider title="Detailed MIS Table" />
            <div className="overflow-x-auto border border-[#cfd6e3]">
              <table className="gov-table min-w-[680px]">
                <thead>
                  <tr>
                    <th>Field</th>
                    <th>Value</th>
                  </tr>
                </thead>
                <tbody>
                  <tr><td>Assigned Department</td><td>{data.department}</td></tr>
                  <tr><td>Model Confidence</td><td>{(data.confidence_score * 100).toFixed(1)}%</td></tr>
                  <tr><td>Predicted Resolution Days</td><td>{data.predicted_resolution_days}</td></tr>
                  <tr><td>Escalation Recommendation</td><td>{data.escalation_recommended ? "Yes" : "No"}</td></tr>
                  <tr><td>Duplicate Pattern Flag</td><td>{data.duplicate_flag ? "Yes" : "No"}</td></tr>
                </tbody>
              </table>
            </div>

            <SectionDivider title="Analytical Visual" />
            <div className="gov-card p-4 border-[#cfd6e3]">
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-sm font-semibold text-slate-700">Escalation Distribution</h3>
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
              <p className="text-[11px] text-slate-500 mt-2">Data Source: Grievance Classification Service • Legend included • Timestamp: {lastUpdated}</p>
            </div>

            <SectionDivider title="Formal Remarks" />
            <div className="border border-[#d3dbe7] bg-[#f8fbff] p-4 text-sm text-slate-700">
              <p>{data.explainability_reason}</p>
              {data.duplicate_flag && <p className="mt-2 text-[#C62828]">Duplicate grievance pattern detected in historical records.</p>}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
