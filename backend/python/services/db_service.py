"""
Database service for MongoDB operations
"""

import os
import logging
from datetime import datetime, timedelta
from typing import Optional, Dict, List, Any
from motor.motor_asyncio import AsyncClient, AsyncDatabase
from pymongo import ASCENDING, DESCENDING
from pymongo.errors import PyMongoError

logger = logging.getLogger(__name__)


class DBService:
    """Service for MongoDB database operations"""

    def __init__(self, connection_string: Optional[str] = None):
        """Initialize DB service with MongoDB connection"""
        self.connection_string = connection_string or os.getenv("MONGODB_URI")
        self.client: Optional[AsyncClient] = None
        self.db: Optional[AsyncDatabase] = None
        self.is_connected = False

    async def connect(self):
        """Connect to MongoDB"""
        try:
            if not self.connection_string:
                logger.warning("⚠️ MONGODB_URI not set, running in mock mode")
                self.is_connected = False
                return

            self.client = AsyncClient(self.connection_string, serverSelectionTimeoutMS=5000)
            self.db = self.client["autosentinel"]

            # Test connection
            await self.db.command("ping")
            logger.info("✅ Connected to MongoDB")
            self.is_connected = True

            # Create indexes
            await self._create_indexes()

        except Exception as e:
            logger.error(f"❌ Failed to connect to MongoDB: {str(e)}")
            self.is_connected = False

    async def disconnect(self):
        """Disconnect from MongoDB"""
        if self.client:
            self.client.close()
            self.is_connected = False
            logger.info("Disconnected from MongoDB")

    async def _create_indexes(self):
        """Create database indexes"""
        try:
            # User indexes
            await self.db.users.create_index("email", unique=True)
            await self.db.users.create_index("username", unique=True)
            await self.db.users.create_index("googleId", sparse=True)

            # Quota usage indexes
            await self.db.quota_usage.create_index([("userId", ASCENDING), ("date", DESCENDING)])

            # Activity log indexes
            await self.db.activity_logs.create_index([("userId", ASCENDING), ("timestamp", DESCENDING)])
            await self.db.activity_logs.create_index("type")

            logger.info("✅ Database indexes created")
        except Exception as e:
            logger.error(f"❌ Error creating indexes: {str(e)}")

    # ===== User Operations =====
    async def get_user(self, user_id: str) -> Optional[Dict]:
        """Get user by ID"""
        try:
            from bson.objectid import ObjectId
            result = await self.db.users.find_one({"_id": ObjectId(user_id)})
            return result
        except Exception as e:
            logger.error(f"Error getting user: {str(e)}")
            return None

    async def get_user_by_email(self, email: str) -> Optional[Dict]:
        """Get user by email"""
        try:
            return await self.db.users.find_one({"email": email})
        except Exception as e:
            logger.error(f"Error getting user by email: {str(e)}")
            return None

    async def get_user_by_username(self, username: str) -> Optional[Dict]:
        """Get user by username"""
        try:
            return await self.db.users.find_one({"username": username})
        except Exception as e:
            logger.error(f"Error getting user by username: {str(e)}")
            return None

    async def create_user(self, user_data: Dict) -> Optional[str]:
        """Create a new user"""
        try:
            user_data["createdAt"] = datetime.utcnow()
            user_data["updatedAt"] = datetime.utcnow()
            user_data["usageResetTime"] = datetime.utcnow() + timedelta(days=1)

            result = await self.db.users.insert_one(user_data)
            return str(result.inserted_id)
        except Exception as e:
            logger.error(f"Error creating user: {str(e)}")
            return None

    async def update_user(self, user_id: str, update_data: Dict) -> bool:
        """Update user"""
        try:
            from bson.objectid import ObjectId
            update_data["updatedAt"] = datetime.utcnow()
            result = await self.db.users.update_one(
                {"_id": ObjectId(user_id)},
                {"$set": update_data}
            )
            return result.modified_count > 0
        except Exception as e:
            logger.error(f"Error updating user: {str(e)}")
            return False

    async def update_user_usage(self, user_id: str, resource: str, increment: int = 1) -> Optional[Dict]:
        """Increment user usage for a resource"""
        try:
            from bson.objectid import ObjectId

            # Get user to check if reset is needed
            user = await self.get_user(user_id)
            if not user:
                return None

            # Check if usage should be reset (daily reset)
            current_time = datetime.utcnow()
            reset_time = user.get("usageResetTime", current_time)

            if current_time >= reset_time:
                # Reset usage
                update_data = {
                    f"usage.{resource}": increment,
                    "usageResetTime": current_time + timedelta(days=1)
                }
            else:
                # Increment existing usage
                update_data = {
                    f"usage.{resource}": user.get("usage", {}).get(resource, 0) + increment
                }

            await self.update_user(user_id, update_data)

            # Return updated user
            return await self.get_user(user_id)

        except Exception as e:
            logger.error(f"Error updating user usage: {str(e)}")
            return None

    async def get_user_quota_status(self, user_id: str, resource: str) -> Optional[Dict]:
        """Get user's quota status for a resource"""
        try:
            user = await self.get_user(user_id)
            if not user:
                return None

            from models import QUOTA_LIMITS

            role = user.get("role", "free")
            usage = user.get("usage", {}).get(resource, 0)
            quota_limits = QUOTA_LIMITS.get(role, QUOTA_LIMITS["free"])
            available = quota_limits.get(resource, 0)
            remaining = max(0, available - usage)

            # Check if reset is needed
            current_time = datetime.utcnow()
            reset_time = user.get("usageResetTime", current_time)

            if current_time >= reset_time:
                remaining = available
                usage = 0

            return {
                "available": available,
                "used": usage,
                "remaining": remaining,
                "resetTime": reset_time
            }

        except Exception as e:
            logger.error(f"Error getting quota status: {str(e)}")
            return None

    # ===== Activity Logging =====
    async def log_activity(self, user_id: str, activity_type: str, description: str, metadata: Optional[Dict] = None) -> bool:
        """Log user activity"""
        try:
            activity = {
                "userId": user_id,
                "type": activity_type,
                "description": description,
                "metadata": metadata or {},
                "timestamp": datetime.utcnow()
            }
            await self.db.activity_logs.insert_one(activity)
            return True
        except Exception as e:
            logger.error(f"Error logging activity: {str(e)}")
            return False

    async def get_recent_activities(self, limit: int = 50) -> List[Dict]:
        """Get recent activities"""
        try:
            activities = await self.db.activity_logs.find().sort("timestamp", DESCENDING).limit(limit).to_list(limit)
            return activities or []
        except Exception as e:
            logger.error(f"Error getting recent activities: {str(e)}")
            return []

    async def get_user_activities(self, user_id: str, limit: int = 20) -> List[Dict]:
        """Get user's activities"""
        try:
            activities = await self.db.activity_logs.find({"userId": user_id}).sort("timestamp", DESCENDING).limit(limit).to_list(limit)
            return activities or []
        except Exception as e:
            logger.error(f"Error getting user activities: {str(e)}")
            return []

    # ===== Metrics =====
    async def get_total_users_count(self) -> int:
        """Get total number of users"""
        try:
            return await self.db.users.count_documents({})
        except Exception as e:
            logger.error(f"Error getting user count: {str(e)}")
            return 0

    async def get_users_by_role(self) -> Dict[str, int]:
        """Get user count by role"""
        try:
            result = await self.db.users.aggregate([
                {"$group": {"_id": "$role", "count": {"$sum": 1}}}
            ]).to_list(None)

            counts = {"free": 0, "premium": 0, "admin": 0}
            for item in result:
                counts[item["_id"]] = item["count"]
            return counts
        except Exception as e:
            logger.error(f"Error getting users by role: {str(e)}")
            return {"free": 0, "premium": 0, "admin": 0}

    async def get_top_users(self, limit: int = 10) -> List[Dict]:
        """Get top active users"""
        try:
            users = await self.db.users.find().sort("simulationsCount", DESCENDING).limit(limit).to_list(limit)
            result = []
            for user in users:
                result.append({
                    "username": user.get("username"),
                    "email": user.get("email"),
                    "activityCount": user.get("simulationsCount", 0) + user.get("networksCount", 0) + user.get("trainingsCount", 0),
                    "role": user.get("role", "free")
                })
            return result
        except Exception as e:
            logger.error(f"Error getting top users: {str(e)}")
            return []

    async def get_daily_stats(self) -> Dict[str, int]:
        """Get daily statistics"""
        try:
            today = datetime.utcnow().date()
            start_of_day = datetime.combine(today, datetime.min.time())

            activities_today = await self.db.activity_logs.find({
                "timestamp": {"$gte": start_of_day}
            }).to_list(None)

            stats = {
                "networksToday": sum(1 for a in activities_today if a.get("type") == "network_created"),
                "trainingsToday": sum(1 for a in activities_today if a.get("type") == "training_started"),
                "simulationsToday": sum(1 for a in activities_today if a.get("type") == "simulation_run"),
                "newUsersToday": sum(1 for a in activities_today if a.get("type") == "user_signup")
            }
            return stats
        except Exception as e:
            logger.error(f"Error getting daily stats: {str(e)}")
            return {
                "networksToday": 0,
                "trainingsToday": 0,
                "simulationsToday": 0,
                "newUsersToday": 0
            }
