"""
Database models for AutoSentinel
"""

from datetime import datetime, timedelta
from typing import Optional, Dict, List
from pydantic import BaseModel, Field
from enum import Enum

# ===== Enums =====
class UserRole(str, Enum):
    FREE = "free"
    PREMIUM = "premium"
    ADMIN = "admin"


# ===== Request/Response Models =====
class UserSignup(BaseModel):
    username: str
    email: str
    password: str


class UserLogin(BaseModel):
    email: str
    password: str


class UserProfileResponse(BaseModel):
    id: str = Field(alias="_id")
    username: str
    email: str
    role: UserRole
    usage: Dict[str, int]
    networksCount: int
    trainingsCount: int
    simulationsCount: int
    createdAt: datetime
    lastLogin: Optional[datetime] = None

    class Config:
        populate_by_name = True


class QuotaCheckResponse(BaseModel):
    available: int
    used: int
    remaining: int
    resetTime: datetime


class QuotaIncrementRequest(BaseModel):
    resource: str  # network|training|simulation


class QuotaIncrementResponse(BaseModel):
    success: bool
    newUsage: int
    remaining: int


class AdminMetricsResponse(BaseModel):
    totalUsers: int
    usersOnline: int
    activeTrainings: int
    activeSimulations: int
    totalNetworks: int
    trainingsToday: int
    simulationsToday: int
    networksToday: int
    newUsersToday: int
    usersByRole: Dict[str, int]
    topUsers: List[Dict]
    recentActivities: List[Dict]
    uptime: str
    avgResponseTime: str
    apiRequestsPerMin: int
    errorRate: str
    cacheHitRate: str


# ===== Database Models (for MongoDB) =====
class UserModel(BaseModel):
    """User database model"""
    username: str
    email: str
    password: str  # hashed
    role: UserRole = UserRole.FREE
    googleId: Optional[str] = None
    createdAt: datetime = Field(default_factory=datetime.utcnow)
    updatedAt: datetime = Field(default_factory=datetime.utcnow)
    lastLogin: Optional[datetime] = None
    isEmailVerified: bool = False
    verificationToken: Optional[str] = None
    resetPasswordToken: Optional[str] = None
    networksCount: int = 0
    trainingsCount: int = 0
    simulationsCount: int = 0
    usage: Dict[str, int] = Field(default_factory=lambda: {
        "networks": 0,
        "trainings": 0,
        "simulations": 0
    })
    usageResetTime: datetime = Field(default_factory=lambda: datetime.utcnow() + timedelta(days=1))

    class Config:
        json_schema_extra = {
            "example": {
                "username": "john_doe",
                "email": "john@example.com",
                "password": "hashed_password",
                "role": "free",
                "usage": {
                    "networks": 3,
                    "trainings": 0,
                    "simulations": 45
                }
            }
        }


class QuotaUsageModel(BaseModel):
    """Quota usage tracking model"""
    userId: str
    date: datetime = Field(default_factory=datetime.utcnow)
    resources: Dict[str, int] = Field(default_factory=lambda: {
        "networks": 0,
        "trainings": 0,
        "simulations": 0
    })
    createdAt: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        json_schema_extra = {
            "example": {
                "userId": "user_id_123",
                "date": "2024-01-15T00:00:00Z",
                "resources": {
                    "networks": 2,
                    "trainings": 1,
                    "simulations": 50
                }
            }
        }


class ActivityLogModel(BaseModel):
    """Activity logging model"""
    userId: str
    type: str  # user_signup|network_created|training_started|simulation_run|user_login
    description: str
    metadata: Optional[Dict] = None
    timestamp: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        json_schema_extra = {
            "example": {
                "userId": "user_id_123",
                "type": "network_created",
                "description": "User created network: MyNetwork",
                "timestamp": "2024-01-15T10:30:00Z"
            }
        }


# ===== Quota Configuration =====
QUOTA_LIMITS = {
    "free": {
        "networks": 5,
        "trainings": 1,
        "simulations": 100
    },
    "premium": {
        "networks": 10,
        "trainings": 5,
        "simulations": 500
    },
    "admin": {
        "networks": float('inf'),
        "trainings": float('inf'),
        "simulations": float('inf')
    }
}


def get_quota_limit(role: UserRole, resource: str) -> int:
    """Get quota limit for a user role and resource"""
    limits = QUOTA_LIMITS.get(role.value, QUOTA_LIMITS["free"])
    return limits.get(resource, 0)


def should_reset_usage(user_reset_time: datetime) -> bool:
    """Check if daily usage should be reset"""
    return datetime.utcnow() >= user_reset_time
