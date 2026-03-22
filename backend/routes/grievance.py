from fastapi import APIRouter
from models.schemas import GrievanceRequest
from services import grievance_service
from fastapi import Depends
from utils.security import role_guard

router = APIRouter()

@router.post("/analyze")
def analyze(req: GrievanceRequest, _role: str = Depends(role_guard(["super_admin", "district_officer", "analyst", "csc_operator"]))):
    return grievance_service.analyze_grievance(req.text, req.urgency)
