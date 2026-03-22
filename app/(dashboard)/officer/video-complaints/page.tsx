"use client";
import { useCallback, useEffect, useState } from "react";
import { api } from "../../../services/api";
import { Video, CheckCircle, AlertTriangle, Mic, Brain } from "lucide-react";
import { toast } from "sonner";

export default function VideoComplaintReviewPage() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [videos, setVideos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const userDistrict =
    typeof window !== "undefined" ? localStorage.getItem("userDistrict") || undefined : undefined;

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.fetchOfficerVideoComplaints(userDistrict);
      setVideos(res?.video_complaints ?? []);
    } catch (e) {
      toast.error("Failed to load video complaints");
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [userDistrict]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleAction = async (videoId: string, action: "verify" | "escalate") => {
    setProcessingId(videoId);
    try {
      await api.officerVideoAction(videoId, action);
      toast.success(`Video complaint ${videoId} ${action === "verify" ? "verified" : "escalated"}`);
      await fetchData();
    } catch (e) {
      toast.error(`Action failed: ${e instanceof Error ? e.message : "unknown"}`);
    } finally {
      setProcessingId(null);
    }
  };

  const statusColor = (status: string) => {
    switch (status) {
      case "Pending Review": return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "Verified": return "bg-green-100 text-green-800 border-green-200";
      case "Escalated": return "bg-red-100 text-red-800 border-red-200";
      default: return "bg-gray-100 text-gray-700";
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#0B3C5D]">Video Complaint Review</h1>
        <p className="text-slate-500 text-sm mt-1">
          Video complaints submitted by citizens with AI-powered speech-to-text analysis
        </p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-pulse">
          {[1, 2, 3, 4].map((i) => <div key={i} className="h-80 bg-slate-200 rounded-xl" />)}
        </div>
      ) : videos.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-12 text-center text-slate-400">
          <Video size={48} className="mx-auto mb-4 text-slate-300" />
          <p>No video complaints found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {videos.map((v) => (
            <div key={v.id} className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
              {/* Video Placeholder */}
              <div className="bg-[#0B3C5D] h-40 flex items-center justify-center relative">
                <Video size={48} className="text-white/40" />
                <div className="absolute bottom-3 left-3 bg-black/60 text-white text-xs px-2 py-1 rounded">
                  {Math.floor(v.duration_seconds / 60)}:{(v.duration_seconds % 60).toString().padStart(2, "0")}
                </div>
                <div className={`absolute top-3 right-3 text-xs font-semibold px-2 py-1 rounded border ${statusColor(v.status)}`}>
                  {v.status}
                </div>
              </div>

              <div className="p-5 space-y-4">
                {/* Citizen Info */}
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold text-[#0B3C5D]">{v.citizen_name}</h3>
                    <p className="text-xs text-slate-500">{v.district} • {v.submitted_at}</p>
                  </div>
                  <span className="text-xs font-mono text-slate-400">{v.id}</span>
                </div>

                {/* Transcript */}
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <Mic size={14} className="text-[#0B3C5D]" />
                    <span className="text-xs font-semibold text-[#0B3C5D] uppercase">Speech-to-Text Transcript</span>
                  </div>
                  <p className="text-sm text-slate-600 leading-relaxed line-clamp-4">{v.transcript}</p>
                </div>

                {/* AI Analysis */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <Brain size={14} className="text-[#0B3C5D]" />
                    <span className="text-xs font-semibold text-[#0B3C5D] uppercase">AI Detection</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-slate-500">Category:</span>{" "}
                      <span className="font-medium text-slate-700">{v.ai_category}</span>
                    </div>
                    <div>
                      <span className="text-slate-500">Department:</span>{" "}
                      <span className="font-medium text-slate-700">{v.ai_department}</span>
                    </div>
                    <div>
                      <span className="text-slate-500">Confidence:</span>{" "}
                      <span className="font-medium text-slate-700">{(v.ai_confidence * 100).toFixed(0)}%</span>
                    </div>
                    <div>
                      <span className="text-slate-500">Urgency:</span>{" "}
                      <span className={`font-semibold ${v.ai_urgency === "Critical" || v.ai_urgency === "High" ? "text-red-600" : "text-slate-700"}`}>{v.ai_urgency}</span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                {v.status === "Pending Review" && (
                  <div className="flex gap-3">
                    <button
                      disabled={processingId === v.id}
                      onClick={() => handleAction(v.id, "verify")}
                      className="flex-1 flex items-center justify-center gap-2 bg-green-600 text-white py-2 rounded-lg text-sm font-semibold hover:bg-green-700 disabled:opacity-50"
                    >
                      <CheckCircle size={16} /> Verify
                    </button>
                    <button
                      disabled={processingId === v.id}
                      onClick={() => handleAction(v.id, "escalate")}
                      className="flex-1 flex items-center justify-center gap-2 bg-red-600 text-white py-2 rounded-lg text-sm font-semibold hover:bg-red-700 disabled:opacity-50"
                    >
                      <AlertTriangle size={16} /> Escalate
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
