"use client";
import { useCallback, useEffect, useState } from "react";
import { api } from "../../../services/api";
import {
  ShieldAlert, AlertTriangle, Users, FileWarning, Fingerprint,
  Skull, Filter, ChevronDown, Eye,
} from "lucide-react";

const SEVERITY_COLORS: Record<string, string> = {
  critical: "bg-red-100 text-red-800 border-red-200",
  high: "bg-orange-100 text-orange-800 border-orange-200",
  medium: "bg-amber-100 text-amber-800 border-amber-200",
  low: "bg-blue-100 text-blue-800 border-blue-200",
};

const TYPE_ICONS: Record<string, React.ReactNode> = {
  duplicate_aadhaar: <Fingerprint size={14} />,
  document_forgery: <FileWarning size={14} />,
  multiple_claims: <Users size={14} />,
  identity_mismatch: <AlertTriangle size={14} />,
  deceased_beneficiary: <Skull size={14} />,
};

const TYPE_LABELS: Record<string, string> = {
  duplicate_aadhaar: "Duplicate Aadhaar",
  document_forgery: "Document Forgery",
  multiple_claims: "Multiple Claims",
  identity_mismatch: "Identity Mismatch",
  deceased_beneficiary: "Deceased Beneficiary",
};

export default function FraudDetectionPage() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [severityFilter, setSeverityFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [expanded, setExpanded] = useState<string | null>(null);

  const userDistrict =
    typeof window !== "undefined" ? localStorage.getItem("userDistrict") || "Raipur" : "Raipur";

  const fetchAlerts = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = { district: userDistrict };
      if (severityFilter) params.severity = severityFilter;
      if (typeFilter) params.type = typeFilter;
      const res = await api.fetchCscFraudAlerts(params);
      setAlerts(res?.alerts ?? []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [userDistrict, severityFilter, typeFilter]);

  useEffect(() => { fetchAlerts(); }, [fetchAlerts]);

  const typeCounts: Record<string, number> = {};
  const severityCounts: Record<string, number> = {};
  alerts.forEach((a) => {
    typeCounts[a.fraud_type] = (typeCounts[a.fraud_type] || 0) + 1;
    severityCounts[a.severity] = (severityCounts[a.severity] || 0) + 1;
  });

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#0B3C5D] flex items-center gap-2">
          <ShieldAlert size={24} /> Fraud Detection & Alerts
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          AI-detected anomalies and suspicious activities across scheme applications and documents
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { label: "Total Alerts", value: alerts.length, icon: ShieldAlert, color: "text-red-600", bg: "bg-red-50 border-red-200" },
          { label: "Duplicate Aadhaar", value: typeCounts["duplicate_aadhaar"] || 0, icon: Fingerprint, color: "text-purple-600", bg: "bg-purple-50 border-purple-200" },
          { label: "Document Forgery", value: typeCounts["document_forgery"] || 0, icon: FileWarning, color: "text-orange-600", bg: "bg-orange-50 border-orange-200" },
          { label: "Multiple Claims", value: typeCounts["multiple_claims"] || 0, icon: Users, color: "text-blue-600", bg: "bg-blue-50 border-blue-200" },
          { label: "Deceased Beneficiary", value: typeCounts["deceased_beneficiary"] || 0, icon: Skull, color: "text-slate-600", bg: "bg-slate-50 border-slate-200" },
        ].map((c) => (
          <div key={c.label} className={`rounded-xl border p-4 shadow-sm ${c.bg}`}>
            <div className="flex items-center gap-2 mb-1">
              <c.icon size={14} className={c.color} />
              <span className="text-xs uppercase font-semibold text-slate-500">{c.label}</span>
            </div>
            <div className={`text-2xl font-bold ${c.color}`}>{c.value}</div>
          </div>
        ))}
      </div>

      {/* Severity Breakdown */}
      <div className="grid grid-cols-4 gap-3">
        {["critical", "high", "medium", "low"].map((sev) => (
          <button
            key={sev}
            onClick={() => setSeverityFilter(severityFilter === sev ? "" : sev)}
            className={`rounded-lg px-4 py-2 text-sm font-semibold border transition ${
              severityFilter === sev
                ? SEVERITY_COLORS[sev] + " ring-2 ring-offset-1 ring-current"
                : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
            }`}
          >
            <div className="uppercase text-xs">{sev}</div>
            <div className="text-lg font-bold">{severityCounts[sev] || 0}</div>
          </button>
        ))}
      </div>

      {/* Filters & List */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm">
        <div className="flex items-center justify-between px-5 py-3 border-b border-slate-200">
          <h3 className="text-sm font-bold text-[#0B3C5D] flex items-center gap-2">
            <Filter size={14} /> Fraud Alerts
          </h3>
          <div className="flex items-center gap-3">
            <div className="relative">
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="border border-slate-200 rounded-lg pl-3 pr-8 py-1.5 text-xs appearance-none focus:outline-none focus:border-[#0B3C5D]"
              >
                <option value="">All Types</option>
                {Object.entries(TYPE_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
              <ChevronDown size={12} className="absolute right-2.5 top-2.5 text-slate-400 pointer-events-none" />
            </div>
          </div>
        </div>

        {loading ? (
          <div className="p-8 text-center text-slate-400">Loading alerts...</div>
        ) : alerts.length === 0 ? (
          <div className="p-8 text-center text-slate-400">
            <ShieldAlert size={40} className="mx-auto mb-2 opacity-30" />
            No fraud alerts match current filters
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {alerts.map((alert) => {
              const isExpanded = expanded === alert.id;
              const sevClass = SEVERITY_COLORS[alert.severity] || SEVERITY_COLORS.low;
              return (
                <div key={alert.id} className={`${alert.severity === "critical" ? "bg-red-50/40" : ""}`}>
                  <button
                    onClick={() => setExpanded(isExpanded ? null : alert.id)}
                    className="w-full px-5 py-4 flex items-center gap-4 text-left hover:bg-slate-50/50 transition"
                  >
                    {/* Type icon */}
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${sevClass}`}>
                      {TYPE_ICONS[alert.fraud_type] || <AlertTriangle size={14} />}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-sm font-semibold text-[#0B3C5D] truncate">
                          {TYPE_LABELS[alert.fraud_type] || alert.fraud_type}
                        </span>
                        <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${sevClass}`}>
                          {alert.severity}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 truncate">{alert.description}</p>
                    </div>

                    {/* Meta */}
                    <div className="text-right shrink-0">
                      <div className="text-xs text-slate-500">{alert.district}</div>
                      <div className="text-xs text-slate-400">{alert.detected_at}</div>
                    </div>

                    <Eye size={14} className={`shrink-0 transition ${isExpanded ? "text-[#0B3C5D]" : "text-slate-300"}`} />
                  </button>

                  {isExpanded && (
                    <div className="px-5 pb-4">
                      <div className="ml-13 bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-3">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                          <div>
                            <span className="text-xs text-slate-500 uppercase font-semibold">Alert ID</span>
                            <p className="font-mono text-xs text-[#0B3C5D] font-semibold">{alert.id}</p>
                          </div>
                          <div>
                            <span className="text-xs text-slate-500 uppercase font-semibold">Citizen</span>
                            <p className="font-medium">{alert.citizen_name || "—"}</p>
                          </div>
                          <div>
                            <span className="text-xs text-slate-500 uppercase font-semibold">Aadhaar</span>
                            <p className="font-mono">{alert.citizen_aadhaar || "—"}</p>
                          </div>
                          <div>
                            <span className="text-xs text-slate-500 uppercase font-semibold">AI Confidence</span>
                            <p className="font-bold">{(alert.ai_confidence * 100).toFixed(0)}%</p>
                          </div>
                        </div>

                        <div>
                          <span className="text-xs text-slate-500 uppercase font-semibold">Description</span>
                          <p className="text-sm text-slate-600 mt-1">{alert.description}</p>
                        </div>

                        {alert.related_applications && (
                          <div>
                            <span className="text-xs text-slate-500 uppercase font-semibold">Related Applications</span>
                            <div className="flex flex-wrap gap-1.5 mt-1">
                              {alert.related_applications.map((appId: string) => (
                                <span key={appId} className="text-xs font-mono bg-blue-100 text-blue-800 px-2 py-0.5 rounded">
                                  {appId}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        <div className="flex items-center gap-2 pt-2">
                          <span className={`text-xs font-bold uppercase px-2 py-1 rounded border ${
                            alert.status === "active" ? "bg-red-100 text-red-800 border-red-200" :
                            alert.status === "investigating" ? "bg-amber-100 text-amber-800 border-amber-200" :
                            "bg-green-100 text-green-800 border-green-200"
                          }`}>
                            {alert.status}
                          </span>
                          <span className="text-xs text-slate-400">Flagged by AI on {alert.detected_at}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
