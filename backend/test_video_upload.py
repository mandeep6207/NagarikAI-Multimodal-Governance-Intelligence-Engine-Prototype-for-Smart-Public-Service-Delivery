"""Test video upload with proper multipart encoding."""
import urllib.request
import json
import os
import wave
import struct
import math

BASE = "http://localhost:8001/api/v1"

# Create a small WAV file with a tone
wav_path = os.path.join(os.path.dirname(__file__), "test_audio.wav")
sample_rate = 16000
duration = 2
n_samples = sample_rate * duration
with wave.open(wav_path, "w") as wf:
    wf.setnchannels(1)
    wf.setsampwidth(2)
    wf.setframerate(sample_rate)
    for i in range(n_samples):
        sample = int(16000 * math.sin(2 * math.pi * 440 * i / sample_rate))
        wf.writeframes(struct.pack("<h", sample))

print(f"Created test WAV: {os.path.getsize(wav_path)} bytes")

# Build multipart body
boundary = "TestBoundary12345"
CRLF = b"\r\n"
parts = []

# File field
parts.append(f"--{boundary}".encode())
parts.append(b'Content-Disposition: form-data; name="video"; filename="test.wav"')
parts.append(b"Content-Type: audio/wav")
parts.append(b"")
with open(wav_path, "rb") as f:
    parts.append(f.read())

# Text fields
for name, val in [
    ("district", "Raipur"),
    ("citizen_name", "Video Test User"),
    ("citizen_id", "CIT-VID-001"),
    ("fallback_transcript", "pension nahi mil raha hai"),
]:
    parts.append(f"--{boundary}".encode())
    parts.append(f'Content-Disposition: form-data; name="{name}"'.encode())
    parts.append(b"")
    parts.append(val.encode())

parts.append(f"--{boundary}--".encode())
parts.append(b"")
body = CRLF.join(parts)

req = urllib.request.Request(
    f"{BASE}/complaints/upload-video",
    data=body,
    headers={
        "Content-Type": f"multipart/form-data; boundary={boundary}",
        "x-user-role": "citizen",
    },
)

try:
    resp = urllib.request.urlopen(req, timeout=120)
    r = json.loads(resp.read())
    vid_id = r.get("id") or r.get("complaint_id")
    print(f"PASS: Video upload succeeded — ID: {vid_id}")
    print(f"  department: {r.get('department')}")
    print(f"  video_url: {r.get('video_url')}")
    print(f"  type: {r.get('type')}")
    print(f"  transcript: {(r.get('transcript') or r.get('description', ''))[:100]}")

    stt = r.get("speech_to_text", {})
    print(f"  STT method: {stt.get('method')}")
    print(f"  STT transcript: {stt.get('transcript', '')[:100]}")
    print(f"  STT confidence: {stt.get('confidence')}")

    # Check video is accessible
    video_url = r.get("video_url", "")
    if video_url:
        vreq = urllib.request.Request(f"http://localhost:8001{video_url}")
        vresp = urllib.request.urlopen(vreq, timeout=10)
        print(f"  Video accessible: status={vresp.status}, size={vresp.headers.get('content-length')} bytes")

    # Check it appears in dashboards
    dreq = urllib.request.Request(
        f"{BASE}/complaints/district-complaints/Raipur",
        headers={"x-user-role": "district_officer"},
    )
    dresp = json.loads(urllib.request.urlopen(dreq, timeout=30).read())
    found = any((c.get("id") or c.get("complaint_id")) == vid_id for c in dresp["complaints"])
    print(f"  In district dashboard: {found}")

    areq = urllib.request.Request(
        f"{BASE}/complaints/all-complaints",
        headers={"x-user-role": "super_admin"},
    )
    aresp = json.loads(urllib.request.urlopen(areq, timeout=30).read())
    found_all = any((c.get("id") or c.get("complaint_id")) == vid_id for c in aresp["complaints"])
    print(f"  In admin dashboard: {found_all}")

except Exception as e:
    error_body = ""
    if hasattr(e, "read"):
        error_body = e.read().decode()[:500]
    print(f"FAIL: {e}")
    if error_body:
        print(f"  Response: {error_body}")

# Clean up
try:
    os.unlink(wav_path)
except OSError:
    pass
