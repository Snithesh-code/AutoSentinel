import { createContext, useContext, useState, useEffect } from 'react'
import { authAPI } from '../utils/api'

const AuthContext = createContext(null)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Check if user is logged in on mount
  useEffect(() => {
    const initAuth = async () => {
      try {
        if (authAPI.isAuthenticated()) {
          const userData = authAPI.getCurrentUser()
          setUser(userData)
        }
      } catch (err) {
        console.error('Auth initialization error:', err)
        authAPI.logout()
      } finally {
        setLoading(false)
      }
    }

    initAuth()

    // Listen for auth state changes (from Google callback or other sources)
    const handleAuthStateChanged = (event) => {
      if (event.detail && event.detail.user) {
        setUser(event.detail.user)
      }
    }

    window.addEventListener('authStateChanged', handleAuthStateChanged)
    return () => window.removeEventListener('authStateChanged', handleAuthStateChanged)
  }, [])

  const login = async (email, password) => {
    try {
      setError(null)
      setLoading(true)
      const response = await authAPI.login({ email, password })
      setUser(response.user)
      return { success: true, user: response.user }
    } catch (err) {
      const errorMessage = err.response?.data?.error || 'Login failed'
      setError(errorMessage)
      return { success: false, error: errorMessage }
    } finally {
      setLoading(false)
    }
  }

  const signup = async (username, email, password) => {
    try {
      setError(null)
      setLoading(true)
      const response = await authAPI.signup({ username, email, password })
      setUser(response.user)
      return { success: true, user: response.user }
    } catch (err) {
      const errorMessage = err.response?.data?.error || 'Signup failed'
      setError(errorMessage)
      return { success: false, error: errorMessage }
    } finally {
      setLoading(false)
    }
  }

  const logout = () => {
    authAPI.logout()
    setUser(null)
    setError(null)
  }

  const value = {
    user,
    loading,
    error,
    login,
    signup,
    logout,
    isAuthenticated: !!user
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
