from fastapi import APIRouter
from models.schemas import DiscoverRequest
from services import discovery_service
from fastapi import Depends
from utils.security import role_guard

router = APIRouter()

@router.post("/discover")
def discover(req: DiscoverRequest, district: str | None = None, _role: str = Depends(role_guard(["super_admin", "district_officer", "analyst", "csc_operator"]))):
    return discovery_service.discover_beneficiaries(district=district)
