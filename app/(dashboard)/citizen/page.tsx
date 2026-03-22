"use client";
import { useCallback, useEffect, useState } from "react";
import { api } from "../../services/api";
import {
  FileText, ClipboardList, CheckCircle2, Clock, AlertTriangle,
  Bell, TrendingUp, ShieldAlert, ArrowRight,
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip,
  PieChart, Pie, Cell,
} from "recharts";

const PIE_COLORS = ["#16a34a", "#eab308", "#ef4444", "#3b82f6"];

export default function CitizenDashboardPage() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.fetchCitizenDashboard();
      setData(res);
    } catch (e) {
      toast.error("Failed to load dashboard");
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  if (loading || !data) {
    return (
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-slate-200 rounded w-64" />
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {[1,2,3,4,5].map(i => <div key={i} className="h-24 bg-slate-200 rounded-xl" />)}
          </div>
        </div>
      </div>
    );
  }

  const s = data.stats || {};
  const citizenName = typeof window !== "undefined" ? localStorage.getItem("userName") || "Citizen" : "Citizen";

  const kpiCards = [
    { label: "Total Complaints", value: s.total_complaints, icon: FileText, color: "text-blue-600", bg: "bg-blue-50 border-blue-200" },
    { label: "Total Applications", value: s.total_applications, icon: ClipboardList, color: "text-emerald-600", bg: "bg-emerald-50 border-emerald-200" },
    { label: "Approved", value: s.approved_applications, icon: CheckCircle2, color: "text-green-600", bg: "bg-green-50 border-green-200" },
    { label: "Pending", value: s.pending_applications, icon: Clock, color: "text-amber-600", bg: "bg-amber-50 border-amber-200" },
    { label: "Unread Notifications", value: s.unread_notifications, icon: Bell, color: "text-purple-600", bg: "bg-purple-50 border-purple-200" },
  ];

  const appChart = [
    { name: "Approved", value: s.approved_applications || 0 },
    { name: "Pending", value: s.pending_applications || 0 },
    { name: "Rejected", value: s.rejected_applications || 0 },
    { name: "Total Complaints", value: s.total_complaints || 0 },
  ];

  const complaintChart = [
    { name: "Resolved", count: s.resolved_complaints || 0 },
    { name: "Pending", count: s.pending_complaints || 0 },
  ];

  const quickLinks = [
    { label: "Submit Complaint", href: "/citizen/complaints", icon: FileText, desc: "File a new grievance" },
    { label: "Voice Complaint", href: "/citizen/voice-complaint", icon: TrendingUp, desc: "Record voice complaint" },
    { label: "Video Complaint", href: "/citizen/video-complaint", icon: AlertTriangle, desc: "Record video complaint" },
    { label: "Scheme Applications", href: "/citizen/schemes", icon: ClipboardList, desc: "Apply for schemes" },
    { label: "Upload Documents", href: "/citizen/documents", icon: CheckCircle2, desc: "Upload & verify documents" },
    { label: "Application Status", href: "/citizen/applications", icon: ShieldAlert, desc: "Track your applications" },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-[#0B3C5D] rounded-xl p-6 text-white">
        <h1 className="text-2xl font-bold">Welcome, {citizenName}</h1>
        <p className="text-white/70 text-sm mt-1">
          Citizen Self-Service Portal — Access government services, track applications, and submit grievances
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {kpiCards.map((k) => (
          <div key={k.label} className={`rounded-xl border p-4 shadow-sm ${k.bg}`}>
            <div className="flex items-center gap-2 mb-1">
              <k.icon size={14} className={k.color} />
              <span className="text-xs uppercase font-semibold text-slate-500">{k.label}</span>
            </div>
            <div className={`text-2xl font-bold ${k.color}`}>{k.value ?? 0}</div>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Application Status Pie */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <h3 className="text-sm font-bold text-[#0B3C5D] mb-4">Application Overview</h3>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={appChart} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                {appChart.map((_, idx) => (
                  <Cell key={idx} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Complaint Status Bar */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <h3 className="text-sm font-bold text-[#0B3C5D] mb-4">Complaint Status</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={complaintChart}>
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="count" fill="#0B3C5D" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Recent Complaints */}
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
          <div className="px-5 py-3 border-b border-slate-200 flex items-center justify-between">
            <h3 className="text-sm font-bold text-[#0B3C5D]">Recent Complaints</h3>
            <Link href="/citizen/complaints" className="text-xs text-blue-600 hover:underline flex items-center gap-1">
              View All <ArrowRight size={12} />
            </Link>
          </div>
          <div className="divide-y divide-slate-100">
            {(data.recent_complaints || []).length === 0 ? (
              <div className="p-6 text-center text-sm text-slate-400">No complaints submitted yet</div>
            ) : (
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              data.recent_complaints.map((c: any) => (
                <div key={c.id} className="px-5 py-3 flex items-center justify-between">
                  <div>
                    <div className="text-sm font-semibold text-slate-700">{c.id}</div>
                    <div className="text-xs text-slate-500">{c.department} • {c.category}</div>
                  </div>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded ${
                    c.status === "Resolved" ? "bg-green-100 text-green-800" :
                    c.status === "Under Review" ? "bg-amber-100 text-amber-800" :
                    "bg-blue-100 text-blue-800"
                  }`}>{c.status}</span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Notifications */}
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
          <div className="px-5 py-3 border-b border-slate-200 flex items-center justify-between">
            <h3 className="text-sm font-bold text-[#0B3C5D]">Recent Notifications</h3>
            <Link href="/citizen/notifications" className="text-xs text-blue-600 hover:underline flex items-center gap-1">
              View All <ArrowRight size={12} />
            </Link>
          </div>
          <div className="divide-y divide-slate-100">
            {(data.recent_notifications || []).length === 0 ? (
              <div className="p-6 text-center text-sm text-slate-400">No notifications</div>
            ) : (
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              data.recent_notifications.map((n: any) => (
                <div key={n.id} className={`px-5 py-3 ${!n.read ? "bg-blue-50/50" : ""}`}>
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className={`w-2 h-2 rounded-full ${
                      n.severity === "success" ? "bg-green-500" :
                      n.severity === "error" ? "bg-red-500" :
                      n.severity === "warning" ? "bg-amber-500" :
                      "bg-blue-500"
                    }`} />
                    <span className="text-sm text-slate-700">{n.message}</span>
                  </div>
                  <div className="text-xs text-slate-400 ml-4">{n.created_at}</div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <h3 className="text-sm font-bold text-[#0B3C5D] uppercase mb-3">Quick Actions</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {quickLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="bg-white border border-slate-200 rounded-xl p-4 hover:border-[#0B3C5D] hover:shadow-md transition text-center group"
            >
              <link.icon size={24} className="mx-auto text-[#0B3C5D] mb-2 group-hover:scale-110 transition" />
              <div className="text-sm font-semibold text-slate-700">{link.label}</div>
              <div className="text-xs text-slate-400 mt-0.5">{link.desc}</div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
