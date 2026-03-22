"""
End-to-end test for all 3 video complaint endpoints with STT pipeline.
Tests:
  1. POST /api/v1/complaints/submit-video
  2. POST /api/v1/citizen/video-complaints
  3. POST /api/v1/csc-portal/video-complaints
"""
import os, sys, time, wave, struct, requests

BASE = "http://localhost:8001/api/v1"

# Create a tiny WAV test file (1s beep)
WAV_PATH = os.path.join(os.path.dirname(__file__), "uploads", "test_beep.wav")
os.makedirs(os.path.dirname(WAV_PATH), exist_ok=True)
with wave.open(WAV_PATH, "w") as wf:
    wf.setnchannels(1)
    wf.setsampwidth(2)
    wf.setframerate(16000)
    frames = struct.pack("<" + "h" * 16000, *([1000] * 8000 + [-1000] * 8000))
    wf.writeframes(frames)

passed = 0
failed = 0

def check(name, condition, detail=""):
    global passed, failed
    if condition:
        passed += 1
        print(f"  PASS: {name}")
    else:
        failed += 1
        print(f"  FAIL: {name} -- {detail}")


# ── Test 1: /complaints/submit-video ────────────────────────
print("\n=== Test 1: POST /complaints/submit-video ===")
start = time.time()
with open(WAV_PATH, "rb") as f:
    r = requests.post(
        f"{BASE}/complaints/submit-video",
        files={"video": ("test.wav", f, "audio/wav")},
        data={"district": "Raipur", "citizen_name": "Test User", "mobile": "9999999999"},
        headers={"x-user-role": "citizen"},
    )
elapsed = time.time() - start
print(f"  Status: {r.status_code} ({elapsed:.1f}s)")
d = r.json()
check("status 200", r.status_code == 200, f"got {r.status_code}")
check("has video_url", bool(d.get("video_url")))
check("has transcript", bool(d.get("transcript")))
check("has stt_method", d.get("stt_method") in ("whisper", "fallback", "none", None), f"got {d.get('stt_method')}")
check("department classified", bool(d.get("department")))
print(f"  transcript: {str(d.get('transcript',''))[:80]}")
print(f"  stt_method: {d.get('stt_method')}")
print(f"  stt_confidence: {d.get('speech_to_text_confidence')}")


# ── Test 2: /citizen/video-complaints ───────────────────────
print("\n=== Test 2: POST /citizen/video-complaints ===")
# First login to get a citizen ID
login_r = requests.post(f"{BASE}/citizen/login", json={"mobile": "9876543210", "otp": "1234"})
if login_r.status_code == 200:
    citizen_id = login_r.json().get("citizen_id", "") or login_r.json().get("citizen", {}).get("id", "")
    print(f"  Logged in as citizen: {citizen_id}")
else:
    citizen_id = "CIT-001"
    print(f"  Login failed, using default: {citizen_id}")

start = time.time()
with open(WAV_PATH, "rb") as f:
    r = requests.post(
        f"{BASE}/citizen/video-complaints",
        files={"video": ("test.wav", f, "audio/wav")},
        data={"fallback_transcript": ""},
        headers={"x-citizen-id": citizen_id},
    )
elapsed = time.time() - start
print(f"  Status: {r.status_code} ({elapsed:.1f}s)")
d = r.json()
if r.status_code == 200:
    check("status 200", True)
    check("has video_url", bool(d.get("video_url")))
    check("has transcript", bool(d.get("transcript")))
    check("has transcript_hi", "transcript_hi" in d)
    check("has translation_en", "translation_en" in d)
    check("has stt_confidence", "speech_to_text_confidence" in d)
    print(f"  transcript: {str(d.get('transcript',''))[:80]}")
    print(f"  stt_confidence: {d.get('speech_to_text_confidence')}")
else:
    check("status 200", False, f"got {r.status_code}: {r.text[:200]}")


# ── Test 3: /csc-portal/video-complaints ────────────────────
print("\n=== Test 3: POST /csc-portal/video-complaints ===")
start = time.time()
with open(WAV_PATH, "rb") as f:
    r = requests.post(
        f"{BASE}/csc-portal/video-complaints",
        files={"video": ("test.wav", f, "audio/wav")},
        data={
            "citizen_name": "CSC Test Citizen",
            "mobile": "8888888888",
            "district": "Durg",
            "fallback_transcript": "",
        },
        headers={"x-user-role": "csc_operator"},
    )
elapsed = time.time() - start
print(f"  Status: {r.status_code} ({elapsed:.1f}s)")
d = r.json()
if r.status_code == 200:
    check("status 200", True)
    check("has video_url", bool(d.get("video_url")))
    check("has transcript", bool(d.get("transcript")))
    check("has transcript_hi", "transcript_hi" in d)
    check("has translation_en", "translation_en" in d)
    check("has stt_confidence", "speech_to_text_confidence" in d)
    check("department classified", bool(d.get("department")))
    print(f"  transcript: {str(d.get('transcript',''))[:80]}")
    print(f"  stt_confidence: {d.get('speech_to_text_confidence')}")
    print(f"  department: {d.get('department')}")
else:
    check("status 200", False, f"got {r.status_code}: {r.text[:200]}")


# ── Summary ─────────────────────────────────────────────────
print(f"\n{'='*60}")
print(f"  RESULTS: {passed} passed, {failed} failed out of {passed+failed} tests")
print(f"{'='*60}")
sys.exit(0 if failed == 0 else 1)
