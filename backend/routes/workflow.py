"""
Cross-Role Workflow Routes — orchestrate real state mutations across roles.

POST /workflow/csc-submit       — CSC operator submits application + creates grievance case
GET  /workflow/officer-cases    — district officer fetches inbox
POST /workflow/case/{id}/status — officer resolves or escalates
GET  /workflow/districts        — list of supported districts
"""
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field

from services import csc_service, grievance_service
from services.state_store import DISTRICTS, state_store
from utils.security import role_guard
from utils.logger import logger


router = APIRouter()


class CscSubmission(BaseModel):
    aadhaar_name: str
    ration_name: str
    aadhaar_address: str
    ration_address: str
    income: int
    documents_complete: bool
    district: str = Field(default="Raipur")
    grievance_text: str = Field(default="Service delivery delay in benefit application")
    urgency: int = Field(default=3, ge=1, le=5)


class CaseStatusUpdate(BaseModel):
    action: str  # resolve | escalate


@router.post("/csc-submit")
def csc_submit(payload: CscSubmission, _role: str = Depends(role_guard(["csc_operator", "super_admin"]))):
    if payload.district not in DISTRICTS:
        raise HTTPException(status_code=400, detail=f"Unsupported district. Valid: {DISTRICTS}")

    logger.info(
        f"[Workflow] CSC submission by {_role} for district={payload.district}, "
        f"applicant='{payload.aadhaar_name}'"
    )

    validation = csc_service.validate_csc_application(payload.model_dump())
    eligibility = payload.income < 80000 and validation["risk_level"] != "High Risk"
    application = state_store.create_application(payload.model_dump(), validation, eligibility)

    analysis = grievance_service.analyze_grievance(payload.grievance_text, payload.urgency)
    case = state_store.create_grievance_case(
        district=payload.district,
        analysis=analysis,
        text=payload.grievance_text,
        urgency=payload.urgency,
        source="csc",
    )

    logger.info(
        f"[Workflow] Case created: {case['case_id']} → "
        f"dept={analysis['department']}, escalate={analysis['escalation_recommended']}"
    )

    return {
        "application": application,
        "validation": validation,
        "eligibility": {"is_eligible": eligibility},
        "created_case": case,
    }


@router.get("/officer-cases")
def officer_cases(
    district: Optional[str] = None,
    status: Optional[str] = None,
    _role: str = Depends(role_guard(["district_officer", "super_admin", "analyst"])),
):
    logger.info(f"[Workflow] Officer case list requested: district={district}, status={status}")
    cases = state_store.list_officer_cases(district=district, status=status)
    return {
        "cases": cases,
        "total": len(cases),
        "district": district or "All",
        "filter_status": status or "All",
    }


@router.post("/case/{case_id}/status")
def update_case_status(
    case_id: str,
    payload: CaseStatusUpdate,
    _role: str = Depends(role_guard(["district_officer", "super_admin"])),
):
    action = payload.action.lower().strip()
    if action not in ["resolve", "escalate"]:
        raise HTTPException(status_code=400, detail="Invalid action. Must be 'resolve' or 'escalate'")

    new_status = "Resolved" if action == "resolve" else "Open"
    escalate = action == "escalate"

    logger.info(f"[Workflow] Case {case_id} → action='{action}' by role={_role}")

    updated = state_store.update_case_status(
        case_id=case_id, status=new_status, escalate=escalate
    )
    if not updated:
        raise HTTPException(status_code=404, detail=f"Case {case_id} not found")

    logger.info(f"[Workflow] Case {case_id} updated → status={updated['status']}, escalated={updated['escalation_recommended']}")

    # Return the updated governance overview so frontend can refresh KPIs
    from services.analytics_service import get_governance_score
    return {
        "case": updated,
        "governance_refresh": get_governance_score(),
    }


@router.get("/districts")
def districts(_role: str = Depends(role_guard(["super_admin", "district_officer", "csc_operator", "analyst"]))):
    return {"districts": DISTRICTS}
