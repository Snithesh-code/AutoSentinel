# AutoSentinel - Role-Based Quota System Implementation Summary

## Overview

This document summarizes the complete implementation of the role-based quota system, user profile management, and admin dashboard for the AutoSentinel network security simulation platform.

---

## Completed Features

### 1. Role-Based User System

**User Roles:**
- **Free User**: 5 networks/day, 1 training/day, 100 simulations/day
- **Premium User**: 10 networks/day, 5 trainings/day, 500 simulations/day
- **Admin User**: Unlimited for all resources

**Frontend Components:**
- User Profile Page (`UserProfile.jsx`)
  - Overview tab: Shows user statistics (networks, trainings, simulations, last active)
  - Quota tab: Progress bars for each resource with remaining count
  - Settings tab: Account information and logout option
  - Role badge with color-coded styling

- Admin Dashboard (`AdminDashboard.jsx`)
  - Overview tab: System metrics and health indicators
  - Users tab: User statistics by role and top active users
  - Activities tab: Recent activity timeline and performance metrics
  - Real-time refresh every 5 seconds
  - Admin-only access control

### 2. Backend API Implementation

**New Backend Services:**

1. **Database Service** (`services/db_service.py`)
   - MongoDB connection management
   - User CRUD operations
   - Quota status tracking
   - Activity logging
   - Metrics collection
   - Daily usage reset logic

2. **Middleware** (`middleware.py`)
   - JWT token authentication
   - User extraction from bearer tokens
   - Quota checking utilities
   - Activity logging helpers

3. **Models** (`models.py`)
   - User model with quota tracking
   - QuotaUsage model for daily tracking
   - ActivityLog model for metrics
   - Enum definitions for roles and request/response schemas

**New Backend Endpoints:**

#### User Endpoints
- `GET /api/users/profile` - Get current user's profile
  - Returns: username, email, role, usage, counts, dates

#### Quota Endpoints
- `GET /api/quota/check/{resource}` - Check remaining quota
  - Returns: available, used, remaining, resetTime
- `POST /api/quota/increment` - Increment usage after action
  - Body: `{ "resource": "network|training|simulation" }`
  - Returns: newUsage, remaining

#### Admin Endpoints
- `GET /api/admin/metrics` - Get system-wide metrics (admin only)
  - Returns: totalUsers, activeCount, dailyStats, topUsers, recentActivities, systemHealth

#### XAI Endpoints (Updated)
- `POST /xai/explain-action` - Get AI explanation for actions
  - Uses Gemini API for explanations
  - Includes caching for repeated requests

### 3. Frontend Integration

**Updated Files:**

1. **Frontend API Client** (`frontend/src/utils/api.js`)
   - Added `userAPI` for user profile
   - Added `quotaAPI` for quota checking
   - Added `adminAPI` for admin metrics
   - Added `xaiAPI` for XAI explanations
   - Axios interceptors for authentication

2. **User Profile Page** (`frontend/src/pages/UserProfile.jsx`)
   - Connected to `userAPI.getProfile()`
   - Dynamic role-based UI
   - Real-time quota visualization
   - Upgrade prompts for free users

3. **Admin Dashboard** (`frontend/src/pages/AdminDashboard.jsx`)
   - Connected to `adminAPI.getMetrics()`
   - Real-time metrics refresh
   - Role-based access control

4. **Events Panel** (`frontend/src/components/EventsPanel.jsx`)
   - Updated to use `xaiAPI.explainAction()`
   - Proper error handling
   - Explanation caching

5. **Navbar** (`frontend/src/components/Navbar.jsx`)
   - Profile button for all authenticated users
   - Admin link visible only to admins (red styling)
   - Conditional navigation based on role

---

## Database Schema

### User Collection
```javascript
{
  _id: ObjectId,
  username: String (unique),
  email: String (unique),
  password: String (hashed),
  role: String (free|premium|admin),
  googleId: String (optional),
  createdAt: Date,
  updatedAt: Date,
  lastLogin: Date,
  isEmailVerified: Boolean,
  verificationToken: String (optional),
  resetPasswordToken: String (optional),
  networksCount: Number,
  trainingsCount: Number,
  simulationsCount: Number,
  usage: {
    networks: Number,
    trainings: Number,
    simulations: Number
  },
  usageResetTime: Date
}
```

### Activity Log Collection
```javascript
{
  _id: ObjectId,
  userId: ObjectId,
  type: String (user_signup|network_created|training_started|simulation_run|user_login),
  description: String,
  metadata: Object (optional),
  timestamp: Date
}
```

---

## Configuration

### Backend Requirements (`backend/python/requirements.txt`)
- FastAPI 0.109.0
- Uvicorn 0.27.0
- Motor 3.3.2 (async MongoDB driver)
- PyMongo 4.6.0
- PyJWT 2.8.1
- python-dotenv 1.0.0
- httpx 0.25.2
- bcrypt 4.1.1

### Environment Variables (`.env`)
```env
# MongoDB Configuration
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/autosentinel

# JWT Configuration (optional, if using JWT tokens)
JWT_SECRET=your-secret-key-here

# Google Gemini API
GEMINI_API_KEY=your-gemini-api-key
```

### Frontend Environment Variables (`.env`)
```env
VITE_API_URL=http://localhost:5000
```

---

## Implementation Details

### Daily Quota Reset

The system automatically resets daily quotas at UTC midnight. Each user has a `usageResetTime` field that tracks when their quota should reset. When checking quota status:

1. Current time is compared against `usageResetTime`
2. If current time >= `usageResetTime`, usage is reset and `usageResetTime` is updated to next day
3. Otherwise, current usage is returned

### Token Authentication

The system supports JWT token authentication. Tokens are decoded using PyJWT with the following claims:
- `sub` or `user_id`: User ID
- `email`: User email
- `role`: User role (free|premium|admin)

Fallback support for mock tokens in format `user:{user_id}` for testing.

### Metrics Collection

Activity logging is integrated throughout the system. Every action (network creation, training start, simulation run, etc.) logs an activity with:
- User ID
- Activity type
- Description
- Optional metadata
- Timestamp

The admin metrics endpoint aggregates these logs to provide real-time system statistics.

---

## API Response Examples

### Get User Profile
```bash
curl -X GET http://localhost:5000/api/users/profile \
  -H "Authorization: Bearer {token}"
```

Response:
```json
{
  "username": "john_doe",
  "email": "john@example.com",
  "role": "free",
  "usage": {
    "networks": 2,
    "trainings": 0,
    "simulations": 45
  },
  "networksCount": 5,
  "trainingsCount": 2,
  "simulationsCount": 87,
  "createdAt": "2024-01-15T10:30:00",
  "lastLogin": "2024-01-20T14:25:00"
}
```

### Check Quota
```bash
curl -X GET http://localhost:5000/api/quota/check/network \
  -H "Authorization: Bearer {token}"
```

Response:
```json
{
  "available": 5,
  "used": 2,
  "remaining": 3,
  "resetTime": "2024-01-21T00:00:00"
}
```

### Increment Quota
```bash
curl -X POST http://localhost:5000/api/quota/increment \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{"resource": "simulation"}'
```

Response:
```json
{
  "success": true,
  "newUsage": 46,
  "remaining": 54
}
```

### Get Admin Metrics
```bash
curl -X GET http://localhost:5000/api/admin/metrics \
  -H "Authorization: Bearer {admin_token}"
```

Response:
```json
{
  "totalUsers": 1250,
  "usersOnline": 45,
  "activeTrainings": 8,
  "activeSimulations": 12,
  "totalNetworks": 3456,
  "trainingsToday": 89,
  "simulationsToday": 234,
  "networksToday": 23,
  "newUsersToday": 5,
  "usersByRole": {
    "free": 980,
    "premium": 250,
    "admin": 20
  },
  "topUsers": [...],
  "recentActivities": [...],
  "uptime": "99.9%",
  "avgResponseTime": "45ms",
  "apiRequestsPerMin": 1234,
  "errorRate": "0.1%",
  "cacheHitRate": "89%"
}
```

---

## Setup Instructions

### 1. Install Backend Dependencies
```bash
cd backend/python
pip install -r requirements.txt
```

### 2. Configure MongoDB

1. Create a MongoDB Atlas account at https://www.mongodb.com/cloud/atlas
2. Create a new cluster
3. Set up network access (whitelist your IP)
4. Create a database user
5. Get the connection string in format:
   ```
   mongodb+srv://username:password@cluster-name.mongodb.net/database-name?retryWrites=true&w=majority
   ```
6. Add to `.env`:
   ```env
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/autosentinel
   ```

### 3. Start Backend Server
```bash
cd backend/python
python main.py
```

The server will:
- Start on `http://localhost:8000`
- Attempt to connect to MongoDB
- Load ML models in background
- Create database indexes

### 4. Frontend is Already Configured
The frontend will automatically use the new API endpoints. No additional setup needed.

---

## Testing the System

### Test User Profile
```bash
# Get profile
curl -X GET http://localhost:5000/api/users/profile \
  -H "Authorization: Bearer {token}"
```

### Test Quota System
```bash
# Check quota before action
curl -X GET http://localhost:5000/api/quota/check/simulation \
  -H "Authorization: Bearer {token}"

# Run simulation (in frontend)
# ... after running simulation ...

# Check quota after action
curl -X GET http://localhost:5000/api/quota/check/simulation \
  -H "Authorization: Bearer {token}"
```

### Test Admin Dashboard
```bash
# Login as admin user
# Navigate to /admin in frontend
# Verify metrics are displayed and refresh every 5 seconds
```

---

## Error Handling

### Common Error Responses

**401 Unauthorized**
```json
{
  "detail": "Unauthorized"
}
```
- Missing or invalid token

**404 Not Found**
```json
{
  "detail": "User not found"
}
```
- User doesn't exist in database

**429 Too Many Requests / Quota Exceeded**
```json
{
  "detail": {
    "error": "You have reached your simulation limit for today",
    "remaining": 0,
    "resetTime": "2024-01-21T00:00:00"
  }
}
```
- User quota limit exceeded for the day

**500 Internal Server Error**
```json
{
  "detail": "Internal server error"
}
```
- Server-side error

---

## Files Modified/Created

### Backend Files Created
- `backend/python/models.py` - Data models and schemas
- `backend/python/services/db_service.py` - MongoDB service
- `backend/python/middleware.py` - Authentication and quota middleware
- `backend/API_DOCUMENTATION.md` - Comprehensive API docs
- `backend/python/.env` - Environment configuration (updated with MONGODB_URI)
- `backend/python/requirements.txt` - Dependencies (updated)

### Backend Files Modified
- `backend/python/main.py` - Added new endpoints and database integration

### Frontend Files Modified
- `frontend/src/utils/api.js` - Added new API services
- `frontend/src/pages/UserProfile.jsx` - Connected to backend API
- `frontend/src/pages/AdminDashboard.jsx` - Connected to backend API
- `frontend/src/components/EventsPanel.jsx` - Updated XAI API calls
- `frontend/src/components/Navbar.jsx` - Already had proper role-based navigation

---

## Future Enhancements

1. **Real-time Metrics**
   - WebSocket support for live user tracking
   - Real-time online user count
   - Live active training/simulation counts

2. **Email Notifications**
   - Quota warning emails
   - Achievement notifications
   - Activity summaries

3. **Advanced Analytics**
   - User behavior analytics
   - Performance trends
   - Network health reports

4. **Upgrade System**
   - Payment integration
   - Automatic role upgrades
   - Subscription management

5. **Performance Optimizations**
   - Redis caching for metrics
   - Database query optimization
   - API response compression

6. **Security Enhancements**
   - Rate limiting
   - IP whitelisting for admin endpoints
   - Audit logging with encryption

---

## Support & Documentation

- **API Documentation**: See `backend/API_DOCUMENTATION.md`
- **Setup Instructions**: See `SETUP_INSTRUCTIONS.md`
- **Architecture**: See this summary document

For issues or questions, refer to the inline code comments and docstrings throughout the codebase.

---

**Implementation Status**: ✅ COMPLETE
**Last Updated**: November 2024
**Version**: 2.0.0
