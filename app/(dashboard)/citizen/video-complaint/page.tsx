"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { api } from "../../../services/api";
import {
  Video, VideoOff, Send, Brain, CheckCircle2, Camera,
  Square, FileText, ArrowRight,
} from "lucide-react";
import { toast } from "sonner";

export default function CitizenVideoComplaintPage() {
  const [cameraActive, setCameraActive] = useState(false);
  const [recording, setRecording] = useState(false);
  const [duration, setDuration] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [recorded, setRecorded] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [submitted, setSubmitted] = useState<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [history, setHistory] = useState<any[]>([]);
  const [view, setView] = useState<"record" | "history">("record");

  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const fetchHistory = useCallback(async () => {
    try {
      const res = await api.fetchCitizenVideoComplaints();
      setHistory(res?.video_complaints ?? []);
    } catch (e) { console.error(e); }
  }, []);

  useEffect(() => { fetchHistory(); }, [fetchHistory]);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setCameraActive(true);
    } catch {
      toast.error("Camera/microphone access denied");
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) videoRef.current.srcObject = null;
    setCameraActive(false);
    setRecording(false);
    if (timerRef.current) clearInterval(timerRef.current);
  };

  const startRecording = () => {
    if (!streamRef.current) return;
    const recorder = new MediaRecorder(streamRef.current);
    mediaRecorderRef.current = recorder;
    recorder.start();
    setRecording(true);
    setDuration(0);
    setRecorded(false);
    setSubmitted(null);
    timerRef.current = setInterval(() => setDuration(d => d + 1), 1000);
    toast.success("Recording started");
  };

  const stopRecording = () => {
    setRecording(false);
    setRecorded(true);
    if (timerRef.current) clearInterval(timerRef.current);
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
    toast.success(`Recording stopped — ${formatTime(duration)}`);
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const res = await api.submitCitizenVideoComplaint({ duration, transcript: "" });
      setSubmitted(res);
      toast.success(`Video complaint ${res?.id} submitted & forwarded`);
      stopCamera();
      await fetchHistory();
    } catch (e) {
      toast.error("Failed to submit video complaint");
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  };

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#0B3C5D]">Video Complaint</h1>
          <p className="text-slate-500 text-sm mt-1">
            Record a video describing your issue. AI will transcribe and classify automatically.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setView("record")}
            className={`px-4 py-2 rounded-lg text-sm font-semibold border ${view === "record" ? "bg-[#0B3C5D] text-white border-[#0B3C5D]" : "bg-white text-slate-600 border-slate-200"}`}
          >
            Record
          </button>
          <button
            onClick={() => setView("history")}
            className={`px-4 py-2 rounded-lg text-sm font-semibold border ${view === "history" ? "bg-[#0B3C5D] text-white border-[#0B3C5D]" : "bg-white text-slate-600 border-slate-200"}`}
          >
            History ({history.length})
          </button>
        </div>
      </div>

      {view === "record" ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Video Panel */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
            <h2 className="text-lg font-bold text-[#0B3C5D] mb-4">Video Recording</h2>

            {/* Video Preview */}
            <div className="relative bg-black rounded-lg overflow-hidden aspect-video mb-4">
              <video ref={videoRef} className="w-full h-full object-cover" muted playsInline />
              {!cameraActive && (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-white/70">
                  <Camera size={48} className="mb-2" />
                  <p className="text-sm">Camera is off</p>
                </div>
              )}
              {recording && (
                <div className="absolute top-3 left-3 flex items-center gap-2 bg-red-600 text-white text-xs font-bold px-3 py-1.5 rounded-full">
                  <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                  REC {formatTime(duration)}
                </div>
              )}
            </div>

            {/* Controls */}
            <div className="flex items-center justify-center gap-3">
              {!cameraActive ? (
                <button onClick={startCamera} className="bg-[#0B3C5D] hover:bg-[#0a3350] text-white px-6 py-2.5 rounded-lg text-sm font-semibold flex items-center gap-2">
                  <Camera size={16} /> Start Camera
                </button>
              ) : (
                <>
                  {!recording ? (
                    <button onClick={startRecording} className="bg-red-600 hover:bg-red-700 text-white px-6 py-2.5 rounded-lg text-sm font-semibold flex items-center gap-2">
                      <Video size={16} /> Start Recording
                    </button>
                  ) : (
                    <button onClick={stopRecording} className="bg-slate-700 hover:bg-slate-800 text-white px-6 py-2.5 rounded-lg text-sm font-semibold flex items-center gap-2">
                      <Square size={16} /> Stop Recording
                    </button>
                  )}
                  <button onClick={stopCamera} className="border border-slate-200 text-slate-600 px-4 py-2.5 rounded-lg text-sm hover:bg-slate-50 flex items-center gap-2">
                    <VideoOff size={16} /> Stop Camera
                  </button>
                </>
              )}
            </div>

            {/* Submit */}
            {recorded && !submitted && (
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="w-full mt-4 bg-[#0B3C5D] hover:bg-[#0a3350] text-white font-bold py-3 rounded-lg text-sm flex items-center justify-center gap-2 disabled:opacity-60"
              >
                <Send size={16} />
                {submitting ? "Uploading & Analyzing..." : "Submit Video Complaint"}
              </button>
            )}

            {/* Process Steps */}
            <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="text-xs font-bold text-blue-800 uppercase mb-2">Process Steps</div>
              <div className="space-y-1.5 text-xs text-blue-700">
                <div className="flex items-center gap-2"><span className="w-4 h-4 rounded-full bg-blue-200 text-blue-800 text-[10px] flex items-center justify-center font-bold">1</span> Start camera and record your complaint</div>
                <div className="flex items-center gap-2"><span className="w-4 h-4 rounded-full bg-blue-200 text-blue-800 text-[10px] flex items-center justify-center font-bold">2</span> Audio is extracted and transcribed</div>
                <div className="flex items-center gap-2"><span className="w-4 h-4 rounded-full bg-blue-200 text-blue-800 text-[10px] flex items-center justify-center font-bold">3</span> AI classifies category and department</div>
                <div className="flex items-center gap-2"><span className="w-4 h-4 rounded-full bg-blue-200 text-blue-800 text-[10px] flex items-center justify-center font-bold">4</span> Forwarded to District Officer & Super Admin</div>
              </div>
            </div>
          </div>

          {/* Result Panel */}
          <div>
            {submitted ? (
              <div className="space-y-4">
                <div className="bg-green-50 border border-green-200 rounded-xl p-6">
                  <div className="flex items-center gap-2 mb-3">
                    <CheckCircle2 className="text-green-600" size={20} />
                    <h3 className="text-lg font-bold text-green-800">Video Complaint Submitted</h3>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div><span className="text-slate-500">Complaint ID:</span> <span className="font-bold text-green-700">{submitted.id}</span></div>
                    <div><span className="text-slate-500">Status:</span> <span className="font-bold">{submitted.status}</span></div>
                    <div><span className="text-slate-500">Duration:</span> <span className="font-medium">{formatTime(submitted.duration)}</span></div>
                    <div><span className="text-slate-500">District:</span> <span className="font-medium">{submitted.district}</span></div>
                  </div>
                </div>

                {/* Speech-to-Text */}
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-5">
                  <h4 className="text-sm font-bold text-[#0B3C5D] mb-3 flex items-center gap-2">
                    <FileText size={14} /> Extracted Transcript
                  </h4>
                  <p className="text-sm text-slate-700 mb-2">{submitted.transcript}</p>
                  <span className="text-xs text-slate-500">
                    Confidence: <strong>{(submitted.speech_to_text_confidence * 100).toFixed(0)}%</strong>
                  </span>
                </div>

                {/* AI Classification */}
                {submitted.ai_classification && (
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-5">
                    <h4 className="text-sm font-bold text-blue-800 mb-3 flex items-center gap-2">
                      <Brain size={14} /> AI Classification
                    </h4>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div><span className="text-slate-500">Category:</span> <span className="font-bold">{submitted.ai_classification.category}</span></div>
                      <div><span className="text-slate-500">Department:</span> <span className="font-bold">{submitted.ai_classification.department}</span></div>
                      <div><span className="text-slate-500">Priority:</span> <span className="font-bold">{submitted.ai_classification.priority}</span></div>
                      <div><span className="text-slate-500">Confidence:</span> <span className="font-bold">{(submitted.ai_classification.confidence * 100).toFixed(0)}%</span></div>
                    </div>
                  </div>
                )}

                {/* Forwarding */}
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-5">
                  <h4 className="text-sm font-bold text-amber-800 mb-2">Forwarded To</h4>
                  <div className="space-y-1">
                    {submitted.forwarded_to?.map((target: string) => (
                      <div key={target} className="flex items-center gap-2 text-sm text-amber-700">
                        <ArrowRight size={12} /> {target}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white border border-slate-200 rounded-xl p-8 text-center text-slate-400 min-h-[400px] flex flex-col items-center justify-center">
                <Video size={48} className="mb-4 opacity-30" />
                <p className="text-base font-medium mb-2">Video Complaint System</p>
                <p className="text-sm max-w-xs mb-4">
                  Record a video, and our system will extract audio, transcribe speech,
                  and classify your complaint automatically.
                </p>
                <div className="text-xs space-y-1 text-left">
                  <p>&#8226; Audio extraction & transcription</p>
                  <p>&#8226; AI-powered classification</p>
                  <p>&#8226; Sent to District Officer & Super Admin</p>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* History View */
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
          <div className="px-5 py-3 border-b border-slate-200">
            <h3 className="text-sm font-bold text-[#0B3C5D]">Video Complaint History</h3>
          </div>
          {history.length === 0 ? (
            <div className="p-8 text-center text-slate-400">
              <Video size={40} className="mx-auto mb-2 opacity-30" />No video complaints submitted yet
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[#0B3C5D] text-white">
                    <th className="text-left px-4 py-3 font-semibold">ID</th>
                    <th className="text-left px-4 py-3 font-semibold">Department</th>
                    <th className="text-left px-4 py-3 font-semibold">Category</th>
                    <th className="text-left px-4 py-3 font-semibold">Duration</th>
                    <th className="text-left px-4 py-3 font-semibold">Status</th>
                    <th className="text-left px-4 py-3 font-semibold">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                  {history.map((v: any, idx: number) => (
                    <tr key={v.id} className={`border-b border-slate-100 ${idx % 2 === 0 ? "bg-white" : "bg-slate-50"}`}>
                      <td className="px-4 py-3 font-mono text-xs text-[#0B3C5D] font-semibold">{v.id}</td>
                      <td className="px-4 py-3">{v.department}</td>
                      <td className="px-4 py-3">{v.category}</td>
                      <td className="px-4 py-3">{formatTime(v.duration)}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded ${
                          v.status === "Resolved" ? "bg-green-100 text-green-800" :
                          v.status === "Forwarded" ? "bg-blue-100 text-blue-800" :
                          "bg-amber-100 text-amber-800"
                        }`}>{v.status}</span>
                      </td>
                      <td className="px-4 py-3 text-slate-500">{v.submitted_at}</td>
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
