"use client";
import { useCallback, useEffect, useState } from "react";
import { api } from "../../../services/api";
import {
  Send, CheckCircle2, AlertTriangle, ArrowLeft, FileText,
} from "lucide-react";
import { toast } from "sonner";

const DISTRICTS = ["Raipur", "Bilaspur", "Durg", "Korba", "Jagdalpur"];
const DEPARTMENTS = [
  "Agriculture", "Revenue", "Education", "Panchayat",
  "Electricity", "Pension", "Health", "Water Supply",
];

export default function NewComplaintPage() {
  const [submitting, setSubmitting] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [submitted, setSubmitted] = useState<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [complaints, setComplaints] = useState<any[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const [showForm, setShowForm] = useState(true);

  const [form, setForm] = useState({
    citizen_name: "",
    aadhaar: "",
    mobile: "",
    district: "",
    department: "Revenue",
    description: "",
  });

  const userDistrict =
    typeof window !== "undefined" ? localStorage.getItem("userDistrict") || "Raipur" : "Raipur";

  useEffect(() => {
    setForm((f) => ({ ...f, district: userDistrict }));
  }, [userDistrict]);

  const fetchComplaints = useCallback(async () => {
    setLoadingList(true);
    try {
      const res = await api.fetchCscComplaints({ district: userDistrict });
      setComplaints(res?.complaints ?? []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingList(false);
    }
  }, [userDistrict]);

  useEffect(() => { fetchComplaints(); }, [fetchComplaints]);

  const handleChange = (field: string, value: string) =>
    setForm((f) => ({ ...f, [field]: value }));

  const handleSubmit = async () => {
    if (!form.citizen_name.trim() || !form.aadhaar.trim() || !form.mobile.trim() || !form.description.trim()) {
      toast.error("Please fill all required fields");
      return;
    }
    setSubmitting(true);
    try {
      const res = await api.submitCscComplaint(form);
      setSubmitted(res);
      toast.success(`Complaint ${res?.id} submitted and forwarded to District Officer`);
      await fetchComplaints();
    } catch (e) {
      toast.error("Failed to submit complaint");
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setForm({
      citizen_name: "",
      aadhaar: "",
      mobile: "",
      district: userDistrict,
      department: "Revenue",
      description: "",
    });
    setSubmitted(null);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#0B3C5D]">New Complaint Submission</h1>
          <p className="text-slate-500 text-sm mt-1">
            Register a citizen complaint and forward to District Officer
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowForm(true)}
            className={`px-4 py-2 text-sm font-medium rounded-lg border ${showForm ? "bg-[#0B3C5D] text-white" : "bg-white text-slate-600 border-slate-200"}`}
          >
            New Complaint
          </button>
          <button
            onClick={() => setShowForm(false)}
            className={`px-4 py-2 text-sm font-medium rounded-lg border ${!showForm ? "bg-[#0B3C5D] text-white" : "bg-white text-slate-600 border-slate-200"}`}
          >
            Submitted ({complaints.length})
          </button>
        </div>
      </div>

      {showForm ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Form */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
            <h2 className="text-lg font-bold text-[#0B3C5D] mb-1 flex items-center gap-2">
              <FileText size={18} /> Citizen Grievance Form
            </h2>
            <p className="text-xs text-slate-400 mb-5">Fields marked with * are mandatory</p>

            <div className="space-y-4">
              {/* Step 1: Citizen Info */}
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                <div className="text-xs font-bold text-[#0B3C5D] uppercase mb-3 flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-[#0B3C5D] text-white text-[10px] flex items-center justify-center">1</span>
                  Citizen Information
                </div>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">Citizen Name *</label>
                    <input
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#0B3C5D]"
                      placeholder="Enter full name as per Aadhaar"
                      value={form.citizen_name}
                      onChange={(e) => handleChange("citizen_name", e.target.value)}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-1">Aadhaar Number *</label>
                      <input
                        className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#0B3C5D]"
                        placeholder="XXXX-XXXX-XXXX"
                        value={form.aadhaar}
                        onChange={(e) => handleChange("aadhaar", e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-1">Mobile Number *</label>
                      <input
                        className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#0B3C5D]"
                        placeholder="+91-XXXXX-XXXXX"
                        value={form.mobile}
                        onChange={(e) => handleChange("mobile", e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Step 2: Complaint Details */}
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                <div className="text-xs font-bold text-[#0B3C5D] uppercase mb-3 flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-[#0B3C5D] text-white text-[10px] flex items-center justify-center">2</span>
                  Complaint Details
                </div>
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-1">District *</label>
                      <select
                        value={form.district}
                        onChange={(e) => handleChange("district", e.target.value)}
                        className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#0B3C5D]"
                      >
                        {DISTRICTS.map((d) => <option key={d} value={d}>{d}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-1">Department *</label>
                      <select
                        value={form.department}
                        onChange={(e) => handleChange("department", e.target.value)}
                        className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#0B3C5D]"
                      >
                        {DEPARTMENTS.map((d) => <option key={d} value={d}>{d}</option>)}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">Complaint Description *</label>
                    <textarea
                      rows={4}
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#0B3C5D] resize-none"
                      placeholder="Describe the citizen's complaint in detail..."
                      value={form.description}
                      onChange={(e) => handleChange("description", e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* Submit */}
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="w-full bg-[#0B3C5D] hover:bg-[#0a3350] text-white font-bold py-3 rounded-lg text-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
              >
                <Send size={16} />
                {submitting ? "Submitting..." : "Submit Complaint & Forward to Officer"}
              </button>
            </div>
          </div>

          {/* Result / AI Analysis Panel */}
          <div className="space-y-4">
            {submitted ? (
              <>
                <div className="bg-green-50 border border-green-200 rounded-xl p-6">
                  <div className="flex items-center gap-2 mb-3">
                    <CheckCircle2 size={20} className="text-green-600" />
                    <h3 className="text-lg font-bold text-green-800">Complaint Registered Successfully</h3>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div><span className="text-slate-500">Complaint ID:</span> <span className="font-bold text-green-700">{submitted.id}</span></div>
                    <div><span className="text-slate-500">Status:</span> <span className="font-bold">{submitted.status}</span></div>
                    <div><span className="text-slate-500">Citizen:</span> <span className="font-medium">{submitted.citizen_name}</span></div>
                    <div><span className="text-slate-500">District:</span> <span className="font-medium">{submitted.district}</span></div>
                    <div><span className="text-slate-500">Department:</span> <span className="font-medium">{submitted.department}</span></div>
                    <div><span className="text-slate-500">Forwarded:</span> <span className={`font-medium ${submitted.forwarded_to_officer ? "text-green-600" : "text-red-600"}`}>{submitted.forwarded_to_officer ? "Yes" : "No"}</span></div>
                  </div>
                </div>

                {/* AI Classification */}
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-5">
                  <h4 className="text-sm font-bold text-[#0B3C5D] mb-3">AI Grievance Classification</h4>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div><span className="text-slate-500">AI Category:</span> <span className="font-medium">{submitted.ai_category}</span></div>
                    <div><span className="text-slate-500">AI Department:</span> <span className="font-medium">{submitted.ai_department}</span></div>
                    <div><span className="text-slate-500">AI Priority:</span>
                      <span className={`ml-1 font-bold ${submitted.ai_priority === "Critical" ? "text-red-600" : submitted.ai_priority === "High" ? "text-orange-600" : "text-blue-600"}`}>
                        {submitted.ai_priority}
                      </span>
                    </div>
                    <div><span className="text-slate-500">Confidence:</span> <span className="font-medium">{(submitted.ai_confidence * 100).toFixed(0)}%</span></div>
                  </div>
                </div>

                <button
                  onClick={resetForm}
                  className="w-full flex items-center justify-center gap-2 bg-white border border-slate-200 text-[#0B3C5D] font-medium py-2.5 rounded-lg text-sm hover:bg-slate-50"
                >
                  <ArrowLeft size={14} /> Register Another Complaint
                </button>
              </>
            ) : (
              <div className="h-full min-h-[400px] bg-white border border-slate-200 rounded-xl flex flex-col items-center justify-center text-slate-400 p-10">
                <FileText size={48} className="mb-4 opacity-30" />
                <p className="text-base font-medium mb-2">Complaint Registration</p>
                <p className="text-sm text-center">
                  Fill in the citizen details and complaint description. After submission,
                  AI will classify the complaint and forward it to the District Officer.
                </p>
                <div className="mt-6 text-xs text-slate-400 text-center space-y-1">
                  <p>• AI-powered grievance classification</p>
                  <p>• Auto-forwarded to District Officer inbox</p>
                  <p>• Priority assigned by AI analysis</p>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Complaints List */
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            {loadingList ? (
              <div className="p-8 text-center text-slate-400">Loading complaints...</div>
            ) : complaints.length === 0 ? (
              <div className="p-8 text-center text-slate-400">
                <FileText size={40} className="mx-auto mb-2 opacity-30" />
                No complaints submitted yet
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[#0B3C5D] text-white">
                    <th className="text-left px-4 py-3 font-semibold">ID</th>
                    <th className="text-left px-4 py-3 font-semibold">Citizen</th>
                    <th className="text-left px-4 py-3 font-semibold">Department</th>
                    <th className="text-left px-4 py-3 font-semibold">Priority</th>
                    <th className="text-left px-4 py-3 font-semibold">Status</th>
                    <th className="text-left px-4 py-3 font-semibold">Forwarded</th>
                    <th className="text-left px-4 py-3 font-semibold">Submitted</th>
                  </tr>
                </thead>
                <tbody>
                  {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                  {complaints.map((c: any, idx: number) => (
                    <tr key={c.id} className={`border-b border-slate-100 ${idx % 2 === 0 ? "bg-white" : "bg-slate-50"}`}>
                      <td className="px-4 py-3 font-mono text-xs text-[#0B3C5D] font-semibold">{c.id}</td>
                      <td className="px-4 py-3">{c.citizen_name}</td>
                      <td className="px-4 py-3">{c.department}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded ${
                          c.priority === "Critical" ? "bg-red-100 text-red-800" :
                          c.priority === "High" ? "bg-orange-100 text-orange-800" :
                          c.priority === "Medium" ? "bg-blue-100 text-blue-800" :
                          "bg-green-100 text-green-800"
                        }`}>{c.priority}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded ${
                          c.status === "Resolved" ? "bg-green-100 text-green-800" :
                          c.status === "Submitted" ? "bg-yellow-100 text-yellow-800" :
                          c.status === "Forwarded" ? "bg-blue-100 text-blue-800" :
                          "bg-slate-100 text-slate-700"
                        }`}>{c.status}</span>
                      </td>
                      <td className="px-4 py-3">
                        {c.forwarded_to_officer ? (
                          <span className="text-green-600 flex items-center gap-1"><CheckCircle2 size={14} /> Yes</span>
                        ) : (
                          <span className="text-slate-400 flex items-center gap-1"><AlertTriangle size={14} /> No</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-slate-500">{c.submitted_at}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
