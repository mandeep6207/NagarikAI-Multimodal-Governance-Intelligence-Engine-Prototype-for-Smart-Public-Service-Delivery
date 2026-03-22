"""
Standalone Speech-to-Text verification test using backend/videos/Testing.mp4.

Tests:
  1. Video file detection
  2. Audio extraction (first 20s, mono, 16kHz WAV)
  3. Whisper transcription (Hindi transcript)
  4. Whisper translation (English translation)
  5. Debug logging at every stage
"""

import os
import sys
import subprocess
import time
import wave

# ── Setup paths ─────────────────────────────────────────────
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
VIDEO_PATH = os.path.join(SCRIPT_DIR, "videos", "Testing.mp4")
AUDIO_OUT = os.path.join(SCRIPT_DIR, "testing_audio.wav")

# Ensure imageio_ffmpeg's bundled ffmpeg is on PATH (same logic as speech_service.py)
try:
    import imageio_ffmpeg
    _ffmpeg_exe = imageio_ffmpeg.get_ffmpeg_exe()
    _ffmpeg_dir = os.path.dirname(_ffmpeg_exe)
    _ffmpeg_link = os.path.join(_ffmpeg_dir, "ffmpeg.exe")
    if not os.path.exists(_ffmpeg_link):
        os.link(_ffmpeg_exe, _ffmpeg_link)
        print(f"[SETUP] Created hard link: {_ffmpeg_link}")
    if _ffmpeg_dir not in os.environ.get("PATH", ""):
        os.environ["PATH"] = _ffmpeg_dir + os.pathsep + os.environ.get("PATH", "")
    FFMPEG_BIN = _ffmpeg_exe
    print(f"[SETUP] ffmpeg binary: {FFMPEG_BIN}")
except ImportError:
    FFMPEG_BIN = "ffmpeg"
    print("[SETUP] imageio_ffmpeg not found, using system ffmpeg")


def log(tag: str, msg: str):
    print(f"  [{tag}] {msg}")


def step(num: int, title: str):
    print(f"\n{'='*60}")
    print(f"  Step {num}: {title}")
    print(f"{'='*60}")


# ── Step 1: Verify video file ──────────────────────────────
step(1, "Verify video file")

if not os.path.exists(VIDEO_PATH):
    log("ERROR", f"Video file not found: {VIDEO_PATH}")
    sys.exit(1)

video_size = os.path.getsize(VIDEO_PATH)
log("OK", f"Video path: {VIDEO_PATH}")
log("OK", f"Video size: {video_size:,} bytes ({video_size / 1024 / 1024:.1f} MB)")

# Check if video has an audio stream using ffprobe
step(2, "Check video audio stream")
ffprobe_bin = os.path.join(os.path.dirname(FFMPEG_BIN), "ffprobe.exe") if FFMPEG_BIN != "ffmpeg" else "ffprobe"
# Use ffmpeg -i to probe (ffprobe may not exist in imageio_ffmpeg)
probe_cmd = [FFMPEG_BIN, "-i", VIDEO_PATH, "-hide_banner"]
probe_result = subprocess.run(probe_cmd, capture_output=True, text=True, timeout=30)
probe_output = probe_result.stderr  # ffmpeg prints info to stderr
has_audio = "Audio:" in probe_output
log("INFO", f"Has audio stream: {has_audio}")
for line in probe_output.splitlines():
    line = line.strip()
    if "Duration:" in line or "Audio:" in line or "Video:" in line or "Stream" in line:
        log("INFO", f"  {line}")

if not has_audio:
    log("ERROR", "Video has no audio stream — STT cannot work on this file.")
    sys.exit(1)


# ── Step 3: Extract first 20 seconds of audio ──────────────
step(3, "Extract audio (first 20s, mono, 16kHz, WAV)")

extract_cmd = [
    FFMPEG_BIN, "-i", VIDEO_PATH,
    "-t", "20",             # first 20 seconds
    "-vn",                  # no video
    "-acodec", "pcm_s16le", # PCM 16-bit
    "-ar", "16000",         # 16kHz
    "-ac", "1",             # mono
    "-y",                   # overwrite
    AUDIO_OUT,
]
log("CMD", " ".join(extract_cmd))

t0 = time.time()
extract_result = subprocess.run(extract_cmd, capture_output=True, text=True, timeout=120)
elapsed = time.time() - t0

if extract_result.returncode != 0:
    log("ERROR", f"ffmpeg failed (exit code {extract_result.returncode})")
    log("STDERR", extract_result.stderr[:1000])
    sys.exit(1)

if not os.path.exists(AUDIO_OUT):
    log("ERROR", f"Audio file not created: {AUDIO_OUT}")
    sys.exit(1)

audio_size = os.path.getsize(AUDIO_OUT)
log("OK", f"Audio extracted: {AUDIO_OUT}")
log("OK", f"Audio size: {audio_size:,} bytes")
log("OK", f"Extraction time: {elapsed:.2f}s")

# Read WAV duration
try:
    with wave.open(AUDIO_OUT, "r") as wf:
        frames = wf.getnframes()
        rate = wf.getframerate()
        duration = frames / float(rate)
        log("OK", f"Audio duration: {duration:.2f}s (frames={frames}, rate={rate})")
except Exception as e:
    log("WARN", f"Could not read WAV header: {e}")
    duration = 0.0


# ── Step 4: Whisper transcription (Hindi) ───────────────────
step(4, "Whisper transcription (Hindi transcript)")

try:
    import whisper
    log("OK", "Whisper module imported successfully")
except ImportError:
    log("ERROR", "Whisper not installed. Run: pip install openai-whisper")
    sys.exit(1)

log("INFO", "Loading Whisper 'base' model...")
t0 = time.time()
model = whisper.load_model("base")
log("OK", f"Model loaded in {time.time() - t0:.2f}s")

# Transcribe (auto-detect language, should detect Hindi)
log("INFO", f"Transcribing: {AUDIO_OUT}")
t0 = time.time()
result = model.transcribe(AUDIO_OUT)
transcribe_time = time.time() - t0

transcript_hi = result.get("text", "").strip()
detected_lang = result.get("language", "unknown")
segments = result.get("segments", [])

log("OK", f"Transcription time: {transcribe_time:.2f}s")
log("OK", f"Detected language: {detected_lang}")
log("OK", f"Segments: {len(segments)}")

if transcript_hi:
    log("OK", f"Hindi transcript: \"{transcript_hi}\"")
    # Show segment details
    for i, seg in enumerate(segments):
        start = seg.get("start", 0)
        end = seg.get("end", 0)
        text = seg.get("text", "").strip()
        prob = seg.get("avg_logprob", 0)
        log("SEG", f"  [{start:.1f}s - {end:.1f}s] (logprob={prob:.3f}) \"{text}\"")
else:
    log("ERROR", "Whisper returned EMPTY transcript!")
    log("ERROR", "Possible reasons:")
    log("ERROR", "  - Audio contains no speech")
    log("ERROR", "  - Audio is too noisy for 'base' model")
    log("ERROR", "  - ffmpeg extracted silent/corrupt audio")
    # Don't exit — continue to translation attempt anyway


# ── Step 5: Whisper translation (English) ───────────────────
step(5, "Whisper translation (English)")

log("INFO", f"Translating: {AUDIO_OUT}")
t0 = time.time()
translate_result = model.transcribe(AUDIO_OUT, task="translate")
translate_time = time.time() - t0

transcript_en = translate_result.get("text", "").strip()

log("OK", f"Translation time: {translate_time:.2f}s")

if transcript_en:
    log("OK", f"English translation: \"{transcript_en}\"")
else:
    log("ERROR", "Whisper returned EMPTY translation!")


# ── Step 6: Summary ────────────────────────────────────────
step(6, "Summary")

print()
print(f"  Video:              {VIDEO_PATH}")
print(f"  Audio extracted:    {AUDIO_OUT}")
print(f"  Audio duration:     {duration:.2f}s")
print(f"  Detected language:  {detected_lang}")
print()
print(f"  Hindi transcript:")
print(f"    \"{transcript_hi}\"")
print()
print(f"  English translation:")
print(f"    \"{transcript_en}\"")
print()

if transcript_hi:
    print("  ✓ SPEECH-TO-TEXT PIPELINE WORKS — Whisper successfully transcribed the video.")

    # Compute confidence
    if segments:
        import math
        avg_prob = sum(s.get("avg_logprob", -1.0) for s in segments) / len(segments)
        confidence = min(0.99, max(0.1, math.exp(avg_prob)))
        print(f"  ✓ Confidence: {confidence:.2f}")
    print()
    print("  The pipeline can be integrated into the upload endpoint.")
else:
    print("  ✗ SPEECH-TO-TEXT FAILED — see errors above.")
    sys.exit(1)

# Cleanup extracted audio
try:
    os.unlink(AUDIO_OUT)
    log("CLEANUP", f"Removed {AUDIO_OUT}")
except OSError:
    pass

print()
print("=" * 60)
print("  TEST COMPLETE")
print("=" * 60)
