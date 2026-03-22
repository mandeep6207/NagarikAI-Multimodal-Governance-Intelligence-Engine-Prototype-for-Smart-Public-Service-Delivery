"use client";
import { useEffect, useState } from "react";
import { api } from "../../services/api";
import SectionDivider from "../../components/gov/SectionDivider";

type GovernanceData = {
  score: number;
  category: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  metrics?: any;
  explainable_contributions?: string[];
};

export default function ExecutivePresentation() {
  const [data, setData] = useState<GovernanceData | null>(null);
  const [lastUpdated, setLastUpdated] = useState("--:--:--");

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 60000);
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    const scoreData = await api.fetchGovernanceScore();
    setData(scoreData);
    setLastUpdated(new Date().toLocaleString());
  };

  const exportCsv = () => {
    if (!data) return;
    const rows = [
      ["Governance Score", String(data.score)],
      ["Category", data.category],
      ["Unresolved Cases", String(data?.metrics?.unresolved_cases || 0)],
      ["Escalation Count", String(data?.metrics?.escalation_count || 0)],
    ];
    const csv = [["Field", "Value"], ...rows].map((row) => row.map((cell) => `"${String(cell)}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "executive_governance_summary.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  if (!data) {
    return (
      <div className="max-w-7xl mx-auto">
        <div className="gov-card p-5 text-slate-600">Loading executive summary...</div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 print:bg-white print:text-black">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[#0B3C5D] tracking-tight">Executive Governance Summary</h1>
          <p className="text-slate-600 text-sm mt-1">Last Updated: {lastUpdated} • Data Source: Governance Scoring Service</p>
        </div>
        <div className="flex gap-2">
          <button onClick={fetchData} className="gov-btn-secondary">Refresh</button>
          <button onClick={exportCsv} className="gov-btn-primary">Export CSV</button>
          <button onClick={() => window.print()} className="gov-btn-secondary">Print</button>
        </div>
      </div>

      <section className="gov-card p-5">
        <SectionDivider title="Summary KPIs" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="gov-kpi p-4"><p className="text-xs uppercase text-slate-500 font-semibold">Governance Score</p><p className="text-3xl font-bold text-[#0B3C5D] mt-1">{data.score}</p></div>
          <div className="gov-kpi p-4"><p className="text-xs uppercase text-slate-500 font-semibold">Category</p><p className="text-xl font-bold mt-2 text-slate-800">{data.category}</p></div>
          <div className="gov-kpi p-4"><p className="text-xs uppercase text-slate-500 font-semibold">Unresolved Cases</p><p className="text-2xl font-bold text-[#C62828] mt-1">{data?.metrics?.unresolved_cases || 0}</p></div>
          <div className="gov-kpi p-4"><p className="text-xs uppercase text-slate-500 font-semibold">Escalations</p><p className="text-2xl font-bold text-[#F57C00] mt-1">{data?.metrics?.escalation_count || 0}</p></div>
        </div>

        <SectionDivider title="Detailed MIS Table" />
        <div className="overflow-x-auto border border-[#cfd6e3]">
          <table className="gov-table min-w-[700px]">
            <thead>
              <tr>
                <th>Indicator</th>
                <th>Value</th>
              </tr>
            </thead>
            <tbody>
              <tr><td>Governance Score</td><td>{data.score}</td></tr>
              <tr><td>Risk Category</td><td>{data.category}</td></tr>
              <tr><td>Unresolved Cases</td><td>{data?.metrics?.unresolved_cases || 0}</td></tr>
              <tr><td>Escalation Count</td><td>{data?.metrics?.escalation_count || 0}</td></tr>
            </tbody>
          </table>
        </div>

        <SectionDivider title="Formal Remarks" />
        <div className="border border-[#d3dbe7] bg-[#f8fbff] p-4 text-sm text-slate-700 space-y-2">
          {(data.explainable_contributions || []).map((remark, idx) => (
            <p key={idx}>• {remark}</p>
          ))}
          <p className="text-[#0B3C5D]">This view is optimized for executive print and briefing consumption with minimum UI clutter.</p>
        </div>
      </section>
    </div>
  );
}
