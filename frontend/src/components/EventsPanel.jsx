import { useState } from 'react'
import { xaiAPI } from '../utils/api'

const EventsPanel = ({ events }) => {
  const [explanations, setExplanations] = useState({})
  const [loadingExplanations, setLoadingExplanations] = useState({})
  const [hoveredEventId, setHoveredEventId] = useState(null)
  const [selectedEventId, setSelectedEventId] = useState(null)
  const [copiedEventId, setCopiedEventId] = useState(null)

  const getActionExplanation = async (event) => {
    const cacheKey = `${event.id}`

    // Return cached explanation if exists
    if (explanations[cacheKey]) {
      setSelectedEventId(event.id)
      return
    }

    // Avoid duplicate requests
    if (loadingExplanations[cacheKey]) {
      return
    }

    try {
      setLoadingExplanations(prev => ({ ...prev, [cacheKey]: true }))

      const data = await xaiAPI.explainAction(
        event.action,
        event.agent?.includes('attacker') ? 'attacker' : 'defender',
        event.target,
        event.description
      )

      if (data.success) {
        setExplanations(prev => ({
          ...prev,
          [cacheKey]: data.explanation
        }))
      }
    } catch (err) {
      console.error('Error getting explanation:', err)
      setExplanations(prev => ({
        ...prev,
        [cacheKey]: 'Failed to load explanation'
      }))
    } finally {
      setLoadingExplanations(prev => {
        const newState = { ...prev }
        delete newState[cacheKey]
        return newState
      })
    }

    setSelectedEventId(event.id)
  }

  const copyToClipboard = (text, eventId) => {
    navigator.clipboard.writeText(text)
    setCopiedEventId(eventId)
    setTimeout(() => setCopiedEventId(null), 2000)
  }

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-900 border-cyber-red text-red-200'
      case 'high':
        return 'bg-orange-900 border-orange-500 text-orange-200'
      case 'medium':
        return 'bg-yellow-900 border-yellow-500 text-yellow-200'
      case 'low':
      default:
        return 'bg-blue-900 border-cyber-blue text-blue-200'
    }
  }

  const getTypeIcon = (type) => {
    switch (type) {
      case 'attack':
        return '⚔️'
      case 'defense':
        return '🛡️'
      case 'alert':
        return '⚠️'
      case 'system':
      default:
        return 'ℹ️'
    }
  }

  const getAgentColor = (agentName) => {
    // Color code based on agent type
    if (agentName.includes('attacker')) {
      return 'font-bold' // Red for attacker
    } else if (agentName.includes('defender')) {
      return 'font-bold' // Blue for defender
    } else if (agentName.includes('green') || agentName.includes('client')) {
      return 'font-bold' // Green for green team
    }
    return ''
  }

  const getActionColor = (agentName) => {
    // Color the action text based on agent
    if (agentName.includes('attacker')) {
      return ''
    } else if (agentName.includes('defender')) {
      return ''
    } else if (agentName.includes('green') || agentName.includes('client')) {
      return ''
    }
    return ''
  }

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp)
    return date.toLocaleTimeString()
  }

  return (
    <div className="border border-cyber-blue rounded-lg overflow-hidden flex flex-col" style={{backgroundColor: 'var(--bg-card)', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3)', height: '600px'}}>
      <div className="px-4 py-3 border-b border-cyber-blue flex items-center justify-between" style={{backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)'}}>
        <div>
          <h2 className="text-lg font-semibold text-cyber-blue">Event Log</h2>
          <p className="text-xs mt-1" style={{color: 'var(--text-tertiary)'}}>Real-time activity monitor</p>
        </div>
        <div className="text-xs px-2 py-1 rounded" style={{backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-tertiary)'}}>{events.length} events</div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-2" style={{backgroundColor: 'var(--bg-card)'}}>
        {events.length === 0 ? (
          <div className="flex items-center justify-center h-full" style={{color: 'var(--text-tertiary)'}}>
            <div className="text-center">
              <div className="text-4xl mb-2">📋</div>
              <p>No events yet</p>
              <p className="text-xs mt-1">Start the simulation to see events</p>
            </div>
          </div>
        ) : (
          events.map((event) => (
            <div
              key={event.id}
              className={`border-l-4 ${getSeverityColor(event.severity)} p-3 rounded-r cursor-pointer relative group transition hover:shadow-lg ${selectedEventId === event.id ? 'ring-2 ring-blue-400' : ''}`}
              style={{backgroundColor: 'var(--bg-tertiary)'}}
              onClick={() => getActionExplanation(event)}
            >
              <div className="flex items-start justify-between mb-1">
                <div className="flex items-center space-x-2">
                  <span className="text-lg">{getTypeIcon(event.type)}</span>
                  <span className={`text-sm ${getAgentColor(event.agent)}`} style={{color: 'var(--text-primary)'}}>{event.agent}</span>
                </div>
                <span className="text-xs" style={{color: 'var(--text-secondary)'}}>
                  {formatTimestamp(event.timestamp)}
                </span>
              </div>

              <div className="text-sm font-mono mb-1" style={{color: 'var(--text-primary)'}}>
                Action: <span style={{color: 'var(--text-primary)', fontWeight: 'bold'}}>{event.action}</span>
              </div>

              {event.target && (
                <div className="text-sm font-mono mb-1" style={{color: 'var(--text-primary)'}}>
                  Target: <span className="text-cyber-green">{event.target}</span>
                </div>
              )}

              <p className="text-xs mt-2" style={{color: 'var(--text-primary)'}}>{event.description}</p>

              {/* XAI Tooltip - Click to show, stays visible until closed */}
              {selectedEventId === event.id && (
                <div className="absolute bottom-full left-0 mb-2 w-60 bg-gradient-to-br from-blue-900 to-blue-800 border border-blue-500 p-3 rounded-lg text-xs text-blue-100 z-50 shadow-xl">
                  <div className="flex items-start gap-2">
                    <span className="text-lg mt-1">🤖</span>
                    <div className="flex-1">
                      <p className="font-semibold text-blue-300 mb-2">Why this action?</p>
                      {loadingExplanations[event.id] ? (
                        <p className="text-blue-200 animate-pulse">Loading explanation...</p>
                      ) : (
                        <p className="text-blue-100 leading-relaxed mb-3">
                          {explanations[event.id] || 'Unable to load explanation'}
                        </p>
                      )}

                      {/* Copy Button */}
                      {explanations[event.id] && !loadingExplanations[event.id] && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            copyToClipboard(explanations[event.id], event.id)
                          }}
                          className="w-full bg-blue-700 hover:bg-blue-600 text-blue-100 px-2 py-1 rounded text-xs mb-2 transition"
                        >
                          {copiedEventId === event.id ? '✓ Copied!' : '📋 Copy'}
                        </button>
                      )}

                      <p className="text-xs text-blue-300 opacity-70">Powered by Gemini XAI</p>
                    </div>

                    {/* Close Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setSelectedEventId(null)
                      }}
                      className="text-blue-300 hover:text-blue-100 transition text-lg font-bold"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export default EventsPanel
