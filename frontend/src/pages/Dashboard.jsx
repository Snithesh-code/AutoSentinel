import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../contexts/ToastContext'
import { networksAPI, trainingAPI } from '../utils/api'
import { networkToYAML, downloadYAML } from '../utils/yamlExport'
import Navbar from '../components/Navbar'

const Dashboard = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { success, error: showError } = useToast()
  const [networks, setNetworks] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showTrainingModal, setShowTrainingModal] = useState(false)
  const [selectedNetwork, setSelectedNetwork] = useState(null)
  const [exportingId, setExportingId] = useState(null)
  const [trainingConfig, setTrainingConfig] = useState({
    episodes: 1000,
    saveFrequency: 100,
    algorithm: 'PPO',
    verbose: false,
    actions: [],
    actionSpace: 'all'
  })

  // Available actions from the backend
  const availableActions = [
    { value: 'router-acl-add-rule', label: 'Router ACL Add Rule' },
    { value: 'router-acl-remove-rule', label: 'Router ACL Remove Rule' },
    { value: 'firewall-acl-add-rule', label: 'Firewall ACL Add Rule' },
    { value: 'firewall-acl-remove-rule', label: 'Firewall ACL Remove Rule' },
    { value: 'node-application-execute', label: 'Application Execute' },
    { value: 'node-application-scan', label: 'Application Scan' },
    { value: 'node-application-close', label: 'Application Close' },
    { value: 'node-application-fix', label: 'Application Fix' },
    { value: 'node-application-install', label: 'Application Install' },
    { value: 'node-application-remove', label: 'Application Remove' },
    { value: 'node-file-create', label: 'File Create' },
    { value: 'node-file-scan', label: 'File Scan' },
    { value: 'node-file-delete', label: 'File Delete' },
    { value: 'node-file-restore', label: 'File Restore' },
    { value: 'node-file-corrupt', label: 'File Corrupt' },
    { value: 'node-file-access', label: 'File Access' },
    { value: 'node-file-checkhash', label: 'File Check Hash' },
    { value: 'node-file-repair', label: 'File Repair' },
    { value: 'node-folder-scan', label: 'Folder Scan' },
    { value: 'node-folder-checkhash', label: 'Folder Check Hash' },
    { value: 'node-folder-repair', label: 'Folder Repair' },
    { value: 'node-folder-restore', label: 'Folder Restore' },
    { value: 'node-folder-create', label: 'Folder Create' },
    { value: 'host-nic-enable', label: 'Host NIC Enable' },
    { value: 'host-nic-disable', label: 'Host NIC Disable' },
    { value: 'do-nothing', label: 'Do Nothing' },
    { value: 'network-port-enable', label: 'Network Port Enable' },
    { value: 'network-port-disable', label: 'Network Port Disable' },
    { value: 'node-os-scan', label: 'Node OS Scan' },
    { value: 'node-shutdown', label: 'Node Shutdown' },
    { value: 'node-startup', label: 'Node Startup' },
    { value: 'node-reset', label: 'Node Reset' },
    { value: 'node-nmap-ping-scan', label: 'NMAP Ping Scan' },
    { value: 'node-nmap-port-scan', label: 'NMAP Port Scan' },
    { value: 'node-network-service-recon', label: 'Network Service Recon' },
    { value: 'node-account-add-user', label: 'Account Add User' },
    { value: 'node-account-disable-user', label: 'Account Disable User' },
    { value: 'node-send-local-command', label: 'Send Local Command' },
    { value: 'node-service-scan', label: 'Service Scan' },
    { value: 'node-service-stop', label: 'Service Stop' },
    { value: 'node-service-start', label: 'Service Start' },
    { value: 'node-service-pause', label: 'Service Pause' },
    { value: 'node-service-resume', label: 'Service Resume' },
    { value: 'node-service-restart', label: 'Service Restart' },
    { value: 'node-service-disable', label: 'Service Disable' },
    { value: 'node-service-enable', label: 'Service Enable' },
    { value: 'node-service-fix', label: 'Service Fix' },
    { value: 'node-session-remote-login', label: 'Session Remote Login' },
    { value: 'node-session-remote-logoff', label: 'Session Remote Logoff' },
    { value: 'node-account-change-password', label: 'Account Change Password' },
    { value: 'configure-ransomware-script', label: 'Configure Ransomware Script' },
    { value: 'c2-server-ransomware-configure', label: 'C2 Server Ransomware Configure' },
    { value: 'configure-dos-bot', label: 'Configure DoS Bot' },
    { value: 'configure-c2-beacon', label: 'Configure C2 Beacon' },
    { value: 'node-send-remote-command', label: 'Send Remote Command' },
    { value: 'c2-server-terminal-command', label: 'C2 Server Terminal Command' },
    { value: 'c2-server-ransomware-launch', label: 'C2 Server Ransomware Launch' },
    { value: 'c2-server-data-exfiltrate', label: 'C2 Server Data Exfiltrate' },
    { value: 'configure-database-client', label: 'Configure Database Client' }
  ]


  useEffect(() => {
    loadNetworks()
  }, [])

  const loadNetworks = async () => {
    try {
      setLoading(true)
      const response = await networksAPI.getAll()
      setNetworks(response.networks || [])
    } catch (err) {
      setError('Failed to load networks')
      console.error('Load networks error:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id) => {
    // if (!window.confirm('Are you sure you want to delete this network?')) {
    //   return
    // }

    try {
      await networksAPI.delete(id)
      setNetworks(networks.filter(n => n._id !== id))
    } catch (err) {
      alert('Failed to delete network')
      console.error('Delete error:', err)
    }
  }

  const handleExportYAML = async (networkId, networkName) => {
    try {
      setExportingId(networkId)
      // Get the full network data
      const response = await networksAPI.getById(networkId)
      const network = response.network

      const networkData = {
        name: network.name,
        description: network.description || '',
        tags: network.tags || [],
        config: network.config || {}
      }

      const yamlContent = networkToYAML(networkData)
      const fileName = networkName.toLowerCase().replace(/\s+/g, '-')
      downloadYAML(yamlContent, fileName)

      success(`📥 Network exported as ${fileName}.yaml`)
    } catch (err) {
      showError('✕ Failed to export network as YAML', 3000)
      console.error('Export YAML error:', err)
    } finally {
      setExportingId(null)
    }
  }

  const handleSimulate = async (id) => {
    try {
      await networksAPI.simulate(id)
      alert('Simulation started (integration pending)')
    } catch (err) {
      alert('Failed to start simulation')
      console.error('Simulate error:', err)
    }
  }

  const handleTrainClick = (network) => {
    // Check if network has agents
    if (!network.config?.agents || network.config.agents.length === 0) {
      alert('This network has no agents configured. Please add at least one agent in the network designer before training.')
      return
    }
    setSelectedNetwork(network)
    setShowTrainingModal(true)
  }

  const handleStartTraining = async () => {
    try {
      const result = await networksAPI.train(selectedNetwork._id, trainingConfig)
      alert(`Training started! Training ID: ${result.trainingId}`)
      setShowTrainingModal(false)
      setSelectedNetwork(null)
      // Navigate to training monitor
      navigate('/trainings')
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to start training')
      console.error('Training error:', err)
    }
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Navigation */}
      <Navbar />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Page Header */}
        <div className="flex justify-between items-center mb-12">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">My Networks</h1>
            <p className="text-slate-400 text-lg">Create and manage your network simulations</p>
          </div>
          <button
            onClick={() => navigate('/network/new')}
            className="px-7 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold rounded-xl transition transform hover:scale-105 shadow-lg flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Create Network
          </button>
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
            <p className="mt-4 text-gray-400">Loading networks...</p>
          </div>
        ) : networks.length === 0 ? (
          /* Empty State */
          <div className="text-center py-12 bg-gray-800 rounded-lg border border-gray-700">
            <svg className="mx-auto h-12 w-12 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            <h3 className="mt-4 text-xl font-medium text-white">No networks yet</h3>
            <p className="mt-2 text-gray-400">Get started by creating your first network simulation</p>
            <button
              onClick={() => navigate('/network/new')}
              className="mt-6 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition"
            >
              Create Your First Network
            </button>
          </div>
        ) : (
          /* Networks Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {networks.map((network) => (
              <div
                key={network._id}
                className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl border border-slate-700 hover:border-blue-500 p-6 transition duration-300 transform hover:scale-105 hover:shadow-2xl shadow-lg group"
              >
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-xl font-semibold text-white">{network.name}</h3>
                  <div className="flex gap-2">
                    <span className="px-2 py-1 bg-blue-500/10 text-blue-400 text-xs rounded">
                      {network.config?.nodes?.length || 0} nodes
                    </span>
                    {network.config?.agents && network.config.agents.length > 0 && (
                      <span className="px-2 py-1 bg-green-500/10 text-green-400 text-xs rounded">
                        {network.config.agents.length} agents
                      </span>
                    )}
                  </div>
                </div>

                <p className="text-gray-400 text-sm mb-4 line-clamp-2">
                  {network.description || 'No description'}
                </p>

                <div className="flex items-center text-xs text-gray-500 mb-4">
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  Created {formatDate(network.createdAt)}
                </div>

                {/* Tags */}
                {network.tags && network.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {network.tags.map((tag, idx) => (
                      <span key={idx} className="px-2 py-1 bg-gray-700 text-gray-300 text-xs rounded">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex flex-col gap-2">
                  <div className="flex gap-2">
                    <button
                      onClick={() => navigate(`/network/${network._id}`)}
                      className="flex-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded transition"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleExportYAML(network._id, network.name)}
                      disabled={exportingId === network._id}
                      className="px-3 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-800 disabled:cursor-not-allowed text-white text-sm rounded transition flex items-center justify-center gap-1"
                      title="Export as YAML file"
                    >
                      {exportingId === network._id ? (
                        <>
                          <svg className="animate-spin w-4 h-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                        </>
                      ) : (
                        <>📥</>
                      )}
                    </button>
                    <button
                      onClick={() => handleDelete(network._id)}
                      className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white text-sm rounded transition"
                      title="Delete"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>

                  {/* Train Button - Always visible */}
                  <button
                    onClick={() => handleTrainClick(network)}
                    className={`w-full px-3 py-2 text-white text-sm rounded transition flex items-center justify-center gap-2 ${
                      network.config?.agents && network.config.agents.length > 0
                        ? 'bg-green-600 hover:bg-green-700'
                        : 'bg-gray-600 hover:bg-gray-500'
                    }`}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    {network.config?.agents && network.config.agents.length > 0
                      ? `Train Agents (${network.config.agents.length})`
                      : 'Train Agents (Add agents first)'
                    }
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Training Configuration Modal - Enhanced UI */}
      {showTrainingModal && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full border border-gray-600 overflow-hidden">
            {/* Modal Header with Gradient */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-8 py-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-white mb-1">🚀 Configure Training</h2>
                  <p className="text-blue-100 text-sm">Set up your RL agents for training</p>
                </div>
                <button
                  onClick={() => {
                    setShowTrainingModal(false)
                    setSelectedNetwork(null)
                  }}
                  className="text-white hover:bg-white hover:bg-opacity-20 rounded-full p-2 transition"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="px-8 py-6 max-h-[75vh] overflow-y-auto">
              {/* Network Info Card */}
              <div className="bg-gradient-to-r from-slate-600 to-slate-700 rounded-xl p-4 mb-6 border border-slate-500 shadow-md">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-gray-400 text-xs uppercase tracking-wider mb-1">Network</p>
                    <p className="text-white font-semibold text-lg">{selectedNetwork?.name}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-xs uppercase tracking-wider mb-1">Agents</p>
                    <div className="flex items-center gap-2">
                      <span className="text-green-400 font-bold text-lg">{selectedNetwork?.config?.agents?.length || 0}</span>
                      <span className="text-green-400 text-lg">🤖</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Training Parameters Section */}
              <div className="space-y-6">
                {/* Episodes */}
                <div>
                  <label className="block text-sm font-semibold text-gray-200 mb-2">
                    📊 Training Episodes
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min="100"
                      step="100"
                      value={trainingConfig.episodes}
                      onChange={(e) => setTrainingConfig({...trainingConfig, episodes: parseInt(e.target.value)})}
                      className="w-full px-4 py-3 bg-gray-900 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                    />
                    <p className="text-xs text-gray-400 mt-2">Total number of training episodes to run</p>
                  </div>
                </div>

                {/* Save Frequency */}
                <div>
                  <label className="block text-sm font-semibold text-gray-200 mb-2">
                    💾 Save Frequency
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min="10"
                      step="10"
                      value={trainingConfig.saveFrequency}
                      onChange={(e) => setTrainingConfig({...trainingConfig, saveFrequency: parseInt(e.target.value)})}
                      className="w-full px-4 py-3 bg-gray-900 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                    />
                    <p className="text-xs text-gray-400 mt-2">Save model checkpoint every N episodes</p>
                  </div>
                </div>

                {/* Algorithm Selection */}
                <div>
                  <label className="block text-sm font-semibold text-gray-200 mb-2">
                    🧠 Training Algorithm
                  </label>
                  <select
                    value={trainingConfig.algorithm}
                    onChange={(e) => setTrainingConfig({...trainingConfig, algorithm: e.target.value})}
                    className="w-full px-4 py-3 bg-gray-900 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition appearance-none cursor-pointer"
                  >
                    <option value="PPO">PPO (Proximal Policy Optimization)</option>
                    <option value="DQN">DQN (Deep Q-Network)</option>
                  </select>
                  <p className="text-xs text-gray-400 mt-2">Select the reinforcement learning algorithm</p>
                </div>

                {/* Verbose Logging */}
                <div className="bg-slate-700 rounded-lg p-4 border border-slate-600 shadow-md">
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={trainingConfig.verbose}
                      onChange={(e) => setTrainingConfig({...trainingConfig, verbose: e.target.checked})}
                      className="w-5 h-5 text-blue-600 bg-gray-900 border-gray-600 rounded focus:ring-2 focus:ring-blue-500 cursor-pointer"
                    />
                    <span className="ml-3 text-sm font-medium text-gray-200">
                      📝 Enable Verbose Logging
                    </span>
                  </label>
                  <p className="text-xs text-gray-400 ml-8 mt-1">Detailed logging during training</p>
                </div>

                {/* Action Space Section */}
                <div className="bg-slate-700 rounded-xl p-4 border border-slate-600 shadow-md">
                  <h4 className="text-sm font-semibold text-gray-200 mb-3">⚙️ Action Space</h4>
                  <div className="space-y-3">
                    <label className="flex items-center cursor-pointer p-3 bg-gray-900 rounded-lg hover:bg-gray-950 transition border border-gray-800">
                      <input
                        type="radio"
                        name="actionSpace"
                        value="all"
                        checked={trainingConfig.actionSpace === 'all'}
                        onChange={(e) => {
                          setTrainingConfig({...trainingConfig, actionSpace: e.target.value, actions: []})
                        }}
                        className="w-5 h-5 text-blue-600 cursor-pointer"
                      />
                      <div className="ml-3">
                        <p className="text-sm font-medium text-gray-200">Use All Actions</p>
                        <p className="text-xs text-gray-400">Agents can use all available actions</p>
                      </div>
                    </label>

                    <label className="flex items-center cursor-pointer p-3 bg-gray-900 rounded-lg hover:bg-gray-950 transition border border-gray-800">
                      <input
                        type="radio"
                        name="actionSpace"
                        value="custom"
                        checked={trainingConfig.actionSpace === 'custom'}
                        onChange={(e) => {
                          setTrainingConfig({...trainingConfig, actionSpace: e.target.value})
                        }}
                        className="w-5 h-5 text-blue-600 cursor-pointer"
                      />
                      <div className="ml-3">
                        <p className="text-sm font-medium text-gray-200">Custom Actions</p>
                        <p className="text-xs text-gray-400">Select specific actions for agents</p>
                      </div>
                    </label>

                    {/* Custom Actions List */}
                    {trainingConfig.actionSpace === 'custom' && (
                      <div className="mt-4 bg-gray-900 rounded-lg p-4 border border-gray-700 shadow-md">
                        <p className="text-xs text-gray-400 mb-3 font-semibold">Select Actions:</p>
                        <div className="space-y-2 max-h-[200px] overflow-y-auto">
                          {availableActions.map((action) => (
                            <label key={action.value} className="flex items-center cursor-pointer p-2 hover:bg-gray-800/50 rounded transition">
                              <input
                                type="checkbox"
                                checked={trainingConfig.actions.includes(action.value)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setTrainingConfig({
                                      ...trainingConfig,
                                      actions: [...trainingConfig.actions, action.value]
                                    })
                                  } else {
                                    setTrainingConfig({
                                      ...trainingConfig,
                                      actions: trainingConfig.actions.filter(a => a !== action.value)
                                    })
                                  }
                                }}
                                className="w-4 h-4 text-green-600 bg-gray-800 border-gray-600 rounded cursor-pointer"
                              />
                              <span className="ml-2 text-xs text-gray-300">{action.label}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Agent Observation Spaces Info */}
                <div className="bg-slate-700 rounded-xl p-4 border border-slate-600 shadow-md">
                  <h4 className="text-sm font-semibold text-gray-200 mb-3">👁️ Agent Observation Spaces</h4>
                  <div className="bg-gray-900 rounded-lg p-3 max-h-[150px] overflow-y-auto border border-gray-800">
                    {selectedNetwork?.config?.agents && selectedNetwork.config.agents.length > 0 ? (
                      <div className="space-y-2">
                        {selectedNetwork.config.agents.map((agent, idx) => {
                          const obsArray = Array.isArray(agent.observation_space) ? agent.observation_space : []
                          return (
                            <div key={idx} className="p-2 bg-gray-800/50 rounded border border-gray-700">
                              <p className="text-xs font-medium text-gray-300 mb-1">
                                🤖 Agent: <span className="text-blue-400">{agent.ref}</span>
                              </p>
                              {obsArray.length > 0 ? (
                                <div className="flex flex-wrap gap-1">
                                  {obsArray.map((obs, i) => (
                                    <span key={i} className="text-xs bg-blue-600/30 text-blue-300 px-2 py-1 rounded">
                                      {obs}
                                    </span>
                                  ))}
                                </div>
                              ) : (
                                <p className="text-xs text-gray-500 italic">No observation spaces configured</p>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    ) : (
                      <p className="text-xs text-gray-400">No agents configured. Add agents in Network Designer to configure observation spaces.</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="bg-gray-900 border-t border-gray-700 px-8 py-4 flex gap-3">
              <button
                onClick={() => {
                  setShowTrainingModal(false)
                  setSelectedNetwork(null)
                }}
                className="flex-1 px-4 py-3 bg-gray-700 hover:bg-gray-600 text-white font-medium rounded-lg transition transform hover:scale-105"
              >
                Cancel
              </button>
              <button
                onClick={handleStartTraining}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-medium rounded-lg transition transform hover:scale-105 shadow-lg flex items-center justify-center gap-2"
              >
                <span>▶️</span>
                Start Training
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Dashboard
