import 'dotenv/config'
import express from 'express'
import { createServer } from 'http'
import { Server } from 'socket.io'
import cors from 'cors'
import axios from 'axios'
import { readFileSync } from 'fs'
import yaml from 'js-yaml'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import session from 'express-session'
import { connectDB } from './utils/db.js'
import passport, { configurePassport } from './utils/passport.js'
import authRoutes from './routes/auth.js'
import networkRoutes from './routes/networks.js'
import quotaRoutes from './routes/quota.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const app = express()
const httpServer = createServer(app)
const io = new Server(httpServer, {
  cors: {
    origin: 'http://localhost:3000',
    methods: ['GET', 'POST']
  }
})

const PORT = process.env.PORT || 5000
const PYTHON_API_URL = process.env.PYTHON_API_URL || 'http://localhost:8000'

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}))
app.use(express.json())

// Session middleware (required for passport)
app.use(session({
  secret: process.env.SESSION_SECRET || 'autosentinel-session-secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}))

// Initialize Passport
configurePassport()
app.use(passport.initialize())
app.use(passport.session())

// API Routes
app.use('/api/auth', authRoutes)
app.use('/api/networks', networkRoutes)
app.use('/api', quotaRoutes)

// Load network configuration
let networkConfig = null
try {
  const configPath = join(__dirname, '../python/v3.yaml')
  const fileContents = readFileSync(configPath, 'utf8')
  networkConfig = yaml.load(fileContents)
  console.log('✅ Loaded network configuration from v3.yaml')
} catch (error) {
  console.error('❌ Error loading network configuration:', error.message)
}

// Simulation state
let simulationState = {
  isRunning: false,
  step: 0,
  episode: 0,
  nodes: [],
  links: [],
  agents: {
    attacker: { reward: 0, lastAction: null },
    defender: { reward: 0, lastAction: null }
  }
}

// Auto-stepping interval
let autoStepInterval = null
const AUTO_STEP_DELAY = 2000 // Poll Python backend every 2 seconds when running

// Initialize network from config
function initializeNetwork() {
  if (!networkConfig) return

  const nodes = []
  const links = []

  // Parse nodes from v3.yaml
  if (networkConfig.simulation?.network?.nodes) {
    networkConfig.simulation.network.nodes.forEach(node => {
      nodes.push({
        id: node.hostname,
        hostname: node.hostname,
        type: node.type,
        ip_address: node.ip_address,
        status: 'active',
        team: getNodeTeam(node.hostname)
      })
    })
  }

  // Parse links from v3.yaml
  if (networkConfig.simulation?.network?.links) {
    networkConfig.simulation.network.links.forEach((link, idx) => {
      links.push({
        id: `link-${idx}`,
        source: link.endpoint_a_hostname,
        target: link.endpoint_b_hostname,
        status: 'active'
      })
    })
  }

  simulationState.nodes = nodes
  simulationState.links = links
  simulationState.step = 0
  simulationState.episode += 1

  console.log(`🌐 Network initialized: ${nodes.length} nodes, ${links.length} links`)
}

function getNodeTeam(hostname) {
  if (hostname.includes('client')) return 'GREEN'
  if (hostname.includes('c2')) return 'RED'
  return undefined
}

function determineSeverity(actionName) {
  const criticalActions = ['execute-ransomware', 'exfiltrate-data']
  const highActions = ['execute-dos-attack', 'execute-data-manipulation']
  const mediumActions = ['scan-network', 'block-ip', 'isolate-node']

  if (criticalActions.some(a => actionName.includes(a))) return 'critical'
  if (highActions.some(a => actionName.includes(a))) return 'high'
  if (mediumActions.some(a => actionName.includes(a))) return 'medium'
  return 'low'
}

// REST API Endpoints
app.get('/api/status', (req, res) => {
  res.json({
    success: true,
    simulation: simulationState
  })
})

app.post('/api/simulation/start', async (req, res) => {
  try {
    const response = await axios.post(`${PYTHON_API_URL}/simulation/start`)
    simulationState.isRunning = true
    io.emit('message', {
      type: 'state_update',
      payload: { isRunning: true }
    })
    startAutoStepping()
    res.json({ success: true, data: response.data })
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

app.post('/api/simulation/stop', async (req, res) => {
  try {
    const response = await axios.post(`${PYTHON_API_URL}/simulation/stop`)
    simulationState.isRunning = false
    io.emit('message', {
      type: 'state_update',
      payload: { isRunning: false }
    })
    stopAutoStepping()
    res.json({ success: true, data: response.data })
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

app.post('/api/simulation/reset', async (req, res) => {
  try {
    const response = await axios.post(`${PYTHON_API_URL}/simulation/reset`)
    stopAutoStepping()
    initializeNetwork()
    simulationState.isRunning = false
    simulationState.agents.attacker.reward = 0
    simulationState.agents.defender.reward = 0
    io.emit('message', {
      type: 'state_update',
      payload: simulationState
    })
    res.json({ success: true, data: response.data })
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

app.post('/api/simulation/step', async (req, res) => {
  try {
    const response = await axios.post(`${PYTHON_API_URL}/simulation/step`)
    updateSimulationState(response.data)
    res.json({ success: true, data: response.data })
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

// Update simulation state from Python backend
function updateSimulationState(data) {
  if (!data) return

  simulationState.step = data.step || simulationState.step + 1

  if (data.agents) {
    simulationState.agents = {
      attacker: {
        reward: data.agents.attacker?.reward || simulationState.agents.attacker.reward,
        lastAction: data.agents.attacker?.action || simulationState.agents.attacker.lastAction
      },
      defender: {
        reward: data.agents.defender?.reward || simulationState.agents.defender.reward,
        lastAction: data.agents.defender?.action || simulationState.agents.defender.lastAction
      }
    }
  }

  // Update node statuses if provided
  if (data.node_states) {
    simulationState.nodes = simulationState.nodes.map(node => ({
      ...node,
      status: data.node_states[node.hostname] || node.status
    }))
  }

  // Broadcast state update
  io.emit('message', {
    type: 'state_update',
    payload: simulationState
  })

  // Broadcast events if any
  if (data.events) {
    data.events.forEach(event => {
      io.emit('message', {
        type: 'event',
        payload: {
          ...event,
          id: `event-${Date.now()}-${Math.random()}`,
          timestamp: Date.now()
        }
      })
    })
  }
}

// Start auto-stepping - Poll Python backend for state updates
function startAutoStepping() {
  if (autoStepInterval) {
    console.log('⚠️  Auto-stepping already running')
    return
  }

  console.log('▶️  Starting auto-stepping - polling Python backend')
  autoStepInterval = setInterval(async () => {
    if (!simulationState.isRunning) {
      stopAutoStepping()
      return
    }

    try {
      // Poll Python backend for current simulation state
      const response = await axios.get(`${PYTHON_API_URL}/simulation/status`)

      if (response.data && response.data.success) {
        const pythonState = response.data

        // Check if step has changed (new step executed)
        if (pythonState.step !== simulationState.step) {
          const attackerAction = pythonState.agents?.attacker?.lastAction || 'unknown'
          const defenderAction = pythonState.agents?.defender?.lastAction || 'unknown'
          const attackerReward = pythonState.agents?.attacker?.reward || 0
          const defenderReward = pythonState.agents?.defender?.reward || 0

          console.log(`📊 Step ${pythonState.step}:`)
          console.log(`   🔴 Attacker: ${attackerAction} (reward: ${attackerReward.toFixed(2)})`)
          console.log(`   🔵 Defender: ${defenderAction} (reward: ${defenderReward.toFixed(2)})`)

          // Update local state
          simulationState.step = pythonState.step
          simulationState.episode = pythonState.episode || simulationState.episode

          if (pythonState.agents) {
            simulationState.agents = {
              attacker: {
                reward: attackerReward,
                lastAction: attackerAction
              },
              defender: {
                reward: defenderReward,
                lastAction: defenderAction
              }
            }
          }

          // Broadcast state update to all connected clients
          io.emit('message', {
            type: 'state_update',
            payload: simulationState
          })

          // Generate and broadcast events for each agent's action
          if (attackerAction && attackerAction !== 'unknown') {
            io.emit('message', {
              type: 'event',
              payload: {
                id: `attacker-${pythonState.step}-${Date.now()}`,
                timestamp: Date.now(),
                type: 'attack',
                agent: 'attacker',
                action: attackerAction,
                severity: determineSeverity(attackerAction),
                description: `Attacker executed: ${attackerAction}`
              }
            })
          }

          if (defenderAction && defenderAction !== 'unknown') {
            io.emit('message', {
              type: 'event',
              payload: {
                id: `defender-${pythonState.step}-${Date.now()}`,
                timestamp: Date.now(),
                type: 'defense',
                agent: 'defender',
                action: defenderAction,
                severity: 'low',
                description: `Defender executed: ${defenderAction}`
              }
            })
          }
        }

        // Update running state
        if (pythonState.is_running !== simulationState.isRunning) {
          simulationState.isRunning = pythonState.is_running
          io.emit('message', {
            type: 'state_update',
            payload: { isRunning: pythonState.is_running }
          })
        }
      }
    } catch (error) {
      console.error('Error polling Python backend:', error.message)
    }
  }, AUTO_STEP_DELAY)
}

// Stop auto-stepping
function stopAutoStepping() {
  if (autoStepInterval) {
    console.log('⏸️  Stopping auto-stepping')
    clearInterval(autoStepInterval)
    autoStepInterval = null
  }
}

// WebSocket Connection Handler
io.on('connection', (socket) => {
  console.log(`🔌 Client connected: ${socket.id}`)

  // Send current state immediately on connection
  socket.emit('message', {
    type: 'state_update',
    payload: simulationState
  })

  socket.on('message', async (data) => {
    console.log('📨 Received message:', data.type)

    try {
      switch (data.type) {
        case 'start_simulation':
          const startRes = await axios.post(`${PYTHON_API_URL}/simulation/start`)
          simulationState.isRunning = true
          io.emit('message', {
            type: 'state_update',
            payload: { isRunning: true }
          })
          // Start polling for state updates
          startAutoStepping()
          break

        case 'stop_simulation':
          const stopRes = await axios.post(`${PYTHON_API_URL}/simulation/stop`)
          simulationState.isRunning = false
          io.emit('message', {
            type: 'state_update',
            payload: { isRunning: false }
          })
          // Stop polling
          stopAutoStepping()
          break

        case 'reset_simulation':
          const resetRes = await axios.post(`${PYTHON_API_URL}/simulation/reset`)
          stopAutoStepping()
          initializeNetwork()
          simulationState.isRunning = false
          simulationState.agents.attacker.reward = 0
          simulationState.agents.defender.reward = 0
          io.emit('message', {
            type: 'state_update',
            payload: simulationState
          })
          break

        case 'step_simulation':
          const stepRes = await axios.post(`${PYTHON_API_URL}/simulation/step`)
          updateSimulationState(stepRes.data)
          break

        default:
          console.log('Unknown message type:', data.type)
      }
    } catch (error) {
      console.error('Error handling message:', error.message)
      console.error('Error details:', error.response?.data || error.stack)

      // Send detailed error to client
      const errorMessage = error.response?.data?.detail || error.message || 'Unknown error'
      socket.emit('error', {
        message: errorMessage,
        type: 'simulation_error'
      })

      // Also emit a state update showing error
      io.emit('message', {
        type: 'event',
        payload: {
          id: `error-${Date.now()}`,
          timestamp: Date.now(),
          type: 'system',
          agent: 'system',
          action: 'error',
          severity: 'critical',
          description: `Error: ${errorMessage}. Make sure Python API is running on ${PYTHON_API_URL}`
        }
      })
    }
  })

  socket.on('disconnect', () => {
    console.log(`🔌 Client disconnected: ${socket.id}`)
  })
})

// Check Python API health on startup
async function checkPythonAPI() {
  try {
    console.log('🔍 Checking Python API...')
    const response = await axios.get(`${PYTHON_API_URL}/health`, { timeout: 5000 })
    console.log('✅ Python API is ready:', response.data)
    return true
  } catch (error) {
    console.log('⚠️  Python API not ready:', error.message)
    console.log('💡 Make sure to start Python API: cd backend/python && python main.py')
    return false
  }
}

// Initialize network on startup
initializeNetwork()

// Connect to MongoDB and start server
const startServer = async () => {
  try {
    // Connect to MongoDB
    await connectDB()

    // Start HTTP server
    httpServer.listen(PORT, async () => {
      console.log(`🚀 Express server running on http://localhost:${PORT}`)
      console.log(`🔌 WebSocket server ready`)
      console.log(`🐍 Python API expected at ${PYTHON_API_URL}`)
      console.log('')

      // Check Python API availability
      await checkPythonAPI()
    })
  } catch (error) {
    console.error('❌ Failed to start server:', error)
    process.exit(1)
  }
}

// Start the server
startServer()
