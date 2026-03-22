"use client";
import { useCallback, useEffect, useState } from "react";
import { api } from "../../../services/api";
import {
  FileUp, FileCheck, AlertTriangle, ShieldAlert, Search,
  CheckCircle2, XCircle, Clock, Upload,
} from "lucide-react";
import { toast } from "sonner";

const DISTRICTS = ["Raipur", "Bilaspur", "Durg", "Korba", "Jagdalpur"];
const DOC_TYPES = [
  "Aadhaar Card", "Ration Card", "Income Certificate", "Death Certificate",
  "BPL Certificate", "Caste Certificate", "Bank Passbook", "Land Document",
  "Mark Sheet", "Age Proof",
];
const VERIFICATION_STATUSES = ["Verified", "Mismatch Detected", "Suspicious", "Pending"];

function StatusIcon({ status }: { status: string }) {
  if (status === "Verified") return <CheckCircle2 size={14} className="text-green-600" />;
  if (status === "Mismatch Detected") return <AlertTriangle size={14} className="text-amber-600" />;
  if (status === "Suspicious") return <ShieldAlert size={14} className="text-red-600" />;
  return <Clock size={14} className="text-slate-400" />;
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    Verified: "bg-green-100 text-green-800",
    "Mismatch Detected": "bg-amber-100 text-amber-800",
    Suspicious: "bg-red-100 text-red-800",
    Pending: "bg-slate-100 text-slate-700",
  };
  return (
    <span className={`text-xs font-semibold px-2 py-0.5 rounded ${colors[status] || "bg-slate-100 text-slate-700"}`}>
      {status}
    </span>
  );
}

export default function DocumentUploadPage() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [showUpload, setShowUpload] = useState(false);
  const [uploading, setUploading] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [uploadResult, setUploadResult] = useState<any>(null);

  const [form, setForm] = useState({
    citizen_name: "",
    citizen_aadhaar: "",
    district: "",
    document_type: "Aadhaar Card",
  });

  const userDistrict =
    typeof window !== "undefined" ? localStorage.getItem("userDistrict") || "Raipur" : "Raipur";

  useEffect(() => {
    setForm((f) => ({ ...f, district: userDistrict }));
  }, [userDistrict]);

  const fetchDocs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.fetchCscDocuments({
        district: userDistrict,
        status: statusFilter || undefined,
      });
      setDocuments(res?.documents ?? []);
    } catch (e) {
      toast.error("Failed to load documents");
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [userDistrict, statusFilter]);

  useEffect(() => { fetchDocs(); }, [fetchDocs]);

  const handleUpload = async () => {
    if (!form.citizen_name.trim()) {
      toast.error("Citizen name is required");
      return;
    }
    setUploading(true);
    try {
      const res = await api.uploadCscDocument(form);
      setUploadResult(res);
      toast.success(`Document uploaded — Status: ${res?.verification_status}`);
      await fetchDocs();
    } catch (e) {
      toast.error("Upload failed");
      console.error(e);
    } finally {
      setUploading(false);
    }
  };

  const resetUpload = () => {
    setUploadResult(null);
    setForm({ citizen_name: "", citizen_aadhaar: "", district: userDistrict, document_type: "Aadhaar Card" });
  };

  // Summary stats
  const verified = documents.filter((d) => d.verification_status === "Verified").length;
  const mismatched = documents.filter((d) => d.verification_status === "Mismatch Detected").length;
  const suspicious = documents.filter((d) => d.verification_status === "Suspicious").length;
  const pending = documents.filter((d) => d.verification_status === "Pending").length;

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#0B3C5D]">Document Upload & AI Verification</h1>
          <p className="text-slate-500 text-sm mt-1">
            Upload citizen documents • AI validates for mismatches, duplicates & forgery
          </p>
        </div>
        <button
          onClick={() => { setShowUpload(!showUpload); setUploadResult(null); }}
          className="flex items-center gap-2 bg-[#0B3C5D] text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-[#0a3350]"
        >
          <Upload size={16} /> Upload Document
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-1"><CheckCircle2 size={14} className="text-green-600" /><span className="text-xs text-slate-500 uppercase font-semibold">Verified</span></div>
          <div className="text-2xl font-bold text-green-600">{verified}</div>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-1"><AlertTriangle size={14} className="text-amber-600" /><span className="text-xs text-slate-500 uppercase font-semibold">Mismatch</span></div>
          <div className="text-2xl font-bold text-amber-600">{mismatched}</div>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-1"><ShieldAlert size={14} className="text-red-600" /><span className="text-xs text-slate-500 uppercase font-semibold">Suspicious</span></div>
          <div className="text-2xl font-bold text-red-600">{suspicious}</div>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-1"><Clock size={14} className="text-slate-400" /><span className="text-xs text-slate-500 uppercase font-semibold">Pending</span></div>
          <div className="text-2xl font-bold text-slate-600">{pending}</div>
        </div>
      </div>

      {/* Upload Panel */}
      {showUpload && (
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
          {uploadResult ? (
            <div className="space-y-4">
              <div className={`border rounded-xl p-5 ${
                uploadResult.verification_status === "Verified" ? "bg-green-50 border-green-200" :
                uploadResult.verification_status === "Mismatch Detected" ? "bg-amber-50 border-amber-200" :
                uploadResult.verification_status === "Suspicious" ? "bg-red-50 border-red-200" :
                "bg-slate-50 border-slate-200"
              }`}>
                <div className="flex items-center gap-2 mb-3">
                  <StatusIcon status={uploadResult.verification_status} />
                  <h3 className="font-bold text-lg">{uploadResult.verification_status}</h3>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div><span className="text-slate-500">Document ID:</span> <span className="font-bold">{uploadResult.id}</span></div>
                  <div><span className="text-slate-500">Type:</span> <span className="font-medium">{uploadResult.document_type}</span></div>
                  <div><span className="text-slate-500">Citizen:</span> <span className="font-medium">{uploadResult.citizen_name}</span></div>
                  <div><span className="text-slate-500">AI Confidence:</span> <span className="font-medium">{(uploadResult.ai_confidence * 100).toFixed(0)}%</span></div>
                </div>
                {uploadResult.ai_issues?.length > 0 && (
                  <div className="mt-3 bg-white/60 rounded-lg p-3 border border-red-200">
                    <h4 className="text-xs font-bold text-red-700 uppercase mb-1">AI Detected Issues</h4>
                    {uploadResult.ai_issues.map((issue: string, i: number) => (
                      <div key={i} className="flex items-center gap-2 text-sm text-red-700">
                        <XCircle size={12} /> {issue}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <button onClick={resetUpload} className="text-sm text-[#0B3C5D] hover:underline">
                Upload another document
              </button>
            </div>
          ) : (
            <>
              <h3 className="text-sm font-bold text-[#0B3C5D] uppercase mb-4 flex items-center gap-2">
                <FileUp size={16} /> Upload New Document
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Citizen Name *</label>
                  <input
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#0B3C5D]"
                    placeholder="Full name as per records"
                    value={form.citizen_name}
                    onChange={(e) => setForm({ ...form, citizen_name: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Aadhaar Number</label>
                  <input
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#0B3C5D]"
                    placeholder="XXXX-XXXX-XXXX"
                    value={form.citizen_aadhaar}
                    onChange={(e) => setForm({ ...form, citizen_aadhaar: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">District</label>
                  <select
                    value={form.district}
                    onChange={(e) => setForm({ ...form, district: e.target.value })}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#0B3C5D]"
                  >
                    {DISTRICTS.map((d) => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Document Type</label>
                  <select
                    value={form.document_type}
                    onChange={(e) => setForm({ ...form, document_type: e.target.value })}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#0B3C5D]"
                  >
                    {DOC_TYPES.map((d) => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
              </div>

              {/* File input (visual only) */}
              <div className="mt-4 border-2 border-dashed border-slate-300 rounded-lg p-6 text-center">
                <FileUp size={32} className="mx-auto text-slate-400 mb-2" />
                <p className="text-sm text-slate-500">Drag & drop document file or click to browse</p>
                <p className="text-xs text-slate-400 mt-1">Supported: PDF, JPG, PNG (max 5MB)</p>
                <input type="file" className="hidden" id="docUpload" accept=".pdf,.jpg,.jpeg,.png" />
                <label htmlFor="docUpload" className="mt-3 inline-block bg-slate-100 hover:bg-slate-200 text-slate-600 text-sm font-medium px-4 py-2 rounded-lg cursor-pointer">
                  Browse Files
                </label>
              </div>

              <button
                onClick={handleUpload}
                disabled={uploading}
                className="mt-4 w-full bg-[#0B3C5D] hover:bg-[#0a3350] text-white font-bold py-3 rounded-lg text-sm flex items-center justify-center gap-2 disabled:opacity-60"
              >
                <FileCheck size={16} />
                {uploading ? "Running AI Verification..." : "Upload & Verify Document"}
              </button>
            </>
          )}
        </div>
      )}

      {/* Filter */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
        <div className="flex items-center gap-4 flex-wrap">
          <Search size={16} className="text-slate-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white text-slate-700"
          >
            <option value="">All Statuses</option>
            {VERIFICATION_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          {statusFilter && (
            <button onClick={() => setStatusFilter("")} className="text-xs text-red-600 hover:underline">
              Clear Filter
            </button>
          )}
          <span className="text-sm text-slate-400 ml-auto">{documents.length} documents</span>
        </div>
      </div>

      {/* Documents Table */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-400">Loading documents...</div>
        ) : documents.length === 0 ? (
          <div className="p-8 text-center text-slate-400">
            <FileUp size={40} className="mx-auto mb-2 opacity-30" />
            No documents found
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[#0B3C5D] text-white">
                  <th className="text-left px-4 py-3 font-semibold">Doc ID</th>
                  <th className="text-left px-4 py-3 font-semibold">Citizen</th>
                  <th className="text-left px-4 py-3 font-semibold">Document Type</th>
                  <th className="text-left px-4 py-3 font-semibold">Status</th>
                  <th className="text-left px-4 py-3 font-semibold">AI Confidence</th>
                  <th className="text-left px-4 py-3 font-semibold">Issues</th>
                  <th className="text-left px-4 py-3 font-semibold">Uploaded</th>
                </tr>
              </thead>
              <tbody>
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                {documents.map((d: any, idx: number) => (
                  <tr key={d.id} className={`border-b border-slate-100 ${
                    d.verification_status === "Suspicious" ? "bg-red-50" :
                    d.verification_status === "Mismatch Detected" ? "bg-amber-50" :
                    idx % 2 === 0 ? "bg-white" : "bg-slate-50"
                  }`}>
                    <td className="px-4 py-3 font-mono text-xs text-[#0B3C5D] font-semibold">{d.id}</td>
                    <td className="px-4 py-3">{d.citizen_name}</td>
                    <td className="px-4 py-3">{d.document_type}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <StatusIcon status={d.verification_status} />
                        <StatusBadge status={d.verification_status} />
                      </div>
                    </td>
                    <td className="px-4 py-3">{(d.ai_confidence * 100).toFixed(0)}%</td>
                    <td className="px-4 py-3">
                      {d.ai_issues?.length > 0 ? (
                        <span className="text-xs text-red-600">{d.ai_issues[0]}</span>
                      ) : (
                        <span className="text-xs text-green-600">No issues</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-500">{d.uploaded_at}</td>
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
