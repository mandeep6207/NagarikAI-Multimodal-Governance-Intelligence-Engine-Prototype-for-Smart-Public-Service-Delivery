"""End-to-end verification tests for the video complaint pipeline."""
import urllib.request
import json
import os
import sys
import wave
import struct
import math

BASE = "http://localhost:8001/api/v1"
HEADERS_CITIZEN = {"Content-Type": "application/json", "x-user-role": "citizen"}
HEADERS_OFFICER = {"Content-Type": "application/json", "x-user-role": "district_officer"}
HEADERS_ADMIN = {"Content-Type": "application/json", "x-user-role": "super_admin"}

passed = 0
failed = 0


def api_get(path, headers=HEADERS_CITIZEN):
    req = urllib.request.Request(f"{BASE}{path}", headers=headers)
    resp = urllib.request.urlopen(req, timeout=30)
    return json.loads(resp.read())


def api_post(path, data, headers=HEADERS_CITIZEN):
    body = json.dumps(data).encode("utf-8")
    req = urllib.request.Request(f"{BASE}{path}", data=body, headers=headers)
    resp = urllib.request.urlopen(req, timeout=120)
    return json.loads(resp.read())


def check(name, condition, detail=""):
    global passed, failed
    if condition:
        passed += 1
        print(f"  PASS: {name}")
    else:
        failed += 1
        print(f"  FAIL: {name} — {detail}")


# ── Test 1: Keyword Classification (English) ─────────────────
print("\n=== Test 1: Keyword Classification (English) ===")
tests_en = [
    ("pension nahi mil raha", "Social Welfare"),
    ("scholarship rejected by office", "Education"),
    ("electricity cut for 5 hours daily", "Electricity"),
    ("ration card pending 4 months", "Revenue"),
    ("water supply stopped in ward", "Water Supply"),
]
for text, expected in tests_en:
    r = api_post("/complaints/classify", {"text": text, "urgency": 3})
    check(f'"{text}" → {expected}', r["department"] == expected, f'got {r["department"]}')

# ── Test 2: Keyword Classification (Hindi) ────────────────────
print("\n=== Test 2: Keyword Classification (Hindi) ===")
tests_hi = [
    ("\u092e\u0947\u0930\u093e \u092a\u0947\u0902\u0936\u0928 \u0928\u0939\u0940\u0902 \u0906 \u0930\u0939\u093e", "Social Welfare"),       # pension
    ("\u091b\u093e\u0924\u094d\u0930\u0935\u0943\u0924\u094d\u0924\u093f \u0905\u0938\u094d\u0935\u0940\u0915\u0943\u0924 \u0939\u094b \u0917\u0908", "Education"),           # scholarship
    ("\u092c\u093f\u091c\u0932\u0940 3 \u0926\u093f\u0928 \u0938\u0947 \u0928\u0939\u0940\u0902 \u0906 \u0930\u0939\u0940", "Electricity"),      # electricity
    ("\u0930\u093e\u0936\u0928 \u0915\u093e\u0930\u094d\u0921 \u0928\u0939\u0940\u0902 \u092e\u093f\u0932\u093e", "Revenue"),              # ration
    ("\u092a\u093e\u0928\u0940 \u0928\u0939\u0940\u0902 \u0906 \u0930\u0939\u093e \u0939\u0948\u0902\u0921\u092a\u0902\u092a \u0916\u0930\u093e\u092c", "Water Supply"),  # water
]
for text, expected in tests_hi:
    r = api_post("/complaints/classify", {"text": text, "urgency": 3})
    check(f'Hindi → {expected}', r["department"] == expected, f'got {r["department"]}')

# ── Test 3: Submit complaint "pension nahi mil raha" ──────────
print("\n=== Test 3: Submit Complaint (pension) ===")
r = api_post("/complaints/submit", {
    "description": "pension nahi mil raha hai mujhe teen mahine se",
    "district": "Raipur",
    "citizen_name": "Test Citizen",
    "citizen_id": "CIT-TEST-001",
    "source": "citizen",
})
new_id = r.get("id") or r.get("complaint_id")
check("Complaint created", bool(new_id), f"response: {r}")
check("Department = Social Welfare", r.get("department") == "Social Welfare", f'got {r.get("department")}')
check("Status = Open", r.get("status") == "Open")
check("Has video_url field", "video_url" in r)
print(f"  → Complaint ID: {new_id}")

# ── Test 4: Verify in MongoDB via GET ─────────────────────────
print("\n=== Test 4: Verify complaint in MongoDB ===")
c = api_get(f"/complaints/{new_id}")
check("GET by ID works", c.get("id") == new_id)
check("Department persisted", c.get("department") == "Social Welfare")
check("District persisted", c.get("district") == "Raipur")

# ── Test 5: District Officer Dashboard ────────────────────────
print("\n=== Test 5: District Officer Dashboard ===")
d = api_get("/complaints/district-complaints/Raipur", HEADERS_OFFICER)
check("District endpoint works", d.get("district") == "Raipur")
check("Has complaints list", isinstance(d.get("complaints"), list))
ids_in_district = [c.get("id") or c.get("complaint_id") for c in d["complaints"]]
check(f"New complaint in district list", new_id in ids_in_district, f"looked for {new_id}")

# Also check officer dashboard
od = api_get("/officer/dashboard", HEADERS_OFFICER)
check("Officer dashboard KPIs", "kpis" in od)
check("Total complaints > 0", od["kpis"]["total_complaints"] > 0)

# ── Test 6: State Admin Dashboard ─────────────────────────────
print("\n=== Test 6: State Admin Dashboard ===")
a = api_get("/complaints/all-complaints", HEADERS_ADMIN)
check("All-complaints endpoint works", a.get("total", 0) > 0)
all_ids = [c.get("id") or c.get("complaint_id") for c in a["complaints"]]
check(f"New complaint in all-complaints", new_id in all_ids)

sd = api_get("/superadmin/dashboard", HEADERS_ADMIN)
check("Superadmin dashboard KPIs", "kpis" in sd)
check("Total complaints > 0", sd["kpis"]["total_complaints"] > 0)

# ── Test 7: Create test video file and upload ─────────────────
print("\n=== Test 7: Video Upload + STT Pipeline ===")

# Create a small WAV file with a tone (to test the pipeline works)
wav_path = os.path.join(os.path.dirname(__file__), "test_audio.wav")
sample_rate = 16000
duration = 2  # seconds
n_samples = sample_rate * duration
with wave.open(wav_path, "w") as wf:
    wf.setnchannels(1)
    wf.setsampwidth(2)
    wf.setframerate(sample_rate)
    for i in range(n_samples):
        sample = int(16000 * math.sin(2 * math.pi * 440 * i / sample_rate))
        wf.writeframes(struct.pack("<h", sample))

# Upload as video (with fallback transcript since it's just a tone)
import http.client
import io

boundary = "----TestBoundary12345"
body_parts = []
# Add video file field
body_parts.append(f"--{boundary}\r\nContent-Disposition: form-data; name=\"video\"; filename=\"test.wav\"\r\nContent-Type: audio/wav\r\n\r\n".encode())
with open(wav_path, "rb") as f:
    body_parts.append(f.read())
body_parts.append(b"\r\n")
# Add form fields
for name, val in [("district", "Raipur"), ("citizen_name", "Video Test User"), ("citizen_id", "CIT-VID-001"), ("fallback_transcript", "pension nahi mil raha hai")]:
    body_parts.append(f"--{boundary}\r\nContent-Disposition: form-data; name=\"{name}\"\r\n\r\n{val}\r\n".encode())
body_parts.append(f"--{boundary}--\r\n".encode())
body_bytes = b"".join(body_parts)

req = urllib.request.Request(
    f"{BASE}/complaints/upload-video",
    data=body_bytes,
    headers={
        "Content-Type": f"multipart/form-data; boundary={boundary}",
        "x-user-role": "citizen",
    },
)
try:
    resp = urllib.request.urlopen(req, timeout=120)
    vr = json.loads(resp.read())
    vid_id = vr.get("id") or vr.get("complaint_id")
    check("Video upload succeeded", bool(vid_id))
    check("Has video_url", bool(vr.get("video_url")))
    check("Video stored in /uploads/videos/", "/uploads/videos/" in (vr.get("video_url") or ""))
    check("Has transcript", bool(vr.get("transcript") or vr.get("description")))
    check("Department classified", bool(vr.get("department")))
    check("Type = video", vr.get("type") == "video")
    
    # Check speech_to_text info
    stt = vr.get("speech_to_text", {})
    check("STT result returned", bool(stt))
    print(f"  → Video ID: {vid_id}, video_url: {vr.get('video_url')}")
    print(f"  → STT method: {stt.get('method')}, transcript: {(vr.get('transcript') or '')[:80]}")
    print(f"  → Department: {vr.get('department')}")
    
    # Verify video appears in dashboards
    print("\n  Checking dashboards for video complaint...")
    dc = api_get("/complaints/district-complaints/Raipur", HEADERS_OFFICER)
    vid_in_district = any((c.get("id") or c.get("complaint_id")) == vid_id for c in dc["complaints"])
    check("Video complaint in district dashboard", vid_in_district)
    
    ac = api_get("/complaints/all-complaints", HEADERS_ADMIN)
    vid_in_all = any((c.get("id") or c.get("complaint_id")) == vid_id for c in ac["complaints"])
    check("Video complaint in admin dashboard", vid_in_all)
    
    # Check video_url is accessible (static file serving)
    video_url = vr.get("video_url", "")
    if video_url:
        try:
            vreq = urllib.request.Request(f"http://localhost:8001{video_url}")
            vresp = urllib.request.urlopen(vreq, timeout=10)
            check("Video file accessible via static route", vresp.status == 200)
            check("Video content length > 0", int(vresp.headers.get("content-length", 0)) > 0)
        except Exception as e:
            check("Video file accessible via static route", False, str(e))

except Exception as e:
    check("Video upload succeeded", False, str(e))

# Clean up test file
try:
    os.unlink(wav_path)
except OSError:
    pass

# ── Summary ───────────────────────────────────────────────────
print(f"\n{'='*50}")
print(f"Results: {passed} passed, {failed} failed out of {passed+failed} tests")
print(f"{'='*50}")
sys.exit(0 if failed == 0 else 1)
