# AutoSentinel - Setup Instructions

## Environment Configuration

### Backend (.env)

Create a `.env` file in the backend directory with the following variables:

```env
# MongoDB Configuration
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/autosentinel

# API Configuration
API_PORT=5000
API_HOST=localhost
NODE_ENV=production

# JWT Configuration
JWT_SECRET=your-secret-key-here
JWT_EXPIRE=7d

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_CALLBACK_URL=http://localhost:5173/auth/google/callback

# Gemini API (for XAI)
GEMINI_API_KEY=your-gemini-api-key

# Email Configuration (Optional)
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password

# Redis Configuration (Optional, for caching)
REDIS_URL=redis://localhost:6379

# Frontend URL
FRONTEND_URL=http://localhost:5173
```

### Frontend (.env)

Create a `.env` file in the frontend directory:

```env
VITE_API_URL=http://localhost:5000
```

## User Roles & Quotas

### Free User
- **Networks per day**: 5
- **Trainings per day**: 1
- **Simulations per day**: 100
- **Features**: Basic network design, single training session, simulation running

### Premium User
- **Networks per day**: 10
- **Trainings per day**: 5
- **Simulations per day**: 500
- **Features**: All free features + advanced analytics, priority support, custom configurations

### Admin User
- **Networks per day**: Unlimited
- **Trainings per day**: Unlimited
- **Simulations per day**: Unlimited
- **Features**: Full system access, user management, metrics dashboard, system configuration

## Backend API Endpoints

### User Endpoints

#### Get User Profile
```
GET /api/users/profile
Headers: Authorization: Bearer <token>
Response:
{
  "username": "string",
  "email": "string",
  "role": "free|premium|admin",
  "usage": {
    "networks": 3,
    "trainings": 0,
    "simulations": 45
  },
  "createdAt": "ISO8601",
  "lastLogin": "ISO8601",
  "networksCount": 5,
  "trainingsCount": 2,
  "simulationsCount": 87
}
```

### Quota Management Endpoints

#### Check Quota
```
GET /api/quota/check/:resource
Params:
  - resource: network|training|simulation

Response:
{
  "available": 5,
  "used": 3,
  "remaining": 2,
  "resetTime": "ISO8601"
}
```

#### Increment Usage
```
POST /api/quota/increment
Body:
{
  "resource": "network|training|simulation"
}

Response:
{
  "success": true,
  "newUsage": 4,
  "remaining": 1
}
```

### Admin Endpoints

#### Get Metrics
```
GET /api/admin/metrics
Headers: Authorization: Bearer <admin-token>

Response:
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
      "timestamp": "ISO8601",
      "userId": "userid"
    }
  ],
  "uptime": "99.9%",
  "avgResponseTime": "45ms",
  "apiRequestsPerMin": 1234,
  "errorRate": "0.1%",
  "cacheHitRate": "89%"
}
```

## Frontend Pages

### User Profile Page
- **Route**: `/profile`
- **Features**:
  - User overview (networks, trainings, simulations)
  - Usage & quota visualization
  - Account settings
  - Logout option

### Admin Dashboard
- **Route**: `/admin` (admin only)
- **Tabs**:
  1. **Overview**: Key metrics, system health, activity summary
  2. **Users**: User statistics by role, top active users
  3. **Activities**: Recent activities timeline, daily statistics, performance metrics

## Database Schema Updates

### User Model
```javascript
{
  _id: ObjectId,
  username: String,
  email: String,
  password: String (hashed),
  role: String (free|premium|admin), // default: free
  googleId: String (optional),
  createdAt: Date,
  updatedAt: Date,
  lastLogin: Date,
  isEmailVerified: Boolean,
  verificationToken: String (optional),
  resetPasswordToken: String (optional),
  networksCount: Number, // total networks created
  trainingsCount: Number, // total trainings
  simulationsCount: Number, // total simulations
  usage: {
    networks: Number, // today
    trainings: Number, // today
    simulations: Number, // today
  },
  usageResetTime: Date // when daily quota resets
}
```

### Quota Usage Model
```javascript
{
  _id: ObjectId,
  userId: ObjectId,
  date: Date,
  resources: {
    networks: Number,
    trainings: Number,
    simulations: Number
  },
  createdAt: Date
}
```

### Activity Log Model
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

## Middleware Implementation

### Quota Checking Middleware
```javascript
async function checkQuota(req, res, next) {
  const userId = req.user._id;
  const resource = req.body.resource; // network|training|simulation

  // Get user role
  const user = await User.findById(userId);

  // Get quota limits based on role
  const quotas = {
    free: { networks: 5, trainings: 1, simulations: 100 },
    premium: { networks: 10, trainings: 5, simulations: 500 },
    admin: { networks: Infinity, trainings: Infinity, simulations: Infinity }
  };

  const limit = quotas[user.role][resource];
  const usage = user.usage[resource] || 0;

  if (usage >= limit) {
    return res.status(429).json({
      success: false,
      error: `You have reached your ${resource} limit for today`,
      remaining: 0
    });
  }

  next();
}
```

## Metrics Collection

The system automatically tracks:
- User sign-ups
- Network creations
- Training sessions started
- Simulations executed
- User logins
- API request counts
- Response times
- Error rates
- Cache hit rates

## MongoDB Atlas Setup

1. Go to https://www.mongodb.com/cloud/atlas
2. Create a new cluster
3. Set up network access (whitelist your IPs)
4. Create a database user
5. Get the connection string
6. Add to `.env` as `MONGODB_URI`

**Connection String Format**:
```
mongodb+srv://username:password@cluster-name.mongodb.net/database-name?retryWrites=true&w=majority
```

## Getting Started

1. **Clone the repository**:
   ```bash
   git clone <repo-url>
   cd autov2
   ```

2. **Install dependencies**:
   ```bash
   # Backend
   cd backend && pip install -r requirements.txt

   # Frontend
   cd ../frontend && npm install
   ```

3. **Set up environment variables**:
   - Create `.env` files in both backend and frontend directories
   - Fill in the required values (see above)

4. **Start MongoDB**:
   - Use MongoDB Atlas or local MongoDB instance

5. **Start the backend**:
   ```bash
   cd backend/python
   python main.py
   ```

6. **Start the frontend**:
   ```bash
   cd frontend
   npm run dev
   ```

7. **Access the application**:
   - Frontend: http://localhost:5173
   - API: http://localhost:5000

## Testing

### Create Test Admin User
```bash
curl -X POST http://localhost:5000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "email": "admin@example.com",
    "password": "password123"
  }'

# Then manually update the user role in MongoDB:
# db.users.updateOne({ email: "admin@example.com" }, { $set: { role: "admin" } })
```

### Test Quota API
```bash
curl -X GET http://localhost:5000/api/quota/check/network \
  -H "Authorization: Bearer <token>"
```

### Test Admin Metrics
```bash
curl -X GET http://localhost:5000/api/admin/metrics \
  -H "Authorization: Bearer <admin-token>"
```

## Support & Documentation

For more information, please refer to:
- Code comments in the source files
- Individual component documentation
- API endpoint comments in backend files

---

**Last Updated**: 2024
**Version**: 2.0.0
