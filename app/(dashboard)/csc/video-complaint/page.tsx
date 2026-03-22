"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { api } from "../../../services/api";
import {
  Video, Mic, Square, Send, CheckCircle2,
  Clock, ArrowLeft, Brain, AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";

const DISTRICTS = ["Raipur", "Bilaspur", "Durg", "Korba", "Jagdalpur"];

export default function VideoComplaintPage() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [recording, setRecording] = useState(false);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [recordedUrl, setRecordedUrl] = useState<string | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [submitted, setSubmitted] = useState<any>(null);
  const [cameraReady, setCameraReady] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [videos, setVideos] = useState<any[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const [tab, setTab] = useState<"record" | "history">("record");

  const [form, setForm] = useState({
    citizen_name: "",
    mobile: "",
    district: "",
  });

  const userDistrict =
    typeof window !== "undefined" ? localStorage.getItem("userDistrict") || "Raipur" : "Raipur";

  useEffect(() => {
    setForm((f) => ({ ...f, district: userDistrict }));
  }, [userDistrict]);

  const fetchVideos = useCallback(async () => {
    setLoadingList(true);
    try {
      const res = await api.fetchCscVideoComplaints(userDistrict);
      setVideos(res?.videos ?? []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingList(false);
    }
  }, [userDistrict]);

  useEffect(() => { fetchVideos(); }, [fetchVideos]);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setCameraReady(true);
    } catch {
      toast.error("Camera access denied or not available");
    }
  };

  const startRecording = () => {
    if (!videoRef.current?.srcObject) return;
    const stream = videoRef.current.srcObject as MediaStream;
    const recorder = new MediaRecorder(stream, { mimeType: "video/webm" });
    chunksRef.current = [];
    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };
    recorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: "video/webm" });
      setRecordedBlob(blob);
      setRecordedUrl(URL.createObjectURL(blob));
    };
    recorder.start();
    mediaRecorderRef.current = recorder;
    setRecording(true);
    setElapsedTime(0);
    timerRef.current = setInterval(() => setElapsedTime((t) => t + 1), 1000);
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    if (timerRef.current) clearInterval(timerRef.current);
    setRecording(false);
    // Stop camera tracks
    const stream = videoRef.current?.srcObject as MediaStream | null;
    stream?.getTracks().forEach((t) => t.stop());
    if (videoRef.current) videoRef.current.srcObject = null;
    setCameraReady(false);
  };

  const handleSubmit = async () => {
    if (!form.citizen_name.trim()) {
      toast.error("Enter citizen name");
      return;
    }
    setSubmitting(true);
    try {
      const res = await api.recordCscVideoComplaint({
        citizen_name: form.citizen_name,
        mobile: form.mobile,
        district: form.district,
        duration: elapsedTime,
        transcript: "", // STT will be server-simulated
      });
      setSubmitted(res);
      toast.success(`Video complaint ${res?.id} recorded & forwarded`);
      setRecordedBlob(null);
      setRecordedUrl(null);
      await fetchVideos();
    } catch (e) {
      toast.error("Failed to submit video complaint");
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  };

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;

  const reset = () => {
    setSubmitted(null);
    setRecordedBlob(null);
    setRecordedUrl(null);
    setElapsedTime(0);
    setForm({ citizen_name: "", mobile: "", district: userDistrict });
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#0B3C5D]">Video Complaint Recording</h1>
          <p className="text-slate-500 text-sm mt-1">
            Record citizen video statements with webcam • AI speech-to-text analysis
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setTab("record")}
            className={`px-4 py-2 text-sm font-medium rounded-lg border ${tab === "record" ? "bg-[#0B3C5D] text-white" : "bg-white text-slate-600 border-slate-200"}`}
          >
            Record
          </button>
          <button
            onClick={() => setTab("history")}
            className={`px-4 py-2 text-sm font-medium rounded-lg border ${tab === "history" ? "bg-[#0B3C5D] text-white" : "bg-white text-slate-600 border-slate-200"}`}
          >
            History ({videos.length})
          </button>
        </div>
      </div>

      {tab === "record" ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left: Video + Controls */}
          <div className="space-y-4">
            {/* Video area */}
            <div className="bg-black rounded-xl overflow-hidden aspect-video relative">
              {recordedUrl && !recording ? (
                <video src={recordedUrl} controls className="w-full h-full object-cover" />
              ) : (
                <video ref={videoRef} muted className="w-full h-full object-cover" />
              )}
              {recording && (
                <div className="absolute top-3 right-3 flex items-center gap-2 bg-red-600 text-white px-3 py-1 rounded-full text-xs font-bold animate-pulse">
                  <div className="w-2 h-2 rounded-full bg-white" /> REC {formatTime(elapsedTime)}
                </div>
              )}
              {!cameraReady && !recordedUrl && (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-white/60">
                  <Video size={48} className="mb-2" />
                  <p className="text-sm">Click &quot;Start Camera&quot; to begin</p>
                </div>
              )}
            </div>

            {/* Controls */}
            <div className="flex gap-3">
              {!cameraReady && !recordedUrl && (
                <button onClick={startCamera} className="flex-1 bg-[#0B3C5D] text-white py-2.5 rounded-lg text-sm font-semibold hover:bg-[#0a3350] flex items-center justify-center gap-2">
                  <Video size={16} /> Start Camera
                </button>
              )}
              {cameraReady && !recording && (
                <button onClick={startRecording} className="flex-1 bg-red-600 text-white py-2.5 rounded-lg text-sm font-semibold hover:bg-red-700 flex items-center justify-center gap-2">
                  <Mic size={16} /> Start Recording
                </button>
              )}
              {recording && (
                <button onClick={stopRecording} className="flex-1 bg-slate-800 text-white py-2.5 rounded-lg text-sm font-semibold hover:bg-slate-900 flex items-center justify-center gap-2">
                  <Square size={16} /> Stop Recording
                </button>
              )}
              {recordedUrl && !recording && (
                <>
                  <button onClick={reset} className="flex-1 bg-white border border-slate-200 text-slate-600 py-2.5 rounded-lg text-sm font-medium hover:bg-slate-50 flex items-center justify-center gap-2">
                    <ArrowLeft size={16} /> Re-record
                  </button>
                </>
              )}
            </div>

            {/* Process info */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="text-xs font-bold text-[#0B3C5D] uppercase mb-2">Recording Process</h4>
              <div className="space-y-2 text-xs text-slate-600">
                <div className="flex items-center gap-2"><span className="w-4 h-4 rounded-full bg-[#0B3C5D] text-white text-[10px] flex items-center justify-center font-bold">1</span> Start camera and begin recording</div>
                <div className="flex items-center gap-2"><span className="w-4 h-4 rounded-full bg-[#0B3C5D] text-white text-[10px] flex items-center justify-center font-bold">2</span> Citizen explains their grievance on camera</div>
                <div className="flex items-center gap-2"><span className="w-4 h-4 rounded-full bg-[#0B3C5D] text-white text-[10px] flex items-center justify-center font-bold">3</span> Stop recording and fill citizen details</div>
                <div className="flex items-center gap-2"><span className="w-4 h-4 rounded-full bg-[#0B3C5D] text-white text-[10px] flex items-center justify-center font-bold">4</span> Submit — AI runs speech-to-text & classification</div>
              </div>
            </div>
          </div>

          {/* Right: Form + Result */}
          <div className="space-y-4">
            {submitted ? (
              <>
                <div className="bg-green-50 border border-green-200 rounded-xl p-6">
                  <div className="flex items-center gap-2 mb-3">
                    <CheckCircle2 size={20} className="text-green-600" />
                    <h3 className="text-lg font-bold text-green-800">Video Complaint Registered</h3>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div><span className="text-slate-500">Video ID:</span> <span className="font-bold text-green-700">{submitted.id}</span></div>
                    <div><span className="text-slate-500">Status:</span> <span className="font-bold">{submitted.status}</span></div>
                    <div><span className="text-slate-500">Duration:</span> <span className="font-medium">{submitted.duration_display}</span></div>
                    <div><span className="text-slate-500">District:</span> <span className="font-medium">{submitted.district}</span></div>
                    <div className="col-span-2"><span className="text-slate-500">Forwarded to Officer:</span> <span className="font-medium text-green-600">{submitted.forwarded_to_officer ? "Yes" : "No"}</span></div>
                    <div className="col-span-2"><span className="text-slate-500">Forwarded to Super Admin:</span> <span className="font-medium text-green-600">{submitted.forwarded_to_admin ? "Yes" : "No"}</span></div>
                  </div>
                </div>

                {/* Speech-to-Text Transcript */}
                <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
                  <h4 className="text-sm font-bold text-[#0B3C5D] mb-2 flex items-center gap-2">
                    <Mic size={14} /> Speech-to-Text Transcript
                  </h4>
                  <p className="text-sm text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-200 italic">
                    &ldquo;{submitted.transcript}&rdquo;
                  </p>
                  <div className="text-xs text-slate-400 mt-2">
                    STT Confidence: {(submitted.speech_to_text_confidence * 100).toFixed(0)}%
                  </div>
                </div>

                {/* AI Classification */}
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-5">
                  <h4 className="text-sm font-bold text-[#0B3C5D] mb-3 flex items-center gap-2">
                    <Brain size={14} /> AI Classification
                  </h4>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div><span className="text-slate-500">Department:</span> <span className="font-medium">{submitted.ai_classified_department}</span></div>
                    <div><span className="text-slate-500">Category:</span> <span className="font-medium">{submitted.ai_classified_category}</span></div>
                    <div><span className="text-slate-500">Priority:</span>
                      <span className={`ml-1 font-bold ${submitted.ai_classified_priority === "Critical" ? "text-red-600" : submitted.ai_classified_priority === "High" ? "text-orange-600" : "text-blue-600"}`}>
                        {submitted.ai_classified_priority}
                      </span>
                    </div>
                    <div><span className="text-slate-500">Confidence:</span> <span className="font-medium">{(submitted.ai_confidence * 100).toFixed(0)}%</span></div>
                  </div>
                </div>

                <button onClick={reset} className="w-full flex items-center justify-center gap-2 bg-white border border-slate-200 text-[#0B3C5D] font-medium py-2.5 rounded-lg text-sm hover:bg-slate-50">
                  <ArrowLeft size={14} /> Record Another Video
                </button>
              </>
            ) : (
              <>
                {/* Citizen details form */}
                <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
                  <h3 className="text-sm font-bold text-[#0B3C5D] uppercase mb-4">Citizen Details</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-1">Citizen Name *</label>
                      <input
                        className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#0B3C5D]"
                        placeholder="Enter citizen's full name"
                        value={form.citizen_name}
                        onChange={(e) => setForm({ ...form, citizen_name: e.target.value })}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-slate-500 mb-1">Mobile Number</label>
                        <input
                          className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#0B3C5D]"
                          placeholder="+91-XXXXX-XXXXX"
                          value={form.mobile}
                          onChange={(e) => setForm({ ...form, mobile: e.target.value })}
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
                  </div>
                </div>

                {/* Submit button */}
                {recordedBlob && (
                  <button
                    onClick={handleSubmit}
                    disabled={submitting}
                    className="w-full bg-[#0B3C5D] hover:bg-[#0a3350] text-white font-bold py-3 rounded-lg text-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
                  >
                    <Send size={16} />
                    {submitting ? "Processing..." : "Submit Video & Run AI Analysis"}
                  </button>
                )}

                {/* Info cards */}
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <h4 className="text-xs font-bold text-amber-800 uppercase mb-2 flex items-center gap-2">
                    <AlertTriangle size={14} /> After Submission
                  </h4>
                  <ul className="text-xs text-amber-700 space-y-1">
                    <li>• Video forwarded to District Officer dashboard</li>
                    <li>• Video forwarded to State Super Administrator</li>
                    <li>• Audio extracted for speech-to-text analysis</li>
                    <li>• AI classifies department, category, priority</li>
                    <li>• Transcript generated for review</li>
                  </ul>
                </div>

                {elapsedTime > 0 && !recording && (
                  <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 flex items-center gap-2">
                    <Clock size={14} className="text-slate-400" />
                    <span className="text-sm text-slate-600">Recorded duration: <strong>{formatTime(elapsedTime)}</strong></span>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      ) : (
        /* History Tab */
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
          {loadingList ? (
            <div className="p-8 text-center text-slate-400">Loading...</div>
          ) : videos.length === 0 ? (
            <div className="p-8 text-center text-slate-400">
              <Video size={40} className="mx-auto mb-2 opacity-30" />
              No video complaints recorded yet
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
              {videos.map((v: any) => (
                <div key={v.id} className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                  {/* Video placeholder */}
                  <div className="bg-[#0B3C5D] h-32 flex items-center justify-center relative">
                    <Video size={32} className="text-white/40" />
                    <span className="absolute bottom-2 right-2 bg-black/60 text-white text-xs px-2 py-0.5 rounded">
                      {v.duration_display}
                    </span>
                    <span className={`absolute top-2 right-2 text-xs font-semibold px-2 py-0.5 rounded ${
                      v.status === "Reviewed" ? "bg-green-500 text-white" :
                      v.status === "Forwarded" ? "bg-blue-500 text-white" :
                      "bg-yellow-500 text-white"
                    }`}>{v.status}</span>
                  </div>
                  <div className="p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs text-[#0B3C5D] font-semibold">{v.id}</span>
                      <span className="text-xs text-slate-400">{v.recorded_at}</span>
                    </div>
                    <div className="text-sm font-medium">{v.citizen_name}</div>
                    <p className="text-xs text-slate-500 line-clamp-2">{v.transcript}</p>
                    <div className="flex gap-2 text-xs">
                      <span className="bg-slate-100 px-2 py-0.5 rounded">{v.ai_classified_department}</span>
                      <span className={`px-2 py-0.5 rounded font-semibold ${
                        v.ai_classified_priority === "Critical" ? "bg-red-100 text-red-700" :
                        v.ai_classified_priority === "High" ? "bg-orange-100 text-orange-700" :
                        "bg-blue-100 text-blue-700"
                      }`}>{v.ai_classified_priority}</span>
                    </div>
                    {v.forwarded_to_officer && (
                      <div className="text-xs text-green-600 flex items-center gap-1">
                        <CheckCircle2 size={12} /> Forwarded to Officer & Admin
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
