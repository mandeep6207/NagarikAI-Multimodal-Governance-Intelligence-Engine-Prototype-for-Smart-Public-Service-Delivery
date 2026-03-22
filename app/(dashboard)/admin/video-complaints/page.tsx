"use client";
import { useCallback, useEffect, useState } from "react";
import { api } from "../../../services/api";
import { Video, CheckCircle, AlertTriangle, RefreshCw, Play } from "lucide-react";
import { toast } from "sonner";

export default function VideoComplaintsPage() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [videos, setVideos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.fetchVideoComplaints();
      setVideos(res.video_complaints ?? []);
    } catch {
      toast.error("Failed to load video complaints");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleAction = async (id: string, action: "verify" | "escalate") => {
    try {
      await api.updateVideoComplaint(id, action);
      toast.success(`Video complaint ${action === "verify" ? "verified" : "escalated"} successfully`);
      fetchData();
    } catch {
      toast.error(`Failed to ${action} video complaint`);
    }
  };

  return (
    <div className="max-w-[1400px] mx-auto space-y-5">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-xl font-bold text-[#0B3C5D] uppercase tracking-tight">Video Complaint Monitoring</h1>
          <p className="text-xs text-slate-500 mt-0.5">Review video-based complaints with AI speech-to-text analysis</p>
        </div>
        <button onClick={fetchData} className="gov-btn-secondary flex items-center gap-2">
          <RefreshCw size={13} className={loading ? "animate-spin" : ""} /> Refresh
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-pulse">
          {[1,2,3,4].map(i => <div key={i} className="h-64 bg-slate-200 rounded" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
          {videos.map((v: any) => (
            <div key={v.id} className="gov-card">
              <div className="gov-panel-header justify-between">
                <div className="flex items-center gap-2">
                  <Video size={14} />
                  {v.id} — {v.citizen_name}
                </div>
                <VideoStatusBadge status={v.status} />
              </div>
              <div className="p-4 space-y-3">
                {/* Video placeholder */}
                <div className="bg-slate-900 rounded h-32 flex items-center justify-center relative">
                  <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                    <Play size={24} className="text-white ml-1" />
                  </div>
                  <div className="absolute bottom-2 right-2 text-[10px] text-white/70 bg-black/50 px-2 py-0.5 rounded">
                    {Math.floor(v.duration_seconds / 60)}:{String(v.duration_seconds % 60).padStart(2, "0")}
                  </div>
                </div>

                {/* Details */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-slate-500 uppercase font-semibold block">District</span>
                    <span className="font-semibold text-[#0B3C5D]">{v.district}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 uppercase font-semibold block">Submitted</span>
                    <span>{v.submitted_at?.slice(0, 10)}</span>
                  </div>
                </div>

                {/* Transcript */}
                <div>
                  <div className="text-[11px] text-slate-500 uppercase font-semibold mb-1">Speech-to-Text Transcript</div>
                  <div className="bg-slate-50 border border-[#cfd6e3] p-2 text-xs text-slate-700 italic rounded">
                    &ldquo;{v.transcript}&rdquo;
                  </div>
                </div>

                {/* AI Analysis */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-blue-50 border border-blue-200 p-2 rounded">
                    <div className="text-[10px] text-blue-600 uppercase font-bold">AI Category</div>
                    <div className="text-xs font-semibold text-blue-900">{v.ai_category}</div>
                  </div>
                  <div className="bg-purple-50 border border-purple-200 p-2 rounded">
                    <div className="text-[10px] text-purple-600 uppercase font-bold">AI Department</div>
                    <div className="text-xs font-semibold text-purple-900">{v.ai_department}</div>
                  </div>
                </div>
                <div className="text-[11px] text-slate-500">
                  AI Confidence: <strong className="text-[#0B3C5D]">{(v.ai_confidence * 100).toFixed(0)}%</strong>
                </div>

                {/* Actions */}
                {v.status === "Pending Review" && (
                  <div className="flex gap-2 pt-2 border-t border-[#cfd6e3]">
                    <button onClick={() => handleAction(v.id, "verify")} className="gov-btn-primary flex items-center gap-1 flex-1 justify-center">
                      <CheckCircle size={13} /> Verify
                    </button>
                    <button onClick={() => handleAction(v.id, "escalate")} className="flex items-center gap-1 flex-1 justify-center bg-red-700 text-white border border-red-800 px-3 py-1.5 text-xs font-bold rounded-sm hover:opacity-90 transition-opacity">
                      <AlertTriangle size={13} /> Escalate
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function VideoStatusBadge({ status }: { status: string }) {
  const cls: Record<string, string> = {
    "Pending Review": "bg-amber-100 text-amber-800 border-amber-300",
    Verified: "bg-green-100 text-green-800 border-green-300",
    Escalated: "bg-red-100 text-red-800 border-red-300",
  };
  return <span className={`text-[11px] px-2 py-0.5 font-semibold border rounded ${cls[status] || cls["Pending Review"]}`}>{status}</span>;
}
