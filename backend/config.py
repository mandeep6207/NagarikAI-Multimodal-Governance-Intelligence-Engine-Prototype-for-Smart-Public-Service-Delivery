import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "NagarikAI - Enterprise Governance Engine"
    API_V1_STR: str = "/api/v1"
    ENV: str = "development"
    RATE_LIMIT_SIMULATION: bool = True
    
    class Config:
        case_sensitive = True

settings = Settings()
