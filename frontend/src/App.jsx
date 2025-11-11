import { useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { ToastProvider } from './contexts/ToastContext'
import ProtectedRoute from './components/ProtectedRoute'
import ToastContainer from './components/ToastContainer'
import Landing from './pages/Landing'
import Login from './pages/Login'
import Signup from './pages/Signup'
import VerifyEmail from './pages/VerifyEmail'
import GoogleCallback from './pages/GoogleCallback'
import Dashboard from './pages/Dashboard'
import NetworkDesigner from './pages/NetworkDesigner'
import Simulation from './pages/Simulation'
import Trainings from './pages/Trainings'
import TrainingV2 from './pages/TrainingV2'
import UserProfile from './pages/UserProfile'
import AdminDashboard from './pages/AdminDashboard'

function App() {
  // Initialize theme on app load
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme')
    if (savedTheme) {
      document.documentElement.setAttribute('data-theme', savedTheme)
    } else {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      document.documentElement.setAttribute('data-theme', prefersDark ? 'dark' : 'light')
      localStorage.setItem('theme', prefersDark ? 'dark' : 'light')
    }
  }, [])

  return (
    <AuthProvider>
      <ToastProvider>
        <Router>
          <ToastContainer />
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/verify-email" element={<VerifyEmail />} />
            <Route path="/auth/google/callback" element={<GoogleCallback />} />

            {/* Protected Routes */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/network/new"
              element={
                <ProtectedRoute>
                  <NetworkDesigner />
                </ProtectedRoute>
              }
            />
            <Route
              path="/network/:id"
              element={
                <ProtectedRoute>
                  <NetworkDesigner />
                </ProtectedRoute>
              }
            />
            <Route
              path="/simulation"
              element={
                <ProtectedRoute>
                  <Simulation />
                </ProtectedRoute>
              }
            />
            <Route
              path="/trainings"
              element={
                <ProtectedRoute>
                  <Trainings />
                </ProtectedRoute>
              }
            />
            <Route
              path="/training-v2"
              element={
                <ProtectedRoute>
                  <TrainingV2 />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <UserProfile />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin"
              element={
                <ProtectedRoute>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />

            {/* Default Route */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Router>
      </ToastProvider>
    </AuthProvider>
  )
}

export default App
