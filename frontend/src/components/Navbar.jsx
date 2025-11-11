import { useState, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../contexts/ToastContext'

const Navbar = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const { success, info } = useToast()
  const [isDark, setIsDark] = useState(true)

  // Initialize theme on mount
  useEffect(() => {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    const savedTheme = localStorage.getItem('theme')

    if (savedTheme) {
      setIsDark(savedTheme === 'dark')
      document.documentElement.setAttribute('data-theme', savedTheme)
    } else {
      setIsDark(prefersDark)
      document.documentElement.setAttribute('data-theme', prefersDark ? 'dark' : 'light')
    }
  }, [])

  const toggleTheme = () => {
    const newTheme = isDark ? 'light' : 'dark'
    setIsDark(!isDark)
    document.documentElement.setAttribute('data-theme', newTheme)
    localStorage.setItem('theme', newTheme)
    info(newTheme === 'dark' ? 'Switched to Dark Mode' : 'Switched to Light Mode', 2000)
  }

  const navItems = [
    { path: '/dashboard', label: 'Dashboard', icon: '' },
    { path: '/trainings', label: 'Trainings', icon: '' },
    { path: '/training-v2', label: 'Training V2', icon: '' },
    { path: '/simulation', label: 'Simulation', icon: '' },
    { path: '/network/new', label: 'Create Network', icon: '' }
  ]

  const adminItems = [
    { path: '/admin', label: 'Admin', icon: '' }
  ]

  const isActive = (path) => {
    return location.pathname === path
  }

  const handleLogout = () => {
    logout()
    success('Logged out successfully', 2000)
    navigate('/')
  }

  return (
    <nav className="bg-gradient-to-r from-slate-900 to-slate-800 border-b border-slate-700 shadow-lg" style={{backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)'}}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16 gap-2">
          {/* Logo */}
          <Link to={user ? "/dashboard" : "/"} className="flex items-center space-x-2 hover:opacity-80 transition flex-shrink-0">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center shadow-lg">
              <span className="text-2xl font-bold text-white">AS</span>
            </div>
            <div className="hidden sm:block">
              <h1 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
                AutoSentinel
              </h1>
              <p className="text-xs" style={{color: 'var(--text-tertiary)'}}>Network Security Simulation</p>
            </div>
          </Link>

          {/* Navigation Links - Only show if logged in */}
          {user && (
            <div className="hidden lg:flex items-center space-x-1">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`px-3 py-2 rounded-lg font-medium text-sm transition whitespace-nowrap ${
                    isActive(item.path)
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-300 hover:bg-slate-700 hover:text-white'
                  }`}
                >
                  <span className="mr-1 text-base">{item.icon}</span>
                  {item.label}
                </Link>
              ))}

              {/* Admin Links - Only for admin users */}
              {user.role === 'admin' && adminItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`px-3 py-2 rounded-lg font-medium text-sm transition whitespace-nowrap ${
                    isActive(item.path)
                      ? 'bg-red-600 text-white'
                      : 'text-slate-300 hover:bg-red-700 hover:text-white'
                  }`}
                >
                  <span className="mr-1 text-base">{item.icon}</span>
                  {item.label}
                </Link>
              ))}
            </div>
          )}

          {/* User Menu */}
          <div className="flex items-center space-x-1 sm:space-x-2 flex-shrink-0">
            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg transition-all duration-300 text-base hover:opacity-80"
              style={{
                border: '1px solid var(--border-color)',
                backgroundColor: 'rgba(0,0,0,0.1)'
              }}
              title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {isDark ? '☀' : '●'}
            </button>

            {user ? (
              <>
                {/* User Info */}
                <div className="hidden sm:block text-right text-xs">
                  <p className="font-medium" style={{color: 'var(--text-primary)'}}>
                    {user?.username}
                  </p>
                  <p style={{color: 'var(--text-tertiary)'}}>
                    {user?.email}
                  </p>
                </div>

                {/* Profile Link */}
                <Link
                  to="/profile"
                  className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition font-medium text-sm whitespace-nowrap"
                >
                  👤 Profile
                </Link>

                {/* Logout Button */}
                <button
                  onClick={handleLogout}
                  className="px-3 py-2 rounded-lg transition font-medium text-sm text-white whitespace-nowrap"
                  style={{backgroundColor: 'var(--accent-red)', opacity: 0.8}}
                  onMouseEnter={(e) => e.target.style.opacity = '1'}
                  onMouseLeave={(e) => e.target.style.opacity = '0.8'}
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="px-3 py-2 transition font-medium text-sm whitespace-nowrap"
                  style={{color: 'var(--text-secondary)'}}
                >
                  Login
                </Link>
                <Link
                  to="/signup"
                  className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition font-medium text-sm whitespace-nowrap"
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="lg:hidden flex-shrink-0">
            <button
              onClick={() => {
                const menu = document.getElementById('mobile-menu')
                menu.classList.toggle('hidden')
              }}
              className="p-2 rounded-lg transition"
              style={{color: 'var(--text-secondary)'}}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        <div id="mobile-menu" className="hidden md:hidden pb-4">
          <div className="space-y-2">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`block px-4 py-2 rounded-lg font-medium transition ${
                  isActive(item.path)
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                }`}
              >
                <span className="mr-2">{item.icon}</span>
                {item.label}
              </Link>
            ))}
            <div className="pt-2 border-t border-gray-700">
              <p className="px-4 py-2 text-sm text-gray-400">
                {user?.username} ({user?.email})
              </p>
            </div>
          </div>
        </div>
      </div>
    </nav>
  )
}

export default Navbar
