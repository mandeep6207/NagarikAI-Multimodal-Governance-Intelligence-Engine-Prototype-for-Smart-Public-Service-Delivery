"use client";
import { useCallback, useEffect, useState } from "react";
import { api } from "../../../services/api";
import {
  Upload, FileCheck, FileX2, AlertTriangle, CheckCircle2,
  Search, Brain, ArrowLeft,
} from "lucide-react";
import { toast } from "sonner";

const DOC_TYPES = [
  { id: "aadhaar", name: "Aadhaar Card" },
  { id: "income_certificate", name: "Income Certificate" },
  { id: "ration_card", name: "Ration Card" },
  { id: "death_certificate", name: "Death Certificate" },
];

export default function CitizenDocumentsPage() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedType, setSelectedType] = useState("aadhaar");
  const [docNumber, setDocNumber] = useState("");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [uploadResult, setUploadResult] = useState<any>(null);
  const [view, setView] = useState<"list" | "upload">("list");
  const [statusFilter, setStatusFilter] = useState("all");

  const fetchDocs = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.fetchCitizenDocuments();
      setDocuments(data);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchDocs(); }, [fetchDocs]);

  const handleUpload = async () => {
    if (!docNumber.trim()) { toast.error("Enter document number"); return; }
    setUploading(true);
    setUploadResult(null);
    try {
      const res = await api.uploadCitizenDocument({ doc_type: selectedType, doc_number: docNumber });
      setUploadResult(res);
      toast.success("Document uploaded & AI verified");
      setDocNumber("");
      fetchDocs();
    } catch (e) {
      toast.error("Upload failed");
      console.error(e);
    } finally {
      setUploading(false);
    }
  };

  const filtered = statusFilter === "all" ? documents : documents.filter(d => d.ai_status === statusFilter);
  const counts = {
    total: documents.length,
    verified: documents.filter(d => d.ai_status === "verified").length,
    mismatch: documents.filter(d => d.ai_status === "mismatch").length,
    suspicious: documents.filter(d => d.ai_status === "suspicious").length,
  };

  if (view === "upload") {
    return (
      <div className="max-w-5xl mx-auto space-y-6">
        <button onClick={() => { setView("list"); setUploadResult(null); }} className="flex items-center gap-2 text-sm text-[#0B3C5D] hover:underline">
          <ArrowLeft size={16} /> Back to Documents
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Upload Form */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
            <h2 className="text-lg font-bold text-[#0B3C5D] mb-1 flex items-center gap-2">
              <Upload size={18} /> Upload Document
            </h2>
            <p className="text-sm text-slate-400 mb-5">AI will automatically verify the document</p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Document Type</label>
                <select
                  value={selectedType}
                  onChange={e => setSelectedType(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-[#0B3C5D]/30 focus:border-[#0B3C5D]"
                >
                  {DOC_TYPES.map(dt => (
                    <option key={dt.id} value={dt.id}>{dt.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Document Number</label>
                <input
                  type="text"
                  value={docNumber}
                  onChange={e => setDocNumber(e.target.value)}
                  placeholder="Enter document number"
                  className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-[#0B3C5D]/30 focus:border-[#0B3C5D]"
                />
              </div>
              <button
                onClick={handleUpload}
                disabled={uploading}
                className="w-full bg-[#0B3C5D] hover:bg-[#0a3350] text-white font-bold py-3 rounded-lg text-sm flex items-center justify-center gap-2 disabled:opacity-60"
              >
                <Upload size={16} />
                {uploading ? "Uploading & Verifying..." : "Upload & Verify"}
              </button>
            </div>
          </div>

          {/* Result Panel */}
          <div>
            {uploadResult ? (
              <div className="space-y-4">
                <div className={`border rounded-xl p-5 ${
                  uploadResult.ai_status === "verified" ? "bg-green-50 border-green-200" :
                  uploadResult.ai_status === "mismatch" ? "bg-red-50 border-red-200" :
                  "bg-amber-50 border-amber-200"
                }`}>
                  <div className="flex items-center gap-2 mb-3">
                    <Brain size={18} className="text-[#0B3C5D]" />
                    <h3 className="text-base font-bold text-[#0B3C5D]">AI Verification Result</h3>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-sm mb-3">
                    <div><span className="text-slate-500">Document:</span> <span className="font-medium">{uploadResult.doc_type}</span></div>
                    <div><span className="text-slate-500">Number:</span> <span className="font-mono font-medium">{uploadResult.doc_number}</span></div>
                    <div><span className="text-slate-500">Status:</span>
                      <span className={`ml-1 font-bold ${
                        uploadResult.ai_status === "verified" ? "text-green-700" :
                        uploadResult.ai_status === "mismatch" ? "text-red-700" :
                        "text-amber-700"
                      }`}>
                        {uploadResult.ai_status === "verified" ? "Verified" :
                         uploadResult.ai_status === "mismatch" ? "Mismatch Detected" : "Suspicious"}
                      </span>
                    </div>
                    <div><span className="text-slate-500">Confidence:</span> <span className="font-medium">{(uploadResult.ai_confidence * 100).toFixed(0)}%</span></div>
                  </div>

                  {uploadResult.ai_issues?.length > 0 && (
                    <div className="bg-white/60 border border-red-200 rounded-lg p-3">
                      <h5 className="text-xs font-bold text-red-700 uppercase mb-1">Detected Issues</h5>
                      {uploadResult.ai_issues.map((issue: string, i: number) => (
                        <div key={i} className="flex items-center gap-2 text-sm text-red-700 mt-1">
                          <AlertTriangle size={12} /> {issue}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="h-full min-h-[300px] bg-white border border-slate-200 rounded-xl flex flex-col items-center justify-center text-slate-400 p-10">
                <Search size={48} className="mb-4 opacity-30" />
                <p className="text-base font-medium mb-1">AI Document Verification</p>
                <p className="text-sm text-center">Upload a document and AI will verify it against government records</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // List view
  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#0B3C5D]">My Documents</h1>
          <p className="text-slate-500 text-sm mt-1">Manage uploaded documents and verification status</p>
        </div>
        <button onClick={() => setView("upload")} className="bg-[#0B3C5D] text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-[#0a3350] flex items-center gap-2">
          <Upload size={16} /> Upload Document
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Total", value: counts.total, color: "bg-blue-500" },
          { label: "Verified", value: counts.verified, color: "bg-green-500" },
          { label: "Mismatch", value: counts.mismatch, color: "bg-red-500" },
          { label: "Suspicious", value: counts.suspicious, color: "bg-amber-500" },
        ].map(c => (
          <div key={c.label} className="bg-white border border-slate-200 rounded-xl p-4 flex items-center gap-3 shadow-sm">
            <div className={`w-10 h-10 ${c.color} rounded-lg flex items-center justify-center`}>
              {c.label === "Total" ? <FileCheck size={18} className="text-white" /> :
               c.label === "Verified" ? <CheckCircle2 size={18} className="text-white" /> :
               c.label === "Mismatch" ? <FileX2 size={18} className="text-white" /> :
               <AlertTriangle size={18} className="text-white" />}
            </div>
            <div>
              <div className="text-xl font-bold text-slate-900">{c.value}</div>
              <div className="text-xs text-slate-500">{c.label}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3 border-b border-slate-200 bg-slate-50">
          <h3 className="text-sm font-bold text-[#0B3C5D]">Uploaded Documents</h3>
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="border border-slate-300 rounded-lg px-2 py-1 text-xs"
          >
            <option value="all">All Status</option>
            <option value="verified">Verified</option>
            <option value="mismatch">Mismatch</option>
            <option value="suspicious">Suspicious</option>
          </select>
        </div>

        {loading ? (
          <div className="p-10 text-center text-slate-400 text-sm">Loading documents...</div>
        ) : filtered.length === 0 ? (
          <div className="p-10 text-center text-slate-400 text-sm">No documents found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[#0B3C5D] text-white text-xs">
                  <th className="px-4 py-2 text-left">ID</th>
                  <th className="px-4 py-2 text-left">Type</th>
                  <th className="px-4 py-2 text-left">Number</th>
                  <th className="px-4 py-2 text-left">AI Status</th>
                  <th className="px-4 py-2 text-left">Confidence</th>
                  <th className="px-4 py-2 text-left">Issues</th>
                  <th className="px-4 py-2 text-left">Date</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((doc, i) => (
                  <tr key={doc.id || i} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="px-4 py-2 font-mono text-xs">{doc.id}</td>
                    <td className="px-4 py-2">{doc.doc_type}</td>
                    <td className="px-4 py-2 font-mono text-xs">{doc.doc_number}</td>
                    <td className="px-4 py-2">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded ${
                        doc.ai_status === "verified" ? "bg-green-100 text-green-800" :
                        doc.ai_status === "mismatch" ? "bg-red-100 text-red-800" :
                        "bg-amber-100 text-amber-800"
                      }`}>
                        {doc.ai_status}
                      </span>
                    </td>
                    <td className="px-4 py-2">{((doc.ai_confidence || 0) * 100).toFixed(0)}%</td>
                    <td className="px-4 py-2 text-xs text-slate-500 max-w-[200px] truncate">
                      {doc.ai_issues?.length > 0 ? doc.ai_issues.join(", ") : "—"}
                    </td>
                    <td className="px-4 py-2 text-xs text-slate-500">
                      {doc.uploaded_at ? new Date(doc.uploaded_at).toLocaleDateString("en-IN") : "—"}
                    </td>
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
