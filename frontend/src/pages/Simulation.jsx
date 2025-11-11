import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import NetworkVisualization from '../components/NetworkVisualization'
import EventsPanel from '../components/EventsPanel'
import ControlPanel from '../components/ControlPanel'
import StatsPanel from '../components/StatsPanel'
import { useWebSocket } from '../hooks/useWebSocket'
import { useAuth } from '../contexts/AuthContext'
import Navbar from '../components/Navbar'

function Simulation() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [simulationState, setSimulationState] = useState({
    isRunning: false,
    step: 0,
    episode: 0,
    nodes: [],
    links: [],
    agents: {
      attacker: { reward: 0, lastAction: null },
      defender: { reward: 0, lastAction: null },
    },
  })

  const [events, setEvents] = useState([])
  const [delay, setDelay] = useState(500)
  const [selectedModel, setSelectedModel] = useState('v3.yaml')
  const stepIntervalRef = useRef(null)
  const selectRef = useRef(null)

  const { connected, sendMessage } = useWebSocket({
    onMessage: (data) => {
      if (data.type === 'state_update') {
        setSimulationState(prev => ({ ...prev, ...data.payload }))
      } else if (data.type === 'event') {
        setEvents(prev => [data.payload, ...prev].slice(0, 100))
      }
    },
  })

  const handleStartSimulation = () => {
    sendMessage({ type: 'start_simulation' })

    // If delay is set, step automatically at intervals
    if (delay > 0) {
      stepIntervalRef.current = setInterval(() => {
        sendMessage({ type: 'step_simulation' })
      }, delay)
    }
  }

  const handleStopSimulation = () => {
    sendMessage({ type: 'stop_simulation' })

    // Clear the interval
    if (stepIntervalRef.current) {
      clearInterval(stepIntervalRef.current)
      stepIntervalRef.current = null
    }
  }

  const handleResetSimulation = () => {
    sendMessage({ type: 'reset_simulation' })
    setEvents([])

    // Clear interval if running
    if (stepIntervalRef.current) {
      clearInterval(stepIntervalRef.current)
      stepIntervalRef.current = null
    }
  }

  const handleStepSimulation = () => {
    sendMessage({ type: 'step_simulation' })
  }

  const handleDelayChange = (newDelay) => {
    setDelay(newDelay)

    // If simulation is running, restart the interval with new delay
    if (simulationState.isRunning && stepIntervalRef.current) {
      clearInterval(stepIntervalRef.current)

      if (newDelay > 0) {
        stepIntervalRef.current = setInterval(() => {
          sendMessage({ type: 'step_simulation' })
        }, newDelay)
      } else {
        // If delay is 0, just keep stepping without interval
        stepIntervalRef.current = null
      }
    }
  }

  const handleModelChange = (e) => {
    const newModel = e.target.value
    setSelectedModel(newModel)
    sendMessage({ type: 'select_model', model: newModel })
    handleResetSimulation()
  }

  return (
    <div className="min-h-screen" style={{backgroundColor: 'var(--bg-primary)'}}>
      {/* Navigation */}
      <Navbar />

      {/* Simulation Info Bar */}
      <div className="border-b shadow-lg relative" style={{backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)', zIndex: 40}}>
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-3">
                <div className={`w-4 h-4 rounded-full animate-pulse ${connected ? 'bg-green-500 shadow-lg shadow-green-500/50' : 'bg-red-500 shadow-lg shadow-red-500/50'}`}></div>
                <span className={`font-semibold ${connected ? 'text-green-400' : 'text-red-400'}`}>
                  {connected ? '🟢 Connected' : '🔴 Disconnected'}
                </span>
              </div>

              <div className="text-center px-4 py-2 rounded-lg border" style={{backgroundColor: 'rgba(0, 212, 255, 0.1)', borderColor: 'var(--border-color)'}}>
                <div className="text-xs font-semibold" style={{color: 'var(--text-tertiary)'}}>Episode</div>
                <div className="text-xl font-bold text-blue-400">{simulationState.episode}</div>
              </div>

              <div className="text-center px-4 py-2 rounded-lg border" style={{backgroundColor: 'rgba(0, 212, 255, 0.1)', borderColor: 'var(--border-color)'}}>
                <div className="text-xs font-semibold" style={{color: 'var(--text-tertiary)'}}>Step</div>
                <div className="text-xl font-bold text-green-400">{simulationState.step}</div>
              </div>
            </div>

            <div className="text-right">
              <p className="text-xs" style={{color: 'var(--text-tertiary)'}}>Configuration Model</p>
              <div className="mt-2 relative inline-block w-full sm:w-auto dropdown-wrapper" style={{zIndex: 50}}>
                <select
                  ref={selectRef}
                  value={selectedModel}
                  onChange={handleModelChange}
                  className="w-full px-4 py-2.5 rounded-xl text-sm font-bold border-2 transition appearance-none cursor-pointer focus:outline-none model-select"
                  style={{
                    backgroundColor: 'var(--bg-card)',
                    color: 'var(--text-primary)',
                    borderColor: '#3b82f6',
                    paddingRight: '2.5rem',
                    zIndex: 50,
                  }}
                >
                  <option value="v3.yaml">v3.yaml</option>
                  <option value="dummy-model-1">Dummy Model 1</option>
                  <option value="dummy-model-2">Dummy Model 2</option>
                </select>
                <div
                  className="model-dropdown-arrow"
                  style={{
                    position: 'absolute',
                    right: '0.625rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    pointerEvents: 'none',
                    color: '#3b82f6',
                    fontSize: '1.125rem',
                    fontWeight: 'bold',
                    transition: 'transform 300ms ease',
                    zIndex: 50,
                  }}
                >
                  ▼
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Network Visualization */}
          <div className="lg:col-span-2 space-y-6">
            <NetworkVisualization
              nodes={simulationState.nodes}
              links={simulationState.links}
              isRunning={simulationState.isRunning}
            />

            <StatsPanel agents={simulationState.agents} />
          </div>

          {/* Right Column - Controls and Events */}
          <div className="space-y-6">
            <ControlPanel
              isRunning={simulationState.isRunning}
              onStart={handleStartSimulation}
              onStop={handleStopSimulation}
              onReset={handleResetSimulation}
              onStep={handleStepSimulation}
              delay={delay}
              onDelayChange={handleDelayChange}
            />

            <EventsPanel events={events} />
          </div>
        </div>
      </div>
    </div>
  )
}

export default Simulation
