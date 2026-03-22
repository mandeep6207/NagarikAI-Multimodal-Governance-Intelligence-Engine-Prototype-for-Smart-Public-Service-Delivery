"use client";
import { useCallback, useEffect, useState } from "react";
import { api } from "../../../services/api";
import { FileWarning, RefreshCw, Search, AlertTriangle, Shield } from "lucide-react";
import { toast } from "sonner";

export default function FraudDetectionPage() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.fetchFraudAlerts();
      setAlerts(res.fraud_alerts ?? []);
    } catch {
      toast.error("Failed to load fraud alerts");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const activeCount = alerts.filter(a => a.status !== "Cleared").length;
  const criticalCount = alerts.filter(a => a.severity === "Critical").length;
  const highCount = alerts.filter(a => a.severity === "High").length;

  return (
    <div className="max-w-[1400px] mx-auto space-y-5">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-xl font-bold text-[#0B3C5D] uppercase tracking-tight">Fraud Detection Center</h1>
          <p className="text-xs text-slate-500 mt-0.5">AI-powered fraud monitoring — Duplicate Aadhaar, document mismatches, multiple claims</p>
        </div>
        <button onClick={fetchData} className="gov-btn-secondary flex items-center gap-2">
          <RefreshCw size={13} className={loading ? "animate-spin" : ""} /> Refresh
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="gov-kpi p-3">
          <div className="text-[11px] text-slate-500 uppercase">Total Alerts</div>
          <div className="text-xl font-bold text-[#0B3C5D]">{alerts.length}</div>
        </div>
        <div className="gov-kpi p-3">
          <div className="text-[11px] text-slate-500 uppercase">Active</div>
          <div className="text-xl font-bold text-amber-700">{activeCount}</div>
        </div>
        <div className="gov-kpi p-3">
          <div className="text-[11px] text-slate-500 uppercase">Critical</div>
          <div className="text-xl font-bold text-red-700">{criticalCount}</div>
        </div>
        <div className="gov-kpi p-3">
          <div className="text-[11px] text-slate-500 uppercase">High Severity</div>
          <div className="text-xl font-bold text-orange-700">{highCount}</div>
        </div>
      </div>

      {/* Alerts Table */}
      <div className="gov-card">
        <div className="gov-panel-header bg-red-50 text-red-900 border-red-200"><FileWarning size={14} /> Fraud Alert Records</div>
        <div className="overflow-x-auto">
          <table className="gov-table">
            <thead>
              <tr>
                <th>Alert ID</th>
                <th>Type</th>
                <th>Severity</th>
                <th>Citizen</th>
                <th>Aadhaar</th>
                <th>District</th>
                <th>Schemes Involved</th>
                <th>Status</th>
                <th>Detected</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={9} className="text-center py-8 text-slate-400">Loading…</td></tr>
              ) : (
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                alerts.map((a: any) => (
                  <tr key={a.id} className={a.severity === "Critical" ? "bg-red-50/50" : a.severity === "High" ? "bg-orange-50/30" : ""}>
                    <td className="font-mono text-xs">{a.id}</td>
                    <td className="text-xs">
                      <div className="flex items-center gap-1">
                        {a.type === "Duplicate Aadhaar Across Schemes" && <AlertTriangle size={12} className="text-red-600" />}
                        {a.type === "Document Mismatch" && <Search size={12} className="text-amber-600" />}
                        {a.type === "Multiple Scheme Claims by Same Citizen" && <Shield size={12} className="text-purple-600" />}
                        <span>{a.type}</span>
                      </div>
                    </td>
                    <td><SeverityBadge severity={a.severity} /></td>
                    <td className="font-semibold">{a.citizen_name}</td>
                    <td className="font-mono text-xs">{a.aadhaar}</td>
                    <td>{a.district}</td>
                    <td className="text-xs">{a.schemes_involved?.join(", ")}</td>
                    <td><FraudStatusBadge status={a.status} /></td>
                    <td className="text-xs whitespace-nowrap">{a.detected_at?.slice(0, 10)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Descriptions */}
      <div className="gov-card">
        <div className="gov-panel-header"><Search size={14} /> Alert Details</div>
        <div className="divide-y divide-[#cfd6e3]">
          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
          {alerts.filter(a => a.status !== "Cleared").map((a: any) => (
            <div key={a.id} className="p-3">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-mono text-xs font-bold text-[#0B3C5D]">{a.id}</span>
                <SeverityBadge severity={a.severity} />
              </div>
              <p className="text-xs text-slate-600">{a.description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function SeverityBadge({ severity }: { severity: string }) {
  const cls: Record<string, string> = {
    Critical: "bg-red-100 text-red-800 border-red-300",
    High: "bg-orange-100 text-orange-800 border-orange-300",
    Medium: "bg-amber-100 text-amber-800 border-amber-300",
  };
  return <span className={`text-[11px] px-2 py-0.5 font-semibold border rounded ${cls[severity] || cls.Medium}`}>{severity}</span>;
}

function FraudStatusBadge({ status }: { status: string }) {
  const cls: Record<string, string> = {
    "Under Investigation": "bg-amber-100 text-amber-800 border-amber-300",
    Flagged: "bg-red-100 text-red-800 border-red-300",
    Cleared: "bg-green-100 text-green-800 border-green-300",
  };
  return <span className={`text-[11px] px-2 py-0.5 font-semibold border rounded ${cls[status] || cls.Flagged}`}>{status}</span>;
}
