"use client";
import { useCallback, useEffect, useState } from "react";
import { api } from "../../../services/api";
import { ClipboardList, CheckCircle, XCircle, FileQuestion, ArrowLeft, AlertTriangle, Shield } from "lucide-react";
import { toast } from "sonner";

const SCHEME_NAMES = ["Widow Pension", "Old Age Pension", "Farmer Insurance", "Scholarship"];
const APP_STATUSES = ["Pending", "Under Review", "Approved", "Rejected", "Documents Requested"];

export default function SchemeApplicationReviewPage() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [selectedApp, setSelectedApp] = useState<any>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [remarks, setRemarks] = useState("");
  const [filters, setFilters] = useState({ status: "", scheme: "" });

  const userDistrict =
    typeof window !== "undefined" ? localStorage.getItem("userDistrict") || undefined : undefined;

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.fetchOfficerSchemeApplications({
        district: userDistrict,
        status: filters.status || undefined,
        scheme: filters.scheme || undefined,
      });
      setApplications(res?.applications ?? []);
      setTotal(res?.total ?? 0);
    } catch (e) {
      toast.error("Failed to load scheme applications");
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [userDistrict, filters]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleAction = async (appId: string, action: string) => {
    setProcessingId(appId);
    try {
      await api.officerSchemeAction(appId, action, remarks || undefined);
      toast.success(`Application ${appId} ${action === "approve" ? "approved" : action === "reject" ? "rejected" : "documents requested"}`);
      setSelectedApp(null);
      setRemarks("");
      await fetchData();
    } catch (e) {
      toast.error(`Action failed: ${e instanceof Error ? e.message : "unknown"}`);
    } finally {
      setProcessingId(null);
    }
  };

  const statusBadge = (status: string) => {
    const colors: Record<string, string> = {
      Pending: "bg-yellow-100 text-yellow-800",
      "Under Review": "bg-purple-100 text-purple-800",
      Approved: "bg-green-100 text-green-800",
      Rejected: "bg-red-100 text-red-800",
      "Documents Requested": "bg-orange-100 text-orange-800",
    };
    return <span className={`text-xs font-semibold px-2 py-0.5 rounded ${colors[status] || "bg-gray-100 text-gray-700"}`}>{status}</span>;
  };

  if (selectedApp) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <button onClick={() => { setSelectedApp(null); setRemarks(""); }} className="flex items-center gap-2 text-sm text-[#0B3C5D] hover:underline">
          <ArrowLeft size={16} /> Back to Applications
        </button>

        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-[#0B3C5D]">{selectedApp.id} — {selectedApp.scheme_name}</h2>
            {statusBadge(selectedApp.status)}
          </div>

          {/* Citizen Details */}
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 mb-6">
            <h3 className="text-sm font-semibold text-slate-700 mb-3">Citizen Details</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
              <div><span className="text-slate-500">Name:</span> <span className="font-medium">{selectedApp.citizen_name}</span></div>
              <div><span className="text-slate-500">Age/Gender:</span> <span className="font-medium">{selectedApp.citizen_age} / {selectedApp.citizen_gender}</span></div>
              <div><span className="text-slate-500">Income:</span> <span className="font-medium">₹{selectedApp.citizen_income?.toLocaleString()}</span></div>
              <div><span className="text-slate-500">Category:</span> <span className="font-medium">{selectedApp.citizen_category}</span></div>
              <div><span className="text-slate-500">District:</span> <span className="font-medium">{selectedApp.citizen_district}</span></div>
              <div><span className="text-slate-500">Ward:</span> <span className="font-medium">{selectedApp.citizen_ward}</span></div>
            </div>
          </div>

          {/* Uploaded Documents */}
          <div className="bg-white border border-slate-200 rounded-lg p-4 mb-6">
            <h3 className="text-sm font-semibold text-slate-700 mb-3">Uploaded Documents</h3>
            <div className="space-y-2">
              {selectedApp.documents?.map((doc: { name: string; submitted: boolean; verified: boolean; mismatch_detected: boolean }, idx: number) => (
                <div key={idx} className={`flex items-center justify-between p-3 rounded-lg border ${
                  doc.mismatch_detected ? "bg-red-50 border-red-200" :
                  !doc.submitted ? "bg-yellow-50 border-yellow-200" :
                  doc.verified ? "bg-green-50 border-green-200" :
                  "bg-slate-50 border-slate-200"
                }`}>
                  <span className="text-sm font-medium text-slate-700">{doc.name}</span>
                  <div className="flex items-center gap-2">
                    {!doc.submitted && (
                      <span className="text-xs font-semibold text-yellow-700 bg-yellow-100 px-2 py-0.5 rounded">Missing</span>
                    )}
                    {doc.submitted && doc.verified && (
                      <span className="text-xs font-semibold text-green-700 bg-green-100 px-2 py-0.5 rounded flex items-center gap-1">
                        <CheckCircle size={12} /> Verified
                      </span>
                    )}
                    {doc.mismatch_detected && (
                      <span className="text-xs font-semibold text-red-700 bg-red-100 px-2 py-0.5 rounded flex items-center gap-1">
                        <AlertTriangle size={12} /> Mismatch
                      </span>
                    )}
                    {doc.submitted && !doc.verified && !doc.mismatch_detected && (
                      <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">Pending</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* AI Analysis */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <h3 className="text-sm font-semibold text-[#0B3C5D] mb-3 flex items-center gap-2">
              <Shield size={16} /> AI Eligibility Analysis
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-slate-500">AI Eligible:</span>{" "}
                <span className={`font-semibold ${selectedApp.ai_eligible ? "text-green-600" : "text-red-600"}`}>
                  {selectedApp.ai_eligible ? "Yes" : "No"}
                </span>
              </div>
              <div>
                <span className="text-slate-500">Confidence:</span>{" "}
                <span className="font-medium">{(selectedApp.ai_eligibility_confidence * 100).toFixed(0)}%</span>
              </div>
              <div>
                <span className="text-slate-500">Risk Score:</span>{" "}
                <span className={`font-semibold ${selectedApp.ai_risk_score > 0.3 ? "text-red-600" : "text-green-600"}`}>
                  {(selectedApp.ai_risk_score * 100).toFixed(0)}%
                </span>
              </div>
              <div>
                <span className="text-slate-500">Mismatches:</span>{" "}
                <span className="font-medium text-red-600">{selectedApp.ai_document_mismatches?.length || 0}</span>
              </div>
            </div>
            {selectedApp.ai_document_mismatches?.length > 0 && (
              <div className="mt-3 bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-xs font-semibold text-red-700 mb-1">Document Mismatches Detected:</p>
                <ul className="text-xs text-red-600 list-disc list-inside">
                  {selectedApp.ai_document_mismatches.map((m: string, i: number) => (
                    <li key={i}>{m}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Remarks & Actions */}
          {selectedApp.status !== "Approved" && selectedApp.status !== "Rejected" && (
            <>
              <div className="mb-4">
                <label className="text-sm font-semibold text-slate-700 block mb-2">Officer Remarks</label>
                <textarea
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  rows={3}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#0B3C5D]/30"
                  placeholder="Add remarks for this application..."
                />
              </div>

              <div className="flex gap-3">
                <button
                  disabled={processingId === selectedApp.id}
                  onClick={() => handleAction(selectedApp.id, "approve")}
                  className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-green-700 disabled:opacity-50"
                >
                  <CheckCircle size={16} /> Approve
                </button>
                <button
                  disabled={processingId === selectedApp.id}
                  onClick={() => handleAction(selectedApp.id, "reject")}
                  className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-red-700 disabled:opacity-50"
                >
                  <XCircle size={16} /> Reject
                </button>
                <button
                  disabled={processingId === selectedApp.id}
                  onClick={() => handleAction(selectedApp.id, "request_documents")}
                  className="flex items-center gap-2 bg-amber-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-amber-700 disabled:opacity-50"
                >
                  <FileQuestion size={16} /> Request Documents
                </button>
              </div>
            </>
          )}

          {selectedApp.officer_remarks && (
            <div className="mt-4 bg-amber-50 border border-amber-200 rounded-lg p-3">
              <p className="text-xs font-semibold text-amber-700">Officer Remarks:</p>
              <p className="text-sm text-amber-800 mt-1">{selectedApp.officer_remarks}</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#0B3C5D]">Scheme Application Review</h1>
        <p className="text-slate-500 text-sm mt-1">
          Review scheme applications submitted by citizens and CSC operators • {total} total
        </p>
      </div>

      {/* Filters */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
        <div className="flex items-center gap-4 flex-wrap">
          <ClipboardList size={16} className="text-slate-400" />
          <select
            value={filters.scheme}
            onChange={(e) => setFilters((f) => ({ ...f, scheme: e.target.value }))}
            className="text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white text-slate-700"
          >
            <option value="">All Schemes</option>
            {SCHEME_NAMES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <select
            value={filters.status}
            onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value }))}
            className="text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white text-slate-700"
          >
            <option value="">All Statuses</option>
            {APP_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          {(filters.scheme || filters.status) && (
            <button
              onClick={() => setFilters({ scheme: "", status: "" })}
              className="text-xs text-red-600 hover:underline"
            >
              Clear Filters
            </button>
          )}
        </div>
      </div>

      {/* Applications Table */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-400">Loading applications...</div>
        ) : applications.length === 0 ? (
          <div className="p-8 text-center text-slate-400 flex flex-col items-center">
            <ClipboardList size={40} className="mb-3 text-slate-300" />
            <p>No applications match the current filters</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[#0B3C5D] text-white">
                  <th className="text-left px-4 py-3 font-semibold">App ID</th>
                  <th className="text-left px-4 py-3 font-semibold">Citizen</th>
                  <th className="text-left px-4 py-3 font-semibold">Scheme</th>
                  <th className="text-left px-4 py-3 font-semibold">Status</th>
                  <th className="text-left px-4 py-3 font-semibold">AI Eligible</th>
                  <th className="text-left px-4 py-3 font-semibold">Risk</th>
                  <th className="text-left px-4 py-3 font-semibold">Submitted</th>
                </tr>
              </thead>
              <tbody>
                {applications.map((a, idx) => (
                  <tr
                    key={a.id}
                    onClick={() => setSelectedApp(a)}
                    className={`cursor-pointer hover:bg-blue-50 border-b border-slate-100 ${
                      a.ai_risk_score > 0.3 ? "bg-red-50" :
                      idx % 2 === 0 ? "bg-white" : "bg-slate-50"
                    }`}
                  >
                    <td className="px-4 py-3 font-mono text-xs text-[#0B3C5D] font-semibold">{a.id}</td>
                    <td className="px-4 py-3">{a.citizen_name}</td>
                    <td className="px-4 py-3">{a.scheme_name}</td>
                    <td className="px-4 py-3">{statusBadge(a.status)}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-semibold ${a.ai_eligible ? "text-green-600" : "text-red-600"}`}>
                        {a.ai_eligible ? "Yes" : "No"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-semibold ${a.ai_risk_score > 0.3 ? "text-red-600" : "text-green-600"}`}>
                        {(a.ai_risk_score * 100).toFixed(0)}%
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-500">{a.submitted_at}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
