# AutoSentinel Quick Start Guide

## 🚀 Get Started in 5 Minutes

### Prerequisites
- Python 3.8+
- Node.js 16+
- MongoDB Atlas account (free tier available)

---

## Step 1: Get MongoDB Connection String

1. Go to https://www.mongodb.com/cloud/atlas
2. Create a new cluster (free M0 tier is fine)
3. Wait for cluster to initialize (2-5 minutes)
4. Click "Connect" → "Connect your application"
5. Copy the connection string that looks like:
   ```
   mongodb+srv://username:password@cluster.mongodb.net/autosentinel?retryWrites=true&w=majority
   ```

---

## Step 2: Configure Backend

1. **Navigate to backend directory:**
   ```bash
   cd backend/python
   ```

2. **Update `.env` file with your MongoDB URI:**
   ```bash
   # Open .env in your editor and replace the placeholder with your actual MongoDB URI
   # Change from:
   # MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/autosentinel

   # To your actual connection string from MongoDB Atlas
   MONGODB_URI=mongodb+srv://your-username:your-password@your-cluster.mongodb.net/autosentinel
   ```

3. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

4. **Start the backend server:**
   ```bash
   python main.py
   ```

   You should see output like:
   ```
   🚀 AutoSentinel Python API starting...
   ⚡ Server ready! Loading services in background...
   🔄 Initializing database connection...
   ✅ Connected to MongoDB
   ✅ Database indexes created
   ✅ ML model loaded successfully
   ```

---

## Step 3: Start Frontend

1. **In a new terminal, navigate to frontend:**
   ```bash
   cd frontend
   ```

2. **Install dependencies (if not already done):**
   ```bash
   npm install
   ```

3. **Start the development server:**
   ```bash
   npm run dev
   ```

   You should see:
   ```
   VITE v... ready in ... ms
   ➜  Local:   http://localhost:5173/
   ```

---

## Step 4: Test the System

1. **Open browser:** http://localhost:5173
2. **Create an account** (Sign Up)
3. **Login** with your credentials
4. **Go to Profile** (click 👤 Profile in navbar)
   - You should see your quota limits
   - Networks: 5/day
   - Trainings: 1/day
   - Simulations: 100/day

5. **Go to Dashboard** and try creating a network, training, or simulation
6. **Check Profile again** - quotas should update

---

## Step 5: Admin Dashboard (Optional)

To see the admin dashboard:

1. **Create a test admin user**
   ```bash
   # In MongoDB Atlas, go to Collections > autosentinel > users
   # Find your user document and change role from "free" to "admin"
   ```

2. **Logout and login again**
3. **Click "Admin" link in navbar** (red button, only visible for admins)
4. **View real-time metrics:**
   - Total users
   - User statistics by role
   - Recent activities
   - System performance

---

## API Endpoints Quick Reference

### User Profile
```bash
curl -X GET http://localhost:8000/api/users/profile \
  -H "Authorization: Bearer {token}"
```

### Check Quota
```bash
curl -X GET http://localhost:8000/api/quota/check/simulation \
  -H "Authorization: Bearer {token}"
```

### Increment Quota (after action)
```bash
curl -X POST http://localhost:8000/api/quota/increment \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{"resource": "simulation"}'
```

### Admin Metrics
```bash
curl -X GET http://localhost:8000/api/admin/metrics \
  -H "Authorization: Bearer {admin_token}"
```

---

## Troubleshooting

### "MongoDB Connection Failed"
- Check your connection string in `.env`
- Make sure IP is whitelisted in MongoDB Atlas
- Verify database username/password are correct

### "API endpoints returning 404"
- Make sure backend is running on port 8000
- Check VITE_API_URL in frontend `.env`
- Verify CORS is enabled (it is in the code)

### "Quota not showing in profile"
- Database might not be connected yet
- Wait a few seconds for MongoDB to initialize
- Check backend console for connection errors
- Refresh the page

### "Admin dashboard shows mock data"
- Database connection is in progress
- Wait 10 seconds and refresh
- Check backend logs for "Database connected" message

---

## Project Structure

```
autov2/
├── backend/
│   └── python/
│       ├── main.py                 # FastAPI server
│       ├── models.py               # Data models
│       ├── middleware.py           # Auth & quota middleware
│       ├── services/
│       │   ├── db_service.py      # MongoDB service
│       │   ├── model_service.py   # ML models
│       │   └── simulation_service.py # Simulation logic
│       ├── requirements.txt        # Python dependencies
│       ├── .env                    # Configuration
│       └── v3.yaml                 # Simulation config
│
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── UserProfile.jsx    # Profile page
│   │   │   ├── AdminDashboard.jsx # Admin page
│   │   │   └── ...
│   │   ├── components/
│   │   │   ├── EventsPanel.jsx    # Events with XAI
│   │   │   ├── Navbar.jsx         # Navigation
│   │   │   └── ...
│   │   ├── utils/
│   │   │   └── api.js             # API client
│   │   └── contexts/
│   │       └── AuthContext.jsx    # Auth state
│   ├── package.json               # JS dependencies
│   └── .env                        # Frontend config
│
├── SETUP_INSTRUCTIONS.md           # Detailed setup
├── API_DOCUMENTATION.md            # API reference
├── IMPLEMENTATION_SUMMARY.md       # Technical summary
└── QUICKSTART.md                   # This file
```

---

## Key Features Implemented

✅ **Role-Based Quotas**
- Free: 5 networks, 1 training, 100 simulations per day
- Premium: 10 networks, 5 trainings, 500 simulations per day
- Admin: Unlimited access

✅ **User Profile Page**
- View usage statistics
- Check remaining quotas
- Account settings

✅ **Admin Dashboard**
- Real-time system metrics
- User statistics by role
- Recent activities timeline
- System health indicators

✅ **Quota Management**
- Automatic daily reset
- Real-time usage tracking
- Enforcement on resource creation

✅ **API Integration**
- User profile endpoint
- Quota checking endpoints
- Admin metrics endpoint
- XAI explanations endpoint

---

## Next Steps

1. **Upgrade Feature** (future): Add Stripe integration for premium upgrades
2. **Email Notifications** (future): Send quota warnings and achievements
3. **Analytics Dashboard** (future): Advanced user behavior analytics
4. **Performance Tuning** (future): Implement Redis caching

---

## Support

For detailed information, see:
- **API Docs**: `backend/API_DOCUMENTATION.md`
- **Setup Guide**: `SETUP_INSTRUCTIONS.md`
- **Technical Details**: `IMPLEMENTATION_SUMMARY.md`

---

**Ready to go!** 🎉

Questions? Check the documentation files or the code comments.
