"""
CSC Operator Routes — dedicated endpoints for the CSC Operator portal.

Endpoints:
  GET   /dashboard              — Dashboard KPIs and charts
  GET   /complaints             — All complaints submitted by this CSC
  POST  /complaints             — Submit a new complaint
  GET   /video-complaints       — All video complaints
  POST  /video-complaints       — Record a new video complaint
  GET   /documents              — All uploaded documents
  POST  /documents              — Upload & verify a document
  GET   /schemes                — Full scheme catalog
  GET   /scheme-applications    — All scheme applications
  POST  /scheme-applications    — Submit a new scheme application
  GET   /fraud-alerts           — Fraud detection alerts
  GET   /ai-integrations        — AI integration status
"""

import os
import asyncio
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Request, UploadFile
from pydantic import BaseModel, Field
from services.csc_operator_service import csc_operator_store
from utils.security import role_guard
from utils.logger import logger

router = APIRouter()

ALLOWED = ["csc_operator", "super_admin"]


# ── Request Models ──────────────────────────────────────────

class NewComplaint(BaseModel):
    citizen_name: str
    aadhaar: str
    mobile: str
    district: str = "Raipur"
    department: str = "Revenue"
    description: str = ""


class NewVideoComplaint(BaseModel):
    citizen_name: str
    mobile: str = ""
    district: str = "Raipur"
    transcript: str = ""
    duration: int = 60


class UploadDocument(BaseModel):
    citizen_name: str
    citizen_aadhaar: str = ""
    district: str = "Raipur"
    document_type: str = "Aadhaar Card"


class NewSchemeApplication(BaseModel):
    citizen_name: str
    citizen_aadhaar: str = ""
    citizen_phone: str = ""
    citizen_age: int = 0
    income: int = 50000
    district: str = "Raipur"
    scheme_id: str = "SCH-WP"
    documents: list = Field(default_factory=list)


# ── Endpoints ───────────────────────────────────────────────

@router.get("/dashboard")
def get_dashboard(
    district: Optional[str] = None,
    _role: str = Depends(role_guard(ALLOWED)),
):
    return csc_operator_store.get_dashboard(district)


@router.get("/complaints")
def get_complaints(
    district: Optional[str] = None,
    status: Optional[str] = None,
    _role: str = Depends(role_guard(ALLOWED)),
):
    return csc_operator_store.get_complaints(district, status)


@router.post("/complaints")
def submit_complaint(
    payload: NewComplaint,
    _role: str = Depends(role_guard(ALLOWED)),
):
    return csc_operator_store.submit_complaint(payload.model_dump())


@router.get("/video-complaints")
def get_video_complaints(
    district: Optional[str] = None,
    _role: str = Depends(role_guard(ALLOWED)),
):
    return csc_operator_store.get_video_complaints(district)


@router.post("/video-complaints")
async def record_video_complaint(
    request: Request,
    _role: str = Depends(role_guard(ALLOWED)),
):
    """Record a CSC video complaint — accepts JSON body or multipart file upload."""
    content_type = request.headers.get("content-type", "")

    if "multipart/form-data" in content_type:
        # ── File upload path: save file, run STT ──
        form = await request.form()
        video = form.get("video")
        citizen_name = form.get("citizen_name", "") or ""
        mobile = form.get("mobile", "") or ""
        district = form.get("district", "Raipur") or "Raipur"
        fallback_transcript = form.get("fallback_transcript", "") or ""

        if not video or not hasattr(video, "filename") or not video.filename:
            raise HTTPException(status_code=400, detail="Video file is required for multipart upload")

        UPLOAD_DIR = os.path.join(os.path.dirname(__file__), "..", "uploads", "videos")
        os.makedirs(UPLOAD_DIR, exist_ok=True)

        import uuid
        safe_ext = os.path.splitext(video.filename or ".webm")[1] or ".webm"
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
            logger.error(f"[CscVideo] STT processing failed: {e}")
            stt_result = {"transcript": fallback_transcript, "transcript_hi": "", "method": "fallback", "confidence": 0.0, "translation_en": ""}

        transcript = stt_result.get("transcript", fallback_transcript)
        transcript_hi = stt_result.get("transcript_hi", "")
        translation_en = stt_result.get("translation_en", "")
        stt_confidence = stt_result.get("confidence", 0.0)

        if stt_confidence < 0.30 and translation_en:
            transcript = translation_en
        if not transcript:
            transcript = fallback_transcript or "Video complaint submitted"

        return csc_operator_store.record_video_complaint({
            "citizen_name": citizen_name,
            "mobile": mobile,
            "district": district,
            "transcript": transcript,
            "transcript_hi": transcript_hi,
            "translation_en": translation_en,
            "duration": 60,
            "video_url": video_url,
            "stt_confidence": stt_confidence,
            "stt_method": stt_result.get("method", "unknown"),
        })
    else:
        # ── JSON body path (frontend sends { citizen_name, mobile, district, transcript, duration }) ──
        data = await request.json()
        return csc_operator_store.record_video_complaint(data)


@router.get("/documents")
def get_documents(
    district: Optional[str] = None,
    status: Optional[str] = None,
    _role: str = Depends(role_guard(ALLOWED)),
):
    return csc_operator_store.get_documents(district, status)


@router.post("/documents")
def upload_document(
    payload: UploadDocument,
    _role: str = Depends(role_guard(ALLOWED)),
):
    return csc_operator_store.upload_document(payload.model_dump())


@router.get("/schemes")
def get_schemes(
    _role: str = Depends(role_guard(ALLOWED)),
):
    return csc_operator_store.get_schemes()


@router.get("/scheme-applications")
def get_scheme_applications(
    district: Optional[str] = None,
    scheme: Optional[str] = None,
    status: Optional[str] = None,
    _role: str = Depends(role_guard(ALLOWED)),
):
    return csc_operator_store.get_scheme_applications(district, scheme, status)


@router.post("/scheme-applications")
def submit_scheme_application(
    payload: NewSchemeApplication,
    _role: str = Depends(role_guard(ALLOWED)),
):
    return csc_operator_store.submit_scheme_application(payload.model_dump())


@router.get("/fraud-alerts")
def get_fraud_alerts(
    district: Optional[str] = None,
    severity: Optional[str] = None,
    _role: str = Depends(role_guard(ALLOWED)),
):
    return csc_operator_store.get_fraud_alerts(district, severity)


@router.get("/ai-integrations")
def get_ai_integrations(
    _role: str = Depends(role_guard(ALLOWED)),
):
    return csc_operator_store.get_ai_integrations()
