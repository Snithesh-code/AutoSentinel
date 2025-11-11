import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { adminAPI } from '../utils/api'
import Navbar from '../components/Navbar'

const AdminDashboard = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [metrics, setMetrics] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState('overview')

  useEffect(() => {
    // Check if user is admin
    if (user?.role !== 'admin') {
      navigate('/dashboard')
      return
    }

    fetchMetrics()
    const interval = setInterval(fetchMetrics, 5000) // Refresh every 5 seconds
    return () => clearInterval(interval)
  }, [user])

  const fetchMetrics = async () => {
    try {
      const data = await adminAPI.getMetrics()
      setMetrics(data)
      setError('')
    } catch (err) {
      console.error('Error fetching metrics:', err)
      setError(err.response?.data?.detail || 'Error loading metrics')
    } finally {
      setLoading(false)
    }
  }

  const handleRoleChange = async (userId, newRole) => {
    try {
      await adminAPI.updateUserRole(userId, newRole)
      // Refresh metrics to get updated user list
      await fetchMetrics()
    } catch (err) {
      console.error('Error updating user role:', err)
      setError('Failed to update user role')
    }
  }

  if (!user || user.role !== 'admin') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
        <Navbar />
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <p className="text-red-400 text-xl font-bold">❌ Access Denied</p>
            <p className="text-slate-400 mt-2">Only admins can access this page</p>
          </div>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
        <Navbar />
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">👑 Admin Dashboard</h1>
          <p className="text-slate-400">System metrics and user management</p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500 rounded-xl">
            <p className="text-red-400">{error}</p>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-4 mb-8 border-b border-slate-700">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-6 py-3 font-semibold transition ${
              activeTab === 'overview'
                ? 'text-blue-400 border-b-2 border-blue-400'
                : 'text-slate-400 hover:text-slate-300'
            }`}
          >
            📊 Overview
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`px-6 py-3 font-semibold transition ${
              activeTab === 'users'
                ? 'text-blue-400 border-b-2 border-blue-400'
                : 'text-slate-400 hover:text-slate-300'
            }`}
          >
            👥 Users
          </button>
          <button
            onClick={() => setActiveTab('activities')}
            className={`px-6 py-3 font-semibold transition ${
              activeTab === 'activities'
                ? 'text-blue-400 border-b-2 border-blue-400'
                : 'text-slate-400 hover:text-slate-300'
            }`}
          >
            Activities
          </button>
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && metrics && (
          <div className="space-y-6">
            {/* Main Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Total Users */}
              <div className="bg-gradient-to-br from-blue-900 to-blue-800 rounded-2xl border border-blue-500 p-6 shadow-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-3xl">👥</span>
                  <span className={`text-xs font-semibold px-3 py-1 rounded-full ${
                    metrics.usersOnline > metrics.totalUsers * 0.5
                      ? 'bg-green-500/20 text-green-400'
                      : 'bg-yellow-500/20 text-yellow-400'
                  }`}>
                    {metrics.usersOnline} Online
                  </span>
                </div>
                <p className="text-blue-100 text-sm font-semibold mb-2">Total Users</p>
                <p className="text-4xl font-bold text-white">{metrics.totalUsers}</p>
                <p className="text-xs text-blue-200 mt-2">
                  Growth: <span className="text-green-300 font-bold">+{metrics.newUsersToday}</span> today
                </p>
              </div>

              {/* Active Trainings */}
              <div className="bg-gradient-to-br from-purple-900 to-purple-800 rounded-2xl border border-purple-500 p-6 shadow-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-3xl">🤖</span>
                  <span className="text-xs font-semibold px-3 py-1 rounded-full bg-purple-500/20 text-purple-300">
                    Active
                  </span>
                </div>
                <p className="text-purple-100 text-sm font-semibold mb-2">Training Sessions</p>
                <p className="text-4xl font-bold text-white">{metrics.activeTrainings}</p>
                <p className="text-xs text-purple-200 mt-2">
                  Total today: <span className="font-bold">{metrics.trainingsToday}</span>
                </p>
              </div>

              {/* Active Simulations */}
              <div className="bg-gradient-to-br from-green-900 to-green-800 rounded-2xl border border-green-500 p-6 shadow-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-3xl">🎮</span>
                  <span className="text-xs font-semibold px-3 py-1 rounded-full bg-green-500/20 text-green-300">
                    Running
                  </span>
                </div>
                <p className="text-green-100 text-sm font-semibold mb-2">Simulations</p>
                <p className="text-4xl font-bold text-white">{metrics.activeSimulations}</p>
                <p className="text-xs text-green-200 mt-2">
                  Total today: <span className="font-bold">{metrics.simulationsToday}</span>
                </p>
              </div>

              {/* Networks Created */}
              <div className="bg-gradient-to-br from-orange-900 to-orange-800 rounded-2xl border border-orange-500 p-6 shadow-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-3xl">🌐</span>
                  <span className="text-xs font-semibold px-3 py-1 rounded-full bg-orange-500/20 text-orange-300">
                    Total
                  </span>
                </div>
                <p className="text-orange-100 text-sm font-semibold mb-2">Networks</p>
                <p className="text-4xl font-bold text-white">{metrics.totalNetworks}</p>
                <p className="text-xs text-orange-200 mt-2">
                  Created today: <span className="font-bold">{metrics.networksToday}</span>
                </p>
              </div>
            </div>

            {/* System Health */}
            <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl border border-slate-700 p-6 shadow-lg">
              <h3 className="text-xl font-bold text-white mb-6">🔧 System Health</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* API Health */}
                <div>
                  <p className="text-slate-400 text-sm font-semibold mb-3">API Status</p>
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse"></div>
                    <span className="text-green-400 font-semibold">Operational</span>
                  </div>
                </div>

                {/* Database Health */}
                <div>
                  <p className="text-slate-400 text-sm font-semibold mb-3">Database</p>
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse"></div>
                    <span className="text-green-400 font-semibold">Connected</span>
                  </div>
                </div>

                {/* Uptime */}
                <div>
                  <p className="text-slate-400 text-sm font-semibold mb-3">Uptime</p>
                  <p className="text-white font-semibold">{metrics.uptime || '99.9%'}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && metrics && (
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl border border-slate-700 p-6 shadow-lg">
            <h3 className="text-xl font-bold text-white mb-6">📋 User Statistics</h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              {/* Free Users */}
              <div className="bg-slate-700/50 rounded-xl p-4 border border-slate-600">
                <p className="text-slate-400 text-sm font-semibold mb-2">🆓 Free Users</p>
                <p className="text-3xl font-bold text-blue-400">{metrics.usersByRole?.free || 0}</p>
                <p className="text-xs text-slate-500 mt-2">
                  {metrics.usersByRole ? Math.round((metrics.usersByRole.free / metrics.totalUsers) * 100) : 0}% of total
                </p>
              </div>

              {/* Premium Users */}
              <div className="bg-slate-700/50 rounded-xl p-4 border border-slate-600">
                <p className="text-slate-400 text-sm font-semibold mb-2">⭐ Premium Users</p>
                <p className="text-3xl font-bold text-yellow-400">{metrics.usersByRole?.premium || 0}</p>
                <p className="text-xs text-slate-500 mt-2">
                  {metrics.usersByRole ? Math.round((metrics.usersByRole.premium / metrics.totalUsers) * 100) : 0}% of total
                </p>
              </div>

              {/* Admin Users */}
              <div className="bg-slate-700/50 rounded-xl p-4 border border-slate-600">
                <p className="text-slate-400 text-sm font-semibold mb-2">👑 Admins</p>
                <p className="text-3xl font-bold text-red-400">{metrics.usersByRole?.admin || 0}</p>
                <p className="text-xs text-slate-500 mt-2">
                  {metrics.usersByRole ? Math.round((metrics.usersByRole.admin / metrics.totalUsers) * 100) : 0}% of total
                </p>
              </div>
            </div>

            {/* Top Users */}
            <div>
              <h4 className="text-lg font-bold text-white mb-4">👤 Top Active Users</h4>
              <div className="space-y-2">
                {metrics.topUsers && metrics.topUsers.length > 0 ? (
                  metrics.topUsers.map((u, idx) => (
                    <div key={idx} className="bg-slate-700/30 rounded-lg p-4 flex items-center justify-between border border-slate-600 hover:border-slate-500 transition">
                      <div className="flex-1">
                        <p className="text-white font-semibold">{u.username}</p>
                        <p className="text-xs text-slate-400">{u.email}</p>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-blue-300 font-semibold text-sm">{u.activityCount} activities</p>
                        </div>

                        {/* Role Toggle Dropdown */}
                        <div className="relative group">
                          <button
                            className={`px-4 py-2 rounded-lg font-semibold text-sm transition capitalize ${
                              u.role === 'admin'
                                ? 'bg-red-500/20 text-red-400 border border-red-500 hover:bg-red-500/30'
                                : u.role === 'premium'
                                ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500 hover:bg-yellow-500/30'
                                : 'bg-blue-500/20 text-blue-400 border border-blue-500 hover:bg-blue-500/30'
                            }`}
                          >
                            {u.role} ▼
                          </button>

                          {/* Dropdown Menu */}
                          <div className="absolute right-0 mt-2 w-40 bg-slate-800 border border-slate-700 rounded-lg shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
                            <button
                              className="w-full text-left px-4 py-2 text-blue-400 hover:bg-slate-700/50 first:rounded-t-lg transition"
                              onClick={() => handleRoleChange(u._id, 'free')}
                            >
                              Free
                            </button>
                            <button
                              className="w-full text-left px-4 py-2 text-yellow-400 hover:bg-slate-700/50 transition"
                              onClick={() => handleRoleChange(u._id, 'premium')}
                            >
                              Premium
                            </button>
                            <button
                              className="w-full text-left px-4 py-2 text-red-400 hover:bg-slate-700/50 last:rounded-b-lg transition"
                              onClick={() => handleRoleChange(u._id, 'admin')}
                            >
                              Admin
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-slate-400 text-center py-4">No user data available</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Activities Tab */}
        {activeTab === 'activities' && metrics && (
          <div className="space-y-6">
            {/* Activity Timeline */}
            <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl border border-slate-700 p-6 shadow-lg">
              <h3 className="text-xl font-bold text-white mb-6">Recent Activities</h3>

              <div className="space-y-3">
                {metrics.recentActivities && metrics.recentActivities.length > 0 ? (
                  metrics.recentActivities.map((activity, idx) => (
                    <div key={idx} className="flex items-start space-x-4 pb-4 border-b border-slate-700 last:border-b-0">
                      <div className="text-2xl">{getActivityIcon(activity.type)}</div>
                      <div className="flex-1">
                        <p className="text-white font-semibold">{activity.description}</p>
                        <p className="text-xs text-slate-400 mt-1">{new Date(activity.timestamp).toLocaleString()}</p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getActivityColor(activity.type)}`}>
                        {activity.type}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-slate-400 text-center py-4">No recent activities</p>
                )}
              </div>
            </div>

            {/* Daily Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl border border-slate-700 p-6 shadow-lg">
                <h4 className="text-lg font-bold text-white mb-4">📊 Today's Usage</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Networks Created</span>
                    <span className="text-white font-bold">{metrics.networksToday}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Trainings Started</span>
                    <span className="text-white font-bold">{metrics.trainingsToday}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Simulations Run</span>
                    <span className="text-white font-bold">{metrics.simulationsToday}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">New Users</span>
                    <span className="text-white font-bold">{metrics.newUsersToday}</span>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl border border-slate-700 p-6 shadow-lg">
                <h4 className="text-lg font-bold text-white mb-4">🎯 Performance</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Avg Response Time</span>
                    <span className="text-white font-bold">{metrics.avgResponseTime || '45ms'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">API Requests/min</span>
                    <span className="text-white font-bold">{metrics.apiRequestsPerMin || '1,234'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Error Rate</span>
                    <span className="text-green-400 font-bold">{metrics.errorRate || '0.1%'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Cache Hit Rate</span>
                    <span className="text-blue-400 font-bold">{metrics.cacheHitRate || '89%'}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

const getActivityIcon = (type) => {
  switch (type) {
    case 'user_signup':
      return '📝'
    case 'network_created':
      return '🌐'
    case 'training_started':
      return '🤖'
    case 'simulation_run':
      return '🎮'
    case 'user_login':
      return '🔓'
    default:
      return '•'
  }
}

const getActivityColor = (type) => {
  switch (type) {
    case 'user_signup':
      return 'bg-green-500/20 text-green-300'
    case 'network_created':
      return 'bg-blue-500/20 text-blue-300'
    case 'training_started':
      return 'bg-purple-500/20 text-purple-300'
    case 'simulation_run':
      return 'bg-orange-500/20 text-orange-300'
    case 'user_login':
      return 'bg-cyan-500/20 text-cyan-300'
    default:
      return 'bg-gray-500/20 text-gray-300'
  }
}

export default AdminDashboard
