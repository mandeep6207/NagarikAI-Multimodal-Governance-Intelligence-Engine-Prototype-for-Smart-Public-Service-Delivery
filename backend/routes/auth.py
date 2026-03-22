from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from services.state_store import DISTRICTS

router = APIRouter()

class LoginRequest(BaseModel):
    username: str
    password: str
    role: str # super_admin, district_officer, csc_operator, analyst

class LoginResponse(BaseModel):
    token: str
    role: str
    name: str
    district: str | None = None
    citizen_id: str | None = None

@router.post("/login", response_model=LoginResponse)
def login(req: LoginRequest):
    # Simulated auth allowing arbitrary entry if role is provided
    valid_roles = ["super_admin", "district_officer", "csc_operator", "analyst", "citizen"]
    if req.role not in valid_roles:
        raise HTTPException(status_code=400, detail="Invalid role specified")
        
    names = {
        "super_admin": "Chief Secretary",
        "district_officer": "Collector Raipur",
        "csc_operator": "VLE Operator A",
        "analyst": "Department Analyst",
        "citizen": "Citizen User"
    }
    
    mapped_district = None
    if req.role in ["district_officer", "csc_operator", "citizen"]:
        mapped_district = DISTRICTS[hash(req.username) % len(DISTRICTS)]

    citizen_id = None
    if req.role == "citizen":
        from services.citizen_service import citizen_store
        citizen_id = citizen_store.citizens[0]["id"] if citizen_store.citizens else None

    return LoginResponse(token=f"v1-simulated-jwt-{req.role}-12345", role=req.role, name=names[req.role], district=mapped_district, citizen_id=citizen_id)
