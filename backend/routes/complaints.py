"""
Complaint Pipeline Routes — unified complaint submission and query API.

POST /complaints/submit           — Submit a text complaint (citizen or CSC)
POST /complaints/submit-voice     — Submit a voice complaint with transcript
POST /complaints/submit-video     — Submit a video complaint with transcript
POST /complaints/upload-video     — Upload video file for STT processing
GET  /complaints/list             — Query complaints (filterable)
GET  /complaints/{id}             — Get a single complaint
POST /complaints/{id}/status      — Update complaint status
GET  /complaints/stats            — Get complaint statistics
POST /complaints/classify         — Classify text using AI (no save)
"""

import os
import asyncio
from typing import Optional

from fastapi import APIRouter, Depends, File, Form, HTTPException, Query, Request, UploadFile
from pydantic import BaseModel, Field

from services.complaint_store import complaint_store
from services.grievance_service import analyze_grievance
from utils.security import role_guard
from utils.logger import logger

router = APIRouter()

ALLOWED_ROLES = ["citizen", "csc_operator", "district_officer", "super_admin", "analyst"]
OFFICER_ROLES = ["district_officer", "super_admin", "analyst"]


# ── Request Models ──────────────────────────────────────────

class SubmitComplaint(BaseModel):
    description: str
    district: str = "Raipur"
    citizen_name: str = ""
    citizen_id: str = ""
    citizen_phone: str = ""
    citizen_aadhaar: str = ""
    department: str = ""
    source: str = "citizen"


class SubmitVoiceComplaint(BaseModel):
    transcript: str
    district: str = "Raipur"
    citizen_name: str = ""
    citizen_id: str = ""
    citizen_phone: str = ""
    citizen_aadhaar: str = ""
    department: str = ""
    source: str = "citizen"


class SubmitVideoComplaint(BaseModel):
    transcript: str = ""
    district: str = "Raipur"
    citizen_name: str = ""
    citizen_id: str = ""
    citizen_phone: str = ""
    citizen_aadhaar: str = ""
    department: str = ""
    duration: int = 60
    source: str = "citizen"


class StatusUpdate(BaseModel):
    action: str  # resolve | escalate | in_progress


class ClassifyRequest(BaseModel):
    text: str
    urgency: int = Field(default=3, ge=1, le=5)


# ── Endpoints ───────────────────────────────────────────────

@router.post("/submit")
def submit_complaint(
    payload: SubmitComplaint,
    _role: str = Depends(role_guard(ALLOWED_ROLES)),
):
    """Submit a new text complaint with AI classification."""
    if not payload.description.strip():
        raise HTTPException(status_code=400, detail="Complaint description is required")

    result = complaint_store.submit_complaint(
        description=payload.description,
        district=payload.district,
        citizen_name=payload.citizen_name,
        citizen_id=payload.citizen_id,
        citizen_phone=payload.citizen_phone,
        citizen_aadhaar=payload.citizen_aadhaar,
        department=payload.department,
        complaint_type="text",
        source=payload.source,
    )
    return result


@router.post("/submit-voice")
def submit_voice_complaint(
    payload: SubmitVoiceComplaint,
    _role: str = Depends(role_guard(ALLOWED_ROLES)),
):
    """Submit a voice complaint with transcript."""
    transcript = payload.transcript.strip()
    if not transcript:
        raise HTTPException(status_code=400, detail="Transcript is required for voice complaints")

    result = complaint_store.submit_complaint(
        description=transcript,
        district=payload.district,
        citizen_name=payload.citizen_name,
        citizen_id=payload.citizen_id,
        citizen_phone=payload.citizen_phone,
        citizen_aadhaar=payload.citizen_aadhaar,
        department=payload.department,
        complaint_type="voice",
        transcript=transcript,
        source=payload.source,
    )
    return result


@router.post("/submit-video")
async def submit_video_complaint(
    request: Request,
    _role: str = Depends(role_guard(ALLOWED_ROLES)),
):
    """Submit a video complaint — accepts JSON body or multipart file upload with STT."""
    content_type = request.headers.get("content-type", "")

    if "multipart/form-data" in content_type:
        # ── File upload path: save file, run STT ──
        form = await request.form()
        video = form.get("video")
        fb = form.get("fallback_transcript", "") or ""
        district = form.get("district", "Raipur") or "Raipur"
        citizen_name = form.get("citizen_name", "") or ""
        citizen_id = form.get("citizen_id", "") or ""
        citizen_phone = form.get("citizen_phone", "") or ""
        citizen_aadhaar = form.get("citizen_aadhaar", "") or ""
        department = form.get("department", "") or ""
        source = form.get("source", "citizen") or "citizen"

        if not video or not hasattr(video, "filename") or not video.filename:
            raise HTTPException(status_code=400, detail="Video file is required for multipart upload")

        UPLOAD_DIR = os.path.join(os.path.dirname(__file__), "..", "uploads", "videos")
        os.makedirs(UPLOAD_DIR, exist_ok=True)

        import uuid
        safe_ext = os.path.splitext(video.filename)[1] or ".webm"
        video_filename = f"{uuid.uuid4().hex}{safe_ext}"
        video_path = os.path.join(UPLOAD_DIR, video_filename)
        content = await video.read()
        with open(video_path, "wb") as f:
            f.write(content)

        video_url = f"/uploads/videos/{video_filename}"

        try:
            from services.speech_service import process_video_complaint
            stt_result = await asyncio.to_thread(process_video_complaint, video_path, fb)
        except Exception as e:
            logger.error(f"STT processing failed: {e}")
            stt_result = {"transcript": fb, "transcript_hi": "", "method": "fallback", "confidence": 0.0, "translation_en": ""}

        transcript = stt_result.get("transcript", fb)
        transcript_hi = stt_result.get("transcript_hi", "")
        translation_en = stt_result.get("translation_en", "")
        stt_confidence = stt_result.get("confidence", 0.0)

        if stt_confidence < 0.30 and translation_en:
            logger.info(f"[SubmitVideo] Hindi confidence {stt_confidence:.2f} < 0.30 — using translation_en")
            transcript = translation_en
        if not transcript:
            transcript = fb or "Video complaint submitted"

        result = complaint_store.submit_complaint(
            description=transcript,
            district=district,
            citizen_name=citizen_name,
            citizen_id=citizen_id,
            citizen_phone=citizen_phone,
            citizen_aadhaar=citizen_aadhaar,
            department=department,
            complaint_type="video",
            transcript=transcript,
            video_url=video_url,
            stt_confidence=stt_confidence,
            stt_method=stt_result.get("method", "unknown"),
            transcript_hi=transcript_hi,
            translation_en=translation_en,
            source=source,
        )
        result["speech_to_text"] = stt_result
        return result
    else:
        # ── JSON body path (frontend sends JSON with transcript) ──
        data = await request.json()
        transcript = data.get("transcript", "") or "Video complaint submitted"
        result = complaint_store.submit_complaint(
            description=transcript,
            district=data.get("district", "Raipur"),
            citizen_name=data.get("citizen_name", ""),
            citizen_phone=data.get("citizen_phone", ""),
            department=data.get("department", ""),
            complaint_type="video",
            transcript=transcript,
            source=data.get("source", "citizen"),
        )
        return result


@router.post("/upload-video")
async def upload_video(
    video: UploadFile = File(...),
    district: str = Form("Raipur"),
    citizen_name: str = Form(""),
    citizen_id: str = Form(""),
    fallback_transcript: str = Form(""),
    _role: str = Depends(role_guard(ALLOWED_ROLES)),
):
    """Upload a video file — save to uploads, extract audio, run STT, classify, and store in MongoDB."""
    if not video.filename:
        raise HTTPException(status_code=400, detail="Video file is required")

    # Persist video to backend/uploads/videos/
    UPLOAD_DIR = os.path.join(os.path.dirname(__file__), "..", "uploads", "videos")
    os.makedirs(UPLOAD_DIR, exist_ok=True)

    import uuid
    safe_ext = os.path.splitext(video.filename)[1] or ".webm"
    video_filename = f"{uuid.uuid4().hex}{safe_ext}"
    video_path = os.path.join(UPLOAD_DIR, video_filename)
    content = await video.read()
    with open(video_path, "wb") as f:
        f.write(content)

    video_url = f"/uploads/videos/{video_filename}"

    # Run STT on saved file (in thread pool to avoid blocking the event loop)
    try:
        from services.speech_service import process_video_complaint
        stt_result = await asyncio.to_thread(process_video_complaint, video_path, fallback_transcript)
    except Exception as e:
        logger.error(f"STT processing failed: {e}")
        stt_result = {"transcript": fallback_transcript, "stt_method": "fallback", "confidence": 0.0}

    transcript = stt_result.get("transcript", fallback_transcript)
    transcript_hi = stt_result.get("transcript_hi", "")
    translation_en = stt_result.get("translation_en", "")
    stt_confidence = stt_result.get("confidence", 0.0)

    # If Hindi confidence is below 0.30, prefer the English translation as primary text
    if stt_confidence < 0.30 and translation_en:
        logger.info(f"[UploadVideo] Hindi confidence {stt_confidence:.2f} < 0.30 — using translation_en as primary transcript")
        transcript = translation_en

    if not transcript:
        raise HTTPException(status_code=422, detail="Could not extract transcript from video. Provide fallback_transcript.")

    # Classify and store in MongoDB
    result = complaint_store.submit_complaint(
        description=transcript,
        district=district,
        citizen_name=citizen_name,
        citizen_id=citizen_id,
        complaint_type="video",
        transcript=transcript,
        video_url=video_url,
        stt_confidence=stt_confidence,
        stt_method=stt_result.get("method", "unknown"),
        transcript_hi=transcript_hi,
        translation_en=translation_en,
        source="citizen",
    )

    result["speech_to_text"] = stt_result
    return result


@router.get("/list")
def list_complaints(
    district: Optional[str] = Query(None),
    department: Optional[str] = Query(None),
    priority: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    source: Optional[str] = Query(None),
    complaint_type: Optional[str] = Query(None, alias="type"),
    limit: int = Query(500, le=1000),
    _role: str = Depends(role_guard(OFFICER_ROLES + ["citizen", "csc_operator"])),
):
    """List complaints with optional filters."""
    complaints = complaint_store.get_complaints(
        district=district,
        department=department,
        priority=priority,
        status=status,
        source=source,
        complaint_type=complaint_type,
        limit=limit,
    )
    return {"complaints": complaints, "total": len(complaints)}


@router.get("/stats")
def complaint_stats(
    district: Optional[str] = Query(None),
    _role: str = Depends(role_guard(OFFICER_ROLES)),
):
    """Get complaint statistics."""
    return complaint_store.get_stats(district=district)


@router.get("/district-complaints/{district}")
def get_district_complaints(
    district: str,
    status: Optional[str] = Query(None),
    department: Optional[str] = Query(None),
    priority: Optional[str] = Query(None),
    _role: str = Depends(role_guard(OFFICER_ROLES)),
):
    """Get all complaints for a specific district (officer/admin dashboard)."""
    complaints = complaint_store.get_complaints(
        district=district,
        status=status,
        department=department,
        priority=priority,
    )
    stats = complaint_store.get_stats(district=district)
    return {"district": district, "complaints": complaints, "total": len(complaints), "stats": stats}


@router.get("/all-complaints")
def get_all_complaints(
    _role: str = Depends(role_guard(OFFICER_ROLES)),
):
    """Get all complaints across all districts (state admin dashboard)."""
    complaints = complaint_store.get_all_complaints()
    stats = complaint_store.get_stats()
    return {"complaints": complaints, "total": len(complaints), "stats": stats}


@router.post("/classify")
def classify_text(
    payload: ClassifyRequest,
    _role: str = Depends(role_guard(ALLOWED_ROLES)),
):
    """Classify complaint text using AI without saving."""
    if not payload.text.strip():
        raise HTTPException(status_code=400, detail="Text is required")

    result = analyze_grievance(payload.text, payload.urgency)
    return result


@router.get("/{complaint_id}")
def get_complaint(
    complaint_id: str,
    _role: str = Depends(role_guard(ALLOWED_ROLES)),
):
    """Get a single complaint by ID."""
    complaint = complaint_store.get_complaint(complaint_id)
    if not complaint:
        raise HTTPException(status_code=404, detail=f"Complaint {complaint_id} not found")
    return complaint


@router.post("/{complaint_id}/status")
def update_status(
    complaint_id: str,
    payload: StatusUpdate,
    _role: str = Depends(role_guard(OFFICER_ROLES)),
):
    """Update complaint status (resolve, escalate, in_progress)."""
    action = payload.action.lower().strip()
    if action not in ["resolve", "escalate", "in_progress"]:
        raise HTTPException(status_code=400, detail="Invalid action. Must be 'resolve', 'escalate', or 'in_progress'")

    result = complaint_store.update_status(complaint_id, action)
    if not result:
        raise HTTPException(status_code=404, detail=f"Complaint {complaint_id} not found")
    return {"status": "success", "complaint": result}
