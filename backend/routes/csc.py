from fastapi import APIRouter
from models.schemas import CSCCopilotRequest
from services import csc_service
from fastapi import Depends
from utils.security import role_guard

router = APIRouter()

@router.post("/validate")
def validate(req: CSCCopilotRequest, _role: str = Depends(role_guard(["super_admin", "csc_operator"]))):
    return csc_service.validate_csc_application(req.dict())
