import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { trainingAPI } from '../utils/api'
import Navbar from '../components/Navbar'

const Trainings = () => {
  const navigate = useNavigate()
  const [trainings, setTrainings] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedTraining, setSelectedTraining] = useState(null)
  const [logs, setLogs] = useState([])
  const [autoRefresh, setAutoRefresh] = useState(true) // Enabled by default for real-time updates

  useEffect(() => {
    loadTrainings()
  }, [])

  useEffect(() => {
    let interval
    if (autoRefresh) {
      interval = setInterval(() => {
        loadTrainings()
        if (selectedTraining) {
          loadLogs(selectedTraining.id)
        }
      }, 5000) // Refresh every 5 seconds
    }
    return () => {
      if (interval) clearInterval(interval)
    }
  }, [autoRefresh, selectedTraining])

  const loadTrainings = async () => {
    try {
      const response = await trainingAPI.getAll()
      const trainingsData = response.trainings || []

      // Update trainings data
      setTrainings(trainingsData)
      setError('')

      // Update selectedTraining if it exists in the new data
      if (selectedTraining) {
        const updated = trainingsData.find(t => t.id === selectedTraining.id)
        if (updated) {
          setSelectedTraining(updated)
        } else {
          // Training was deleted on server, clear selection
          setSelectedTraining(null)
          setLogs([])
        }
      }
    } catch (err) {
      setError('Failed to load trainings')
      console.error('Load trainings error:', err)
    } finally {
      setLoading(false)
    }
  }

  const loadLogs = async (trainingId) => {
    try {
      const response = await trainingAPI.getLogs(trainingId, 500)
      setLogs(response.logs || [])
    } catch (err) {
      // Silently fail - logs may not be available yet
      setLogs([])
    }
  }

  const handleViewLogs = async (training) => {
    setSelectedTraining(training)
    await loadLogs(training.id)
  }

  const handleStopTraining = async (trainingId) => {
    if (!window.confirm('Are you sure you want to stop this training?')) {
      return
    }

    try {
      await trainingAPI.stop(trainingId)
      await loadTrainings()
      alert('Training stopped successfully')
    } catch (err) {
      alert('Failed to stop training')
      console.error('Stop training error:', err)
    }
  }

  const handleDownloadModel = async (trainingId) => {
    try {
      await trainingAPI.downloadModel(trainingId)
    } catch (err) {
      alert('Failed to download model')
      console.error('Download model error:', err)
    }
  }

  const handleDeleteTraining = async (trainingId) => {
    if (!window.confirm('Are you sure you want to delete this training session? This action cannot be undone.')) {
      return
    }

    try {
      // Immediately remove from UI before server call
      setTrainings(prevTrainings => prevTrainings.filter(t => t.id !== trainingId))

      // Clear selection if the deleted training was selected
      if (selectedTraining?.id === trainingId) {
        setSelectedTraining(null)
        setLogs([])
      }

      // Now call the API to delete from server
      const deleteResult = await trainingAPI.delete(trainingId)

      // Show success message
      alert('Training session deleted successfully')
    } catch (err) {
      // If deletion fails, reload the trainings to restore the deleted item
      await loadTrainings()
      alert('Failed to delete training session')
      console.error('Delete training error:', err)
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'running':
        return 'bg-green-500'
      case 'completed':
        return 'bg-blue-500'
      case 'stopped':
        return 'bg-yellow-500'
      case 'failed':
      case 'error':
        return 'bg-red-500'
      default:
        return 'bg-gray-500'
    }
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const formatDuration = (startTime, endTime) => {
    const start = new Date(startTime)
    const end = endTime ? new Date(endTime) : new Date()
    const durationMs = end - start
    const seconds = Math.floor(durationMs / 1000)
    const minutes = Math.floor(seconds / 60)
    const hours = Math.floor(minutes / 60)

    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`
    } else {
      return `${seconds}s`
    }
  }

  return (
    <div className="min-h-screen bg-gray-900">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-3xl font-bold text-white">Training Monitor</h2>
            <p className="text-gray-400 mt-1">Monitor and manage ML agent training sessions</p>
          </div>
          <div className="flex items-center gap-4">
            <label className="flex items-center text-gray-300">
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                className="w-4 h-4 text-blue-600 bg-gray-900 border-gray-600 rounded focus:ring-blue-500 mr-2"
              />
              Auto-refresh
            </label>
            <button
              onClick={() => navigate('/dashboard')}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition"
            >
              Back to Dashboard
            </button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500 rounded-lg">
            <p className="text-red-400">{error}</p>
          </div>
        )}

        {/* Loading State */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            <p className="mt-4 text-gray-400">Loading trainings...</p>
          </div>
        ) : trainings.length === 0 ? (
          /* Empty State */
          <div className="text-center py-12 bg-gray-800 rounded-lg border border-gray-700">
            <svg className="mx-auto h-12 w-12 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <h3 className="mt-4 text-xl font-medium text-white">No trainings yet</h3>
            <p className="mt-2 text-gray-400">Start training a network from the dashboard to see it here</p>
            <button
              onClick={() => navigate('/dashboard')}
              className="mt-6 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition"
            >
              Go to Dashboard
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Training List */}
            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-white mb-4">Training Sessions</h3>
              {trainings.map((training) => (
                <div
                  key={training.id}
                  className={`bg-gray-800 rounded-lg border ${
                    selectedTraining?.id === training.id ? 'border-blue-500' : 'border-gray-700'
                  } p-4 hover:border-blue-500 transition cursor-pointer`}
                  onClick={() => handleViewLogs(training)}
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <h4 className="text-lg font-semibold text-white">{training.networkName}</h4>
                      <p className="text-sm text-gray-400 mt-1">ID: {training.id}</p>
                    </div>
                    <span className={`px-3 py-1 ${getStatusColor(training.status)} text-white text-xs rounded-full`}>
                      {training.status}
                    </span>
                  </div>

                  {/* Progress Bar */}
                  {training.status === 'running' && (
                    <div className="mb-4">
                      <div className="flex justify-between text-xs text-gray-400 mb-1">
                        <span>Progress</span>
                        <span>
                          {training.progress?.currentEpisode || 0} / {training.progress?.totalEpisodes || 0} episodes
                        </span>
                      </div>
                      <div className="w-full bg-gray-700 rounded-full h-2">
                        <div
                          className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                          style={{
                            width: `${Math.min(
                              100,
                              ((training.progress?.currentEpisode || 0) / (training.progress?.totalEpisodes || 1)) * 100
                            )}%`,
                          }}
                        ></div>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-500">Algorithm</p>
                      <p className="text-white font-medium">{training.config?.algorithm || 'PPO'}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Iteration</p>
                      <p className="text-white font-medium">{training.progress?.currentIteration || 0}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Episodes</p>
                      <p className="text-white font-medium">
                        {training.progress?.currentEpisode || 0} / {training.progress?.totalEpisodes || 0}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500">Avg Episode Length</p>
                      <p className="text-white font-medium">{training.progress?.meanEpisodeLength?.toFixed(0) || 0}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Started</p>
                      <p className="text-white font-medium text-xs">{formatDate(training.startTime)}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Duration</p>
                      <p className="text-white font-medium">
                        {formatDuration(training.startTime, training.endTime)}
                      </p>
                    </div>
                  </div>

                  {/* Policy Rewards */}
                  {training.progress?.policyRewards && Object.keys(training.progress.policyRewards).length > 0 && (
                    <div className="mt-3 pt-3 border-t border-gray-700">
                      <p className="text-xs text-gray-500 mb-2">Policy Rewards</p>
                      <div className="grid grid-cols-2 gap-2">
                        {Object.entries(training.progress.policyRewards).map(([policy, reward]) => {
                          const policyLabels = {
                            'attacker': 'RED (Attacker)',
                            'defender': 'BLUE (Defender)'
                          }
                          const colors = {
                            'attacker': 'text-red-400',
                            'defender': 'text-blue-400'
                          }
                          const label = policyLabels[policy] || policy
                          const color = colors[policy] || 'text-green-400'
                          return (
                            <div key={policy} className="bg-gray-900 rounded px-2 py-1">
                              <p className="text-xs text-gray-400">{label}</p>
                              <p className={`text-sm font-bold ${color}`}>{reward.toFixed(3)}</p>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}

                  {/* Episode Reward */}
                  {training.progress?.avgReward !== null && (
                    <div className="mt-3 pt-3 border-t border-gray-700">
                      <p className="text-xs text-gray-500">Latest Episode Reward</p>
                      <p className="text-lg font-bold text-blue-400">{training.progress.avgReward.toFixed(3)}</p>
                    </div>
                  )}

                  {training.status === 'running' && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleStopTraining(training.id)
                      }}
                      className="mt-4 w-full px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm rounded transition"
                    >
                      Stop Training
                    </button>
                  )}

                  {(training.status === 'completed' || training.status === 'stopped') && (
                    <div className="mt-4 space-y-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDownloadModel(training.id)
                        }}
                        className="w-full px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm rounded transition flex items-center justify-center gap-2"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        Download Model
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDeleteTraining(training.id)
                        }}
                        className="w-full px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white text-sm rounded transition flex items-center justify-center gap-2"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        Delete Session
                      </button>
                    </div>
                  )}

                  {training.status !== 'running' && training.status !== 'completed' && training.status !== 'stopped' && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDeleteTraining(training.id)
                      }}
                      className="mt-4 w-full px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white text-sm rounded transition flex items-center justify-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      Delete Session
                    </button>
                  )}
                </div>
              ))}
            </div>

            {/* Reward Graph Panel */}
            <div className="bg-gray-800 rounded-lg border border-gray-700 p-4">
              <h3 className="text-xl font-semibold text-white mb-4">
                {selectedTraining ? `Training Progress: ${selectedTraining.networkName}` : 'Select a training to view progress'}
              </h3>

              {selectedTraining ? (
                <div className="space-y-4">
                  {/* Reward Graph */}
                  {selectedTraining.progress?.policyRewardHistory && Object.keys(selectedTraining.progress.policyRewardHistory).length > 0 ? (
                    <div className="bg-gray-900 rounded p-4 h-[400px]">
                      <div className="flex justify-between items-center mb-4">
                        <p className="text-sm font-medium text-gray-300">Policy Reward History</p>
                        <div className="flex gap-3">
                          {Object.keys(selectedTraining.progress.policyRewardHistory).map((policy, idx) => {
                            const policyLabels = {
                              'attacker': 'RED (Attacker)',
                              'defender': 'BLUE (Defender)'
                            }
                            const colors = {
                              'attacker': '#EF4444',
                              'defender': '#3B82F6'
                            }
                            const label = policyLabels[policy] || policy
                            const color = colors[policy] || '#10B981'
                            return (
                              <div key={policy} className="flex items-center gap-1">
                                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }}></div>
                                <span className="text-xs text-gray-400">{label}</span>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                      <div className="relative w-full h-[320px]">
                        {(() => {
                          const policyHistory = selectedTraining.progress.policyRewardHistory
                          const allRewards = Object.values(policyHistory).flat().map(p => p.reward)
                          const maxReward = Math.max(...allRewards, 0.1)
                          const minReward = Math.min(...allRewards, 0)
                          const rewardRange = maxReward - minReward || 1
                          const width = 1000
                          const height = 300
                          const colorMap = {
                            'attacker': '#EF4444',
                            'defender': '#3B82F6'
                          }
                          const padding = { top: 20, right: 40, bottom: 40, left: 60 }
                          const plotWidth = width - padding.left - padding.right
                          const plotHeight = height - padding.top - padding.bottom

                          return (
                            <svg width="100%" height="100%" viewBox={`0 0 ${width} ${height}`} className="overflow-visible">
                              {/* Y-axis */}
                              <line x1={padding.left} y1={padding.top} x2={padding.left} y2={height - padding.bottom} stroke="#4B5563" strokeWidth="2" />
                              {/* X-axis */}
                              <line x1={padding.left} y1={height - padding.bottom} x2={width - padding.right} y2={height - padding.bottom} stroke="#4B5563" strokeWidth="2" />

                              {/* Plot reward lines for each policy */}
                              {Object.entries(policyHistory).map(([policy, history], policyIdx) => {
                                if (!history || history.length === 0) return null

                                const points = history.map((point, idx) => {
                                  const x = padding.left + (idx / Math.max(1, history.length - 1)) * plotWidth
                                  const y = height - padding.bottom - ((point.reward - minReward) / rewardRange) * plotHeight
                                  return `${x},${y}`
                                }).join(' ')

                                return (
                                  <polyline
                                    key={policy}
                                    points={points}
                                    fill="none"
                                    stroke={colorMap[policy] || '#10B981'}
                                    strokeWidth="2"
                                  />
                                )
                              })}

                              {/* Y-axis labels */}
                              <text x={padding.left - 15} y={padding.top + 5} fill="#9CA3AF" fontSize="12" textAnchor="end">{maxReward.toFixed(2)}</text>
                              <text x={padding.left - 15} y={height - padding.bottom + 5} fill="#9CA3AF" fontSize="12" textAnchor="end">{minReward.toFixed(2)}</text>

                              {/* X-axis label */}
                              <text x={width / 2} y={height - 5} fill="#9CA3AF" fontSize="12" textAnchor="middle">
                                Episode
                              </text>

                              {/* Y-axis label */}
                              <text x="15" y={height / 2} fill="#9CA3AF" fontSize="12" textAnchor="middle" transform={`rotate(-90, 15, ${height / 2})`}>
                                Reward
                              </text>
                            </svg>
                          )
                        })()}
                      </div>
                    </div>
                  ) : (
                    <div className="bg-gray-900 rounded p-4 h-[400px] flex items-center justify-center">
                      <p className="text-gray-500">No reward data available yet. Training will populate this graph as it progresses.</p>
                    </div>
                  )}

                  {/* Training Logs (Condensed) */}
                  <div className="bg-gray-900 rounded p-4">
                    <div className="flex justify-between items-center mb-2">
                      <p className="text-sm font-medium text-gray-300">Recent Activity</p>
                      <p className="text-xs text-gray-500">{logs.length} log entries</p>
                    </div>
                    <div className="max-h-[160px] overflow-y-auto font-mono text-xs">
                      {logs.length === 0 ? (
                        <p className="text-gray-500">No activity yet...</p>
                      ) : (
                        logs.slice(-20).map((log, idx) => (
                          <div key={idx} className="mb-1">
                            <span className="text-gray-600 text-xs">
                              [{new Date(log.timestamp).toLocaleTimeString()}]
                            </span>{' '}
                            <span className={log.type === 'stderr' ? 'text-red-400' : 'text-gray-400'}>
                              {log.message.length > 100 ? log.message.substring(0, 100) + '...' : log.message}
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-gray-900 rounded p-4 h-[600px] flex items-center justify-center">
                  <p className="text-gray-500">Select a training session to view its progress</p>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

export default Trainings
