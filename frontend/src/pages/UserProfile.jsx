import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { userAPI, adminAPI } from '../utils/api'
import Navbar from '../components/Navbar'

const UserProfile = () => {
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState('overview')
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState(null)
  const [paymentProcessing, setPaymentProcessing] = useState(false)

  useEffect(() => {
    fetchProfile()
  }, [])

  const fetchProfile = async () => {
    try {
      setLoading(true)
      setError('')
      const data = await userAPI.getProfile()
      setProfile(data)
    } catch (err) {
      console.error('Error fetching profile:', err)
      setError(err.response?.data?.detail || 'Error loading profile')
    } finally {
      setLoading(false)
    }
  }

  const handleBuyClick = (planName) => {
    setSelectedPlan(planName)
    setShowPaymentModal(true)
  }

  const handlePaymentConfirm = async () => {
    try {
      setPaymentProcessing(true)

      // Map plan names to role values
      const roleMap = {
        'Premium': 'premium',
        'Pro': 'admin' // Pro plan maps to admin role with unlimited resources
      }

      const newRole = roleMap[selectedPlan]

      // Call API to update user role
      const response = await adminAPI.updateUserRole(profile._id, newRole)

      // Update local profile state
      setProfile({
        ...profile,
        role: newRole
      })

      // Close modal
      setShowPaymentModal(false)
      setSelectedPlan(null)

      // Show success message
      alert(`Successfully upgraded to ${selectedPlan}! You now have access to all ${selectedPlan} features.`)

      // Refresh profile data
      await fetchProfile()
    } catch (err) {
      console.error('Error processing payment:', err)
      alert(`Error upgrading plan: ${err.response?.data?.error || 'Please try again'}`)
    } finally {
      setPaymentProcessing(false)
    }
  }

  const handlePaymentCancel = () => {
    setShowPaymentModal(false)
    setSelectedPlan(null)
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

  const getRoleColor = (role) => {
    switch (role) {
      case 'admin':
        return 'text-red-400 bg-red-500/10 border-red-500'
      case 'premium':
        return 'text-yellow-400 bg-yellow-500/10 border-yellow-500'
      case 'free':
        return 'text-blue-400 bg-blue-500/10 border-blue-500'
      default:
        return 'text-gray-400 bg-gray-500/10 border-gray-500'
    }
  }

  const getRoleLabel = (role) => {
    switch (role) {
      case 'admin':
        return '👑 Admin'
      case 'premium':
        return '⭐ Premium'
      case 'free':
        return '🆓 Free'
      default:
        return role
    }
  }

  const quotas = {
    free: { networks: 5, trainings: 1, simulations: 100 },
    premium: { networks: 10, trainings: 5, simulations: 500 },
    admin: { networks: '∞', trainings: '∞', simulations: '∞' }
  }

  const userRole = profile?.role || 'free'
  const userQuotas = quotas[userRole]
  const usage = profile?.usage || { networks: 0, trainings: 0, simulations: 0 }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <Navbar />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header Card */}
        <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl border border-slate-700 shadow-2xl p-8 mb-8">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-6">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/30">
                <span className="text-3xl">👤</span>
              </div>
              <div>
                <h1 className="text-4xl font-bold text-white">{profile?.username}</h1>
                <p className="text-slate-400 text-lg">{profile?.email}</p>
                <p className="text-sm text-slate-500 mt-2">Joined {new Date(profile?.createdAt).toLocaleDateString()}</p>
              </div>
            </div>
            <div className={`px-6 py-3 rounded-xl border ${getRoleColor(userRole)}`}>
              <p className="font-semibold text-lg">{getRoleLabel(userRole)}</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-8 border-b border-slate-700 overflow-x-auto">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-6 py-3 font-semibold transition whitespace-nowrap ${
              activeTab === 'overview'
                ? 'text-blue-400 border-b-2 border-blue-400'
                : 'text-slate-400 hover:text-slate-300'
            }`}
          >
            📊 Overview
          </button>
          <button
            onClick={() => setActiveTab('quota')}
            className={`px-6 py-3 font-semibold transition whitespace-nowrap ${
              activeTab === 'quota'
                ? 'text-blue-400 border-b-2 border-blue-400'
                : 'text-slate-400 hover:text-slate-300'
            }`}
          >
            📈 Usage & Quota
          </button>
          <button
            onClick={() => setActiveTab('plans')}
            className={`px-6 py-3 font-semibold transition whitespace-nowrap ${
              activeTab === 'plans'
                ? 'text-blue-400 border-b-2 border-blue-400'
                : 'text-slate-400 hover:text-slate-300'
            }`}
          >
            💎 Plans
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`px-6 py-3 font-semibold transition whitespace-nowrap ${
              activeTab === 'settings'
                ? 'text-blue-400 border-b-2 border-blue-400'
                : 'text-slate-400 hover:text-slate-300'
            }`}
          >
            ⚙️ Settings
          </button>
        </div>

        {/* Content */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {/* Networks */}
            <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl border border-slate-700 p-6 shadow-lg">
              <div className="text-4xl mb-2">🌐</div>
              <p className="text-slate-400 text-sm font-semibold mb-2">Networks Created</p>
              <p className="text-3xl font-bold text-white">{profile?.networksCount || 0}</p>
            </div>

            {/* Trainings */}
            <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl border border-slate-700 p-6 shadow-lg">
              <div className="text-4xl mb-2">🤖</div>
              <p className="text-slate-400 text-sm font-semibold mb-2">Training Sessions</p>
              <p className="text-3xl font-bold text-white">{profile?.trainingsCount || 0}</p>
            </div>

            {/* Simulations */}
            <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl border border-slate-700 p-6 shadow-lg">
              <div className="text-4xl mb-2">🎮</div>
              <p className="text-slate-400 text-sm font-semibold mb-2">Simulations Run</p>
              <p className="text-3xl font-bold text-white">{profile?.simulationsCount || 0}</p>
            </div>

            {/* Activity */}
            <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl border border-slate-700 p-6 shadow-lg">
              <div className="text-4xl mb-2">📅</div>
              <p className="text-slate-400 text-sm font-semibold mb-2">Last Active</p>
              <p className="text-white font-medium">{new Date(profile?.lastLogin).toLocaleDateString()}</p>
            </div>
          </div>
        )}

        {activeTab === 'quota' && (
          <div className="space-y-6">
            <div className="bg-gradient-to-br from-blue-900 to-blue-800 rounded-2xl border border-blue-500 p-6 shadow-lg">
              <p className="text-blue-100 text-sm mb-2">💡 Your Plan Includes:</p>
              <p className="text-white font-semibold">
                {userRole === 'free'
                  ? 'Free plan with basic features'
                  : userRole === 'premium'
                  ? 'Premium plan with enhanced limits'
                  : 'Admin access with unlimited resources'}
              </p>
            </div>

            {/* Quota Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Networks Quota */}
              <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl border border-slate-700 p-6 shadow-lg">
                <p className="text-slate-400 text-sm font-semibold mb-4">🌐 Networks per Day</p>
                <div className="space-y-3">
                  <div className="flex items-end justify-between">
                    <span className="text-white font-bold text-2xl">{usage.networks}</span>
                    <span className="text-slate-400">/ {userQuotas.networks}</span>
                  </div>
                  <div className="w-full bg-slate-700 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full transition-all"
                      style={{
                        width: userQuotas.networks === '∞' ? '0%' : `${(usage.networks / userQuotas.networks) * 100}%`
                      }}
                    ></div>
                  </div>
                  <p className="text-xs text-slate-500">
                    {userQuotas.networks === '∞'
                      ? 'Unlimited'
                      : `${userQuotas.networks - usage.networks} remaining`}
                  </p>
                </div>
              </div>

              {/* Trainings Quota */}
              <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl border border-slate-700 p-6 shadow-lg">
                <p className="text-slate-400 text-sm font-semibold mb-4">🤖 Trainings per Day</p>
                <div className="space-y-3">
                  <div className="flex items-end justify-between">
                    <span className="text-white font-bold text-2xl">{usage.trainings}</span>
                    <span className="text-slate-400">/ {userQuotas.trainings}</span>
                  </div>
                  <div className="w-full bg-slate-700 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-purple-500 to-purple-600 h-2 rounded-full transition-all"
                      style={{
                        width: userQuotas.trainings === '∞' ? '0%' : `${(usage.trainings / userQuotas.trainings) * 100}%`
                      }}
                    ></div>
                  </div>
                  <p className="text-xs text-slate-500">
                    {userQuotas.trainings === '∞'
                      ? 'Unlimited'
                      : `${userQuotas.trainings - usage.trainings} remaining`}
                  </p>
                </div>
              </div>

              {/* Simulations Quota */}
              <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl border border-slate-700 p-6 shadow-lg">
                <p className="text-slate-400 text-sm font-semibold mb-4">🎮 Simulations per Day</p>
                <div className="space-y-3">
                  <div className="flex items-end justify-between">
                    <span className="text-white font-bold text-2xl">{usage.simulations}</span>
                    <span className="text-slate-400">/ {userQuotas.simulations}</span>
                  </div>
                  <div className="w-full bg-slate-700 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-green-500 to-green-600 h-2 rounded-full transition-all"
                      style={{
                        width: userQuotas.simulations === '∞' ? '0%' : `${(usage.simulations / userQuotas.simulations) * 100}%`
                      }}
                    ></div>
                  </div>
                  <p className="text-xs text-slate-500">
                    {userQuotas.simulations === '∞'
                      ? 'Unlimited'
                      : `${userQuotas.simulations - usage.simulations} remaining`}
                  </p>
                </div>
              </div>
            </div>

            {/* Upgrade Info */}
            {userRole === 'free' && (
              <div className="bg-gradient-to-r from-yellow-900/30 to-orange-900/30 rounded-2xl border border-yellow-600 p-6">
                <p className="text-yellow-300 font-semibold mb-2">⭐ Upgrade to Premium</p>
                <p className="text-slate-300 text-sm mb-4">
                  Get higher limits and unlock more features. Premium users enjoy 2x more networks and trainings!
                </p>
                <button className="px-6 py-2 bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-700 hover:to-orange-700 text-white font-semibold rounded-lg transition">
                  View Plans
                </button>
              </div>
            )}
          </div>
        )}

        {activeTab === 'plans' && (
          <div className="space-y-6">
            {/* Current Plan Indicator */}
            <div className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 rounded-2xl border border-blue-500/50 p-6 mb-8">
              <h3 className="text-xl font-bold text-white mb-2">Current Plan</h3>
              <p className="text-slate-300">You are currently on the <span className="font-semibold capitalize text-blue-400">{userRole}</span> plan</p>
              {userRole === 'free' && (
                <p className="text-sm text-slate-400 mt-2">Upgrade to Premium or Pro to unlock more features and higher limits</p>
              )}
            </div>

            {/* Pricing Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 overflow-visible">
              {/* Free Plan */}
              <div className={`rounded-2xl border-2 transition-all ${
                userRole === 'free'
                  ? 'border-blue-500 bg-gradient-to-br from-slate-800 to-slate-900 shadow-2xl shadow-blue-500/20'
                  : 'border-slate-700 bg-gradient-to-br from-slate-800 to-slate-900'
              } p-8`}>
                <div className="mb-6">
                  <h4 className="text-2xl font-bold text-white mb-2">Free</h4>
                  <p className="text-slate-400">Get started with AutoSentinel</p>
                </div>

                <div className="mb-8">
                  <p className="text-4xl font-bold text-white mb-2">$0<span className="text-lg text-slate-400">/month</span></p>
                  <p className="text-sm text-slate-400">Perfect for learning</p>
                </div>

                <div className="space-y-3 mb-8">
                  <div className="flex items-center gap-3">
                    <span className="text-green-400">✓</span>
                    <span className="text-slate-300">5 Networks</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-green-400">✓</span>
                    <span className="text-slate-300">1 Training Session</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-green-400">✓</span>
                    <span className="text-slate-300">100 Simulations/day</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-gray-500">✗</span>
                    <span className="text-slate-400">Advanced Analytics</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-gray-500">✗</span>
                    <span className="text-slate-400">Priority Support</span>
                  </div>
                </div>

                <button
                  disabled={userRole === 'free'}
                  className={`w-full py-3 rounded-lg font-semibold transition ${
                    userRole === 'free'
                      ? 'bg-slate-600 text-slate-400 cursor-not-allowed'
                      : 'bg-slate-700 hover:bg-slate-600 text-white'
                  }`}
                >
                  {userRole === 'free' ? 'Current Plan' : 'Downgrade'}
                </button>
              </div>

              {/* Premium Plan */}
              <div className={`rounded-2xl border-2 transition-all ${
                userRole === 'premium'
                  ? 'border-yellow-500 bg-gradient-to-br from-slate-800 to-slate-900 shadow-2xl shadow-yellow-500/20'
                  : 'border-slate-700 bg-gradient-to-br from-slate-800 to-slate-900'
              } px-8 py-8 pt-16 relative`}>
                <div className="absolute top-3 left-1/2 -translate-x-1/2">
                  <span className="bg-gradient-to-r from-yellow-600 to-orange-600 text-white px-6 py-2 rounded-full text-sm font-semibold whitespace-nowrap">
                    POPULAR
                  </span>
                </div>

                <div className="mb-6">
                  <h4 className="text-2xl font-bold text-white mb-2">Premium</h4>
                  <p className="text-slate-400">For professional users</p>
                </div>

                <div className="mb-8">
                  <p className="text-4xl font-bold text-white mb-2">$29<span className="text-lg text-slate-400">/month</span></p>
                  <p className="text-sm text-slate-400">2x more resources</p>
                </div>

                <div className="space-y-3 mb-8">
                  <div className="flex items-center gap-3">
                    <span className="text-green-400">✓</span>
                    <span className="text-slate-300">10 Networks</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-green-400">✓</span>
                    <span className="text-slate-300">5 Training Sessions</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-green-400">✓</span>
                    <span className="text-slate-300">500 Simulations/day</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-green-400">✓</span>
                    <span className="text-slate-300">Advanced Analytics</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-gray-500">✗</span>
                    <span className="text-slate-400">Dedicated Support</span>
                  </div>
                </div>

                <button
                  onClick={() => userRole !== 'premium' && handleBuyClick('Premium')}
                  disabled={userRole === 'premium'}
                  className={`w-full py-3 rounded-lg font-semibold transition ${
                    userRole === 'premium'
                      ? 'bg-gradient-to-r from-yellow-600 to-orange-600 text-white cursor-default'
                      : 'bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-700 hover:to-orange-700 text-white cursor-pointer'
                  }`}
                >
                  {userRole === 'premium' ? 'Current Plan' : 'Buy Premium'}
                </button>
              </div>

              {/* Pro Plan */}
              <div className={`rounded-2xl border-2 transition-all ${
                userRole === 'pro'
                  ? 'border-purple-500 bg-gradient-to-br from-slate-800 to-slate-900 shadow-2xl shadow-purple-500/20'
                  : 'border-slate-700 bg-gradient-to-br from-slate-800 to-slate-900'
              } p-8`}>
                <div className="mb-6">
                  <h4 className="text-2xl font-bold text-white mb-2">Pro</h4>
                  <p className="text-slate-400">Enterprise-grade features</p>
                </div>

                <div className="mb-8">
                  <p className="text-4xl font-bold text-white mb-2">$99<span className="text-lg text-slate-400">/month</span></p>
                  <p className="text-sm text-slate-400">Unlimited resources</p>
                </div>

                <div className="space-y-3 mb-8">
                  <div className="flex items-center gap-3">
                    <span className="text-green-400">✓</span>
                    <span className="text-slate-300">Unlimited Networks</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-green-400">✓</span>
                    <span className="text-slate-300">Unlimited Trainings</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-green-400">✓</span>
                    <span className="text-slate-300">Unlimited Simulations</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-green-400">✓</span>
                    <span className="text-slate-300">Advanced Analytics</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-green-400">✓</span>
                    <span className="text-slate-300">Dedicated Support</span>
                  </div>
                </div>

                <button
                  onClick={() => userRole !== 'admin' && handleBuyClick('Pro')}
                  disabled={userRole === 'admin'}
                  className={`w-full py-3 rounded-lg font-semibold transition ${
                    userRole === 'admin'
                      ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white cursor-default'
                      : 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white cursor-pointer'
                  }`}
                >
                  {userRole === 'admin' ? 'Current Plan' : 'Buy Pro'}
                </button>
              </div>
            </div>

            {/* FAQ Section */}
            <div className="mt-12 bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl border border-slate-700 p-8">
              <h4 className="text-2xl font-bold text-white mb-6">Frequently Asked Questions</h4>
              <div className="space-y-4">
                <div className="border-b border-slate-700 pb-4">
                  <p className="text-white font-semibold mb-2">💳 Can I change plans anytime?</p>
                  <p className="text-slate-400 text-sm">Yes, you can upgrade or downgrade your plan at any time. Changes take effect at the next billing cycle.</p>
                </div>
                <div className="border-b border-slate-700 pb-4">
                  <p className="text-white font-semibold mb-2">🔄 What happens if I exceed my limits?</p>
                  <p className="text-slate-400 text-sm">We'll notify you when you're approaching your limits. You can upgrade anytime to continue using the platform.</p>
                </div>
                <div>
                  <p className="text-white font-semibold mb-2">📞 Do you offer custom plans?</p>
                  <p className="text-slate-400 text-sm">Yes! Contact our sales team for enterprise-grade custom plans tailored to your specific needs.</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="space-y-6 max-w-2xl">
            {/* Account Settings */}
            <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl border border-slate-700 p-6 shadow-lg">
              <h3 className="text-xl font-bold text-white mb-6">🔐 Account Settings</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-2">Email</label>
                  <p className="text-slate-200 bg-slate-700/50 p-3 rounded-lg">{profile?.email}</p>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-2">Username</label>
                  <p className="text-slate-200 bg-slate-700/50 p-3 rounded-lg">{profile?.username}</p>
                </div>
              </div>
            </div>

            {/* Session Management */}
            <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl border border-slate-700 p-6 shadow-lg">
              <h3 className="text-xl font-bold text-white mb-4">🚪 Session Management</h3>
              <p className="text-slate-400 mb-4">You can logout from your account here. You'll need to login again to access AutoSentinel.</p>
              <button
                onClick={() => {
                  if (window.confirm('Are you sure you want to logout?')) {
                    logout()
                    navigate('/')
                  }
                }}
                className="px-6 py-3 bg-slate-600 hover:bg-slate-700 text-white font-semibold rounded-lg transition w-full"
              >
                🚪 Logout
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Payment Confirmation Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl border border-slate-700 p-8 max-w-md w-full mx-4 shadow-2xl">
            {/* Modal Header */}
            <div className="mb-6">
              <h3 className="text-2xl font-bold text-white mb-2">Confirm Purchase</h3>
              <p className="text-slate-400">Complete your upgrade to {selectedPlan}</p>
            </div>

            {/* Plan Details */}
            <div className="bg-slate-700/30 rounded-lg p-4 mb-6 border border-slate-600">
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-slate-300">Plan:</span>
                  <span className="font-semibold text-white capitalize">{selectedPlan}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-300">Price:</span>
                  <span className="font-semibold text-white">
                    {selectedPlan === 'Premium' ? '$29' : '$99'}/month
                  </span>
                </div>
              </div>
            </div>

            {/* Payment Question */}
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 mb-6">
              <p className="text-blue-300 font-semibold text-center">Did you complete the payment?</p>
            </div>

            {/* Modal Actions */}
            <div className="flex gap-4">
              <button
                onClick={handlePaymentCancel}
                disabled={paymentProcessing}
                className="flex-1 px-4 py-3 bg-slate-700 hover:bg-slate-600 text-white font-semibold rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                onClick={handlePaymentConfirm}
                disabled={paymentProcessing}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {paymentProcessing ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Processing...
                  </>
                ) : (
                  'Yes, I Paid'
                )}
              </button>
            </div>

            {/* Helper Text */}
            <p className="text-xs text-slate-500 mt-4 text-center">
              Your role will be upgraded immediately after confirmation. You'll have access to all {selectedPlan} features.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

export default UserProfile
