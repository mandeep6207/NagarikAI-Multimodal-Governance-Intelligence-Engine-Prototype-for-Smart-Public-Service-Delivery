"use client";
import { useRef, useState } from "react";
import { api } from "../../../services/api";
import {
  Mic, MicOff, Send, Brain, CheckCircle2, FileText,
} from "lucide-react";
import { toast } from "sonner";

/* eslint-disable @typescript-eslint/no-explicit-any */
interface IWindow extends Window { SpeechRecognition?: any; webkitSpeechRecognition?: any; }
declare const window: IWindow;

export default function VoiceComplaintPage() {
  const [recording, setRecording] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [duration, setDuration] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [submitted, setSubmitted] = useState<any>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const recognitionRef = useRef<any>(null);

  // Start recording using Web Speech API for live speech-to-text
  const startRecording = async () => {
    setTranscript("");
    setDuration(0);
    setSubmitted(null);

    try {
      // Start microphone (for visual feedback / future upload)
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      recorder.start();

      // Start timer
      timerRef.current = setInterval(() => {
        setDuration(d => d + 1);
      }, 1000);

      // Start Web Speech API recognition
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = "en-IN";
        recognition.onresult = (event: any) => {
          let finalTranscript = "";
          for (let i = 0; i < event.results.length; i++) {
            finalTranscript += event.results[i][0].transcript;
          }
          setTranscript(finalTranscript);
        };
        recognition.onerror = () => { /* ignore errors, we have fallback */ };
        recognition.start();
        recognitionRef.current = recognition;
      }

      setRecording(true);
      toast.success("Recording started — speak now");
    } catch {
      toast.error("Microphone access denied");
    }
  };

  const stopRecording = () => {
    setRecording(false);
    if (timerRef.current) clearInterval(timerRef.current);
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(t => t.stop());
    }
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
  };

  const handleSubmit = async () => {
    if (!transcript.trim()) {
      toast.error("No speech transcript found. Please record again.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await api.submitCitizenVoiceComplaint({
        transcript,
        duration,
      });
      setSubmitted(res);
      toast.success(`Voice complaint ${res?.id} submitted`);
    } catch (e) {
      toast.error("Failed to submit voice complaint");
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  };

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#0B3C5D]">Voice Complaint</h1>
        <p className="text-slate-500 text-sm mt-1">
          Record your complaint using your microphone. Speech will be automatically converted to text and classified by AI.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recording Panel */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
          <h2 className="text-lg font-bold text-[#0B3C5D] mb-5">Record Your Complaint</h2>

          {/* Microphone Control */}
          <div className="flex flex-col items-center py-8">
            <button
              onClick={recording ? stopRecording : startRecording}
              className={`w-24 h-24 rounded-full flex items-center justify-center transition-all ${
                recording
                  ? "bg-red-500 hover:bg-red-600 animate-pulse shadow-lg shadow-red-200"
                  : "bg-[#0B3C5D] hover:bg-[#0a3350] shadow-lg shadow-blue-200"
              }`}
            >
              {recording ? <MicOff size={36} className="text-white" /> : <Mic size={36} className="text-white" />}
            </button>

            <div className="mt-4 text-center">
              {recording ? (
                <>
                  <div className="flex items-center gap-2 text-red-600 font-bold">
                    <span className="w-3 h-3 rounded-full bg-red-500 animate-pulse" />
                    Recording... {formatTime(duration)}
                  </div>
                  <p className="text-xs text-slate-500 mt-1">Click the button to stop recording</p>
                </>
              ) : (
                <>
                  <p className="text-sm font-semibold text-slate-600">
                    {duration > 0 ? `Recorded: ${formatTime(duration)}` : "Click to start recording"}
                  </p>
                  <p className="text-xs text-slate-400 mt-1">Speak clearly in Hindi or English</p>
                </>
              )}
            </div>
          </div>

          {/* Transcript Display */}
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 min-h-[120px]">
            <div className="text-xs font-bold text-[#0B3C5D] uppercase mb-2">Speech-to-Text Transcript</div>
            {transcript ? (
              <p className="text-sm text-slate-700 leading-relaxed">{transcript}</p>
            ) : (
              <p className="text-sm text-slate-400 italic">
                {recording ? "Listening... speak now" : "No transcript yet. Record your complaint first."}
              </p>
            )}
          </div>

          {/* Submit Button */}
          {!recording && transcript && !submitted && (
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="w-full mt-4 bg-[#0B3C5D] hover:bg-[#0a3350] text-white font-bold py-3 rounded-lg text-sm flex items-center justify-center gap-2 disabled:opacity-60"
            >
              <Send size={16} />
              {submitting ? "Submitting & Analyzing..." : "Submit Voice Complaint"}
            </button>
          )}

          {/* Process Steps */}
          <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="text-xs font-bold text-blue-800 uppercase mb-2">How it works</div>
            <div className="space-y-2 text-xs text-blue-700">
              <div className="flex items-center gap-2"><span className="w-4 h-4 rounded-full bg-blue-200 text-blue-800 text-[10px] flex items-center justify-center font-bold">1</span> Click the microphone and describe your complaint</div>
              <div className="flex items-center gap-2"><span className="w-4 h-4 rounded-full bg-blue-200 text-blue-800 text-[10px] flex items-center justify-center font-bold">2</span> Speech is converted to text in real-time</div>
              <div className="flex items-center gap-2"><span className="w-4 h-4 rounded-full bg-blue-200 text-blue-800 text-[10px] flex items-center justify-center font-bold">3</span> AI classifies the category and department</div>
              <div className="flex items-center gap-2"><span className="w-4 h-4 rounded-full bg-blue-200 text-blue-800 text-[10px] flex items-center justify-center font-bold">4</span> Complaint is auto-assigned to an officer</div>
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
                  <h3 className="text-lg font-bold text-green-800">Complaint Submitted</h3>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div><span className="text-slate-500">Complaint ID:</span> <span className="font-bold text-green-700">{submitted.id}</span></div>
                  <div><span className="text-slate-500">Status:</span> <span className="font-bold">{submitted.status}</span></div>
                  <div><span className="text-slate-500">Department:</span> <span className="font-medium">{submitted.department}</span></div>
                  <div><span className="text-slate-500">Priority:</span> <span className="font-medium">{submitted.priority}</span></div>
                  <div><span className="text-slate-500">Assigned:</span> <span className="font-medium">{submitted.assigned_officer}</span></div>
                  <div><span className="text-slate-500">Type:</span> <span className="font-medium">Voice</span></div>
                </div>
              </div>

              {/* Speech-to-Text Result */}
              {submitted.speech_to_text && (
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-5">
                  <h4 className="text-sm font-bold text-[#0B3C5D] mb-3 flex items-center gap-2">
                    <FileText size={14} /> Speech-to-Text Analysis
                  </h4>
                  <p className="text-sm text-slate-700 mb-2">{submitted.speech_to_text.transcript}</p>
                  <div className="flex gap-4 text-xs text-slate-500">
                    <span>Confidence: <strong>{(submitted.speech_to_text.confidence * 100).toFixed(0)}%</strong></span>
                    <span>Language: <strong>{submitted.speech_to_text.language}</strong></span>
                  </div>
                </div>
              )}

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
            </div>
          ) : (
            <div className="bg-white border border-slate-200 rounded-xl p-8 text-center text-slate-400 min-h-[400px] flex flex-col items-center justify-center">
              <Mic size={48} className="mb-4 opacity-30" />
              <p className="text-base font-medium mb-2">Voice Complaint System</p>
              <p className="text-sm max-w-xs">
                Record your complaint by voice. Our AI will automatically transcribe,
                classify, and assign it to the right department.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
