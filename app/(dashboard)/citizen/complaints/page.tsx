"use client";
import { useCallback, useEffect, useState } from "react";
import { api } from "../../../services/api";
import {
  Send, FileText, Filter, ChevronDown,
  CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";

const DISTRICTS = ["Raipur", "Bilaspur", "Durg", "Korba", "Jagdalpur"];
const DEPARTMENTS = [
  "Agriculture", "Revenue", "Education", "Panchayat",
  "Electricity", "Pension", "Health", "Water Supply",
];

type View = "form" | "list";

export default function CitizenComplaintsPage() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [complaints, setComplaints] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [view, setView] = useState<View>("form");
  const [statusFilter, setStatusFilter] = useState("");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [submitted, setSubmitted] = useState<any>(null);

  const citizenName = typeof window !== "undefined" ? localStorage.getItem("userName") || "" : "";
  const citizenDistrict = typeof window !== "undefined" ? localStorage.getItem("userDistrict") || "Raipur" : "Raipur";

  const [form, setForm] = useState({
    citizen_name: citizenName,
    mobile: "",
    district: citizenDistrict,
    department: "Revenue",
    description: "",
  });

  useEffect(() => {
    setForm(f => ({ ...f, citizen_name: citizenName, district: citizenDistrict }));
  }, [citizenName, citizenDistrict]);

  const fetchComplaints = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.fetchCitizenComplaints(statusFilter || undefined);
      setComplaints(res?.complaints ?? []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [statusFilter]);

  useEffect(() => { fetchComplaints(); }, [fetchComplaints]);

  const handleSubmit = async () => {
    if (!form.citizen_name.trim() || !form.description.trim()) {
      toast.error("Name and description are required");
      return;
    }
    setSubmitting(true);
    try {
      const res = await api.submitCitizenComplaint(form);
      setSubmitted(res);
      toast.success(`Complaint ${res?.id} submitted successfully`);
      await fetchComplaints();
    } catch (e) {
      toast.error("Failed to submit complaint");
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#0B3C5D]">Submit a Complaint</h1>
          <p className="text-slate-500 text-sm mt-1">File a grievance with the government department</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => { setView("form"); setSubmitted(null); }}
            className={`px-4 py-2 rounded-lg text-sm font-semibold border ${view === "form" ? "bg-[#0B3C5D] text-white border-[#0B3C5D]" : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"}`}
          >
            New Complaint
          </button>
          <button
            onClick={() => setView("list")}
            className={`px-4 py-2 rounded-lg text-sm font-semibold border ${view === "list" ? "bg-[#0B3C5D] text-white border-[#0B3C5D]" : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"}`}
          >
            My Complaints ({complaints.length})
          </button>
        </div>
      </div>

      {view === "form" ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Form */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
            <h2 className="text-lg font-bold text-[#0B3C5D] mb-1">Grievance Details</h2>
            <p className="text-xs text-slate-400 mb-5">All fields marked with * are required</p>

            <div className="space-y-4">
              {/* Step 1: Personal Info */}
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                <div className="text-xs font-bold text-[#0B3C5D] uppercase mb-3 flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-[#0B3C5D] text-white text-[10px] flex items-center justify-center">1</span>
                  Personal Information
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">Full Name *</label>
                    <input
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#0B3C5D]"
                      value={form.citizen_name}
                      onChange={(e) => setForm({ ...form, citizen_name: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">Mobile Number</label>
                    <input
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#0B3C5D]"
                      placeholder="10-digit mobile"
                      value={form.mobile}
                      onChange={(e) => setForm({ ...form, mobile: e.target.value })}
                    />
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
                      <label className="block text-xs font-semibold text-slate-500 mb-1">District</label>
                      <select
                        value={form.district}
                        onChange={(e) => setForm({ ...form, district: e.target.value })}
                        className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#0B3C5D]"
                      >
                        {DISTRICTS.map(d => <option key={d} value={d}>{d}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-1">Department</label>
                      <select
                        value={form.department}
                        onChange={(e) => setForm({ ...form, department: e.target.value })}
                        className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#0B3C5D]"
                      >
                        {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">Description *</label>
                    <textarea
                      rows={4}
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#0B3C5D] resize-none"
                      placeholder="Describe your complaint in detail..."
                      value={form.description}
                      onChange={(e) => setForm({ ...form, description: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="w-full bg-[#0B3C5D] hover:bg-[#0a3350] text-white font-bold py-3 rounded-lg text-sm flex items-center justify-center gap-2 disabled:opacity-60"
              >
                <Send size={16} />
                {submitting ? "Submitting..." : "Submit Complaint"}
              </button>
            </div>
          </div>

          {/* Result / Info Panel */}
          <div>
            {submitted ? (
              <div className="space-y-4">
                <div className="bg-green-50 border border-green-200 rounded-xl p-6">
                  <div className="flex items-center gap-2 mb-3">
                    <CheckCircle2 className="text-green-600" size={20} />
                    <h3 className="text-lg font-bold text-green-800">Complaint Submitted</h3>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div><span className="text-slate-500">Complaint ID:</span> <span className="font-bold text-green-700">{submitted.id}</span></div>
                    <div><span className="text-slate-500">Status:</span> <span className="font-bold">{submitted.status}</span></div>
                    <div><span className="text-slate-500">Department:</span> <span className="font-medium">{submitted.department}</span></div>
                    <div><span className="text-slate-500">Priority:</span> <span className="font-medium">{submitted.priority}</span></div>
                    <div><span className="text-slate-500">Assigned To:</span> <span className="font-medium">{submitted.assigned_officer}</span></div>
                    <div><span className="text-slate-500">Date:</span> <span className="font-medium">{submitted.submitted_at}</span></div>
                  </div>
                </div>

                {/* AI Classification */}
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-5">
                  <h4 className="text-sm font-bold text-blue-800 mb-3">AI Classification Result</h4>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div><span className="text-slate-500">Category:</span> <span className="font-bold">{submitted.ai_category}</span></div>
                    <div><span className="text-slate-500">Department:</span> <span className="font-bold">{submitted.ai_department}</span></div>
                    <div><span className="text-slate-500">Confidence:</span> <span className="font-bold">{(submitted.ai_confidence * 100).toFixed(0)}%</span></div>
                    <div><span className="text-slate-500">Priority:</span> <span className="font-bold">{submitted.priority}</span></div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white border border-slate-200 rounded-xl p-8 text-center text-slate-400 min-h-[350px] flex flex-col items-center justify-center">
                <FileText size={48} className="mb-4 opacity-30" />
                <p className="text-base font-medium mb-2">Complaint Submission</p>
                <p className="text-sm max-w-xs">
                  Fill in details and submit. Your complaint will be classified by AI
                  and assigned to the appropriate department officer.
                </p>
                <div className="mt-4 text-xs space-y-1 text-left">
                  <p>&#8226; AI-powered category detection</p>
                  <p>&#8226; Auto-assigned to department officer</p>
                  <p>&#8226; Track status in real-time</p>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Complaints List View */
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3 border-b border-slate-200">
            <h3 className="text-sm font-bold text-[#0B3C5D] flex items-center gap-2">
              <Filter size={14} /> My Complaints
            </h3>
            <div className="relative">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="border border-slate-200 rounded-lg pl-3 pr-8 py-1.5 text-xs appearance-none focus:outline-none focus:border-[#0B3C5D]"
              >
                <option value="">All Status</option>
                {["Submitted", "Under Review", "Assigned", "Resolved", "Closed"].map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
              <ChevronDown size={12} className="absolute right-2.5 top-2.5 text-slate-400 pointer-events-none" />
            </div>
          </div>

          {loading ? (
            <div className="p-8 text-center text-slate-400">Loading complaints...</div>
          ) : complaints.length === 0 ? (
            <div className="p-8 text-center text-slate-400">
              <FileText size={40} className="mx-auto mb-2 opacity-30" />
              No complaints found
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[#0B3C5D] text-white">
                    <th className="text-left px-4 py-3 font-semibold">ID</th>
                    <th className="text-left px-4 py-3 font-semibold">Department</th>
                    <th className="text-left px-4 py-3 font-semibold">Category</th>
                    <th className="text-left px-4 py-3 font-semibold">Priority</th>
                    <th className="text-left px-4 py-3 font-semibold">Status</th>
                    <th className="text-left px-4 py-3 font-semibold">Assigned To</th>
                    <th className="text-left px-4 py-3 font-semibold">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                  {complaints.map((c: any, idx: number) => (
                    <tr key={c.id} className={`border-b border-slate-100 ${idx % 2 === 0 ? "bg-white" : "bg-slate-50"}`}>
                      <td className="px-4 py-3 font-mono text-xs text-[#0B3C5D] font-semibold">{c.id}</td>
                      <td className="px-4 py-3">{c.department}</td>
                      <td className="px-4 py-3">{c.category}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded ${
                          c.priority === "Critical" ? "bg-red-100 text-red-800" :
                          c.priority === "High" ? "bg-orange-100 text-orange-800" :
                          c.priority === "Medium" ? "bg-amber-100 text-amber-800" :
                          "bg-blue-100 text-blue-800"
                        }`}>{c.priority}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded ${
                          c.status === "Resolved" || c.status === "Closed" ? "bg-green-100 text-green-800" :
                          c.status === "Under Review" ? "bg-amber-100 text-amber-800" :
                          "bg-blue-100 text-blue-800"
                        }`}>{c.status}</span>
                      </td>
                      <td className="px-4 py-3 text-slate-600">{c.assigned_officer}</td>
                      <td className="px-4 py-3 text-slate-500">{c.submitted_at}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
