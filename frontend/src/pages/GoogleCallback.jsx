import { useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'

const GoogleCallback = () => {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()

  useEffect(() => {
    const token = searchParams.get('token')

    if (token) {
      // Save token to localStorage
      localStorage.setItem('token', token)

      // Fetch user data
      fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/auth/me`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            localStorage.setItem('user', JSON.stringify(data.user))

            // Dispatch custom event to notify AuthContext
            window.dispatchEvent(new CustomEvent('authStateChanged', {
              detail: { user: data.user, token: token }
            }))

            // Small delay to ensure event is processed
            setTimeout(() => {
              navigate('/dashboard')
            }, 100)
          } else {
            navigate('/login?error=google_auth_failed')
          }
        })
        .catch(() => {
          navigate('/login?error=google_auth_failed')
        })
    } else {
      navigate('/login?error=no_token')
    }
  }, [searchParams, navigate])

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        <p className="mt-4 text-gray-400">Completing Google sign-in...</p>
      </div>
    </div>
  )
}

export default GoogleCallback
