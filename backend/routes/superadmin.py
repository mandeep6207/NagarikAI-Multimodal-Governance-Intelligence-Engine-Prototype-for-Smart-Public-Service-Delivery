"""
Super Administrator Routes — State Governance Authority API.

GET  /superadmin/dashboard          — State Governance Dashboard KPIs & charts
GET  /superadmin/districts          — All districts summary
GET  /superadmin/district/{name}    — District detail view
GET  /superadmin/grievances         — Master grievance table with filters
GET  /superadmin/video-complaints   — Video complaint list
POST /superadmin/video-complaints/{id}/action — Verify or escalate video complaint
GET  /superadmin/officers           — Officer management panel
POST /superadmin/officers/{id}/reassign — Reassign officer to new district
GET  /superadmin/schemes            — Scheme intelligence analytics
GET  /superadmin/fraud-alerts       — Fraud detection center
GET  /superadmin/ai-insights        — AI integration insights
"""

from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel

from services.superadmin_service import superadmin_store, DISTRICTS
from utils.security import role_guard

router = APIRouter()


@router.get("/dashboard")
def dashboard(_role: str = Depends(role_guard(["super_admin"]))):
    return superadmin_store.get_state_dashboard()


@router.get("/districts")
def districts(_role: str = Depends(role_guard(["super_admin"]))):
    dashboard_data = superadmin_store.get_state_dashboard()
    return {"districts": dashboard_data["district_scores"]}


@router.get("/district/{district_name}")
def district_detail(district_name: str, _role: str = Depends(role_guard(["super_admin"]))):
    data = superadmin_store.get_district_detail(district_name)
    if not data:
        raise HTTPException(status_code=404, detail=f"District '{district_name}' not found. Valid: {DISTRICTS}")
    return data


@router.get("/grievances")
def grievances(
    district: Optional[str] = Query(None),
    department: Optional[str] = Query(None),
    priority: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    _role: str = Depends(role_guard(["super_admin"])),
):
    return {"grievances": superadmin_store.get_grievances(district, department, priority, status)}


@router.get("/video-complaints")
def video_complaints(_role: str = Depends(role_guard(["super_admin"]))):
    return {"video_complaints": superadmin_store.get_video_complaints()}


class VideoAction(BaseModel):
    action: str  # verify | escalate


@router.post("/video-complaints/{video_id}/action")
def video_complaint_action(video_id: str, body: VideoAction, _role: str = Depends(role_guard(["super_admin"]))):
    if body.action not in ("verify", "escalate"):
        raise HTTPException(status_code=400, detail="Action must be 'verify' or 'escalate'")
    result = superadmin_store.update_video_complaint_status(video_id, body.action)
    if not result:
        raise HTTPException(status_code=404, detail="Video complaint not found")
    return result


@router.get("/officers")
def officers(
    district: Optional[str] = Query(None),
    _role: str = Depends(role_guard(["super_admin"])),
):
    return {"officers": superadmin_store.get_officers(district)}


class ReassignBody(BaseModel):
    new_district: str


@router.post("/officers/{officer_id}/reassign")
def reassign_officer(officer_id: str, body: ReassignBody, _role: str = Depends(role_guard(["super_admin"]))):
    result = superadmin_store.reassign_officer(officer_id, body.new_district)
    if not result:
        raise HTTPException(status_code=404, detail="Officer not found or invalid district")
    return result


@router.get("/schemes")
def schemes(_role: str = Depends(role_guard(["super_admin"]))):
    return superadmin_store.get_scheme_analytics()


@router.get("/fraud-alerts")
def fraud_alerts(_role: str = Depends(role_guard(["super_admin"]))):
    return {"fraud_alerts": superadmin_store.get_fraud_alerts()}


@router.get("/ai-insights")
def ai_insights(_role: str = Depends(role_guard(["super_admin"]))):
    return superadmin_store.get_ai_insights()
