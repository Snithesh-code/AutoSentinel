# AutoSentinel Backend API Documentation

## Overview

The AutoSentinel backend provides REST APIs for authentication, quota management, user profiles, admin metrics, and AI explanations.

## Base URL

```
http://localhost:8000 (development)
https://api.autosentinel.com (production)
```

## Authentication

All protected endpoints require a Bearer token in the Authorization header:

```
Authorization: Bearer {token}
```

Tokens should be in the format: `user:{user_id}`

Example:
```
Authorization: Bearer user:507f1f77bcf86cd799439011
```

---

## User Endpoints

### Get User Profile

Retrieve the authenticated user's profile information.

**Endpoint:**
```
GET /api/users/profile
```

**Headers:**
```
Authorization: Bearer {token}
Content-Type: application/json
```

**Response (200):**
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

**Response (401):**
```json
{
  "detail": "Unauthorized"
}
```

**Response (404):**
```json
{
  "detail": "User not found"
}
```

---

## Quota Endpoints

### Check Quota

Check the user's remaining quota for a specific resource.

**Endpoint:**
```
GET /api/quota/check/{resource}
```

**Path Parameters:**
- `resource` (string): One of `network`, `training`, or `simulation`

**Headers:**
```
Authorization: Bearer {token}
Content-Type: application/json
```

**Example Request:**
```bash
curl -X GET http://localhost:8000/api/quota/check/network \
  -H "Authorization: Bearer user:507f1f77bcf86cd799439011"
```

**Response (200):**
```json
{
  "available": 5,
  "used": 2,
  "remaining": 3,
  "resetTime": "2024-01-21T00:00:00"
}
```

**Response (400):**
```json
{
  "detail": "Invalid resource"
}
```

**Response (401):**
```json
{
  "detail": "Unauthorized"
}
```

---

### Increment Quota Usage

Increment the user's usage for a resource (called after creating a network, starting training, or running simulation).

**Endpoint:**
```
POST /api/quota/increment
```

**Headers:**
```
Authorization: Bearer {token}
Content-Type: application/json
```

**Request Body:**
```json
{
  "resource": "simulation"
}
```

**Example Request:**
```bash
curl -X POST http://localhost:8000/api/quota/increment \
  -H "Authorization: Bearer user:507f1f77bcf86cd799439011" \
  -H "Content-Type: application/json" \
  -d '{"resource": "simulation"}'
```

**Response (200):**
```json
{
  "success": true,
  "newUsage": 46,
  "remaining": 54
}
```

**Response (400):**
```json
{
  "detail": "Invalid resource"
}
```

**Response (401):**
```json
{
  "detail": "Unauthorized"
}
```

**Response (429):** (Quota exceeded)
```json
{
  "detail": {
    "error": "You have reached your simulation limit for today",
    "remaining": 0,
    "resetTime": "2024-01-21T00:00:00"
  }
}
```

---

## Admin Endpoints

### Get System Metrics

Retrieve system-wide metrics and statistics. **Admin-only endpoint.**

**Endpoint:**
```
GET /api/admin/metrics
```

**Headers:**
```
Authorization: Bearer {admin_token}
Content-Type: application/json
```

**Response (200):**
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
  "topUsers": [
    {
      "username": "user1",
      "email": "user1@example.com",
      "activityCount": 156,
      "role": "premium"
    }
  ],
  "recentActivities": [
    {
      "type": "network_created",
      "description": "User created network: MyNetwork",
      "timestamp": "2024-01-20T14:25:00",
      "userId": "507f1f77bcf86cd799439011"
    }
  ],
  "uptime": "99.9%",
  "avgResponseTime": "45ms",
  "apiRequestsPerMin": 1234,
  "errorRate": "0.1%",
  "cacheHitRate": "89%"
}
```

**Response (401):**
```json
{
  "detail": "Unauthorized"
}
```

---

## XAI (Explainable AI) Endpoints

### Get Action Explanation

Get an AI-generated explanation for an action using the Gemini API.

**Endpoint:**
```
POST /xai/explain-action
```

**Headers:**
```
Content-Type: application/json
```

**Request Body:**
```json
{
  "action": "INFILTRATE_NODE",
  "agent_type": "attacker",
  "target": "web_server",
  "description": "Attempting to gain unauthorized access"
}
```

**Example Request:**
```bash
curl -X POST http://localhost:8000/xai/explain-action \
  -H "Content-Type: application/json" \
  -d '{
    "action": "INFILTRATE_NODE",
    "agent_type": "attacker",
    "target": "web_server"
  }'
```

**Response (200):**
```json
{
  "success": true,
  "action": "INFILTRATE_NODE",
  "explanation": "The attacker is attempting to exploit a known vulnerability in the web server to gain unauthorized access and establish a foothold in the network.",
  "cached": false
}
```

**Response (200) - Cached:**
```json
{
  "success": true,
  "action": "INFILTRATE_NODE",
  "explanation": "The attacker is attempting to exploit a known vulnerability in the web server to gain unauthorized access and establish a foothold in the network.",
  "cached": true
}
```

**Response (400):**
```json
{
  "success": false,
  "error": "Missing required fields",
  "explanation": "Unable to generate explanation"
}
```

---

## Quota Limits by User Role

### Free Users
- **Networks per day**: 5
- **Trainings per day**: 1
- **Simulations per day**: 100

### Premium Users
- **Networks per day**: 10
- **Trainings per day**: 5
- **Simulations per day**: 500

### Admin Users
- **Networks per day**: Unlimited
- **Trainings per day**: Unlimited
- **Simulations per day**: Unlimited

---

## Activity Types

The system tracks the following activity types in activity logs:

- `user_signup` - User created an account
- `network_created` - User created a network
- `training_started` - User started a training session
- `simulation_run` - User ran a simulation
- `user_login` - User logged in

---

## Error Handling

All endpoints follow standard HTTP status codes:

| Status Code | Meaning |
|-------------|---------|
| 200 | Success |
| 400 | Bad Request |
| 401 | Unauthorized |
| 404 | Not Found |
| 429 | Too Many Requests / Quota Exceeded |
| 500 | Internal Server Error |

---

## Rate Limiting

Currently, no rate limiting is enforced. Quota limits are based on user roles and reset daily at midnight UTC.

---

## Integration Examples

### JavaScript/React

```javascript
// Check quota before creating a network
const checkQuota = async (token, resource) => {
  const response = await fetch(`/api/quota/check/${resource}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  return response.json();
};

// Increment quota after creating a network
const incrementQuota = async (token, resource) => {
  const response = await fetch('/api/quota/increment', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ resource })
  });
  return response.json();
};

// Get user profile
const getUserProfile = async (token) => {
  const response = await fetch('/api/users/profile', {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  return response.json();
};

// Get admin metrics
const getAdminMetrics = async (adminToken) => {
  const response = await fetch('/api/admin/metrics', {
    headers: {
      'Authorization': `Bearer ${adminToken}`
    }
  });
  return response.json();
};

// Get action explanation
const getActionExplanation = async (action, agentType, target) => {
  const response = await fetch('/xai/explain-action', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      action,
      agent_type: agentType,
      target
    })
  });
  return response.json();
};
```

### Python

```python
import httpx
import asyncio

async def check_quota(token, resource):
    async with httpx.AsyncClient() as client:
        response = await client.get(
            f"http://localhost:8000/api/quota/check/{resource}",
            headers={"Authorization": f"Bearer {token}"}
        )
        return response.json()

async def increment_quota(token, resource):
    async with httpx.AsyncClient() as client:
        response = await client.post(
            "http://localhost:8000/api/quota/increment",
            headers={
                "Authorization": f"Bearer {token}",
                "Content-Type": "application/json"
            },
            json={"resource": resource}
        )
        return response.json()

async def get_user_profile(token):
    async with httpx.AsyncClient() as client:
        response = await client.get(
            "http://localhost:8000/api/users/profile",
            headers={"Authorization": f"Bearer {token}"}
        )
        return response.json()
```

---

## Setup Instructions

### Backend Setup

1. **Install dependencies:**
```bash
cd backend/python
pip install -r requirements.txt
```

2. **Configure environment variables:**
```bash
# Edit .env file
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/autosentinel
GEMINI_API_KEY=your-gemini-api-key
```

3. **Start the server:**
```bash
python main.py
```

The API will be available at `http://localhost:8000`

### Database Setup

1. Create a MongoDB Atlas account at https://www.mongodb.com/cloud/atlas
2. Create a new cluster
3. Set up network access and database user
4. Get your connection string and add it to `.env` as `MONGODB_URI`

---

## Database Models

### User Model
```javascript
{
  _id: ObjectId,
  username: String,
  email: String,
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

### Activity Log Model
```javascript
{
  _id: ObjectId,
  userId: ObjectId,
  type: String,
  description: String,
  metadata: Object (optional),
  timestamp: Date
}
```

---

## Future Enhancements

- Real-time user online tracking
- WebSocket support for live metrics
- Advanced analytics dashboard
- Custom quota configuration per user
- Email notifications for quota limits
- Activity audit logs with detailed filters
- Performance monitoring and optimization

---

**Last Updated:** January 2024
**Version:** 1.0.0
