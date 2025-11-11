import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import axios from 'axios'
import { authAPI } from '../utils/api'

const VerifyEmail = () => {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [status, setStatus] = useState('verifying') // verifying, success, error
  const [message, setMessage] = useState('')
  const [userEmail, setUserEmail] = useState('')
  const [resendLoading, setResendLoading] = useState(false)
  const [resendMessage, setResendMessage] = useState('')

  useEffect(() => {
    const verifyEmail = async () => {
      const token = searchParams.get('token')

      if (!token) {
        setStatus('error')
        setMessage('Invalid verification link')
        return
      }

      try {
        const response = await axios.get(
          `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/auth/verify-email/${token}`
        )

        console.log('Verification response:', response.data)

        if (response.data && response.data.success === true) {
          // Save token and user data - verify they exist
          if (response.data.token && response.data.user) {
            localStorage.setItem('token', response.data.token)
            localStorage.setItem('user', JSON.stringify(response.data.user))

            setStatus('success')
            setMessage('Email verified successfully! Redirecting to dashboard...')

            // Redirect after 2 seconds
            setTimeout(() => {
              navigate('/dashboard')
            }, 2000)
          } else {
            throw new Error('Invalid response: missing token or user data')
          }
        } else {
          // Response was not successful
          setStatus('error')
          setMessage(response.data?.error || 'Failed to verify email')
        }
      } catch (error) {
        console.error('Verification error:', error)
        setStatus('error')
        const errorMessage = error.response?.data?.error || error.message || 'Failed to verify email. The link may have expired.'
        setMessage(errorMessage)

        // Try to extract email from error response or use from localStorage
        const email = error.response?.data?.email || error.response?.data?.userEmail
        if (email) {
          setUserEmail(email)
        }
      }
    }

    verifyEmail()
  }, [searchParams, navigate])

  const handleResendVerification = async () => {
    if (!userEmail) {
      alert('Email address not available. Please sign up again.')
      return
    }

    setResendLoading(true)
    setResendMessage('')

    try {
      const result = await authAPI.resendVerification(userEmail)
      setResendMessage('✓ Verification email sent! Check your inbox for the new link.')
      setTimeout(() => {
        setResendMessage('')
      }, 5000)
    } catch (err) {
      const error = err.response?.data?.error || 'Failed to resend verification email'
      alert(error)
    } finally {
      setResendLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        {/* Card */}
        <div className="bg-gray-800 rounded-lg shadow-xl p-8 border border-gray-700 text-center">
          {/* Icon */}
          <div className="mb-6">
            {status === 'verifying' && (
              <div className="inline-block">
                <svg
                  className="animate-spin h-16 w-16 text-blue-500 mx-auto"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
              </div>
            )}

            {status === 'success' && (
              <div className="inline-block">
                <svg
                  className="h-16 w-16 text-green-500 mx-auto"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
            )}

            {status === 'error' && (
              <div className="inline-block">
                <svg
                  className="h-16 w-16 text-red-500 mx-auto"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
            )}
          </div>

          {/* Title */}
          <h2 className="text-2xl font-bold text-white mb-4">
            {status === 'verifying' && 'Verifying Your Email'}
            {status === 'success' && 'Email Verified!'}
            {status === 'error' && 'Verification Failed'}
          </h2>

          {/* Message */}
          <p className={`text-lg mb-6 ${
            status === 'success' ? 'text-green-400' :
            status === 'error' ? 'text-red-400' :
            'text-gray-400'
          }`}>
            {status === 'verifying' && 'Please wait while we verify your email address...'}
            {message}
          </p>

          {/* Resend Message */}
          {resendMessage && (
            <div className="mb-4 p-3 bg-green-500/10 border border-green-500 rounded-lg">
              <p className="text-green-400 text-sm font-medium">{resendMessage}</p>
            </div>
          )}

          {/* Actions */}
          {status === 'error' && (
            <div className="space-y-3">
              {userEmail && (
                <button
                  onClick={handleResendVerification}
                  disabled={resendLoading}
                  className="w-full py-3 px-4 bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-lg transition"
                >
                  {resendLoading ? 'Sending...' : '📧 Resend Verification Email'}
                </button>
              )}
              <button
                onClick={() => navigate('/login')}
                className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition"
              >
                Go to Login
              </button>
              <button
                onClick={() => navigate('/signup')}
                className="w-full py-3 px-4 bg-gray-700 hover:bg-gray-600 text-white font-medium rounded-lg transition"
              >
                Sign Up Again
              </button>
            </div>
          )}

          {status === 'success' && (
            <div className="flex items-center justify-center text-sm text-gray-400">
              <svg
                className="animate-spin h-4 w-4 mr-2"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              Redirecting to dashboard...
            </div>
          )}
        </div>

        {/* Footer */}
        <p className="text-center text-gray-500 text-sm mt-6">
          AutoSentinel v2 - Network Security Simulation Platform
        </p>
      </div>
    </div>
  )
}

export default VerifyEmail
