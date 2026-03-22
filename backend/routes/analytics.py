from fastapi import APIRouter
from services import analytics_service
from fastapi import Depends
from utils.security import role_guard

router = APIRouter()

@router.get("/governance-score")
def governance_score(_role: str = Depends(role_guard(["super_admin", "district_officer", "analyst", "csc_operator"]))):
    return analytics_service.get_governance_score()

@router.get("/forecast")
def forecast(district: str | None = None, _role: str = Depends(role_guard(["super_admin", "district_officer", "analyst"]))):
    return analytics_service.get_district_forecast(district=district)
    
@router.get("/workload")
def workload(district: str | None = None, _role: str = Depends(role_guard(["super_admin", "district_officer", "analyst"]))):
    return analytics_service.get_workload_balancer(district=district)
    
@router.get("/knowledge-graph")
def knowledge_graph(district: str | None = None, _role: str = Depends(role_guard(["super_admin", "district_officer", "analyst"]))):
    return analytics_service.get_knowledge_graph(district=district)


@router.get("/system-overview")
def system_overview(_role: str = Depends(role_guard(["super_admin", "analyst", "district_officer"]))):
    return analytics_service.get_system_overview()

from pydantic import BaseModel
class ScenarioRequest(BaseModel):
    grievance_volume_change: float

@router.post("/simulate-scenario")
def simulate_scenario(req: ScenarioRequest, _role: str = Depends(role_guard(["super_admin", "analyst"]))):
    return analytics_service.simulate_governance_scenario(req.grievance_volume_change)
