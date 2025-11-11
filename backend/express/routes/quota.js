import express from 'express'
import axios from 'axios'
import User from '../models/User.js'
import { protect } from '../middleware/auth.js'

const router = express.Router()
const PYTHON_API_URL = process.env.PYTHON_API_URL || 'http://localhost:8000'

// Quota limits by role
const QUOTA_LIMITS = {
  free: {
    networks: 5,
    trainings: 1,
    simulations: 100
  },
  premium: {
    networks: 10,
    trainings: 5,
    simulations: 500
  },
  admin: {
    networks: Infinity,
    trainings: Infinity,
    simulations: Infinity
  }
}

// Helper function to check if usage should be reset
const shouldResetUsage = (user) => {
  const now = new Date()
  return now >= user.usageResetTime
}

// Helper function to reset daily usage
const resetUsage = (user) => {
  user.usage = {
    networks: 0,
    trainings: 0,
    simulations: 0
  }
  const tomorrow = new Date()
  tomorrow.setUTCHours(24, 0, 0, 0)
  user.usageResetTime = tomorrow
  return user
}

// @route   GET /api/users/profile
// @desc    Get current user's profile with usage stats
// @access  Private
router.get('/users/profile', protect, async (req, res) => {
  try {
    let user = await User.findById(req.user.id)

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      })
    }

    // Check if usage should be reset
    if (shouldResetUsage(user)) {
      user = resetUsage(user)
      await user.save()
    }

    res.json({
      username: user.username,
      email: user.email,
      role: user.role,
      usage: user.usage,
      networksCount: user.networksCount,
      trainingsCount: user.trainingsCount,
      simulationsCount: user.simulationsCount,
      createdAt: user.createdAt,
      lastLogin: user.lastLogin
    })
  } catch (error) {
    console.error('Error fetching profile:', error)
    res.status(500).json({
      success: false,
      error: 'Error fetching profile'
    })
  }
})

// @route   GET /api/quota/check/:resource
// @desc    Check quota remaining for a resource
// @access  Private
router.get('/quota/check/:resource', protect, async (req, res) => {
  try {
    const { resource } = req.params

    // Validate resource
    if (!['networks', 'trainings', 'simulations'].includes(resource)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid resource. Must be networks, trainings, or simulations'
      })
    }

    let user = await User.findById(req.user.id)

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      })
    }

    // Check if usage should be reset
    if (shouldResetUsage(user)) {
      user = resetUsage(user)
      await user.save()
    }

    // Get quota limit for user's role
    const limit = QUOTA_LIMITS[user.role][resource]
    const used = user.usage[resource] || 0
    const remaining = Math.max(0, limit - used)

    res.json({
      available: limit === Infinity ? 'Unlimited' : limit,
      used,
      remaining: limit === Infinity ? 'Unlimited' : remaining,
      resetTime: user.usageResetTime
    })
  } catch (error) {
    console.error('Error checking quota:', error)
    res.status(500).json({
      success: false,
      error: 'Error checking quota'
    })
  }
})

// @route   POST /api/quota/increment
// @desc    Increment usage after action (network creation, training, simulation)
// @access  Private
router.post('/quota/increment', protect, async (req, res) => {
  try {
    const { resource } = req.body

    // Validate resource
    if (!['networks', 'trainings', 'simulations'].includes(resource)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid resource. Must be networks, trainings, or simulations'
      })
    }

    let user = await User.findById(req.user.id)

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      })
    }

    // Check if usage should be reset
    if (shouldResetUsage(user)) {
      user = resetUsage(user)
    }

    // Get quota limit
    const limit = QUOTA_LIMITS[user.role][resource]
    const currentUsage = user.usage[resource] || 0

    // Check if quota exceeded
    if (currentUsage >= limit) {
      return res.status(429).json({
        success: false,
        error: `You have reached your ${resource} limit for today`,
        remaining: 0,
        resetTime: user.usageResetTime
      })
    }

    // Increment usage
    user.usage[resource] = currentUsage + 1

    // Also increment total count
    const countField = `${resource.slice(0, -1)}Count` // Remove 's' for singular form
    user[countField] = (user[countField] || 0) + 1

    // Update last login
    user.lastLogin = new Date()

    // Save user
    await user.save()

    const newUsage = user.usage[resource]
    const remaining = Math.max(0, limit - newUsage)

    res.json({
      success: true,
      newUsage,
      remaining: limit === Infinity ? 'Unlimited' : remaining,
      message: `${resource} usage incremented successfully`
    })
  } catch (error) {
    console.error('Error incrementing quota:', error)
    res.status(500).json({
      success: false,
      error: 'Error incrementing quota'
    })
  }
})

// @route   GET /api/admin/metrics
// @desc    Get system metrics (admin only)
// @access  Private/Admin
router.get('/admin/metrics', protect, async (req, res) => {
  try {
    // Check if user is admin
    const user = await User.findById(req.user.id)
    if (!user || user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Only admins can access this endpoint'
      })
    }

    // Get all users
    const totalUsers = await User.countDocuments()

    // Get users by role
    const usersByRole = await User.aggregate([
      {
        $group: {
          _id: '$role',
          count: { $sum: 1 }
        }
      }
    ])

    const roleStats = {
      free: 0,
      premium: 0,
      admin: 0
    }

    usersByRole.forEach(stat => {
      roleStats[stat._id] = stat.count
    })

    // Get top users by activity
    const topUsers = await User.find()
      .select('_id username email networksCount trainingsCount simulationsCount role')
      .sort({ simulationsCount: -1 })
      .limit(10)
      .lean()

    const topUsersFormatted = topUsers.map(u => ({
      _id: u._id,
      username: u.username,
      email: u.email,
      activityCount: (u.networksCount || 0) + (u.trainingsCount || 0) + (u.simulationsCount || 0),
      role: u.role
    }))

    // Get aggregate stats
    const aggregateStats = await User.aggregate([
      {
        $group: {
          _id: null,
          totalNetworks: { $sum: '$networksCount' },
          totalTrainings: { $sum: '$trainingsCount' },
          totalSimulations: { $sum: '$simulationsCount' }
        }
      }
    ])

    const stats = aggregateStats[0] || {
      totalNetworks: 0,
      totalTrainings: 0,
      totalSimulations: 0
    }

    res.json({
      totalUsers,
      usersOnline: 0, // Would need real-time tracking
      activeTrainings: 0, // Would need real-time tracking
      activeSimulations: 0, // Would need real-time tracking
      totalNetworks: stats.totalNetworks,
      trainingsToday: 0, // Would need activity logs
      simulationsToday: 0, // Would need activity logs
      networksToday: 0, // Would need activity logs
      newUsersToday: 0, // Would need activity logs
      usersByRole: roleStats,
      topUsers: topUsersFormatted,
      recentActivities: [], // Would need activity logs collection
      uptime: '99.9%',
      avgResponseTime: '45ms',
      apiRequestsPerMin: 0,
      errorRate: '0%',
      cacheHitRate: '0%'
    })
  } catch (error) {
    console.error('Error fetching admin metrics:', error)
    res.status(500).json({
      success: false,
      error: 'Error fetching admin metrics'
    })
  }
})

// @route   PUT /api/admin/users/:userId/role
// @desc    Update a user's role (admin only)
// @access  Private/Admin
router.put('/admin/users/:userId/role', protect, async (req, res) => {
  try {
    // Check if user is admin
    const adminUser = await User.findById(req.user.id)
    if (!adminUser || adminUser.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Only admins can update user roles'
      })
    }

    const { userId } = req.params
    const { role } = req.body

    // Validate role
    const validRoles = ['free', 'premium', 'admin']
    if (!validRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid role. Must be one of: free, premium, admin'
      })
    }

    // Update user role
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { role },
      { new: true, runValidators: true }
    )

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      })
    }

    res.json({
      success: true,
      message: `User role updated to ${role}`,
      user: {
        id: updatedUser._id,
        username: updatedUser.username,
        email: updatedUser.email,
        role: updatedUser.role
      }
    })
  } catch (error) {
    console.error('Error updating user role:', error)
    res.status(500).json({
      success: false,
      error: 'Error updating user role'
    })
  }
})

// @route   POST /xai/explain-action
// @desc    Get XAI explanation from Python backend
// @access  Public
router.post('/xai/explain-action', async (req, res) => {
  try {
    const { action, agent_type, target, description } = req.body

    // Validate required fields
    if (!action || !agent_type) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: action and agent_type'
      })
    }

    console.log(`📡 Proxying XAI request to Python backend: ${action}`)

    // Call Python backend for XAI
    const response = await axios.post(
      `${PYTHON_API_URL}/xai/explain-action`,
      {
        action,
        agent_type,
        target,
        description
      },
      { timeout: 10000 } // 10 second timeout
    )

    console.log(`✅ XAI response received: ${response.data.explanation?.substring(0, 50)}...`)
    res.json(response.data)
  } catch (error) {
    console.error('❌ XAI Error:', error.message)

    if (error.code === 'ECONNREFUSED') {
      console.error('❌ Cannot connect to Python backend at:', PYTHON_API_URL)
    }

    res.status(500).json({
      success: false,
      error: 'Failed to load explanation',
      explanation: 'Unable to generate explanation',
      details: error.message
    })
  }
})

export default router
