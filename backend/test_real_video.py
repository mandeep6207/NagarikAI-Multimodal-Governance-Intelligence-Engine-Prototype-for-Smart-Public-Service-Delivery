"""
Test the upload-video endpoint with the real Testing.mp4 video.
Verifies: audio extraction, Whisper transcription, English translation,
MongoDB storage, and dashboard visibility.
"""

import requests
import json
import time
import os

BASE = "http://localhost:8001/api/v1/complaints"
HEADERS = {"x-user-role": "citizen"}
VIDEO_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "videos", "Testing.mp4")

print("=" * 70)
print("  REAL VIDEO STT TEST — Testing.mp4 via /upload-video endpoint")
print("=" * 70)

# Verify video file
assert os.path.exists(VIDEO_PATH), f"Video not found: {VIDEO_PATH}"
video_size = os.path.getsize(VIDEO_PATH)
print(f"\n  Video: {VIDEO_PATH}")
print(f"  Size: {video_size:,} bytes ({video_size / 1024 / 1024:.1f} MB)")

# Upload the real video
print(f"\n  Uploading video to {BASE}/upload-video ...")
t0 = time.time()
with open(VIDEO_PATH, "rb") as f:
    resp = requests.post(
        f"{BASE}/upload-video",
        headers=HEADERS,
        files={"video": ("Testing.mp4", f, "video/mp4")},
        data={
            "district": "Raipur",
            "citizen_name": "Test User",
            "citizen_id": "CIT-TEST",
            "fallback_transcript": "",  # empty — force Whisper to do the work
        },
        timeout=300,
    )
elapsed = time.time() - t0
print(f"  Response time: {elapsed:.2f}s")
print(f"  Status: {resp.status_code}")

if resp.status_code != 200:
    print(f"  ERROR: {resp.text}")
    # Retry with fallback in case Whisper fails to produce transcript
    print("\n  Retrying with fallback_transcript...")
    with open(VIDEO_PATH, "rb") as f:
        resp = requests.post(
            f"{BASE}/upload-video",
            headers=HEADERS,
            files={"video": ("Testing.mp4", f, "video/mp4")},
            data={
                "district": "Raipur",
                "citizen_name": "Test User",
                "citizen_id": "CIT-TEST",
                "fallback_transcript": "video complaint testing",
            },
            timeout=300,
        )
    print(f"  Retry status: {resp.status_code}")

data = resp.json()
complaint_id = data.get("complaint_id") or data.get("id")
print(f"\n  Complaint ID: {complaint_id}")
print(f"  Department: {data.get('department')}")
print(f"  Type: {data.get('type')}")
print(f"  Video URL: {data.get('video_url')}")

# STT results
stt = data.get("speech_to_text", {})
print(f"\n  STT Method: {stt.get('method')}")
print(f"  STT Confidence: {stt.get('confidence')}")
print(f"  Detected Language: {stt.get('language')}")
print(f"\n  Hindi Transcript:")
print(f"    \"{stt.get('transcript_hi', '')}\"")
print(f"\n  English Translation:")
print(f"    \"{stt.get('translation_en', '')}\"")
print(f"\n  Primary Transcript (used for classification):")
print(f"    \"{data.get('transcript', '')}\"")

# Check MongoDB persistence
print(f"\n  Checking MongoDB persistence...")
r2 = requests.get(f"{BASE}/{complaint_id}", headers={"x-user-role": "district_officer"})
if r2.status_code == 200:
    stored = r2.json()
    print(f"  PASS: Complaint retrieved from DB")
    print(f"    transcript: \"{stored.get('transcript', '')[:100]}\"")
    print(f"    transcript_hi: \"{(stored.get('transcript_hi') or '')[:100]}\"")
    print(f"    translation_en: \"{(stored.get('translation_en') or '')[:100]}\"")
    print(f"    stt_method: {stored.get('stt_method')}")
    print(f"    stt_confidence: {stored.get('speech_to_text_confidence')}")
else:
    print(f"  WARN: Could not retrieve complaint: {r2.status_code}")

# Check dashboards
print(f"\n  Checking dashboards...")
r3 = requests.get(f"{BASE}/district-complaints/Raipur", headers={"x-user-role": "district_officer"})
district_ids = [c.get("complaint_id") or c.get("id") for c in r3.json().get("complaints", [])] if r3.status_code == 200 else []
in_district = complaint_id in district_ids

r4 = requests.get(f"{BASE}/all-complaints", headers={"x-user-role": "super_admin"})
admin_ids = [c.get("complaint_id") or c.get("id") for c in r4.json().get("complaints", [])] if r4.status_code == 200 else []
in_admin = complaint_id in admin_ids

print(f"  In district dashboard: {in_district}")
print(f"  In admin dashboard: {in_admin}")

# Video accessible
if data.get("video_url"):
    r5 = requests.get(f"http://localhost:8001{data['video_url']}", timeout=10)
    print(f"  Video accessible: status={r5.status_code}, size={len(r5.content):,} bytes")

# Summary
print(f"\n{'='*70}")
print("  RESULTS")
print(f"{'='*70}")
tests = [
    ("Video uploaded", resp.status_code == 200),
    ("Transcript not empty", bool(data.get("transcript"))),
    ("STT method is whisper", stt.get("method") == "whisper"),
    ("Has Hindi transcript", bool(stt.get("transcript_hi"))),
    ("Has English translation", bool(stt.get("translation_en"))),
    ("transcript_hi stored in DB", bool(stored.get("transcript_hi")) if r2.status_code == 200 else False),
    ("translation_en stored in DB", bool(stored.get("translation_en")) if r2.status_code == 200 else False),
    ("In district dashboard", in_district),
    ("In admin dashboard", in_admin),
]
passed = 0
for name, ok in tests:
    status = "PASS" if ok else "FAIL"
    if ok:
        passed += 1
    print(f"  {status}: {name}")

print(f"\n  {passed}/{len(tests)} tests passed")
print(f"{'='*70}")
