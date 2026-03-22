"""
Citizen Self-Service Portal Routes — endpoints for direct citizen access.

Endpoints:
  POST  /login                  — Mobile OTP login (simulated)
  GET   /profile                — Citizen profile
  GET   /dashboard              — Personal dashboard
  GET   /complaints             — Citizen's complaints
  POST  /complaints             — Submit a new complaint
  POST  /voice-complaint        — Submit a voice complaint
  GET   /video-complaints       — Citizen's video complaints
  POST  /video-complaints       — Submit a video complaint
  GET   /schemes                — Scheme catalog
  GET   /applications           — Citizen's scheme applications
  POST  /applications           — Submit a scheme application
  GET   /documents              — Citizen's uploaded documents
  POST  /documents              — Upload & verify a document
  GET   /notifications          — Citizen's notifications
  POST  /notifications/read     — Mark notification as read
  GET   /fraud-status           — Fraud prevention checks
"""

import os
import asyncio
from typing import Optional
from fastapi import APIRouter, Depends, Header, HTTPException, Request, UploadFile
from pydantic import BaseModel, Field
from services.citizen_service import citizen_store
from utils.logger import logger

router = APIRouter()


# ── Helpers ─────────────────────────────────────────────────

def _resolve_citizen_id(
    authorization: str = Header(default=""),
    x_citizen_id: str = Header(default=""),
) -> str:
    """Resolve citizen_id from token or header."""
    if x_citizen_id:
        return x_citizen_id
    if authorization.startswith("Bearer v1-simulated-jwt-citizen-"):
        # In real system, decode JWT; for demo, use header
        pass
    raise HTTPException(status_code=401, detail="Citizen not authenticated")


# ── Request Models ──────────────────────────────────────────

class MobileLoginRequest(BaseModel):
    mobile: str
    otp: str = "1234"  # simulated OTP


class NewComplaint(BaseModel):
    citizen_name: str = ""
    mobile: str = ""
    district: str = "Raipur"
    department: str = "Revenue"
    description: str = ""


class VoiceComplaint(BaseModel):
    transcript: str = ""
    duration: int = 30


class VideoComplaint(BaseModel):
    transcript: str = ""
    duration: int = 60


class UploadDocument(BaseModel):
    document_type: str = "Aadhaar Card"


class SchemeApplication(BaseModel):
    scheme_id: str = "SCH-WP"
    documents: list = Field(default_factory=list)


class MarkRead(BaseModel):
    notification_id: str


# ── Endpoints ───────────────────────────────────────────────

@router.post("/login")
def citizen_login(payload: MobileLoginRequest):
    """Mobile number OTP login (simulated)."""
    if not payload.mobile or len(payload.mobile) < 10:
        raise HTTPException(status_code=400, detail="Valid mobile number required")
    result = citizen_store.login_by_mobile(payload.mobile)
    if not result:
        raise HTTPException(status_code=401, detail="Login failed")
    return result


@router.get("/profile")
def get_profile(citizen_id: str = Depends(_resolve_citizen_id)):
    citizen = citizen_store.get_citizen(citizen_id)
    if not citizen:
        raise HTTPException(status_code=404, detail="Citizen not found")
    return citizen


@router.get("/dashboard")
def get_dashboard(citizen_id: str = Depends(_resolve_citizen_id)):
    return citizen_store.get_dashboard(citizen_id)


@router.get("/complaints")
def get_complaints(
    status: Optional[str] = None,
    citizen_id: str = Depends(_resolve_citizen_id),
):
    return citizen_store.get_complaints(citizen_id, status)


@router.post("/complaints")
def submit_complaint(
    payload: NewComplaint,
    citizen_id: str = Depends(_resolve_citizen_id),
):
    return citizen_store.submit_complaint(citizen_id, payload.model_dump())


@router.post("/voice-complaint")
def submit_voice_complaint(
    payload: VoiceComplaint,
    citizen_id: str = Depends(_resolve_citizen_id),
):
    return citizen_store.submit_voice_complaint(citizen_id, payload.model_dump())


@router.get("/video-complaints")
def get_video_complaints(citizen_id: str = Depends(_resolve_citizen_id)):
    return citizen_store.get_video_complaints(citizen_id)


@router.post("/video-complaints")
async def submit_video_complaint(
    request: Request,
    citizen_id: str = Depends(_resolve_citizen_id),
):
    """Submit a video complaint — accepts JSON body or multipart file upload."""
    content_type = request.headers.get("content-type", "")

    if "multipart/form-data" in content_type:
        # ── File upload path: save file, run STT ──
        form = await request.form()
        video = form.get("video")
        fallback_transcript = form.get("fallback_transcript", "") or ""

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
            from services.speech_service import process_video_complaint as run_stt
            stt_result = await asyncio.to_thread(run_stt, video_path, fallback_transcript)
        except Exception as e:
            logger.error(f"[CitizenVideo] STT processing failed: {e}")
            stt_result = {"transcript": fallback_transcript, "transcript_hi": "", "method": "fallback", "confidence": 0.0, "translation_en": ""}

        transcript = stt_result.get("transcript", fallback_transcript)
        transcript_hi = stt_result.get("transcript_hi", "")
        translation_en = stt_result.get("translation_en", "")
        stt_confidence = stt_result.get("confidence", 0.0)

        if stt_confidence < 0.30 and translation_en:
            transcript = translation_en
        if not transcript:
            transcript = fallback_transcript or "Video complaint submitted"

        return citizen_store.submit_video_complaint(citizen_id, {
            "transcript": transcript,
            "transcript_hi": transcript_hi,
            "translation_en": translation_en,
            "duration": 60,
            "video_url": video_url,
            "stt_confidence": stt_confidence,
            "stt_method": stt_result.get("method", "unknown"),
        })
    else:
        # ── JSON body path (frontend sends { transcript, duration }) ──
        data = await request.json()
        return citizen_store.submit_video_complaint(citizen_id, data)


@router.get("/schemes")
def get_schemes():
    return citizen_store.get_schemes()


@router.get("/applications")
def get_applications(
    status: Optional[str] = None,
    citizen_id: str = Depends(_resolve_citizen_id),
):
    return citizen_store.get_scheme_applications(citizen_id, status)


@router.post("/applications")
def submit_application(
    payload: SchemeApplication,
    citizen_id: str = Depends(_resolve_citizen_id),
):
    return citizen_store.submit_scheme_application(citizen_id, payload.model_dump())


@router.get("/documents")
def get_documents(
    status: Optional[str] = None,
    citizen_id: str = Depends(_resolve_citizen_id),
):
    return citizen_store.get_documents(citizen_id, status)


@router.post("/documents")
def upload_document(
    payload: UploadDocument,
    citizen_id: str = Depends(_resolve_citizen_id),
):
    return citizen_store.upload_document(citizen_id, payload.model_dump())


@router.get("/notifications")
def get_notifications(
    unread_only: bool = False,
    citizen_id: str = Depends(_resolve_citizen_id),
):
    return citizen_store.get_notifications(citizen_id, unread_only)


@router.post("/notifications/read")
def mark_notification_read(
    payload: MarkRead,
    citizen_id: str = Depends(_resolve_citizen_id),
):
    return citizen_store.mark_notification_read(payload.notification_id)


@router.get("/fraud-status")
def get_fraud_status(citizen_id: str = Depends(_resolve_citizen_id)):
    return citizen_store.get_fraud_status(citizen_id)
