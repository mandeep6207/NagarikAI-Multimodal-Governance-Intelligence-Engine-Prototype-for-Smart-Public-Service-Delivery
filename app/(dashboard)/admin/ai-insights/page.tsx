"use client";
import { useCallback, useEffect, useState } from "react";
import { api } from "../../../services/api";
import { Brain, RefreshCw, Shield, AlertCircle, Video, FileWarning, TrendingUp } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { toast } from "sonner";

const RISK_COLORS = ["#15803d", "#0d9488", "#b45309", "#c2410c", "#991b1b"];

export default function AiInsightsPage() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.fetchAiInsights();
      setData(res);
    } catch {
      toast.error("Failed to load AI insights");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  return (
    <div className="max-w-[1400px] mx-auto space-y-5">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-xl font-bold text-[#0B3C5D] uppercase tracking-tight">AI Integration Insights</h1>
          <p className="text-xs text-slate-500 mt-0.5">AI-powered governance analytics — Risk scoring, classification, and fraud detection</p>
        </div>
        <button onClick={fetchData} className="gov-btn-secondary flex items-center gap-2">
          <RefreshCw size={13} className={loading ? "animate-spin" : ""} /> Refresh
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-3 gap-4 animate-pulse">
          {[1,2,3].map(i => <div key={i} className="h-32 bg-slate-200 rounded" />)}
        </div>
      ) : data ? (
        <>
          {/* Risk Score Banner */}
          <div className={`gov-card p-0 ${data.risk_category === "Critical" ? "border-red-400" : data.risk_category === "Moderate" ? "border-amber-400" : "border-green-400"}`}>
            <div className={`p-5 ${data.risk_category === "Critical" ? "bg-red-50" : data.risk_category === "Moderate" ? "bg-amber-50" : "bg-green-50"}`}>
              <div className="flex items-center gap-3">
                <div className={`w-16 h-16 rounded flex items-center justify-center ${data.risk_category === "Critical" ? "bg-red-200" : data.risk_category === "Moderate" ? "bg-amber-200" : "bg-green-200"}`}>
                  <Shield size={28} className={data.risk_category === "Critical" ? "text-red-800" : data.risk_category === "Moderate" ? "text-amber-800" : "text-green-800"} />
                </div>
                <div>
                  <div className="text-[11px] uppercase tracking-wide text-slate-500 font-semibold">Governance Risk Score</div>
                  <div className={`text-4xl font-bold ${data.risk_category === "Critical" ? "text-red-800" : data.risk_category === "Moderate" ? "text-amber-800" : "text-green-800"}`}>
                    {data.governance_risk_score}
                    <span className="text-lg font-normal text-slate-400 ml-1">/ 100</span>
                  </div>
                  <div className={`text-xs font-bold uppercase tracking-wider ${data.risk_category === "Critical" ? "text-red-600" : data.risk_category === "Moderate" ? "text-amber-600" : "text-green-600"}`}>
                    {data.risk_category}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* AI Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <AiMetric label="Grievances Analyzed" value={data.total_grievances_analyzed} icon={<AlertCircle size={16} />} color="text-[#0B3C5D]" bg="bg-blue-50" />
            <AiMetric label="AI Classified" value={data.ai_classified_count} icon={<Brain size={16} />} color="text-purple-700" bg="bg-purple-50" />
            <AiMetric label="Fraud Detected" value={data.fraud_detected} icon={<FileWarning size={16} />} color="text-red-700" bg="bg-red-50" />
            <AiMetric label="Videos Analyzed" value={data.video_analyzed} icon={<Video size={16} />} color="text-green-700" bg="bg-green-50" />
          </div>

          {/* District Risk Ranking */}
          <div className="gov-card">
            <div className="gov-panel-header"><TrendingUp size={14} /> District Risk Ranking</div>
            <div className="p-4">
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={data.district_risk_ranking} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11 }} />
                  <YAxis dataKey="district" type="category" tick={{ fontSize: 11 }} width={80} />
                  <Tooltip contentStyle={{ fontSize: 12 }} />
                  <Bar dataKey="risk_score" name="Risk Score" radius={[0, 2, 2, 0]}>
                    {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                    {data.district_risk_ranking?.map((_: any, i: number) => (
                      <Cell key={i} fill={RISK_COLORS[i % RISK_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* AI Insights */}
          <div className="gov-card">
            <div className="gov-panel-header"><Brain size={14} /> AI Analysis & Recommendations</div>
            <div className="p-4 space-y-2">
              {data.insights?.map((insight: string, i: number) => (
                <div key={i} className="flex items-start gap-2 bg-slate-50 border border-[#cfd6e3] p-3 rounded-sm">
                  <span className="text-[#0B3C5D] font-bold text-sm mt-0.5">▸</span>
                  <p className="text-sm text-slate-700">{insight}</p>
                </div>
              ))}
            </div>
          </div>

          {/* AI Capabilities */}
          <div className="gov-card">
            <div className="gov-panel-header"><Brain size={14} /> Active AI Capabilities</div>
            <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {[
                { title: "Speech-to-Text Analysis", desc: "Automatic transcription and analysis of video complaints submitted by citizens", status: "Active" },
                { title: "Grievance Classification", desc: "AI-powered department routing and category classification for all incoming grievances", status: "Active" },
                { title: "Governance Risk Score", desc: "Real-time composite risk scoring based on escalations, open cases, and fraud alerts", status: "Active" },
                { title: "Fraud Detection", desc: "Detection of duplicate Aadhaar enrollment, document mismatches, and multiple scheme claims", status: "Active" },
                { title: "Scheme Eligibility Analysis", desc: "Automated eligibility verification based on citizen profiles and scheme rules", status: "Active" },
                { title: "SLA Prediction", desc: "ML-based prediction of complaint resolution timelines and SLA breach probability", status: "Active" },
              ].map((cap, i) => (
                <div key={i} className="bg-slate-50 border border-[#cfd6e3] p-3 rounded-sm">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-[#0B3C5D] uppercase">{cap.title}</span>
                    <span className="text-[10px] px-2 py-0.5 bg-green-100 text-green-800 border border-green-300 rounded font-semibold">{cap.status}</span>
                  </div>
                  <p className="text-[11px] text-slate-500">{cap.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}

function AiMetric({ label, value, icon, color, bg }: { label: string; value: number; icon: React.ReactNode; color: string; bg: string }) {
  return (
    <div className="gov-kpi p-3 flex items-center gap-3">
      <div className={`p-2 rounded ${bg}`}><span className={color}>{icon}</span></div>
      <div>
        <div className={`text-xl font-bold ${color}`}>{value}</div>
        <div className="text-[10px] text-slate-500 uppercase tracking-wide font-semibold">{label}</div>
      </div>
    </div>
  );
}
