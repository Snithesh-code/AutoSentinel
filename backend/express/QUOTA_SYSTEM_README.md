# AutoSentinel - Quota System Implementation (Express.js)

## Overview

The quota system has been fully implemented in the Node.js/Express backend with MongoDB. Users are now tracked by role (free, premium, admin) with daily usage limits.

---

## What Was Added

### 1. **Updated User Model** (`models/User.js`)

Added the following fields to the User schema:

```javascript
{
  role: {
    type: String,
    enum: ['free', 'premium', 'admin'],
    default: 'free'
  },
  networksCount: { type: Number, default: 0 },
  trainingsCount: { type: Number, default: 0 },
  simulationsCount: { type: Number, default: 0 },
  usage: {
    networks: { type: Number, default: 0 },
    trainings: { type: Number, default: 0 },
    simulations: { type: Number, default: 0 }
  },
  usageResetTime: {
    type: Date,
    default: function() {
      const tomorrow = new Date()
      tomorrow.setUTCHours(24, 0, 0, 0)
      return tomorrow
    }
  }
}
```

### 2. **New Quota Routes** (`routes/quota.js`)

Created comprehensive quota management endpoints:

#### Get User Profile with Stats
```
GET /api/users/profile
Authorization: Bearer {token}

Response:
{
  username: "john_doe",
  email: "john@example.com",
  role: "free",
  usage: { networks: 2, trainings: 0, simulations: 45 },
  networksCount: 5,
  trainingsCount: 2,
  simulationsCount: 87,
  createdAt: "2024-01-15T...",
  lastLogin: "2024-01-20T..."
}
```

#### Check Quota
```
GET /api/quota/check/{resource}
Authorization: Bearer {token}

Params:
- resource: "networks", "trainings", or "simulations"

Response:
{
  available: 5,
  used: 2,
  remaining: 3,
  resetTime: "2024-01-21T00:00:00Z"
}
```

#### Increment Usage
```
POST /api/quota/increment
Authorization: Bearer {token}
Content-Type: application/json

Body:
{ "resource": "simulations" }

Response:
{
  newUsage: 46,
  remaining: 54,
  message: "simulations usage incremented successfully"
}
```

#### Get Admin Metrics (Admin Only)
```
GET /api/admin/metrics
Authorization: Bearer {admin_token}

Response:
{
  totalUsers: 1250,
  usersOnline: 0,
  totalNetworks: 3456,
  usersByRole: { free: 980, premium: 250, admin: 20 },
  topUsers: [...],
  recentActivities: [],
  ...
}
```

### 3. **Updated Auth Routes** (`routes/auth.js`)

All authentication endpoints now return the `role` field:

- **Signup**: Returns `role: "free"` (default)
- **Login**: Returns user's assigned role
- **Verify Email**: Returns `role` in response
- **Get Me** (`/api/auth/me`): Returns `role` in user data
- **Google OAuth**: User created with `role: "free"` by default

### 4. **Routes Registration** (`server.js`)

Added quota routes to the Express server:

```javascript
import quotaRoutes from './routes/quota.js'

// Register routes
app.use('/api', quotaRoutes)  // Includes user/profile, quota/check, quota/increment, admin/metrics
```

---

## Quota Limits by Role

| Feature | Free | Premium | Admin |
|---------|------|---------|-------|
| Networks/day | 5 | 10 | ∞ |
| Trainings/day | 1 | 5 | ∞ |
| Simulations/day | 100 | 500 | ∞ |

---

## How the Quota System Works

### 1. **Daily Reset**

Each user has a `usageResetTime` field that defaults to tomorrow at 00:00 UTC.

When checking quota or incrementing usage:
- Current time is compared against `usageResetTime`
- If current time >= `usageResetTime`, usage is reset to 0
- `usageResetTime` is updated to the next day

### 2. **Usage Tracking**

Every time a user creates a network, starts training, or runs a simulation:
1. Check if quota exceeded → Return 429 error if exceeded
2. Increment `usage[resource]` by 1
3. Increment total count (e.g., `networksCount`)
4. Update `lastLogin` timestamp
5. Save user to database

### 3. **Role Assignment**

- **New users** get `role: "free"` by default
- **Google OAuth users** get `role: "free"` by default
- **Admin role** must be manually set in MongoDB or via admin panel (future feature)

---

## Database Structure

### User Document Example

```javascript
{
  _id: ObjectId("690b5949185f832c1828260f"),
  username: "john_doe",
  email: "john@example.com",
  password: "hashed_password",
  role: "free",  // ← QUOTA ROLE
  authProvider: "local",
  isVerified: true,

  // ← QUOTA FIELDS
  usage: {
    networks: 2,
    trainings: 0,
    simulations: 45
  },
  networksCount: 5,      // Total networks created
  trainingsCount: 2,     // Total trainings started
  simulationsCount: 87,  // Total simulations run
  usageResetTime: ISODate("2025-11-06T00:00:00Z"),  // Tomorrow at UTC midnight

  createdAt: ISODate("2025-11-05T14:03:53.434Z"),
  lastLogin: ISODate("2025-11-05T14:03:53.422Z"),
  updatedAt: ISODate("2025-11-05T14:03:53.434Z")
}
```

---

## How to Use the Quota System in Your Code

### Example 1: Before Creating a Network

```javascript
// Check if user has quota available
const quotaResponse = await fetch('/api/quota/check/networks', {
  headers: { 'Authorization': `Bearer ${token}` }
})
const quota = await quotaResponse.json()

if (quota.remaining > 0) {
  // Create network
  const networkResponse = await fetch('/api/networks', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` },
    body: JSON.stringify({ name: 'MyNetwork' })
  })

  // Increment quota after successful creation
  await fetch('/api/quota/increment', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` },
    body: JSON.stringify({ resource: 'networks' })
  })
} else {
  alert('You have reached your daily network limit')
}
```

### Example 2: Check User Role

```javascript
// Frontend - check role from localStorage
const user = JSON.parse(localStorage.getItem('user'))
if (user.role === 'admin') {
  // Show admin features
  showAdminPanel()
}
```

### Example 3: Backend - Verify Admin

```javascript
// In route handler
router.get('/admin/metrics', protect, async (req, res) => {
  const user = await User.findById(req.user.id)

  if (user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' })
  }

  // Return metrics...
})
```

---

## Updating Existing Users

### Option 1: MongoDB Atlas UI

1. Go to MongoDB Atlas > Collections > Users
2. Click on any user document
3. Add/edit these fields:

```javascript
{
  role: "free",  // or "premium" or "admin"
  usage: { networks: 0, trainings: 0, simulations: 0 },
  usageResetTime: new Date(Date.now() + 24*60*60*1000),
  networksCount: 0,
  trainingsCount: 0,
  simulationsCount: 0
}
```

### Option 2: MongoDB Shell

```javascript
// Update single user
db.users.updateOne(
  { email: "reddysnithesh66@gmail.com" },
  { $set: {
    role: "free",
    usage: { networks: 0, trainings: 0, simulations: 0 },
    usageResetTime: new Date(Date.now() + 24*60*60*1000),
    networksCount: 0,
    trainingsCount: 0,
    simulationsCount: 0
  }}
)

// Update all users without role
db.users.updateMany(
  { role: { $exists: false } },
  { $set: {
    role: "free",
    usage: { networks: 0, trainings: 0, simulations: 0 },
    usageResetTime: new Date(Date.now() + 24*60*60*1000),
    networksCount: 0,
    trainingsCount: 0,
    simulationsCount: 0
  }}
)
```

### Option 3: Node.js Script

Create `scripts/migrate-users.js`:

```javascript
import mongoose from 'mongoose'
import User from '../models/User.js'

await mongoose.connect(process.env.MONGODB_URI)

const tomorrow = new Date()
tomorrow.setUTCHours(24, 0, 0, 0)

const result = await User.updateMany(
  { role: { $exists: false } },
  { $set: {
    role: "free",
    usage: { networks: 0, trainings: 0, simulations: 0 },
    usageResetTime: tomorrow,
    networksCount: 0,
    trainingsCount: 0,
    simulationsCount: 0
  }}
)

console.log(`Updated ${result.modifiedCount} users`)
process.exit(0)
```

Run with:
```bash
node scripts/migrate-users.js
```

---

## Testing the Quota System

### Test 1: Create User and Check Profile

```bash
# Signup
curl -X POST http://localhost:5000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","email":"test@example.com","password":"password123"}'

# Expected response includes: role: "free"

# Login and get token
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'

# Copy token from response
TOKEN="..."

# Get profile
curl -X GET http://localhost:5000/api/users/profile \
  -H "Authorization: Bearer $TOKEN"
```

### Test 2: Check and Increment Quota

```bash
# Check initial quota
curl -X GET http://localhost:5000/api/quota/check/simulations \
  -H "Authorization: Bearer $TOKEN"
# Should return: available: 100, used: 0, remaining: 100

# Increment 5 times
for i in {1..5}; do
  curl -X POST http://localhost:5000/api/quota/increment \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"resource":"simulations"}'
done

# Check quota again
curl -X GET http://localhost:5000/api/quota/check/simulations \
  -H "Authorization: Bearer $TOKEN"
# Should return: available: 100, used: 5, remaining: 95
```

### Test 3: Exceed Quota (Free User)

```bash
# Run simulations 100 times to reach limit
for i in {1..100}; do
  curl -X POST http://localhost:5000/api/quota/increment \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"resource":"simulations"}'
done

# Try one more - should fail
curl -X POST http://localhost:5000/api/quota/increment \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"resource":"simulations"}'
# Should return 429: "You have reached your simulations limit for today"
```

---

## Integration with Frontend

The frontend (`api.js`) should have these API methods:

```javascript
export const quotaAPI = {
  check: async (resource) => {
    return api.get(`/quota/check/${resource}`)
  },
  increment: async (resource) => {
    return api.post('/quota/increment', { resource })
  }
}

export const userAPI = {
  getProfile: async () => {
    return api.get('/users/profile')
  }
}

export const adminAPI = {
  getMetrics: async () => {
    return api.get('/admin/metrics')
  }
}
```

---

## Next Steps

1. **Update existing MongoDB documents** with role and quota fields
2. **Test the quota system** with the curl examples above
3. **Connect frontend to backend** using the API methods
4. **Monitor quotas** in the user profile page
5. **Create admin panel** to manage user roles

---

## Troubleshooting

### "role field is missing"
- Run the migration script to add role to all users
- Or manually update in MongoDB Atlas

### "Quota not resetting at midnight"
- Make sure `usageResetTime` is set correctly
- Check server timezone (should use UTC)
- Manually update: `usageResetTime: new Date()` to tomorrow at 00:00 UTC

### "401 Unauthorized on quota endpoints"
- Check if token is being sent in Authorization header
- Verify token is still valid (not expired)
- Make sure header format is: `Bearer {token}`

### "Users created before don't have role"
- Update them manually in MongoDB or run migration script
- New users will automatically get `role: "free"`

---

**Status**: ✅ COMPLETE - Ready to use!
**Last Updated**: November 2024
