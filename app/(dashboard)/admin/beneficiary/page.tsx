"use client";

import { useEffect, useState } from "react";
import { api } from "../../../services/api";

type Candidate = {
  aadhaar_id: string;
  name: string;
  district: string;
  confidence_score: number;
  status: string;
  explainability_reason: string;
  ration_match_found: boolean;
};

type BeneficiaryResponse = {
  eligible_count: number;
  list_of_candidates: Candidate[];
};

export default function AdminBeneficiaryPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<BeneficiaryResponse | null>(null);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.discoverBeneficiaries();
      setData(res);
    } catch {
      setError("Failed to fetch beneficiary discovery data.");
    } finally {
      setLoading(false);
    }
  };

  const exportCsv = () => {
    if (!data?.list_of_candidates?.length) return;
    const headers = ["Aadhaar ID", "Name", "District", "Confidence", "Status", "Ration Match", "Reason"];
    const rows = data.list_of_candidates.map((item) => [
      item.aadhaar_id,
      item.name,
      item.district,
      `${item.confidence_score}`,
      item.status,
      item.ration_match_found ? "Yes" : "No",
      item.explainability_reason,
    ]);
    const csv = [headers, ...rows].map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "beneficiary_mis_report.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Beneficiary Engine</h1>
          <p className="text-slate-500 text-sm mt-1">Unified beneficiary discovery and eligibility insights.</p>
        </div>
        <button onClick={loadData} className="bg-white border border-slate-200 px-4 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50">
          Refresh
        </button>
      </div>

      <section className="gov-card p-5">
        {loading && <p className="text-slate-500">Loading data...</p>}
        {error && <p className="text-red-600">{error}</p>}
        {!loading && !error && data && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="gov-kpi p-4">
                <p className="text-xs uppercase tracking-wider text-slate-500 font-semibold">Eligible Count</p>
                <p className="text-3xl font-bold text-slate-800 mt-1">{data.eligible_count}</p>
              </div>
              <div className="gov-kpi p-4">
                <p className="text-xs uppercase tracking-wider text-slate-500 font-semibold">High Confidence</p>
                <p className="text-3xl font-bold text-slate-800 mt-1">
                  {data.list_of_candidates.filter((item) => item.status === "high confidence").length}
                </p>
              </div>
              <div className="gov-kpi p-4">
                <p className="text-xs uppercase tracking-wider text-slate-500 font-semibold">Ration Match Found</p>
                <p className="text-3xl font-bold text-slate-800 mt-1">
                  {data.list_of_candidates.filter((item) => item.ration_match_found).length}
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex justify-end">
                <button onClick={exportCsv} className="gov-btn-secondary px-3 py-1.5 text-xs font-semibold">Export to CSV</button>
              </div>
              {data.list_of_candidates.length === 0 ? (
                <p className="text-sm text-slate-500">No eligible candidates found in current run.</p>
              ) : (
                <div className="overflow-x-auto border border-[#cfd6e3]">
                  <table className="gov-table min-w-[860px]">
                    <thead>
                      <tr>
                        <th>Aadhaar ID</th>
                        <th>Name</th>
                        <th>District</th>
                        <th>Confidence</th>
                        <th>Status</th>
                        <th>Ration Match</th>
                        <th>Explainability Reason</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.list_of_candidates.slice(0, 20).map((item) => (
                        <tr key={item.aadhaar_id}>
                          <td>{item.aadhaar_id}</td>
                          <td>{item.name}</td>
                          <td>{item.district}</td>
                          <td>{item.confidence_score}%</td>
                          <td>{item.status}</td>
                          <td>{item.ration_match_found ? "Yes" : "No"}</td>
                          <td>{item.explainability_reason}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
