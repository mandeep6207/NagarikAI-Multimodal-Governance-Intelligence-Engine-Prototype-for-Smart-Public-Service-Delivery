"use client";
import { useEffect, useState } from "react";
import { api } from "../../../services/api";
import {
  Landmark, FileCheck, CheckCircle2, XCircle, ArrowLeft,
  Send, ChevronRight, Brain,
} from "lucide-react";
import { toast } from "sonner";

type SchemeView = "catalog" | "detail" | "apply";

export default function CitizenSchemesPage() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [schemes, setSchemes] = useState<any[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [selectedScheme, setSelectedScheme] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [submitted, setSubmitted] = useState<any>(null);
  const [view, setView] = useState<SchemeView>("catalog");
  const [docChecked, setDocChecked] = useState<string[]>([]);

  useEffect(() => {
    api.fetchCitizenSchemes().then(setSchemes).catch(console.error);
  }, []);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const openDetail = (s: any) => { setSelectedScheme(s); setView("detail"); };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const startApply = (s: any) => {
    setSelectedScheme(s);
    setDocChecked([]);
    setSubmitted(null);
    setView("apply");
  };

  const toggleDoc = (doc: string) => {
    setDocChecked(prev => prev.includes(doc) ? prev.filter(d => d !== doc) : [...prev, doc]);
  };

  const handleSubmit = async () => {
    if (!selectedScheme) return;
    setSubmitting(true);
    try {
      const res = await api.submitCitizenApplication({
        scheme_id: selectedScheme.id,
        documents: docChecked,
      });
      setSubmitted(res);
      toast.success(`Application ${res?.id} submitted & forwarded`);
    } catch (e) {
      toast.error("Application submission failed");
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  };

  // Catalog view
  if (view === "catalog") {
    return (
      <div className="max-w-7xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-[#0B3C5D]">Government Schemes</h1>
          <p className="text-slate-500 text-sm mt-1">Browse and apply for government welfare schemes</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {schemes.map(scheme => (
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
                      <span key={doc} className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded">{doc}</span>
                    ))}
                  </div>
                </div>
                <div className="flex gap-3 pt-2">
                  <button onClick={() => openDetail(scheme)} className="flex-1 border border-[#0B3C5D] text-[#0B3C5D] py-2 rounded-lg text-sm font-semibold hover:bg-slate-50 flex items-center justify-center gap-2">
                    View Details <ChevronRight size={14} />
                  </button>
                  <button onClick={() => startApply(scheme)} className="flex-1 bg-[#0B3C5D] text-white py-2 rounded-lg text-sm font-semibold hover:bg-[#0a3350] flex items-center justify-center gap-2">
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

  // Detail view
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
            <p className="text-sm text-slate-600">{selectedScheme.description}</p>
            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
              <div className="text-xs font-bold text-emerald-800 uppercase">Benefit Amount</div>
              <div className="text-xl font-bold text-emerald-700 mt-1">{selectedScheme.benefit}</div>
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

            <button onClick={() => startApply(selectedScheme)} className="w-full bg-[#0B3C5D] text-white py-3 rounded-lg text-sm font-bold hover:bg-[#0a3350] flex items-center justify-center gap-2">
              <Send size={16} /> Apply for {selectedScheme.name}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Apply view
  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <button onClick={() => { setView("catalog"); setSelectedScheme(null); setSubmitted(null); }} className="flex items-center gap-2 text-sm text-[#0B3C5D] hover:underline">
        <ArrowLeft size={16} /> Back to Schemes
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Application Form */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
          <h2 className="text-lg font-bold text-[#0B3C5D] mb-1 flex items-center gap-2">
            <Landmark size={18} /> {selectedScheme?.name} — Application
          </h2>
          <p className="text-xs text-slate-400 mb-5">{selectedScheme?.department} Department</p>

          {/* Document Upload Checklist */}
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 mb-4">
            <div className="text-xs font-bold text-[#0B3C5D] uppercase mb-3 flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-[#0B3C5D] text-white text-[10px] flex items-center justify-center">1</span>
              Upload Required Documents
            </div>
            <p className="text-xs text-slate-500 mb-3">Check documents that have been uploaded</p>
            <div className="space-y-2">
              {selectedScheme?.required_documents?.map((doc: string) => (
                <label key={doc} className="flex items-center gap-3 cursor-pointer bg-white border border-slate-200 rounded-lg p-3 hover:bg-blue-50">
                  <input
                    type="checkbox"
                    checked={docChecked.includes(doc)}
                    onChange={() => toggleDoc(doc)}
                    className="w-4 h-4 accent-[#0B3C5D]"
                  />
                  <FileCheck size={14} className={docChecked.includes(doc) ? "text-green-600" : "text-slate-400"} />
                  <span className="text-sm">{doc}</span>
                </label>
              ))}
            </div>
            <div className="mt-2 text-xs text-slate-400">
              {docChecked.length} of {selectedScheme?.required_documents?.length || 0} documents uploaded
            </div>
          </div>

          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="w-full bg-[#0B3C5D] hover:bg-[#0a3350] text-white font-bold py-3 rounded-lg text-sm flex items-center justify-center gap-2 disabled:opacity-60"
          >
            <Send size={16} />
            {submitting ? "Running AI Eligibility Analysis..." : "Submit Application"}
          </button>
        </div>

        {/* Result Panel */}
        <div className="space-y-4">
          {submitted ? (
            <>
              <div className="bg-green-50 border border-green-200 rounded-xl p-6">
                <div className="flex items-center gap-2 mb-3">
                  <CheckCircle2 className="text-green-600" size={20} />
                  <h3 className="text-lg font-bold text-green-800">Application Submitted</h3>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div><span className="text-slate-500">Application ID:</span> <span className="font-bold text-green-700">{submitted.id}</span></div>
                  <div><span className="text-slate-500">Scheme:</span> <span className="font-medium">{submitted.scheme_name}</span></div>
                  <div><span className="text-slate-500">Status:</span> <span className="font-bold">{submitted.status}</span></div>
                  <div><span className="text-slate-500">Assigned To:</span> <span className="font-medium">{submitted.assigned_officer}</span></div>
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

                {!submitted.ai_eligible && (
                  <div className="mt-3 bg-white/60 border border-red-200 rounded-lg p-3">
                    <h5 className="text-xs font-bold text-red-700 uppercase mb-1">Reason</h5>
                    <p className="text-sm text-red-700">
                      Based on AI analysis, the applicant does not meet one or more eligibility criteria.
                      Missing documents or data inconsistencies were detected.
                    </p>
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
                Upload required documents and submit your application.
                AI will analyze eligibility and detect mismatches.
              </p>
              <div className="text-xs space-y-1">
                <p>&#8226; AI eligibility prediction</p>
                <p>&#8226; Document mismatch detection</p>
                <p>&#8226; Auto-forwarded to District Officer</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
