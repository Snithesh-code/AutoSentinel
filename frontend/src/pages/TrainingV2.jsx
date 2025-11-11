import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import NetworkVisualization from '../components/NetworkVisualization'
import { trainingAPI } from '../utils/api'

const TrainingV2 = () => {
  const navigate = useNavigate()
  const [yamlFile, setYamlFile] = useState(null)
  const [yamlContent, setYamlContent] = useState('')
  const [isValidYaml, setIsValidYaml] = useState(false)
  const [networkData, setNetworkData] = useState(null)
  const [networkNodes, setNetworkNodes] = useState([])
  const [networkLinks, setNetworkLinks] = useState([])
  const [trainings, setTrainings] = useState([])
  const [selectedTraining, setSelectedTraining] = useState(null)
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(false)
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [error, setError] = useState('')
  const [showNetworkPanel, setShowNetworkPanel] = useState(false)
  const [graphInterval, setGraphInterval] = useState(1)

  // Training configuration state
  const [trainingConfig, setTrainingConfig] = useState({
    episodes: 1000,
    saveFrequency: 100,
    algorithm: 'PPO',
    verbose: false
  })

  // Parse YAML to extract network topology
  const parseYamlNetwork = (yaml) => {
    try {
      const nodes = []
      const links = []
      const processedNodes = new Set()

      // Extract simulation.network section
      const networkMatch = yaml.match(/simulation:\s*\n\s*network:([\s\S]*?)(?=\n\s{0}[a-z]|$)/)
      if (!networkMatch) {
        throw new Error('simulation.network section not found')
      }

      const networkContent = networkMatch[1]

      // Extract nodes section - match the YAML array structure
      const nodesMatch = networkContent.match(/nodes:\s*\n([\s\S]*?)(?=\n\s{4}[a-z]|$)/)
      if (nodesMatch) {
        const nodesContent = nodesMatch[1]
        // Split by lines starting with "- hostname:"
        const nodeBlocks = nodesContent.split(/(?=\n\s{6}-\s+hostname:)/)

        for (const block of nodeBlocks) {
          if (!block.trim()) continue

          // Extract hostname
          const hostnameMatch = block.match(/hostname:\s*(.+)/)
          if (!hostnameMatch) continue

          const hostname = hostnameMatch[1].trim()
          if (!hostname || processedNodes.has(hostname)) continue
          processedNodes.add(hostname)

          // Extract type
          const typeMatch = block.match(/type:\s*(.+)/)
          const type = typeMatch ? typeMatch[1].trim() : 'unknown'

          // Extract IP address
          const ipMatch = block.match(/ip_address:\s*['""]?(.+?)['""]?(?:\n|$)/)
          const ip = ipMatch ? ipMatch[1].trim() : null

          nodes.push({
            id: hostname,
            hostname: hostname,
            type: type,
            ip_address: ip,
            status: 'normal',
            team: 'GREEN'
          })
        }
      }

      // Extract links section
      const linksMatch = networkContent.match(/links:\s*\n([\s\S]*?)(?=\n\s{4}[a-z]|$)/)
      if (linksMatch) {
        const linksContent = linksMatch[1]
        // Split by lines starting with "- endpoint_a_hostname:"
        const linkBlocks = linksContent.split(/(?=\n\s{6}-\s+endpoint_a_hostname:)/)

        for (const block of linkBlocks) {
          if (!block.trim()) continue

          // Extract endpoint_a_hostname
          const sourceMatch = block.match(/endpoint_a_hostname:\s*(.+)/)
          // Extract endpoint_b_hostname
          const targetMatch = block.match(/endpoint_b_hostname:\s*(.+)/)

          if (sourceMatch && targetMatch) {
            const source = sourceMatch[1].trim()
            const target = targetMatch[1].trim()

            links.push({
              id: `${source}-${target}`,
              source: source,
              target: target,
              status: 'normal'
            })
          }
        }
      }

      return { nodes, links }
    } catch (err) {
      console.error('Error parsing YAML:', err)
      return { nodes: [], links: [] }
    }
  }

  // Load trainings on component mount
  useEffect(() => {
    loadTrainings()
  }, [])

  // Auto-refresh trainings
  useEffect(() => {
    let interval
    if (autoRefresh) {
      interval = setInterval(() => {
        loadTrainings()
        if (selectedTraining) {
          loadLogs(selectedTraining.id)
        }
      }, 5000)
    }
    return () => {
      if (interval) clearInterval(interval)
    }
  }, [autoRefresh, selectedTraining])

  const loadTrainings = async () => {
    try {
      const response = await trainingAPI.getAll()
      console.log('📥 [loadTrainings] All trainings from API:', response.trainings?.length || 0, response.trainings)

      // Filter trainings from YAML uploads
      // Include trainings that:
      // 1. Don't have a networkId (!t.networkId)
      // 2. Have isYamlUpload flag (t.isYamlUpload)
      // 3. Have networkId starting with 'yaml_' (t.networkId?.startsWith('yaml_'))
      const yamlTrainings = (response.trainings || []).filter(t => {
        const isYaml = !t.networkId || t.isYamlUpload || (t.networkId && typeof t.networkId === 'string' && t.networkId.startsWith('yaml_'))
        if (!isYaml) {
          console.log('🚫 Filtered out training:', t.id, 'networkId:', t.networkId)
        }
        return isYaml
      })

      console.log('✓ [loadTrainings] Filtered YAML trainings:', yamlTrainings.length)
      setTrainings(yamlTrainings)
      setError('')

      if (selectedTraining) {
        const updated = yamlTrainings.find(t => t.id === selectedTraining.id)
        if (updated) {
          console.log('✓ [loadTrainings] Updated selectedTraining:', updated.id)
          setSelectedTraining(updated)
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
      setLogs([])
    }
  }

  const handleFileUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    console.log('📤 File selected:', file.name)
    setYamlFile(file)
    const reader = new FileReader()
    reader.onload = async (event) => {
      const content = event.target.result
      console.log('📖 File content length:', content.length)
      setYamlContent(content)

      // Basic validation - check if it contains expected YAML sections
      const hasMetadata = content.includes('metadata:')
      const hasAgents = content.includes('agents:')
      const hasGame = content.includes('game:')
      const hasSimulation = content.includes('simulation:')

      console.log('✓ Validation checks:', {
        hasMetadata,
        hasAgents,
        hasGame,
        hasSimulation,
        hasAgentsOrGame: hasAgents || hasGame
      })

      const hasValidSections = hasMetadata && (hasAgents || hasGame) && hasSimulation

      console.log('🔍 Is valid YAML:', hasValidSections)
      setIsValidYaml(hasValidSections)

      if (hasValidSections) {
        try {
          // Parse YAML to extract nodes and links
          const { nodes, links } = parseYamlNetwork(content)
          console.log('🎯 Parsed nodes:', nodes.length, 'links:', links.length)
          setNetworkNodes(nodes)
          setNetworkLinks(links)

          setNetworkData({
            name: file.name.replace('.yaml', ''),
            yamlContent: content,
            nodeCount: nodes.length,
            linkCount: links.length
          })

          setShowNetworkPanel(true)
          setError('')
          console.log('✅ YAML uploaded and parsed successfully!')
        } catch (err) {
          console.error('❌ Error parsing YAML:', err)
          setError('Failed to parse YAML structure: ' + err.message)
          setShowNetworkPanel(false)
        }
      } else {
        const missing = []
        if (!hasMetadata) missing.push('metadata')
        if (!hasAgents && !hasGame) missing.push('agents or game')
        if (!hasSimulation) missing.push('simulation')

        const errorMsg = `Invalid YAML format. Missing sections: ${missing.join(', ')}`
        console.warn('⚠️ ' + errorMsg)
        setError(errorMsg)
        setNetworkData(null)
        setShowNetworkPanel(false)
      }
    }
    reader.readAsText(file)
  }

  const handleStartTraining = async (e) => {
    if (e) e.preventDefault()

    console.log('handleStartTraining called!')
    console.log('yamlContent length:', yamlContent?.length)

    if (!yamlContent) {
      const errorMsg = 'Please upload a YAML file first'
      setError(errorMsg)
      console.error(errorMsg)
      return
    }

    setLoading(true)
    setError('')

    try {
      const trainingData = {
        yamlContent: yamlContent,
        yamlFileName: yamlFile?.name || 'uploaded.yaml',
        episodes: trainingConfig.episodes,
        saveFrequency: trainingConfig.saveFrequency,
        algorithm: trainingConfig.algorithm,
        verbose: trainingConfig.verbose,
        isYamlUpload: true
      }

      console.log('🚀 Starting training with config:', {
        episodes: trainingData.episodes,
        saveFrequency: trainingData.saveFrequency,
        algorithm: trainingData.algorithm,
        yamlFileName: trainingData.yamlFileName,
        yamlLength: trainingData.yamlContent.length
      })

      const response = await trainingAPI.trainFromYaml(trainingData)

      console.log('📦 Training response:', response)

      if (response && response.success) {
        console.log('✅ Training started successfully! ID:', response.trainingId || response.id)

        // Wait a bit for backend to process
        console.log('⏳ Waiting for backend to register training...')
        await new Promise(resolve => setTimeout(resolve, 1000))

        // Load trainings
        console.log('📥 Loading trainings...')
        await loadTrainings()
        console.log('✓ loadTrainings completed')

        // Auto-select the newly created training
        console.log('🔍 Finding newest training...')
        setTimeout(async () => {
          try {
            console.log('Fetching all trainings...')
            const updatedTrainings = await trainingAPI.getAll()
            console.log('📊 All trainings:', updatedTrainings.trainings?.length || 0, updatedTrainings.trainings)

            if (updatedTrainings.trainings && updatedTrainings.trainings.length > 0) {
              const newestTraining = updatedTrainings.trainings[0]
              console.log('✨ Auto-selecting training:', newestTraining.id, newestTraining)
              setSelectedTraining(newestTraining)
              console.log('✓ setSelectedTraining called')

              await loadLogs(newestTraining.id)
              console.log('✓ loadLogs completed')
            } else {
              console.warn('⚠️ No trainings found in response')
            }
          } catch (err) {
            console.error('❌ Error selecting training:', err)
          }
        }, 100)

      } else {
        const errorMsg = response?.error || 'Failed to start training'
        setError(errorMsg)
        console.error('❌ Training failed:', response)
      }
    } catch (err) {
      console.error('🔴 Catch error:', err)
      const errorMsg = err.response?.data?.error || err.message || 'Failed to start training'
      setError(errorMsg)
      console.error('Start training error details:', {
        message: err.message,
        status: err.response?.status,
        data: err.response?.data
      })
    } finally {
      setLoading(false)
    }
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
      await trainingAPI.delete(trainingId)
      await loadTrainings()
      if (selectedTraining?.id === trainingId) {
        setSelectedTraining(null)
      }
      alert('Training session deleted successfully')
    } catch (err) {
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

  const renderRewardGraph = (training) => {
    if (!training.progress?.policyRewardHistory) {
      return <div className="text-sm" style={{color: 'var(--text-tertiary)'}}>No reward data yet</div>
    }

    const history = training.progress.policyRewardHistory

    // Calculate mean for every N episodes
    const calculateMeanByInterval = (data) => {
      if (!data || data.length === 0) return []

      const result = []
      for (let i = 0; i < data.length; i += graphInterval) {
        const chunk = data.slice(i, Math.min(i + graphInterval, data.length))
        const meanReward = chunk.reduce((sum, d) => sum + d.reward, 0) / chunk.length
        result.push({
          reward: meanReward,
          episode: chunk[chunk.length - 1].episode || chunk[chunk.length - 1].iteration || i + graphInterval
        })
      }
      return result
    }

    const filteredAttacker = calculateMeanByInterval(history.attacker)
    const filteredDefender = calculateMeanByInterval(history.defender)

    // Calculate min and max rewards to scale the graph properly
    const allRewards = [
      ...(filteredAttacker ? filteredAttacker.map(d => d.reward) : []),
      ...(filteredDefender ? filteredDefender.map(d => d.reward) : [])
    ]

    const minReward = Math.min(...allRewards, 0)
    const maxReward = Math.max(...allRewards, 0)
    const rewardRange = maxReward - minReward || 1

    // SVG dimensions
    const svgHeight = 256
    const topMargin = 30
    const bottomMargin = 26
    const graphHeight = svgHeight - topMargin - bottomMargin // 200px usable

    const getYPosition = (reward) => {
      // Normalize reward to 0-1 range
      const normalized = (reward - minReward) / rewardRange
      // Map to SVG coordinates (inverted because SVG Y increases downward)
      return bottomMargin + (1 - normalized) * graphHeight
    }

    // Y-axis labels
    const midLabel = (minReward + maxReward) / 2

    return (
      <svg className="w-full h-64 border rounded" viewBox={`0 0 800 ${svgHeight}`} style={{borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-secondary)'}}>
        {/* Grid lines */}
        {[minReward, midLabel, maxReward].map((value, idx) => {
          const y = getYPosition(value)
          return (
            <line
              key={`h-${idx}`}
              x1="40"
              y1={y}
              x2="800"
              y2={y}
              stroke={Math.abs(value) < 0.01 ? 'var(--border-color)' : 'rgba(0, 0, 0, 0.2)'}
              strokeWidth={Math.abs(value) < 0.01 ? '1' : '0.5'}
              strokeDasharray={Math.abs(value) < 0.01 ? '0' : '2,2'}
            />
          )
        })}

        {/* Y-axis labels */}
        {[minReward, midLabel, maxReward].map((value, idx) => {
          const y = getYPosition(value)
          return (
            <text key={`yl-${idx}`} x="35" y={y + 4} fontSize="10" fill="var(--text-tertiary)" textAnchor="end">
              {value.toFixed(1)}
            </text>
          )
        })}

        {/* Zero line (if applicable) */}
        {minReward < 0 && maxReward > 0 && (
          <line
            x1="40"
            y1={getYPosition(0)}
            x2="800"
            y2={getYPosition(0)}
            stroke="var(--border-color)"
            strokeWidth="1"
          />
        )}

        {/* Attacker line (Red) */}
        {filteredAttacker && filteredAttacker.length > 1 && (
          <polyline
            points={filteredAttacker
              .map((d, i) => {
                const x = 40 + (i / (filteredAttacker.length - 1)) * 760
                const y = getYPosition(d.reward)
                return `${x},${y}`
              })
              .join(' ')}
            fill="none"
            stroke="#ef4444"
            strokeWidth="2"
          />
        )}

        {/* Defender line (Blue) */}
        {filteredDefender && filteredDefender.length > 1 && (
          <polyline
            points={filteredDefender
              .map((d, i) => {
                const x = 40 + (i / (filteredDefender.length - 1)) * 760
                const y = getYPosition(d.reward)
                return `${x},${y}`
              })
              .join(' ')}
            fill="none"
            stroke="#3b82f6"
            strokeWidth="2"
          />
        )}

        {/* Legend */}
        <line x1="600" y1="10" x2="630" y2="10" stroke="#ef4444" strokeWidth="2" />
        <text x="635" y="15" fontSize="12" fill="#ef4444">Attacker</text>
        <line x1="600" y1="25" x2="630" y2="25" stroke="#3b82f6" strokeWidth="2" />
        <text x="635" y="30" fontSize="12" fill="#3b82f6">Defender</text>
      </svg>
    )
  }

  return (
    <div className="min-h-screen" style={{backgroundColor: 'var(--bg-primary)'}}>
      <Navbar />

      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left Column - YAML Upload and Training Config */}
          <div className="lg:col-span-1">
            <div className="border rounded-lg p-6 space-y-6" style={{backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)'}}>
              {/* YAML Upload Section */}
              <div>
                <h2 className="text-xl font-bold text-white mb-4">Upload YAML</h2>

                {/* File Upload */}
                <div className="border-2 border-dashed border-gray-600 rounded-lg p-4 text-center cursor-pointer hover:border-blue-500 transition">
                  <input
                    type="file"
                    accept=".yaml,.yml"
                    onChange={handleFileUpload}
                    className="hidden"
                    id="yaml-upload"
                  />
                  <label htmlFor="yaml-upload" className="cursor-pointer">
                    <div className="text-4xl mb-2">📄</div>
                    <p className="text-sm text-gray-300">Click to upload YAML file</p>
                    <p className="text-xs text-gray-500">or drag and drop</p>
                    {yamlFile && (
                      <p className="text-xs text-green-400 mt-2">✓ {yamlFile.name}</p>
                    )}
                  </label>
                </div>

                {/* Validation Status */}
                {yamlFile && (
                  <div className={`mt-3 p-3 rounded text-sm ${
                    isValidYaml
                      ? 'bg-green-900 text-green-300'
                      : 'bg-red-900 text-red-300'
                  }`}>
                    {isValidYaml ? '✓ Valid YAML' : '✗ Invalid YAML'}
                  </div>
                )}

                {/* Network Info */}
                {networkData && (
                  <div className="mt-4 bg-gray-700 p-3 rounded text-sm text-gray-200 space-y-2">
                    <div>
                      <p><strong>Network Name:</strong> {networkData.name}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="bg-gray-600 p-2 rounded">
                        <p className="text-xs text-gray-400">Nodes</p>
                        <p className="text-lg font-bold text-cyan-400">{networkData.nodeCount}</p>
                      </div>
                      <div className="bg-gray-600 p-2 rounded">
                        <p className="text-xs text-gray-400">Links</p>
                        <p className="text-lg font-bold text-cyan-400">{networkData.linkCount}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Training Configuration */}
              {isValidYaml && (
                <div className="border-t border-gray-700 pt-6">
                  <h3 className="text-lg font-bold text-white mb-4">Training Config</h3>

                  <div className="space-y-4">
                    {/* Episodes */}
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Episodes: {trainingConfig.episodes}
                      </label>
                      <input
                        type="range"
                        min="100"
                        max="10000"
                        step="100"
                        value={trainingConfig.episodes}
                        onChange={(e) =>
                          setTrainingConfig({
                            ...trainingConfig,
                            episodes: parseInt(e.target.value)
                          })
                        }
                        className="w-full"
                      />
                    </div>

                    {/* Save Frequency */}
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Save Frequency: {trainingConfig.saveFrequency}
                      </label>
                      <input
                        type="range"
                        min="10"
                        max="1000"
                        step="10"
                        value={trainingConfig.saveFrequency}
                        onChange={(e) =>
                          setTrainingConfig({
                            ...trainingConfig,
                            saveFrequency: parseInt(e.target.value)
                          })
                        }
                        className="w-full"
                      />
                    </div>

                    {/* Algorithm */}
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Algorithm
                      </label>
                      <select
                        value={trainingConfig.algorithm}
                        onChange={(e) =>
                          setTrainingConfig({
                            ...trainingConfig,
                            algorithm: e.target.value
                          })
                        }
                        className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white"
                      >
                        <option>PPO</option>
                        <option>DQN</option>
                      </select>
                    </div>

                    {/* Verbose */}
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="verbose"
                        checked={trainingConfig.verbose}
                        onChange={(e) =>
                          setTrainingConfig({
                            ...trainingConfig,
                            verbose: e.target.checked
                          })
                        }
                        className="mr-2"
                      />
                      <label htmlFor="verbose" className="text-sm text-gray-300">
                        Verbose Logging
                      </label>
                    </div>
                  </div>

                  {/* Start Training Button */}
                  <button
                    type="button"
                    onClick={(e) => {
                      console.log('🖱️ Button clicked!')
                      console.log('isValidYaml:', isValidYaml)
                      console.log('loading:', loading)
                      console.log('yamlContent length:', yamlContent?.length)
                      handleStartTraining(e)
                    }}
                    disabled={!isValidYaml || loading}
                    className="w-full mt-6 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white font-bold py-2 px-4 rounded transition cursor-pointer"
                  >
                    {loading ? 'Starting...' : 'Start Training'}
                  </button>

                  {/* Debug Info */}
                  <div className="mt-3 text-xs text-gray-400 bg-gray-900 p-2 rounded">
                    <div>isValidYaml: {String(isValidYaml)}</div>
                    <div>loading: {String(loading)}</div>
                    <div>Button disabled: {String(!isValidYaml || loading)}</div>
                    <div>yamlContent: {yamlContent ? 'Loaded' : 'Empty'}</div>
                  </div>
                </div>
              )}

              {/* Error Message */}
              {error && (
                <div className="bg-red-900 border border-red-700 text-red-300 p-3 rounded text-sm">
                  {error}
                </div>
              )}
            </div>
          </div>

          {/* Middle/Right Column - Network Visualization AND Training Progress */}
          <div className="lg:col-span-3">
            <div className="space-y-6">
              {/* Network Visualization - Always show when network is loaded */}
              {showNetworkPanel && (
                <>
                  <div className="border rounded-lg overflow-hidden" style={{backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3)'}}>
                    <div className="px-4 py-3 border-b" style={{backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)', borderColor: 'var(--border-color)'}}>
                      <h2 className="text-xl font-bold">Network Topology</h2>
                    </div>
                    <div style={{ height: '500px', width: '100%' }}>
                      <NetworkVisualization
                        nodes={networkNodes}
                        links={networkLinks}
                        isRunning={selectedTraining?.status === 'running'}
                      />
                    </div>
                  </div>

                  {/* Network Stats */}
                  {networkData && (
                    <div className="border rounded-lg p-6" style={{backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3)'}}>
                      <h3 className="text-lg font-bold mb-4" style={{color: 'var(--text-primary)'}}>Network Statistics</h3>
                      <div className="grid grid-cols-3 gap-4">
                        <div className="p-4 rounded" style={{backgroundColor: 'var(--bg-secondary)'}}>
                          <div className="text-sm" style={{color: 'var(--text-tertiary)'}}>Total Nodes</div>
                          <div className="text-3xl font-bold text-cyan-400">{networkData.nodeCount}</div>
                        </div>
                        <div className="p-4 rounded" style={{backgroundColor: 'var(--bg-secondary)'}}>
                          <div className="text-sm" style={{color: 'var(--text-tertiary)'}}>Total Links</div>
                          <div className="text-3xl font-bold text-cyan-400">{networkData.linkCount}</div>
                        </div>
                        <div className="p-4 rounded" style={{backgroundColor: 'var(--bg-secondary)'}}>
                          <div className="text-sm" style={{color: 'var(--text-tertiary)'}}>Network Name</div>
                          <div className="text-sm font-bold text-cyan-400 truncate">{networkData.name}</div>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* Training Progress - Show when training is selected */}
              {selectedTraining ? (
                // SHOW TRAINING PROGRESS BELOW NETWORK
                <>
                {/* Training Info Card */}
                <div className="border rounded-lg p-6" style={{backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3)'}}>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold" style={{color: 'var(--text-primary)'}}>
                      {selectedTraining.networkName || 'YAML Training'}
                    </h2>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold text-white ${getStatusColor(
                        selectedTraining.status
                      )}`}
                    >
                      {selectedTraining.status}
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div className="mb-4">
                    <div className="flex justify-between text-sm mb-1" style={{color: 'var(--text-tertiary)'}}>
                      <span>Progress</span>
                      <span>
                        {Math.round(
                          ((selectedTraining.progress?.currentEpisode || 0) /
                            (selectedTraining.progress?.totalEpisodes || 1)) *
                            100
                        )}
                        %
                      </span>
                    </div>
                    <div className="w-full rounded-full h-2" style={{backgroundColor: 'var(--border-color)'}}>
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all"
                        style={{
                          width: `${
                            ((selectedTraining.progress?.currentEpisode || 0) /
                              (selectedTraining.progress?.totalEpisodes || 1)) *
                            100
                          }%`
                        }}
                      ></div>
                    </div>
                  </div>

                  {/* Metrics Grid */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 rounded" style={{backgroundColor: 'var(--bg-secondary)'}}>
                      <div className="text-xs" style={{color: 'var(--text-tertiary)'}}>Episodes</div>
                      <div className="text-lg font-bold" style={{color: 'var(--text-primary)'}}>
                        {selectedTraining.progress?.currentEpisode || 0}/
                        {selectedTraining.progress?.totalEpisodes || 0}
                      </div>
                    </div>
                    <div className="p-3 rounded" style={{backgroundColor: 'var(--bg-secondary)'}}>
                      <div className="text-xs" style={{color: 'var(--text-tertiary)'}}>Duration</div>
                      <div className="text-lg font-bold" style={{color: 'var(--text-primary)'}}>
                        {formatDuration(selectedTraining.createdAt, selectedTraining.completedAt)}
                      </div>
                    </div>
                    <div className="p-3 rounded" style={{backgroundColor: 'var(--bg-secondary)'}}>
                      <div className="text-xs" style={{color: 'var(--text-tertiary)'}}>Avg Reward</div>
                      <div className="text-lg font-bold" style={{color: 'var(--text-primary)'}}>
                        {(selectedTraining.progress?.avgReward || 0).toFixed(3)}
                      </div>
                    </div>
                    <div className="p-3 rounded" style={{backgroundColor: 'var(--bg-secondary)'}}>
                      <div className="text-xs" style={{color: 'var(--text-tertiary)'}}>Mean Length</div>
                      <div className="text-lg font-bold" style={{color: 'var(--text-primary)'}}>
                        {selectedTraining.progress?.meanEpisodeLength?.toFixed(1) || 0}
                      </div>
                    </div>
                  </div>

                  {/* Policy Rewards */}
                  {selectedTraining.progress?.policyRewards && (
                    <div className="mt-4 grid grid-cols-2 gap-4">
                      <div className="p-3 rounded" style={{backgroundColor: 'rgba(239, 68, 68, 0.1)'}}>
                        <div className="text-xs text-red-400">Attacker</div>
                        <div className="text-lg font-bold text-red-500">
                          {(selectedTraining.progress.policyRewards.attacker || 0).toFixed(3)}
                        </div>
                      </div>
                      <div className="p-3 rounded" style={{backgroundColor: 'rgba(59, 130, 246, 0.1)'}}>
                        <div className="text-xs text-blue-400">Defender</div>
                        <div className="text-lg font-bold text-blue-500">
                          {(selectedTraining.progress.policyRewards.defender || 0).toFixed(3)}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="mt-4 flex gap-2">
                    {selectedTraining.status === 'running' && (
                      <button
                        type="button"
                        onClick={() => handleStopTraining(selectedTraining.id)}
                        className="flex-1 bg-yellow-600 hover:bg-yellow-700 text-white font-bold py-2 px-4 rounded transition"
                      >
                        Stop Training
                      </button>
                    )}
                    {(selectedTraining.status === 'completed' ||
                      selectedTraining.status === 'stopped') && (
                      <button
                        type="button"
                        onClick={() => handleDownloadModel(selectedTraining.id)}
                        className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded transition"
                      >
                        Download Model
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleDeleteTraining(selectedTraining.id)}
                      className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded transition"
                    >
                      Delete
                    </button>
                  </div>
                </div>

                {/* Reward Graph */}
                <div className="border rounded-lg p-6" style={{backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3)'}}>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold" style={{color: 'var(--text-primary)'}}>Reward History</h3>
                    <div className="flex items-center gap-3">
                      <label className="text-sm" style={{color: 'var(--text-tertiary)'}}>Show every:</label>
                      <input
                        type="range"
                        min="1"
                        max="50"
                        value={graphInterval}
                        onChange={(e) => setGraphInterval(parseInt(e.target.value))}
                        className="w-24"
                      />
                      <span className="text-sm min-w-[40px]" style={{color: 'var(--text-secondary)'}}>{graphInterval} ep</span>
                    </div>
                  </div>
                  {renderRewardGraph(selectedTraining)}
                </div>

                {/* Training Logs */}
                <div className="border rounded-lg p-6" style={{backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3)'}}>
                  <h3 className="text-lg font-bold mb-4" style={{color: 'var(--text-primary)'}}>Recent Logs</h3>
                  <div className="max-h-64 overflow-y-auto">
                    {logs.length === 0 ? (
                      <div className="text-sm" style={{color: 'var(--text-tertiary)'}}>No logs available</div>
                    ) : (
                      <div className="space-y-1">
                        {logs.map((log, idx) => (
                          <div key={idx} className="text-xs font-mono" style={{color: 'var(--text-secondary)'}}>
                            {typeof log === 'string' ? log : log.message}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </>
              ) : !showNetworkPanel ? (
                // SHOW PLACEHOLDER IF NO NETWORK LOADED
                <div className="border rounded-lg p-6 text-center" style={{backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)'}}>
                  <div style={{color: 'var(--text-tertiary)'}}>
                    <p className="text-lg mb-2">📊</p>
                    <p>Upload a YAML file to see network visualization</p>
                  </div>
                </div>
              ) : null}
            </div>
          </div>

          {/* Training Sessions Sidebar */}
          {trainings.length > 0 && (
            <div className="lg:col-span-1">
              <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold text-white">Sessions</h2>
                  <button
                    onClick={() => setAutoRefresh(!autoRefresh)}
                    className={`px-2 py-1 rounded text-xs ${
                      autoRefresh
                        ? 'bg-green-600 text-white'
                        : 'bg-gray-700 text-gray-300'
                    }`}
                  >
                    {autoRefresh ? 'Pause' : 'Resume'}
                  </button>
                </div>

                <div className="space-y-2 max-h-full overflow-y-auto">
                  {trainings.map((training) => (
                    <div
                      key={training.id}
                      onClick={() => {
                        setSelectedTraining(training)
                        loadLogs(training.id)
                      }}
                      className={`p-3 rounded cursor-pointer transition border text-sm ${
                        selectedTraining?.id === training.id
                          ? 'border-blue-500 bg-blue-900'
                          : 'border-gray-700 bg-gray-700 hover:bg-gray-600'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-white truncate">
                            {training.networkName || 'YAML'}
                          </div>
                          <div className="text-xs text-gray-400">
                            {training.progress?.currentEpisode || 0}/{training.progress?.totalEpisodes || 0}
                          </div>
                        </div>
                        <div
                          className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ml-2 ${getStatusColor(
                            training.status
                          )}`}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default TrainingV2
