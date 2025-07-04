from fastapi import APIRouter, HTTPException, Depends, BackgroundTasks
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from typing import List, Dict, Any, Optional
import uuid
import asyncio

from ..middleware.auth import verify_token
from ..services.redis_service import RedisService
from ..services.gemini_service import GeminiService
from ..services.vector_service import VectorService
from ..services.agent_orchestrator import AgentOrchestrator
from ..services.supabase_service import SupabaseService
from ..models.generation import GenerationRequest, GenerationResponse

router = APIRouter()
security = HTTPBearer()

# Initialize services
redis_service = RedisService()
gemini_service = GeminiService()
vector_service = VectorService()
supabase_service = SupabaseService()
orchestrator = AgentOrchestrator(redis_service, gemini_service, vector_service)

@router.post("/start", response_model=GenerationResponse)
async def start_generation(
    request: GenerationRequest,
    background_tasks: BackgroundTasks,
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    """Start synthetic data generation job"""
    user = await verify_token(credentials.credentials)
    
    # Generate unique job ID
    job_id = str(uuid.uuid4())
    
    # Start background generation task
    background_tasks.add_task(
        run_generation_job,
        job_id,
        user["id"],
        request.dict()
    )
    
    return GenerationResponse(
        job_id=job_id,
        status="started",
        message="Generation job started successfully"
    )

@router.get("/status/{job_id}")
async def get_generation_status(
    job_id: str,
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    """Get generation job status"""
    user = await verify_token(credentials.credentials)
    
    # Get job status from Redis
    job_data = await redis_service.get_cache(f"job:{job_id}")
    
    if not job_data:
        raise HTTPException(status_code=404, detail="Job not found")
    
    return {
        "job_id": job_id,
        "status": job_data.get("status", "unknown"),
        "progress": job_data.get("progress", 0),
        "message": job_data.get("message", ""),
        "started_at": job_data.get("started_at"),
        "estimated_completion": job_data.get("estimated_completion"),
        "result": job_data.get("result") if job_data.get("status") == "completed" else None
    }

@router.get("/jobs")
async def get_user_jobs(
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    """Get all generation jobs for user"""
    user = await verify_token(credentials.credentials)
    
    # Get jobs from Supabase
    jobs = await supabase_service.get_user_generation_jobs(user["id"])
    
    return {"jobs": jobs}

@router.delete("/jobs/{job_id}")
async def cancel_generation_job(
    job_id: str,
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    """Cancel a running generation job"""
    user = await verify_token(credentials.credentials)
    
    # Update job status
    await redis_service.update_job_progress(job_id, -1, "cancelled")
    
    return {"message": "Job cancelled successfully"}

@router.post("/analyze")
async def analyze_data(
    data: Dict[str, Any],
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    """Analyze uploaded data before generation"""
    user = await verify_token(credentials.credentials)
    
    try:
        # Quick analysis using Gemini
        analysis = await gemini_service.analyze_schema_advanced(
            data.get("sample_data", []),
            data.get("config", {}),
            []
        )
        
        return {
            "analysis": analysis,
            "recommendations": {
                "suggested_row_count": min(max(len(data.get("sample_data", [])) * 10, 1000), 100000),
                "suggested_privacy_level": "high" if analysis.get("pii_detected") else "medium",
                "estimated_generation_time": "2-5 minutes"
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")

async def run_generation_job(job_id: str, user_id: str, config: Dict[str, Any]):
    """Background task to run generation job"""
    try:
        # Store initial job data
        await supabase_service.create_generation_job(job_id, user_id, config)
        
        # Run the orchestrated generation
        result = await orchestrator.orchestrate_generation(
            job_id,
            config.get("source_data", []),
            config
        )
        
        # Store the result in Supabase
        await supabase_service.complete_generation_job(job_id, result)
        
        # Update metrics
        await redis_service.increment_metric("total_generations")
        await redis_service.increment_metric("successful_generations")
        
    except Exception as e:
        # Handle job failure
        await redis_service.update_job_progress(job_id, -1, "failed")
        await supabase_service.fail_generation_job(job_id, str(e))
        
        print(f"Generation job {job_id} failed: {e}")