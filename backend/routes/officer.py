"""
District Officer Routes — dedicated APIs for the District Officer portal.

GET  /officer/dashboard              — operational statistics & charts
GET  /officer/complaints             — filtered complaint inbox
GET  /officer/complaints/{id}        — single complaint detail
POST /officer/complaints/{id}/action — resolve, escalate, or assign
GET  /officer/video-complaints       — video complaints for review
POST /officer/video-complaints/{id}/action — verify or escalate video
GET  /officer/field-officers         — field officers in district
POST /officer/assign                 — assign complaint to field officer
GET  /officer/scheme-applications    — scheme applications for review
POST /officer/scheme-applications/{id}/action — approve, reject, request docs
GET  /officer/analytics              — district performance analytics
GET  /officer/ai-features            — AI capabilities and insights
"""

from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel

from services.officer_service import officer_store
from utils.security import role_guard
from utils.logger import logger

router = APIRouter()


class ComplaintAction(BaseModel):
    action: str  # resolve | escalate | in_progress
    officer_id: Optional[str] = None


class VideoAction(BaseModel):
    action: str  # verify | escalate


class AssignRequest(BaseModel):
    complaint_id: str
    officer_id: str


class SchemeAction(BaseModel):
    action: str  # approve | reject | request_documents
    remarks: Optional[str] = None


@router.get("/dashboard")
def get_dashboard(
    district: Optional[str] = Query(None),
    _role: str = Depends(role_guard(["district_officer", "super_admin"])),
):
    logger.info(f"[Officer] Dashboard requested: district={district}")
    return officer_store.get_dashboard(district=district)


@router.get("/complaints")
def get_complaints(
    district: Optional[str] = Query(None),
    department: Optional[str] = Query(None),
    priority: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    _role: str = Depends(role_guard(["district_officer", "super_admin"])),
):
    logger.info(f"[Officer] Complaints requested: district={district}, dept={department}, priority={priority}, status={status}")
    complaints = officer_store.get_complaints(district=district, department=department, priority=priority, status=status)
    return {"complaints": complaints, "total": len(complaints)}


@router.get("/complaints/{complaint_id}")
def get_complaint_detail(
    complaint_id: str,
    _role: str = Depends(role_guard(["district_officer", "super_admin"])),
):
    complaint = officer_store.get_complaint_detail(complaint_id)
    if not complaint:
        raise HTTPException(status_code=404, detail=f"Complaint {complaint_id} not found")
    return complaint


@router.post("/complaints/{complaint_id}/action")
def complaint_action(
    complaint_id: str,
    payload: ComplaintAction,
    _role: str = Depends(role_guard(["district_officer", "super_admin"])),
):
    action = payload.action.lower().strip()
    if action not in ["resolve", "escalate", "in_progress"]:
        raise HTTPException(status_code=400, detail="Invalid action. Must be 'resolve', 'escalate', or 'in_progress'")

    logger.info(f"[Officer] Complaint {complaint_id} → action='{action}'")
    result = officer_store.update_complaint_status(complaint_id, action, payload.officer_id)
    if not result:
        raise HTTPException(status_code=404, detail=f"Complaint {complaint_id} not found")
    return {"status": "success", "complaint": result}


@router.get("/video-complaints")
def get_video_complaints(
    district: Optional[str] = Query(None),
    _role: str = Depends(role_guard(["district_officer", "super_admin"])),
):
    videos = officer_store.get_video_complaints(district=district)
    return {"video_complaints": videos, "total": len(videos)}


@router.post("/video-complaints/{video_id}/action")
def video_action(
    video_id: str,
    payload: VideoAction,
    _role: str = Depends(role_guard(["district_officer", "super_admin"])),
):
    action = payload.action.lower().strip()
    if action not in ["verify", "escalate"]:
        raise HTTPException(status_code=400, detail="Invalid action. Must be 'verify' or 'escalate'")

    logger.info(f"[Officer] Video {video_id} → action='{action}'")
    result = officer_store.update_video_status(video_id, action)
    if not result:
        raise HTTPException(status_code=404, detail=f"Video complaint {video_id} not found")
    return {"status": "success", "video_complaint": result}


@router.get("/field-officers")
def get_field_officers(
    district: Optional[str] = Query(None),
    _role: str = Depends(role_guard(["district_officer", "super_admin"])),
):
    officers = officer_store.get_field_officers(district=district)
    return {"officers": officers, "total": len(officers)}


@router.post("/assign")
def assign_complaint(
    payload: AssignRequest,
    _role: str = Depends(role_guard(["district_officer", "super_admin"])),
):
    logger.info(f"[Officer] Assigning complaint {payload.complaint_id} to officer {payload.officer_id}")
    result = officer_store.assign_complaint_to_officer(payload.complaint_id, payload.officer_id)
    if not result:
        raise HTTPException(status_code=404, detail="Complaint or officer not found")
    return {"status": "success", **result}


@router.get("/scheme-applications")
def get_scheme_applications(
    district: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    scheme: Optional[str] = Query(None),
    _role: str = Depends(role_guard(["district_officer", "super_admin"])),
):
    apps = officer_store.get_scheme_applications(district=district, status=status, scheme=scheme)
    return {"applications": apps, "total": len(apps)}


@router.post("/scheme-applications/{app_id}/action")
def scheme_action(
    app_id: str,
    payload: SchemeAction,
    _role: str = Depends(role_guard(["district_officer", "super_admin"])),
):
    action = payload.action.lower().strip()
    if action not in ["approve", "reject", "request_documents"]:
        raise HTTPException(status_code=400, detail="Invalid action. Must be 'approve', 'reject', or 'request_documents'")

    logger.info(f"[Officer] Scheme app {app_id} → action='{action}'")
    result = officer_store.update_scheme_application(app_id, action, payload.remarks)
    if not result:
        raise HTTPException(status_code=404, detail=f"Application {app_id} not found")
    return {"status": "success", "application": result}


@router.get("/analytics")
def get_analytics(
    district: Optional[str] = Query(None),
    _role: str = Depends(role_guard(["district_officer", "super_admin"])),
):
    return officer_store.get_performance_analytics(district=district)


@router.get("/ai-features")
def get_ai_features(
    district: Optional[str] = Query(None),
    _role: str = Depends(role_guard(["district_officer", "super_admin"])),
):
    return officer_store.get_ai_features(district=district)
