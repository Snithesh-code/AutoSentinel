"""
Middleware for quota checking and request processing
"""

import logging
import os
import jwt
from fastapi import Request, HTTPException, Depends
from typing import Optional
from functools import wraps
from datetime import datetime

logger = logging.getLogger(__name__)

# Global db_service reference (will be set in main.py)
db_service = None

# JWT configuration
JWT_SECRET = os.getenv("JWT_SECRET", "your-secret-key-here")
JWT_ALGORITHM = "HS256"


def set_db_service(service):
    """Set the database service for middleware"""
    global db_service
    db_service = service


async def get_user_from_token(request: Request) -> Optional[dict]:
    """Extract user info from Authorization header"""
    auth_header = request.headers.get("Authorization", "")

    if not auth_header.startswith("Bearer "):
        return None

    token = auth_header.split("Bearer ")[1]

    try:
        # Try to decode JWT token first (standard format)
        try:
            payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
            return {
                "id": payload.get("sub") or payload.get("user_id"),
                "email": payload.get("email"),
                "role": payload.get("role", "free")
            }
        except jwt.InvalidTokenError:
            # Fall back to mock token format for testing
            if token.startswith("user:"):
                user_id = token.split(":", 1)[1]
                return {"id": user_id}
            return None

    except Exception as e:
        logger.error(f"Error parsing token: {str(e)}")
        return None


async def check_quota(request: Request, resource: str):
    """Middleware to check user quota before allowing action"""
    global db_service

    if not db_service or not db_service.is_connected:
        logger.warning("Database service not available, skipping quota check")
        return True

    try:
        # Get user from token
        user = await get_user_from_token(request)
        if not user:
            raise HTTPException(status_code=401, detail="Unauthorized")

        user_id = user.get("id")

        # Get user's quota status
        quota_status = await db_service.get_user_quota_status(user_id, resource)
        if not quota_status:
            raise HTTPException(status_code=404, detail="User not found")

        # Check if quota is available
        if quota_status["remaining"] <= 0:
            raise HTTPException(
                status_code=429,
                detail={
                    "error": f"You have reached your {resource} limit for today",
                    "remaining": 0,
                    "resetTime": quota_status["resetTime"].isoformat()
                }
            )

        # Store quota status in request state for later use
        request.state.quota_status = quota_status
        request.state.user_id = user_id

        return True

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error checking quota: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")


async def log_activity(user_id: str, activity_type: str, description: str, metadata: dict = None):
    """Log user activity to database"""
    global db_service

    if not db_service or not db_service.is_connected:
        logger.warning("Database service not available, skipping activity logging")
        return

    try:
        await db_service.log_activity(user_id, activity_type, description, metadata)
    except Exception as e:
        logger.error(f"Error logging activity: {str(e)}")
