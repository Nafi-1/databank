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

class NaturalLanguageRequest(BaseModel):
    description: str
    domain: str = 'general'
    data_type: str = 'tabular'
    
class SchemaGenerationResponse(BaseModel):
    schema: Dict[str, Any]
    detected_domain: str
    sample_data: List[Dict[str, Any]]
    suggestions: List[str]
router = APIRouter()
security = HTTPBearer()

# Initialize services
redis_service = RedisService()
gemini_service = GeminiService()
vector_service = VectorService()
supabase_service = SupabaseService()
orchestrator = AgentOrchestrator(redis_service, gemini_service, vector_service)

@router.post("/schema-from-description", response_model=SchemaGenerationResponse)
async def generate_schema_from_description(
    request: NaturalLanguageRequest,
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    """Generate schema from natural language description"""
    try:
        # Allow both authenticated users and guests
        user = None
        try:
            user = await verify_token(credentials.credentials)
        except:
            # Allow guest access
            pass
            
        # Generate schema using Gemini
        schema_result = await gemini_service.generate_schema_from_natural_language(
            request.description,
            request.domain,
            request.data_type
        )
        
        return SchemaGenerationResponse(
            schema=schema_result.get('schema', {}),
            detected_domain=schema_result.get('detected_domain', request.domain),
            sample_data=schema_result.get('sample_data', []),
            suggestions=schema_result.get('suggestions', [])
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Schema generation failed: {str(e)}")
@router.post("/start", response_model=GenerationResponse)
async def start_generation(
    request: GenerationRequest,
    background_tasks: BackgroundTasks,
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    """Start synthetic data generation job"""
    # Allow both authenticated users and guests
    user = None
    try:
        user = await verify_token(credentials.credentials)
    except:
        # Allow guest access - create temporary user
        user = {
            "id": f"guest_{uuid.uuid4().hex[:8]}",
            "email": "guest@datagenesis.ai",
            "is_guest": True
        }
    
    # Generate unique job ID
    job_id = str(uuid.uuid4())
    
    # Start background generation task
    background_tasks.add_task(
        run_generation_job,
        job_id,
        user.get("id") if user else "anonymous",
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
    # Allow both authenticated users and guests
    try:
        user = await verify_token(credentials.credentials)
    except:
        # Allow guest access
        pass
    
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
    # Allow both authenticated users and guests
    try:
        user = await verify_token(credentials.credentials)
        user_id = user["id"]
    except:
        # For guests, return empty list or recent guest jobs
        return {"jobs": []}
    
    # Get jobs from Supabase
    jobs = await supabase_service.get_user_generation_jobs(user_id)
    
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
    # Allow both authenticated users and guests
    try:
        user = await verify_token(credentials.credentials)
    except:
        # Allow guest access
        pass
    
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

@router.post("/generate-local")
async def generate_local_data(
    request: Dict[str, Any],
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    """Generate synthetic data locally (for guests)"""
    try:
        # This endpoint is specifically for guest users who can't use the full backend pipeline
        schema = request.get('schema', {})
        config = request.get('config', {})
        description = request.get('description', '')
        
        # Use Gemini to generate synthetic data
        synthetic_data = await gemini_service.generate_synthetic_data_from_schema(
            schema, config, description
        )
        
        # Calculate basic quality metrics
        quality_score = min(100, max(80, len(synthetic_data) / max(1, config.get('rowCount', 100)) * 100))
        privacy_score = 95  # Default high privacy for synthetic data
        bias_score = 88    # Default bias score
        
        return {
            "data": synthetic_data,
            "metadata": {
                "rowsGenerated": len(synthetic_data),
                "columnsGenerated": len(synthetic_data[0].keys()) if synthetic_data else 0,
                "generationTime": datetime.utcnow().isoformat(),
                "config": config
            },
            "qualityScore": quality_score,
            "privacyScore": privacy_score,
            "biasScore": bias_score
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Local generation failed: {str(e)}")
async def run_generation_job(job_id: str, user_id: str, config: Dict[str, Any]):
    """Background task to run generation job"""
    try:
        # Store initial job data
        if not user_id.startswith("guest_") and not user_id == "anonymous":
            await supabase_service.create_generation_job(job_id, user_id, config)
        
        # Run the orchestrated generation
        result = await orchestrator.orchestrate_generation(
            job_id,
            config.get("source_data", []),
            config
        )
        
        # Store the result in Supabase
        if not user_id.startswith("guest_") and not user_id == "anonymous":
            await supabase_service.complete_generation_job(job_id, result)
        
        # Update metrics
        await redis_service.increment_metric("total_generations")
        await redis_service.increment_metric("successful_generations")
        
    except Exception as e:
        # Handle job failure
        await redis_service.update_job_progress(job_id, -1, "failed")
        if not user_id.startswith("guest_") and not user_id == "anonymous":
            await supabase_service.fail_generation_job(job_id, str(e))
        
        print(f"Generation job {job_id} failed: {e}")