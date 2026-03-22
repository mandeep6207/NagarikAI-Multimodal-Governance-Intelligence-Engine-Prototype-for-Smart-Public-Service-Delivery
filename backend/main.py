from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse
import time
import os
import sys

# Ensure data path is reachable
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from config import settings
from utils.logger import logger

# Import the v1 API routes
from routes import beneficiary, grievance, csc, analytics, auth, workflow, superadmin, officer, csc_operator, citizen, complaints

app = FastAPI(
    title=settings.PROJECT_NAME,
    version="2.0",
    description="Intelligence Layer for Public Governance"
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Simulated Rate Limiter & Profiling Middleware
@app.middleware("http")
async def add_process_time_header(request: Request, call_next):
    start_time = time.time()
    
    # Simulate a generic catch-all Enterprise Error Handler
    try:
        response = await call_next(request)
        process_time = time.time() - start_time
        response.headers["X-Process-Time"] = str(round(process_time, 4))
        logger.info(f"{request.method} {request.url.path} - HTTP {response.status_code} - {round(process_time * 1000, 2)}ms")
        return response
    except Exception as e:
        logger.error(f"SYSTEM FAULT on {request.url.path}: {str(e)}")
        return JSONResponse(
            status_code=500,
            content={"error": "Internal Enterprise Service Error", "message": str(e), "trace": "Contact SysAdmin"}
        )

# API Versioning Structure
app.include_router(auth.router, prefix=f"{settings.API_V1_STR}/auth", tags=["Authentication"])
app.include_router(beneficiary.router, prefix=f"{settings.API_V1_STR}/beneficiary", tags=["Beneficiary Discovery"])
app.include_router(grievance.router, prefix=f"{settings.API_V1_STR}/grievance", tags=["Grievance Intelligence"])
app.include_router(csc.router, prefix=f"{settings.API_V1_STR}/csc", tags=["CSC Copilot"])
app.include_router(analytics.router, prefix=f"{settings.API_V1_STR}/analytics", tags=["Governance Analytics"])
app.include_router(workflow.router, prefix=f"{settings.API_V1_STR}/workflow", tags=["Cross Role Workflow"])
app.include_router(superadmin.router, prefix=f"{settings.API_V1_STR}/superadmin", tags=["Super Administrator"])
app.include_router(officer.router, prefix=f"{settings.API_V1_STR}/officer", tags=["District Officer"])
app.include_router(csc_operator.router, prefix=f"{settings.API_V1_STR}/csc-portal", tags=["CSC Operator Portal"])
app.include_router(citizen.router, prefix=f"{settings.API_V1_STR}/citizen", tags=["Citizen Self-Service Portal"])
app.include_router(complaints.router, prefix=f"{settings.API_V1_STR}/complaints", tags=["Complaint Pipeline"])

# Serve uploaded videos as static files
_uploads_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "uploads", "videos")
os.makedirs(_uploads_dir, exist_ok=True)
app.mount("/uploads/videos", StaticFiles(directory=_uploads_dir), name="uploaded-videos")

# Root endpoint — confirms API is alive
@app.get("/", tags=["System"])
def root():
    return {
        "service": "NagarikAI Governance Intelligence API",
        "status": "running",
        "version": "1.0",
        "docs": "/docs",
    }

# Health check endpoint
@app.get("/health", tags=["System"])
def health_check():
    return {"status": "healthy"}

