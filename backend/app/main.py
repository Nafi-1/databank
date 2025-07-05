from fastapi import FastAPI, HTTPException, Depends, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import redis
import json
from datetime import datetime
import asyncio
import uvicorn

from .config import settings
from .routes import auth, datasets, generation, analytics, agents
from .websocket_manager import ConnectionManager
from .services.redis_service import RedisService
from .services.supabase_service import SupabaseService
from .middleware.auth import verify_token

# Initialize FastAPI app
app = FastAPI(
    title="DataGenesis AI API",
    description="Enterprise-grade synthetic data generation platform",
    version="1.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "https://localhost:5173", 
        "http://127.0.0.1:5173",
        "https://127.0.0.1:5173",
        "https://*.vercel.app",
        "https://*.netlify.app"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Optional authentication - allow unauthenticated access for guest users
from fastapi.security import HTTPBearer
from fastapi import Request, HTTPException

class OptionalHTTPBearer(HTTPBearer):
    """Modified HTTPBearer that doesn't require authentication for guests"""
    async def __call__(self, request: Request):
        try:
            return await super().__call__(request)
        except HTTPException:
            # Return None for unauthenticated requests (guests)
            return None

# Initialize services
redis_service = RedisService()
supabase_service = SupabaseService()
manager = ConnectionManager()

# Optional security for guest access
security = OptionalHTTPBearer(auto_error=False)

# Include routers
app.include_router(auth.router, prefix="/api/auth", tags=["authentication"])
app.include_router(datasets.router, prefix="/api/datasets", tags=["datasets"])
app.include_router(generation.router, prefix="/api/generation", tags=["generation"])
app.include_router(analytics.router, prefix="/api/analytics", tags=["analytics"])
app.include_router(agents.router, prefix="/api/agents", tags=["agents"])

@app.on_event("startup")
async def startup_event():
    """Initialize services on startup"""
    await redis_service.initialize()
    await supabase_service.initialize()
    print("🚀 DataGenesis AI API started successfully!")

@app.on_event("shutdown")
async def shutdown_event():
    """Cleanup on shutdown"""
    await redis_service.close()
    print("📴 DataGenesis AI API shutdown complete")

@app.get("/api/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "services": {
            "redis": await redis_service.ping(),
            "supabase": await supabase_service.health_check()
        }
    }

@app.websocket("/ws/{client_id}")
async def websocket_endpoint(websocket: WebSocket, client_id: str):
    """WebSocket endpoint for real-time updates"""
    await manager.connect(websocket, client_id)
    try:
        while True:
            # Keep connection alive and handle incoming messages
            data = await websocket.receive_text()
            await manager.send_personal_message(f"Echo: {data}", client_id)
    except WebSocketDisconnect:
        manager.disconnect(client_id)
        await manager.broadcast(f"Client {client_id} disconnected")

@app.get("/api/system/status")
async def system_status(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Get real-time system status"""
    # Allow both authenticated users and guests
    user = None
    if credentials:
        try:
            user = await verify_token(credentials.credentials)
        except:
            pass
    
    # Get real-time metrics from Redis
    metrics = await redis_service.get_system_metrics()
    
    return {
        "timestamp": datetime.utcnow().isoformat(),
        "active_users": metrics.get("active_users", 0),
        "active_generations": metrics.get("active_generations", 0),
        "total_datasets": metrics.get("total_datasets", 0),
        "agent_status": await redis_service.get_agent_status(),
        "performance_metrics": await redis_service.get_performance_metrics(),
        "user_type": "guest" if (user and user.get("is_guest")) else "authenticated" if user else "anonymous"
    }

if __name__ == "__main__":
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )