from fastapi import HTTPException, status
import jwt
from ..config import settings

async def verify_token(token: str):
    """Verify JWT token from Supabase"""
    try:
        # For now, return a mock user - replace with actual Supabase verification
        if token == "mock-token":
            return {
                "id": "user-123",
                "email": "user@example.com", 
                "name": "Test User"
            }
        
        # In production, verify with Supabase:
        # decoded = jwt.decode(token, settings.supabase_jwt_secret, algorithms=["HS256"])
        # return decoded
        
        return {
            "id": "guest-user",
            "email": "guest@datagenesis.ai",
            "name": "Guest User"
        }
        
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has expired"
        )
    except jwt.JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token"
        )