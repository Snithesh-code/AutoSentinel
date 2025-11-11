import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

// Create axios instance with base configuration
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
})

// Add auth token to requests if available
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Handle response errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid - clear auth data
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

// ==================== Auth API ====================

export const authAPI = {
  // Register new user
  signup: async (userData) => {
    const response = await api.post('/api/auth/signup', userData)
    if (response.data.token) {
      localStorage.setItem('token', response.data.token)
      localStorage.setItem('user', JSON.stringify(response.data.user))
    }
    return response.data
  },

  // Login user
  login: async (credentials) => {
    const response = await api.post('/api/auth/login', credentials)
    if (response.data.token) {
      localStorage.setItem('token', response.data.token)
      localStorage.setItem('user', JSON.stringify(response.data.user))
    }
    return response.data
  },

  // Get current user
  getMe: async () => {
    const response = await api.get('/api/auth/me')
    return response.data
  },

  // Logout user
  logout: () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
  },

  // Check if user is authenticated
  isAuthenticated: () => {
    return !!localStorage.getItem('token')
  },

  // Get current user from localStorage
  getCurrentUser: () => {
    const userStr = localStorage.getItem('user')
    return userStr ? JSON.parse(userStr) : null
  },

  // Resend verification email
  resendVerification: async (email) => {
    const response = await api.post('/api/auth/resend-verification', { email })
    return response.data
  }
}

// ==================== Networks API ====================

export const networksAPI = {
  // Get all networks for current user
  getAll: async () => {
    const response = await api.get('/api/networks')
    return response.data
  },

  // Get single network by ID
  getById: async (id) => {
    const response = await api.get(`/api/networks/${id}`)
    return response.data
  },

  // Create new network
  create: async (networkData) => {
    const response = await api.post('/api/networks', networkData)
    return response.data
  },

  // Update network
  update: async (id, networkData) => {
    const response = await api.put(`/api/networks/${id}`, networkData)
    return response.data
  },

  // Delete network
  delete: async (id) => {
    const response = await api.delete(`/api/networks/${id}`)
    return response.data
  },

  // Download network as ZIP
  download: async (id, networkName) => {
    const response = await api.get(`/api/networks/${id}/download`, {
      responseType: 'blob'
    })

    // Create download link
    const url = window.URL.createObjectURL(new Blob([response.data]))
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `${networkName.replace(/\s+/g, '_')}.zip`)
    document.body.appendChild(link)
    link.click()
    link.remove()
    window.URL.revokeObjectURL(url)
  },

  // Start simulation for network
  simulate: async (id) => {
    const response = await api.post(`/api/networks/${id}/simulate`)
    return response.data
  },

  // Start training for network
  train: async (id, trainingConfig) => {
    const response = await api.post(`/api/networks/${id}/train`, trainingConfig)
    return response.data
  },

  // Get trainings for a network
  getTrainings: async (id) => {
    const response = await api.get(`/api/networks/${id}/trainings`)
    return response.data
  }
}

// ==================== Training API ====================

export const trainingAPI = {
  // Start training from YAML file upload
  trainFromYaml: async (trainingData) => {
    const response = await api.post('/api/networks/training/yaml', trainingData)
    return response.data
  },

  // Get all trainings for current user
  getAll: async () => {
    const response = await api.get('/api/networks/trainings/all')
    return response.data
  },

  // Get training status
  getStatus: async (trainingId) => {
    const response = await api.get(`/api/networks/trainings/${trainingId}`)
    return response.data
  },

  // Stop training
  stop: async (trainingId) => {
    const response = await api.post(`/api/networks/trainings/${trainingId}/stop`)
    return response.data
  },

  // Get training logs
  getLogs: async (trainingId, limit = 100) => {
    const response = await api.get(`/api/networks/trainings/${trainingId}/logs`, {
      params: { limit }
    })
    return response.data
  },

  // Download trained model
  downloadModel: (trainingId) => {
    // Create a download link that triggers the download
    const token = localStorage.getItem('token')
    const url = `${API_BASE_URL}/api/networks/trainings/${trainingId}/download`

    // Use fetch with authorization to download file
    return fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    .then(response => {
      if (!response.ok) throw new Error('Download failed')
      return response.blob()
    })
    .then(blob => {
      const blobUrl = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = blobUrl
      link.setAttribute('download', '')
      link.style.display = 'none'
      document.body.appendChild(link)
      link.click()
      setTimeout(() => {
        document.body.removeChild(link)
        window.URL.revokeObjectURL(blobUrl)
      }, 100)
    })
    .catch(err => {
      console.error('Download error:', err)
      throw err
    })
  },

  // Delete training session
  delete: async (trainingId) => {
    const response = await api.delete(`/api/networks/trainings/${trainingId}`)
    return response.data
  }
}

// ==================== Simulation API ====================

export const simulationAPI = {
  // Get simulation status
  getStatus: async () => {
    const response = await api.get('/api/status')
    return response.data
  },

  // Start simulation
  start: async () => {
    const response = await api.post('/api/simulation/start')
    return response.data
  },

  // Stop simulation
  stop: async () => {
    const response = await api.post('/api/simulation/stop')
    return response.data
  },

  // Reset simulation
  reset: async () => {
    const response = await api.post('/api/simulation/reset')
    return response.data
  },

  // Step simulation
  step: async () => {
    const response = await api.post('/api/simulation/step')
    return response.data
  }
}

// ==================== User Profile API ====================

export const userAPI = {
  // Get user profile
  getProfile: async () => {
    const response = await api.get('/api/users/profile')
    return response.data
  }
}

// ==================== Quota API ====================

export const quotaAPI = {
  // Check quota for a resource
  check: async (resource) => {
    const response = await api.get(`/api/quota/check/${resource}`)
    return response.data
  },

  // Increment quota usage
  increment: async (resource) => {
    const response = await api.post('/api/quota/increment', { resource })
    return response.data
  }
}

// ==================== Admin API ====================

export const adminAPI = {
  // Get admin metrics
  getMetrics: async () => {
    const response = await api.get('/api/admin/metrics')
    return response.data
  },

  // Update user role
  updateUserRole: async (userId, newRole) => {
    const response = await api.put(`/api/admin/users/${userId}/role`, {
      role: newRole
    })
    return response.data
  }
}

// ==================== XAI API ====================

export const xaiAPI = {
  // Get action explanation
  explainAction: async (action, agentType, target, description) => {
    const response = await api.post('/api/xai/explain-action', {
      action,
      agent_type: agentType,
      target,
      description
    })
    return response.data
  }
}

export default api
