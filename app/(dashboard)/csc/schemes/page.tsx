"use client";
import { useCallback, useEffect, useState } from "react";
import { api } from "../../../services/api";
import {
  Landmark, FileCheck, CheckCircle2, XCircle,
  ArrowLeft, Send, ChevronRight, Brain, FileText,
  Clock, Users,
} from "lucide-react";
import { toast } from "sonner";

const DISTRICTS = ["Raipur", "Bilaspur", "Durg", "Korba", "Jagdalpur"];

type SchemeView = "catalog" | "detail" | "apply" | "applications";

export default function SchemeApplicationPage() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [schemes, setSchemes] = useState<any[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [selectedScheme, setSelectedScheme] = useState<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [submitted, setSubmitted] = useState<any>(null);
  const [view, setView] = useState<SchemeView>("catalog");

  const [form, setForm] = useState({
    citizen_name: "",
    citizen_aadhaar: "",
    citizen_phone: "",
    citizen_age: 0,
    income: 50000,
    district: "",
    scheme_id: "",
    documents: [] as string[],
  });

  const userDistrict =
    typeof window !== "undefined" ? localStorage.getItem("userDistrict") || "Raipur" : "Raipur";

  useEffect(() => { setForm((f) => ({ ...f, district: userDistrict })); }, [userDistrict]);

  const fetchSchemes = useCallback(async () => {
    try {
      const res = await api.fetchCscSchemes();
      setSchemes(res || []);
    } catch (e) {
      console.error(e);
    }
  }, []);

  const fetchApplications = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.fetchCscSchemeApplications({ district: userDistrict });
      setApplications(res?.applications ?? []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [userDistrict]);

  useEffect(() => { fetchSchemes(); fetchApplications(); }, [fetchSchemes, fetchApplications]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const openSchemeDetail = (scheme: any) => {
    setSelectedScheme(scheme);
    setView("detail");
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const startApplication = (scheme: any) => {
    setSelectedScheme(scheme);
    setForm((f) => ({ ...f, scheme_id: scheme.id, documents: [] }));
    setSubmitted(null);
    setView("apply");
  };

  const toggleDocument = (doc: string) => {
    setForm((f) => ({
      ...f,
      documents: f.documents.includes(doc)
        ? f.documents.filter((d) => d !== doc)
        : [...f.documents, doc],
    }));
  };

  const handleSubmit = async () => {
    if (!form.citizen_name.trim() || !form.citizen_aadhaar.trim()) {
      toast.error("Citizen name and Aadhaar are required");
      return;
    }
    setSubmitting(true);
    try {
      const res = await api.submitCscSchemeApplication(form);
      setSubmitted(res);
      toast.success(`Application ${res?.id} submitted & forwarded to District Officer`);
      await fetchApplications();
    } catch (e) {
      toast.error("Application submission failed");
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  };

  // Scheme catalog view
  if (view === "catalog" || (!selectedScheme && view !== "applications")) {
    return (
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[#0B3C5D]">Scheme Application System</h1>
            <p className="text-slate-500 text-sm mt-1">
              Government schemes available for citizen application
            </p>
          </div>
          <button
            onClick={() => setView("applications")}
            className="flex items-center gap-2 bg-white border border-slate-200 text-[#0B3C5D] px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-50"
          >
            <FileText size={16} /> View Applications ({applications.length})
          </button>
        </div>

        {/* Scheme Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {schemes.map((scheme) => (
            <div key={scheme.id} className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
              <div className="bg-[#0B3C5D] px-6 py-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-white/15 flex items-center justify-center">
                    <Landmark size={20} className="text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">{scheme.name}</h3>
                    <p className="text-xs text-white/70">{scheme.department} Department</p>
                  </div>
                </div>
              </div>
              <div className="p-6 space-y-4">
                <p className="text-sm text-slate-600">{scheme.description}</p>

                <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3">
                  <div className="text-xs font-bold text-emerald-800 uppercase mb-1">Benefit</div>
                  <div className="text-lg font-bold text-emerald-700">{scheme.benefit}</div>
                </div>

                <div>
                  <div className="text-xs font-bold text-slate-500 uppercase mb-2">Required Documents</div>
                  <div className="flex flex-wrap gap-1.5">
                    {scheme.required_documents?.map((doc: string) => (
                      <span key={doc} className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded">
                        {doc}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => openSchemeDetail(scheme)}
                    className="flex-1 border border-[#0B3C5D] text-[#0B3C5D] py-2 rounded-lg text-sm font-semibold hover:bg-slate-50 flex items-center justify-center gap-2"
                  >
                    View Details <ChevronRight size={14} />
                  </button>
                  <button
                    onClick={() => startApplication(scheme)}
                    className="flex-1 bg-[#0B3C5D] text-white py-2 rounded-lg text-sm font-semibold hover:bg-[#0a3350] flex items-center justify-center gap-2"
                  >
                    Apply Now <Send size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Scheme detail view
  if (view === "detail" && selectedScheme) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <button onClick={() => { setView("catalog"); setSelectedScheme(null); }} className="flex items-center gap-2 text-sm text-[#0B3C5D] hover:underline">
          <ArrowLeft size={16} /> Back to Schemes
        </button>

        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
          <div className="bg-[#0B3C5D] px-6 py-5">
            <div className="flex items-center gap-3">
              <Landmark size={24} className="text-white" />
              <div>
                <h2 className="text-xl font-bold text-white">{selectedScheme.name}</h2>
                <p className="text-sm text-white/70">{selectedScheme.department} Department</p>
              </div>
            </div>
          </div>
          <div className="p-6 space-y-6">
            <div>
              <p className="text-sm text-slate-600">{selectedScheme.description}</p>
              <div className="mt-3 bg-emerald-50 border border-emerald-200 rounded-lg p-4">
                <div className="text-xs font-bold text-emerald-800 uppercase">Benefit Amount</div>
                <div className="text-xl font-bold text-emerald-700 mt-1">{selectedScheme.benefit}</div>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-bold text-[#0B3C5D] uppercase mb-3">Eligibility Rules</h3>
              <div className="space-y-2">
                {selectedScheme.eligibility_rules?.map((rule: string, i: number) => (
                  <div key={i} className="flex items-start gap-2 text-sm text-slate-600 bg-slate-50 border border-slate-200 rounded-lg p-3">
                    <CheckCircle2 size={14} className="text-green-500 mt-0.5 shrink-0" />
                    {rule}
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-sm font-bold text-[#0B3C5D] uppercase mb-3">Required Documents</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {selectedScheme.required_documents?.map((doc: string) => (
                  <div key={doc} className="flex items-center gap-2 text-sm bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <FileCheck size={14} className="text-blue-600 shrink-0" />
                    {doc}
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={() => startApplication(selectedScheme)}
              className="w-full bg-[#0B3C5D] text-white py-3 rounded-lg text-sm font-bold hover:bg-[#0a3350] flex items-center justify-center gap-2"
            >
              <Send size={16} /> Apply for {selectedScheme.name}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Application form view
  if (view === "apply" && selectedScheme) {
    return (
      <div className="max-w-5xl mx-auto space-y-6">
        <button onClick={() => { setView("catalog"); setSelectedScheme(null); setSubmitted(null); }} className="flex items-center gap-2 text-sm text-[#0B3C5D] hover:underline">
          <ArrowLeft size={16} /> Back to Schemes
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Form */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
            <h2 className="text-lg font-bold text-[#0B3C5D] mb-1 flex items-center gap-2">
              <Landmark size={18} /> {selectedScheme.name} — Application
            </h2>
            <p className="text-xs text-slate-400 mb-5">{selectedScheme.department} Department</p>

            <div className="space-y-4">
              {/* Citizen Info */}
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                <div className="text-xs font-bold text-[#0B3C5D] uppercase mb-3 flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-[#0B3C5D] text-white text-[10px] flex items-center justify-center">1</span>
                  Citizen Information
                </div>
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-1">Full Name *</label>
                      <input
                        className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#0B3C5D]"
                        placeholder="As per Aadhaar"
                        value={form.citizen_name}
                        onChange={(e) => setForm({ ...form, citizen_name: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-1">Aadhaar *</label>
                      <input
                        className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#0B3C5D]"
                        placeholder="XXXX-XXXX-XXXX"
                        value={form.citizen_aadhaar}
                        onChange={(e) => setForm({ ...form, citizen_aadhaar: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-1">Phone</label>
                      <input
                        className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#0B3C5D]"
                        value={form.citizen_phone}
                        onChange={(e) => setForm({ ...form, citizen_phone: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-1">Age</label>
                      <input
                        type="number"
                        className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#0B3C5D]"
                        value={form.citizen_age || ""}
                        onChange={(e) => setForm({ ...form, citizen_age: parseInt(e.target.value) || 0 })}
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
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">
                      Annual Income: ₹{form.income.toLocaleString("en-IN")}
                    </label>
                    <input
                      type="range"
                      min="10000"
                      max="300000"
                      step="5000"
                      value={form.income}
                      onChange={(e) => setForm({ ...form, income: parseInt(e.target.value) })}
                      className="w-full accent-[#0B3C5D]"
                    />
                    <div className="flex justify-between text-xs text-slate-400 mt-1">
                      <span>₹10,000</span>
                      <span className={form.income > 100000 ? "text-red-500 font-bold" : "text-green-600 font-bold"}>
                        {form.income > 100000 ? "Above threshold" : "Within threshold"}
                      </span>
                      <span>₹3,00,000</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Document Upload */}
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                <div className="text-xs font-bold text-[#0B3C5D] uppercase mb-3 flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-[#0B3C5D] text-white text-[10px] flex items-center justify-center">2</span>
                  Document Upload
                </div>
                <p className="text-xs text-slate-500 mb-3">Select documents that have been uploaded</p>
                <div className="space-y-2">
                  {selectedScheme.required_documents?.map((doc: string) => (
                    <label key={doc} className="flex items-center gap-3 cursor-pointer bg-white border border-slate-200 rounded-lg p-3 hover:bg-blue-50">
                      <input
                        type="checkbox"
                        checked={form.documents.includes(doc)}
                        onChange={() => toggleDocument(doc)}
                        className="w-4 h-4 accent-[#0B3C5D]"
                      />
                      <FileCheck size={14} className={form.documents.includes(doc) ? "text-green-600" : "text-slate-400"} />
                      <span className="text-sm">{doc}</span>
                    </label>
                  ))}
                </div>
                <div className="mt-2 text-xs text-slate-400">
                  {form.documents.length} of {selectedScheme.required_documents?.length || 0} documents uploaded
                </div>
              </div>

              {/* Submit */}
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="w-full bg-[#0B3C5D] hover:bg-[#0a3350] text-white font-bold py-3 rounded-lg text-sm flex items-center justify-center gap-2 disabled:opacity-60"
              >
                <Send size={16} />
                {submitting ? "Running AI Analysis..." : "Submit Application"}
              </button>
            </div>
          </div>

          {/* Result Panel */}
          <div className="space-y-4">
            {submitted ? (
              <>
                <div className="bg-green-50 border border-green-200 rounded-xl p-6">
                  <div className="flex items-center gap-2 mb-3">
                    <CheckCircle2 size={20} className="text-green-600" />
                    <h3 className="text-lg font-bold text-green-800">Application Submitted</h3>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div><span className="text-slate-500">Application ID:</span> <span className="font-bold text-green-700">{submitted.id}</span></div>
                    <div><span className="text-slate-500">Scheme:</span> <span className="font-medium">{submitted.scheme_name}</span></div>
                    <div><span className="text-slate-500">Status:</span> <span className="font-bold">{submitted.status}</span></div>
                    <div><span className="text-slate-500">Forwarded:</span> <span className="font-medium text-green-600">{submitted.forwarded_to_officer ? "Yes" : "No"}</span></div>
                  </div>
                </div>

                {/* AI Eligibility Analysis */}
                <div className={`border rounded-xl p-5 ${submitted.ai_eligible ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"}`}>
                  <h4 className="text-sm font-bold flex items-center gap-2 mb-3">
                    <Brain size={14} /> AI Eligibility Analysis
                  </h4>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-slate-500">Eligibility:</span>
                      <span className={`ml-1 font-bold ${submitted.ai_eligible ? "text-green-700" : "text-red-700"}`}>
                        {submitted.ai_eligible ? "Eligible" : "Not Eligible"}
                      </span>
                    </div>
                    <div><span className="text-slate-500">Confidence:</span> <span className="font-medium">{(submitted.ai_confidence * 100).toFixed(0)}%</span></div>
                    <div><span className="text-slate-500">Risk Score:</span> <span className="font-medium">{(submitted.ai_risk_score * 100).toFixed(0)}%</span></div>
                    <div><span className="text-slate-500">Docs:</span> <span className="font-medium">{submitted.docs_uploaded}/{submitted.docs_total}</span></div>
                  </div>

                  {submitted.ai_mismatches?.length > 0 && (
                    <div className="mt-3 bg-white/60 border border-red-200 rounded-lg p-3">
                      <h5 className="text-xs font-bold text-red-700 uppercase mb-1">Document Mismatches</h5>
                      {submitted.ai_mismatches.map((m: string, i: number) => (
                        <div key={i} className="flex items-center gap-2 text-sm text-red-700">
                          <XCircle size={12} /> {m}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Document Status */}
                <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
                  <h4 className="text-sm font-bold text-[#0B3C5D] mb-3">Document Verification Status</h4>
                  <div className="space-y-2">
                    {submitted.documents?.map((doc: { name: string; status: string }, i: number) => (
                      <div key={i} className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-lg p-3">
                        <span className="text-sm">{doc.name}</span>
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded ${
                          doc.status === "verified" ? "bg-green-100 text-green-800" :
                          doc.status === "mismatch" ? "bg-red-100 text-red-800" :
                          "bg-slate-100 text-slate-600"
                        }`}>
                          {doc.status === "verified" ? "Verified" : doc.status === "mismatch" ? "Mismatch" : "Missing"}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <div className="h-full min-h-[400px] bg-white border border-slate-200 rounded-xl flex flex-col items-center justify-center text-slate-400 p-10">
                <Landmark size={48} className="mb-4 opacity-30" />
                <p className="text-base font-medium mb-2">Scheme Application</p>
                <p className="text-sm text-center mb-4">
                  Fill citizen details, upload required documents, and submit.
                  AI will analyze eligibility and detect mismatches.
                </p>
                <div className="text-xs space-y-1">
                  <p>• AI eligibility prediction</p>
                  <p>• Document mismatch detection</p>
                  <p>• Auto-forwarded to District Officer</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Applications list view
  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#0B3C5D]">Submitted Applications</h1>
          <p className="text-slate-500 text-sm mt-1">All scheme applications from this CSC</p>
        </div>
        <button
          onClick={() => setView("catalog")}
          className="flex items-center gap-2 bg-[#0B3C5D] text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-[#0a3350]"
        >
          <ArrowLeft size={16} /> Back to Schemes
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { label: "Total", value: applications.length, icon: FileText, color: "text-[#0B3C5D]" },
          { label: "Submitted", value: applications.filter((a) => a.status === "Submitted").length, icon: Send, color: "text-blue-600" },
          { label: "Approved", value: applications.filter((a) => a.status === "Approved").length, icon: CheckCircle2, color: "text-green-600" },
          { label: "Rejected", value: applications.filter((a) => a.status === "Rejected").length, icon: XCircle, color: "text-red-600" },
          { label: "Pending", value: applications.filter((a) => ["Draft", "Under Review", "Document Required"].includes(a.status)).length, icon: Clock, color: "text-amber-600" },
        ].map((s) => (
          <div key={s.label} className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-1">
              <s.icon size={14} className={s.color} />
              <span className="text-xs text-slate-500 uppercase font-semibold">{s.label}</span>
            </div>
            <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-400">Loading applications...</div>
        ) : applications.length === 0 ? (
          <div className="p-8 text-center text-slate-400">
            <Users size={40} className="mx-auto mb-2 opacity-30" />
            No applications submitted yet
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
                  <th className="text-left px-4 py-3 font-semibold">Docs</th>
                  <th className="text-left px-4 py-3 font-semibold">Submitted</th>
                </tr>
              </thead>
              <tbody>
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                {applications.map((a: any, idx: number) => (
                  <tr key={a.id} className={`border-b border-slate-100 ${idx % 2 === 0 ? "bg-white" : "bg-slate-50"}`}>
                    <td className="px-4 py-3 font-mono text-xs text-[#0B3C5D] font-semibold">{a.id}</td>
                    <td className="px-4 py-3">{a.citizen_name}</td>
                    <td className="px-4 py-3">{a.scheme_name}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded ${
                        a.status === "Approved" ? "bg-green-100 text-green-800" :
                        a.status === "Rejected" ? "bg-red-100 text-red-800" :
                        a.status === "Submitted" ? "bg-blue-100 text-blue-800" :
                        "bg-slate-100 text-slate-700"
                      }`}>{a.status}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-semibold ${a.ai_eligible ? "text-green-600" : "text-red-600"}`}>
                        {a.ai_eligible ? "Eligible" : "Not Eligible"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-semibold ${a.ai_risk_score > 0.5 ? "text-red-600" : "text-green-600"}`}>
                        {(a.ai_risk_score * 100).toFixed(0)}%
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs">{a.docs_uploaded}/{a.docs_total}</td>
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
