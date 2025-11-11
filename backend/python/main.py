import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# === Optimize imports: disable TensorFlow, CUDA checks ===
os.environ["CUDA_VISIBLE_DEVICES"] = "-1"
os.environ["TF_CPP_MIN_LOG_LEVEL"] = "3"
os.environ["RLLIB_FRAMEWORK"] = "torch"
os.environ["RLLIB_TEST_NO_TF_IMPORT"] = "1"

import yaml
import logging
from fastapi import FastAPI, HTTPException, Request, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Dict, Any, Optional, List, TYPE_CHECKING
import asyncio
import httpx
import json
from datetime import datetime, timedelta

# Type checking imports (not loaded at runtime)
if TYPE_CHECKING:
    from services.model_service import ModelService
    from services.simulation_service import SimulationService

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title="AutoSentinel Python API",
    description="ML Model and Simulation Backend",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global services (using Any to avoid import at runtime)
model_service: Any = None
simulation_service: Any = None
db_service: Any = None

# XAI Cache for explanations
explanation_cache: Dict[str, str] = {}

# Metrics tracking
api_request_count = 0
error_count = 0
cache_hits = 0
cache_misses = 0
start_time = datetime.utcnow()

# Request/Response Models
class SimulationResponse(BaseModel):
    success: bool
    message: str
    data: Optional[Dict[str, Any]] = None

class StepResponse(BaseModel):
    success: bool
    step: int
    agents: Dict[str, Any]
    events: List[Dict[str, Any]]
    node_states: Dict[str, str]

class ActionExplanationRequest(BaseModel):
    action: str
    agent_type: str
    target: Optional[str] = None
    description: Optional[str] = None


class QuotaCheckRequest(BaseModel):
    resource: str  # network|training|simulation


class QuotaIncrementRequest(BaseModel):
    resource: str  # network|training|simulation

# Background task to load model
async def load_model_background():
    """Load model in background to avoid blocking startup"""
    global model_service, simulation_service

    try:
        # Lazy import to speed up startup
        from services.model_service import ModelService
        from services.simulation_service import SimulationService

        logger.info("🔄 Loading ML model in background...")

        model_path = os.path.join(os.path.dirname(__file__), "ray_results/checkpoints")
        config_path = os.path.join(os.path.dirname(__file__), "v3.yaml")

        model_service = ModelService(model_path, config_path)
        await model_service.initialize()

        # Initialize simulation service
        simulation_service = SimulationService(model_service, config_path)
        await simulation_service.initialize()

        logger.info("✅ ML model loaded successfully")

    except Exception as e:
        logger.warning(f"⚠️ Model loading failed: {str(e)}")
        logger.info("ℹ️  Running in mock mode")


# Background task to initialize database
async def initialize_db_background():
    """Initialize database connection in background"""
    global db_service

    try:
        from services.db_service import DBService

        logger.info("🔄 Initializing database connection...")

        db_service = DBService()
        await db_service.connect()

        if db_service.is_connected:
            logger.info("✅ Database connected successfully")
            from middleware import set_db_service
            set_db_service(db_service)
        else:
            logger.warning("⚠️ Running without database - quota system disabled")

    except Exception as e:
        logger.warning(f"⚠️ Database initialization failed: {str(e)}")
        logger.info("ℹ️ Running without database")

# Startup event - Fast startup, load model in background
@app.on_event("startup")
async def startup_event():
    logger.info("🚀 AutoSentinel Python API starting...")
    logger.info("⚡ Server ready! Loading services in background...")

    # Start background tasks to load model and database
    asyncio.create_task(load_model_background())
    asyncio.create_task(initialize_db_background())

# Health check endpoint
@app.get("/")
async def root():
    return {
        "status": "running",
        "service": "AutoSentinel Python API",
        "version": "1.0.0",
        "model_loaded": model_service is not None and model_service.is_loaded(),
        "simulation_ready": simulation_service is not None
    }

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "model_loaded": model_service.is_loaded() if model_service else False,
        "simulation_active": simulation_service.is_running() if simulation_service else False
    }

@app.get("/simulation/status")
async def get_simulation_status():
    """Get current simulation state"""
    if not simulation_service:
        raise HTTPException(status_code=500, detail="Simulation service not initialized")

    return {
        "success": True,
        "is_running": simulation_service.is_running(),
        "step": int(simulation_service._step_count),
        "episode": int(simulation_service._episode_count),
        "agents": {
            "attacker": {
                "reward": float(simulation_service.agent_rewards.get("attacker", 0)),
                "lastAction": simulation_service.last_actions.get("attacker"),
                "lastActionId": int(simulation_service.last_action_ids.get("attacker", 0))
            },
            "defender": {
                "reward": float(simulation_service.agent_rewards.get("defender", 0)),
                "lastAction": simulation_service.last_actions.get("defender"),
                "lastActionId": int(simulation_service.last_action_ids.get("defender", 0))
            }
        }
    }

# Simulation control endpoints
@app.post("/simulation/start", response_model=SimulationResponse)
async def start_simulation():
    """Start the simulation"""
    try:
        if not simulation_service:
            raise HTTPException(status_code=500, detail="Simulation service not initialized")

        await simulation_service.start()

        return SimulationResponse(
            success=True,
            message="Simulation started successfully"
        )
    except Exception as e:
        logger.error(f"Error starting simulation: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/simulation/stop", response_model=SimulationResponse)
async def stop_simulation():
    """Stop the simulation"""
    try:
        if not simulation_service:
            raise HTTPException(status_code=500, detail="Simulation service not initialized")

        await simulation_service.stop()

        return SimulationResponse(
            success=True,
            message="Simulation stopped successfully"
        )
    except Exception as e:
        logger.error(f"Error stopping simulation: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/simulation/reset", response_model=SimulationResponse)
async def reset_simulation():
    """Reset the simulation"""
    try:
        if not simulation_service:
            raise HTTPException(status_code=500, detail="Simulation service not initialized")

        await simulation_service.reset()

        return SimulationResponse(
            success=True,
            message="Simulation reset successfully"
        )
    except Exception as e:
        logger.error(f"Error resetting simulation: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/simulation/step", response_model=StepResponse)
async def step_simulation():
    """Execute one step of the simulation"""
    try:
        if not simulation_service:
            raise HTTPException(status_code=500, detail="Simulation service not initialized")

        result = await simulation_service.step()

        return StepResponse(
            success=True,
            step=result["step"],
            agents=result["agents"],
            events=result["events"],
            node_states=result["node_states"]
        )
    except Exception as e:
        logger.error(f"Error stepping simulation: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# Model inference endpoint
@app.post("/model/predict")
async def predict(observation: Dict[str, Any]):
    """Get model predictions for given observations"""
    try:
        if not model_service or not model_service.is_loaded():
            raise HTTPException(status_code=500, detail="Model not loaded")

        actions = await model_service.predict(observation)

        return {
            "success": True,
            "actions": actions
        }
    except Exception as e:
        logger.error(f"Error during prediction: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# Model info endpoint
@app.get("/model/info")
async def model_info():
    """Get information about the loaded model"""
    try:
        if not model_service:
            raise HTTPException(status_code=500, detail="Model service not initialized")

        info = model_service.get_info()

        return {
            "success": True,
            "info": info
        }
    except Exception as e:
        logger.error(f"Error getting model info: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


# ===== User Endpoints =====
@app.get("/api/users/profile")
async def get_user_profile(request: Request):
    """Get user profile"""
    global db_service

    try:
        from middleware import get_user_from_token

        # Get user from token
        user = await get_user_from_token(request)
        if not user:
            raise HTTPException(status_code=401, detail="Unauthorized")

        user_id = user.get("id")

        if not db_service or not db_service.is_connected:
            # Return mock data if database is not connected
            logger.warning("Database not connected, returning mock profile")
            return {
                "username": "mock_user",
                "email": "user@example.com",
                "role": "free",
                "usage": {"networks": 0, "trainings": 0, "simulations": 0},
                "networksCount": 0,
                "trainingsCount": 0,
                "simulationsCount": 0,
                "createdAt": datetime.utcnow().isoformat(),
                "lastLogin": datetime.utcnow().isoformat()
            }

        # Get user from database
        user_data = await db_service.get_user(user_id)
        if not user_data:
            raise HTTPException(status_code=404, detail="User not found")

        # Return user profile
        return {
            "username": user_data.get("username"),
            "email": user_data.get("email"),
            "role": user_data.get("role", "free"),
            "usage": user_data.get("usage", {"networks": 0, "trainings": 0, "simulations": 0}),
            "networksCount": user_data.get("networksCount", 0),
            "trainingsCount": user_data.get("trainingsCount", 0),
            "simulationsCount": user_data.get("simulationsCount", 0),
            "createdAt": user_data.get("createdAt", datetime.utcnow()).isoformat(),
            "lastLogin": user_data.get("lastLogin", datetime.utcnow()).isoformat()
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting user profile: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")


# ===== Quota Endpoints =====
@app.get("/api/quota/check/{resource}")
async def check_quota(resource: str, request: Request):
    """Check user's quota for a resource"""
    global db_service

    try:
        from middleware import get_user_from_token

        # Validate resource
        if resource not in ["network", "training", "simulation"]:
            raise HTTPException(status_code=400, detail="Invalid resource")

        # Get user from token
        user = await get_user_from_token(request)
        if not user:
            raise HTTPException(status_code=401, detail="Unauthorized")

        user_id = user.get("id")

        if not db_service or not db_service.is_connected:
            # Return mock quota if database is not connected
            logger.warning("Database not connected, returning mock quota")
            return {
                "available": 100,
                "used": 0,
                "remaining": 100,
                "resetTime": (datetime.utcnow() + timedelta(days=1)).isoformat()
            }

        # Get quota status
        quota_status = await db_service.get_user_quota_status(user_id, resource)
        if not quota_status:
            raise HTTPException(status_code=404, detail="User not found")

        return {
            "available": quota_status["available"],
            "used": quota_status["used"],
            "remaining": quota_status["remaining"],
            "resetTime": quota_status["resetTime"].isoformat()
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error checking quota: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")


@app.post("/api/quota/increment")
async def increment_quota(request: QuotaIncrementRequest, user_request: Request):
    """Increment user's usage for a resource"""
    global db_service

    try:
        from middleware import get_user_from_token

        # Validate resource
        if request.resource not in ["network", "training", "simulation"]:
            raise HTTPException(status_code=400, detail="Invalid resource")

        # Get user from token
        user = await get_user_from_token(user_request)
        if not user:
            raise HTTPException(status_code=401, detail="Unauthorized")

        user_id = user.get("id")

        if not db_service or not db_service.is_connected:
            # Mock response if database not connected
            logger.warning("Database not connected, returning mock increment response")
            return {
                "success": True,
                "newUsage": 1,
                "remaining": 99
            }

        # Update usage
        updated_user = await db_service.update_user_usage(user_id, request.resource)
        if not updated_user:
            raise HTTPException(status_code=404, detail="User not found")

        # Get new quota status
        quota_status = await db_service.get_user_quota_status(user_id, request.resource)

        # Log activity
        await db_service.log_activity(
            user_id,
            f"{request.resource}_created",
            f"User incremented {request.resource} usage",
            {"resource": request.resource}
        )

        return {
            "success": True,
            "newUsage": quota_status["used"],
            "remaining": quota_status["remaining"]
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error incrementing quota: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")


# ===== Admin Endpoints =====
@app.get("/api/admin/metrics")
async def get_admin_metrics(request: Request):
    """Get system metrics (admin only)"""
    global db_service

    try:
        from middleware import get_user_from_token

        # Get user from token
        user = await get_user_from_token(request)
        if not user:
            raise HTTPException(status_code=401, detail="Unauthorized")

        # TODO: Verify user role is admin
        # For now, we'll assume the user is admin if they have a token

        if not db_service or not db_service.is_connected:
            # Return mock metrics if database not connected
            logger.warning("Database not connected, returning mock metrics")
            return {
                "totalUsers": 1250,
                "usersOnline": 45,
                "activeTrainings": 8,
                "activeSimulations": 12,
                "totalNetworks": 3456,
                "trainingsToday": 89,
                "simulationsToday": 234,
                "networksToday": 23,
                "newUsersToday": 5,
                "usersByRole": {"free": 980, "premium": 250, "admin": 20},
                "topUsers": [],
                "recentActivities": [],
                "uptime": "99.9%",
                "avgResponseTime": "45ms",
                "apiRequestsPerMin": 1234,
                "errorRate": "0.1%",
                "cacheHitRate": "89%"
            }

        # Get all metrics
        total_users = await db_service.get_total_users_count()
        users_by_role = await db_service.get_users_by_role()
        top_users = await db_service.get_top_users(10)
        recent_activities = await db_service.get_recent_activities(50)
        daily_stats = await db_service.get_daily_stats()

        # Calculate system metrics
        uptime_seconds = (datetime.utcnow() - start_time).total_seconds()
        uptime_hours = uptime_seconds / 3600
        uptime_percent = 99.9  # Mock value

        avg_response_time = 45 if api_request_count > 0 else 0
        error_rate = (error_count / api_request_count * 100) if api_request_count > 0 else 0
        cache_hit_rate = (cache_hits / (cache_hits + cache_misses) * 100) if (cache_hits + cache_misses) > 0 else 0

        return {
            "totalUsers": total_users,
            "usersOnline": 0,  # Would need real-time tracking
            "activeTrainings": 0,  # Would need real-time tracking
            "activeSimulations": 0,  # Would need real-time tracking
            "totalNetworks": 0,  # Would need database tracking
            "trainingsToday": daily_stats.get("trainingsToday", 0),
            "simulationsToday": daily_stats.get("simulationsToday", 0),
            "networksToday": daily_stats.get("networksToday", 0),
            "newUsersToday": daily_stats.get("newUsersToday", 0),
            "usersByRole": users_by_role,
            "topUsers": top_users,
            "recentActivities": [
                {
                    "type": activity.get("type", "unknown"),
                    "description": activity.get("description", ""),
                    "timestamp": activity.get("timestamp", datetime.utcnow()).isoformat(),
                    "userId": activity.get("userId", "")
                }
                for activity in recent_activities
            ],
            "uptime": f"{uptime_percent}%",
            "avgResponseTime": f"{int(avg_response_time)}ms",
            "apiRequestsPerMin": api_request_count,
            "errorRate": f"{error_rate:.1f}%",
            "cacheHitRate": f"{cache_hit_rate:.1f}%"
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting admin metrics: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")


# XAI - Explainable AI endpoints
async def get_gemini_explanation(action: str, agent_type: str, target: Optional[str] = None, description: Optional[str] = None) -> str:
    """
    Call Google Gemini API to generate XAI explanation for actions
    """
    api_key = os.getenv("GEMINI_API_KEY")

    if not api_key:
        logger.warning("GEMINI_API_KEY not set, using fallback explanation")
        return "Explanation unavailable - API key not configured"

    # Build context
    context = f"Agent Type: {agent_type}"
    if target:
        context += f"\nTarget: {target}"
    if description:
        context += f"\nContext: {description}"

    prompt = f"""You are a cybersecurity expert explaining AI agent actions in a network security simulation.

{context}
Action Taken: {action}

Provide a brief, clear explanation (1-2 sentences max) of why this action makes sense in the context of {'attacking/breaching' if agent_type == 'attacker' else 'defending'} a network.
Be concise and technical. Focus on the strategic reasoning."""

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.post(
                "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent",
                headers={"Content-Type": "application/json", "X-goog-api-key": api_key},
                json={
                    "contents": [
                        {
                            "parts": [
                                {
                                    "text": prompt
                                }
                            ]
                        }
                    ],
                    "generationConfig": {
                        "maxOutputTokens": 100,
                        "temperature": 0.7
                    }
                }
            )

            logger.info(f"Gemini API response status: {response.status_code}")

            if response.status_code == 200:
                try:
                    data = response.json()
                    logger.info(f"📦 Full Gemini API response: {json.dumps(data, indent=2)}")

                    # Check for error in response
                    if "error" in data:
                        logger.error(f"Gemini API returned error: {data['error']}")
                        return f"Gemini Error: {data['error'].get('message', 'Unknown error')}"

                    # Try to extract text from various possible structures
                    if "candidates" in data and len(data["candidates"]) > 0:
                        candidate = data["candidates"][0]
                        if "content" in candidate and "parts" in candidate["content"]:
                            parts = candidate["content"]["parts"]
                            if len(parts) > 0 and "text" in parts[0]:
                                explanation = parts[0]["text"]
                                logger.info(f"✅ Successfully extracted explanation: {explanation[:100]}...")
                                return explanation

                    if "contents" in data and len(data["contents"]) > 0:
                        if "parts" in data["contents"][0] and len(data["contents"][0]["parts"]) > 0:
                            explanation = data["contents"][0]["parts"][0]["text"]
                            logger.info(f"✅ Successfully extracted explanation: {explanation[:100]}...")
                            return explanation

                    logger.error(f"❌ Unexpected response structure: {json.dumps(data)}")
                    return "Unable to generate explanation - unexpected response format"

                except Exception as parse_err:
                    logger.error(f"❌ Error parsing response: {str(parse_err)}")
                    logger.error(f"Raw response text: {response.text}")
                    return f"Error parsing response: {str(parse_err)}"
            else:
                logger.error(f"❌ Gemini API error: {response.status_code} - {response.text}")
                return f"API Error: {response.status_code}"
    except asyncio.TimeoutError:
        logger.error("Gemini API request timeout")
        return "API request timeout"
    except Exception as e:
        logger.error(f"Error calling Gemini API: {str(e)}")
        return f"Error: {str(e)}"

@app.post("/xai/explain-action")
async def explain_action(request: ActionExplanationRequest):
    """
    Get XAI explanation for an action using Gemini API
    """
    logger.info(f"🔍 XAI request received: action={request.action}, agent_type={request.agent_type}, target={request.target}")

    # Create cache key
    cache_key = f"{request.agent_type}:{request.action}:{request.target or ''}"

    # Check cache first
    if cache_key in explanation_cache:
        logger.info(f"✓ Returning cached explanation for {cache_key}")
        return {
            "success": True,
            "action": request.action,
            "explanation": explanation_cache[cache_key],
            "cached": True
        }

    try:
        logger.info(f"📡 Calling Gemini API for: {request.action}")
        # Call Gemini API
        explanation = await get_gemini_explanation(
            request.action,
            request.agent_type,
            request.target,
            request.description
        )

        logger.info(f"✅ Got explanation: {explanation[:100]}...")

        # Cache the result
        explanation_cache[cache_key] = explanation

        return {
            "success": True,
            "action": request.action,
            "explanation": explanation,
            "cached": False
        }
    except Exception as e:
        logger.error(f"❌ XAI Error: {str(e)}", exc_info=True)
        return {
            "success": False,
            "error": str(e),
            "explanation": "Unable to generate explanation"
        }

# Shutdown event
@app.on_event("shutdown")
async def shutdown_event():
    """Clean up resources on shutdown"""
    global db_service

    logger.info("🛑 AutoSentinel API shutting down...")

    if db_service:
        await db_service.disconnect()

    logger.info("✅ Shutdown complete")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, log_level="info")
