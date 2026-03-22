from pydantic import BaseModel
from typing import List, Optional

class DiscoverRequest(BaseModel):
    pass # Trigger full discovery

class GrievanceRequest(BaseModel):
    text: str
    urgency: int = 3 # 1 to 5

class CSCCopilotRequest(BaseModel):
    aadhaar_name: str
    ration_name: str
    aadhaar_address: str
    ration_address: str
    income: int
    documents_complete: bool
