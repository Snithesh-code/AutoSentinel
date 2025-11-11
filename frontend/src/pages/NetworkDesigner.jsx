import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { networksAPI } from '../utils/api'
import { useToast } from '../contexts/ToastContext'
import { networkToYAML, downloadYAML } from '../utils/yamlExport'
import Navbar from '../components/Navbar'
import {
  NODE_TYPES,
  PREDEFINED_PORTS,
  PREDEFINED_PROTOCOLS,
  BANDWIDTH_OPTIONS,
  COMMON_SUBNETS,
  NETWORK_TEMPLATES,
  AVAILABLE_SERVICES,
  AVAILABLE_APPLICATIONS,
  AGENT_TYPES,
  AGENT_TEAMS,
  RED_TEAM_ACTIONS,
  BLUE_TEAM_ACTIONS,
  GREEN_TEAM_ACTIONS,
  REWARD_COMPONENTS,
  ACTION_OPTIONS_MAP,
  getRecommendedPorts
} from '../utils/networkConstants'

// Available observation spaces for agents
const OBSERVATION_SPACES = [
  { value: 'acl', label: 'ACL Observation' },
  { value: 'file', label: 'File Observation' },
  { value: 'folder', label: 'Folder Observation' },
  { value: 'firewall', label: 'Firewall Observation' },
  { value: 'host', label: 'Host Observation' },
  { value: 'link', label: 'Link Observation' },
  { value: 'links', label: 'Links Observation' },
  { value: 'network-interface', label: 'Network Interface Observation' },
  { value: 'port', label: 'Port Observation' },
  { value: 'nodes', label: 'Nodes Observation' },
  { value: 'custom', label: 'Custom Nested Observation' },
  { value: 'none', label: 'None (No Observation)' },
  { value: 'router', label: 'Router Observation' },
  { value: 'service', label: 'Service Observation' },
  { value: 'application', label: 'Application Observation' }
]

const NetworkDesigner = () => {
  const navigate = useNavigate()
  const { id } = useParams()
  const { success, error: showError } = useToast()
  const isEditMode = !!id

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [exporting, setExporting] = useState(false)

  // Network metadata
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [tags, setTags] = useState('')

  // Game settings
  const [maxEpisodeLength, setMaxEpisodeLength] = useState(128)
  const [selectedPorts, setSelectedPorts] = useState(['ARP', 'DNS', 'HTTP'])
  const [selectedProtocols, setSelectedProtocols] = useState(['ICMP', 'TCP', 'UDP'])

  // Nodes and Links
  const [nodes, setNodes] = useState([])
  const [links, setLinks] = useState([])

  // Agents (for ML training)
  const [agents, setAgents] = useState([])

  // UI State
  const [activeTab, setActiveTab] = useState('basic')
  const [showTemplates, setShowTemplates] = useState(false)

  useEffect(() => {
    if (isEditMode) {
      loadNetwork()
    }
  }, [id])

  const loadNetwork = async () => {
    try {
      setLoading(true)
      const response = await networksAPI.getById(id)
      const network = response.network

      setName(network.name)
      setDescription(network.description || '')
      setTags(network.tags?.join(', ') || '')

      if (network.config.game) {
        setMaxEpisodeLength(network.config.game.maxEpisodeLength || 128)
        setSelectedPorts(network.config.game.ports || ['ARP', 'DNS', 'HTTP'])
        setSelectedProtocols(network.config.game.protocols || ['ICMP', 'TCP', 'UDP'])
      }

      setNodes(network.config.nodes || [])
      setLinks(network.config.links || [])

      // Preserve observation_space as-is (can be array or complex object)
      const loadedAgents = (network.config.agents || []).map(agent => ({
        ...agent,
        observation_space: agent.observation_space !== undefined ? agent.observation_space : []
      }))
      setAgents(loadedAgents)
    } catch (err) {
      setError('Failed to load network')
      console.error('Load network error:', err)
    } finally {
      setLoading(false)
    }
  }

  const loadTemplate = (templateKey) => {
    const template = NETWORK_TEMPLATES[templateKey]
    if (!template || !template.config) {
      console.error('Template not found or invalid:', templateKey)
      return
    }
    setNodes(template.config.nodes || [])
    setLinks(template.config.links || [])

    // Preserve observation_space as-is (can be array or complex object)
    const templateAgents = (template.config.agents || []).map(agent => ({
      ...agent,
      observation_space: agent.observation_space !== undefined ? agent.observation_space : []
    }))
    setAgents(templateAgents)

    setName(template.name)
    setDescription(template.description)

    // Load game settings from template
    if (template.config.game) {
      setMaxEpisodeLength(template.config.game.maxEpisodeLength || 128)
      setSelectedPorts(template.config.game.ports || [])
      setSelectedProtocols(template.config.game.protocols || [])
    }

    setShowTemplates(false)
    setActiveTab('nodes')
  }

  const addNode = () => {
    const nodeNumber = nodes.length + 1
    const newNode = {
      hostname: `node-${nodeNumber}`,
      type: 'computer',
      ipAddress: `192.168.1.${10 + nodes.length}`,
      subnetMask: '255.255.255.0',
      defaultGateway: '192.168.1.1',
      numPorts: 8,
      services: [],
      applications: []
    }
    setNodes([...nodes, newNode])
  }

  const removeNode = (index) => {
    const nodeToRemove = nodes[index]
    setLinks(links.filter(link =>
      link.endpointAHostname !== nodeToRemove.hostname &&
      link.endpointBHostname !== nodeToRemove.hostname
    ))
    setNodes(nodes.filter((_, i) => i !== index))
  }

  const updateNode = (index, field, value) => {
    const updatedNodes = [...nodes]
    updatedNodes[index] = {
      ...updatedNodes[index],
      [field]: value
    }
    setNodes(updatedNodes)
  }

  const addLink = () => {
    if (nodes.length < 2) {
      alert('You need at least 2 nodes to create a link')
      return
    }

    const newLink = {
      endpointAHostname: nodes[0].hostname,
      endpointAPort: 1,
      endpointBHostname: nodes[1].hostname,
      endpointBPort: 1,
      bandwidth: 100
    }
    setLinks([...links, newLink])
  }

  const removeLink = (index) => {
    setLinks(links.filter((_, i) => i !== index))
  }

  const updateLink = (index, field, value) => {
    const updatedLinks = [...links]
    updatedLinks[index] = {
      ...updatedLinks[index],
      [field]: value
    }
    setLinks(updatedLinks)
  }

  const togglePort = (port) => {
    setSelectedPorts(prev =>
      prev.includes(port)
        ? prev.filter(p => p !== port)
        : [...prev, port]
    )
  }

  const toggleProtocol = (protocol) => {
    setSelectedProtocols(prev =>
      prev.includes(protocol)
        ? prev.filter(p => p !== protocol)
        : [...prev, protocol]
    )
  }

  // Service management functions
  const addServiceToNode = (nodeIndex) => {
    const updatedNodes = [...nodes]
    if (!updatedNodes[nodeIndex].services) updatedNodes[nodeIndex].services = []
    updatedNodes[nodeIndex].services.push({ type: '', options: {} })
    setNodes(updatedNodes)
  }

  const removeServiceFromNode = (nodeIndex, serviceIndex) => {
    const updatedNodes = [...nodes]
    updatedNodes[nodeIndex].services.splice(serviceIndex, 1)
    setNodes(updatedNodes)
  }

  const updateService = (nodeIndex, serviceIndex, field, value) => {
    const updatedNodes = [...nodes]
    if (field === 'type') {
      updatedNodes[nodeIndex].services[serviceIndex].type = value
      updatedNodes[nodeIndex].services[serviceIndex].options = {}
    } else {
      if (!updatedNodes[nodeIndex].services[serviceIndex].options) {
        updatedNodes[nodeIndex].services[serviceIndex].options = {}
      }
      updatedNodes[nodeIndex].services[serviceIndex].options[field] = value
    }
    setNodes(updatedNodes)
  }

  // Application management functions
  const addApplicationToNode = (nodeIndex) => {
    const updatedNodes = [...nodes]
    if (!updatedNodes[nodeIndex].applications) updatedNodes[nodeIndex].applications = []
    updatedNodes[nodeIndex].applications.push({ type: '', options: {} })
    setNodes(updatedNodes)
  }

  const removeApplicationFromNode = (nodeIndex, appIndex) => {
    const updatedNodes = [...nodes]
    updatedNodes[nodeIndex].applications.splice(appIndex, 1)
    setNodes(updatedNodes)
  }

  const updateApplication = (nodeIndex, appIndex, field, value) => {
    const updatedNodes = [...nodes]
    if (field === 'type') {
      updatedNodes[nodeIndex].applications[appIndex].type = value
      updatedNodes[nodeIndex].applications[appIndex].options = {}
    } else {
      if (!updatedNodes[nodeIndex].applications[appIndex].options) {
        updatedNodes[nodeIndex].applications[appIndex].options = {}
      }
      updatedNodes[nodeIndex].applications[appIndex].options[field] = value
    }
    setNodes(updatedNodes)
  }

  // Agent management functions
  const addAgent = () => {
    const newAgent = {
      ref: `agent_${agents.length + 1}`,
      team: 'RED',
      type: 'proxy-agent',
      agent_settings: { flatten_obs: true, action_masking: true, action_probabilities: {} },
      action_space: { action_map: { 0: { action: 'do-nothing', options: {} } } },
      observation_space: [],
      reward_function: { reward_components: [] }
    }
    setAgents([...agents, newAgent])
  }

  const removeAgent = (agentIndex) => {
    setAgents(agents.filter((_, i) => i !== agentIndex))
  }

  const updateAgent = (agentIndex, field, value) => {
    const updatedAgents = [...agents]
    if (field === 'agent_settings') {
      updatedAgents[agentIndex].agent_settings = { ...updatedAgents[agentIndex].agent_settings, ...value }
    } else {
      updatedAgents[agentIndex][field] = value
    }
    setAgents(updatedAgents)
  }

  const addActionToAgent = (agentIndex) => {
    const updatedAgents = [...agents]
    const actionMap = updatedAgents[agentIndex].action_space.action_map
    const nextId = Object.keys(actionMap).length
    actionMap[nextId] = { action: 'do-nothing', options: {} }
    setAgents(updatedAgents)
  }

  const removeActionFromAgent = (agentIndex, actionId) => {
    const updatedAgents = [...agents]
    delete updatedAgents[agentIndex].action_space.action_map[actionId]
    const actions = Object.values(updatedAgents[agentIndex].action_space.action_map)
    updatedAgents[agentIndex].action_space.action_map = {}
    actions.forEach((action, idx) => {
      updatedAgents[agentIndex].action_space.action_map[idx] = action
    })
    setAgents(updatedAgents)
  }

  const updateAgentAction = (agentIndex, actionId, field, value) => {
    const updatedAgents = [...agents]
    if (field === 'action') {
      updatedAgents[agentIndex].action_space.action_map[actionId] = { action: value, options: {} }
    } else {
      updatedAgents[agentIndex].action_space.action_map[actionId].options[field] = value
    }
    setAgents(updatedAgents)
  }

  const updateAgentProbability = (agentIndex, actionId, probability) => {
    const updatedAgents = [...agents]
    if (!updatedAgents[agentIndex].agent_settings.action_probabilities) {
      updatedAgents[agentIndex].agent_settings.action_probabilities = {}
    }
    updatedAgents[agentIndex].agent_settings.action_probabilities[actionId] = parseFloat(probability)
    setAgents(updatedAgents)
  }

  const updateAgentObservationSpace = (agentIndex, observations) => {
    const updatedAgents = [...agents]
    updatedAgents[agentIndex].observation_space = observations
    setAgents(updatedAgents)
  }

  const addRewardToAgent = (agentIndex) => {
    const updatedAgents = [...agents]
    updatedAgents[agentIndex].reward_function.reward_components.push({ type: '', weight: 1.0, options: {} })
    setAgents(updatedAgents)
  }

  const removeRewardFromAgent = (agentIndex, rewardIndex) => {
    const updatedAgents = [...agents]
    updatedAgents[agentIndex].reward_function.reward_components.splice(rewardIndex, 1)
    setAgents(updatedAgents)
  }

  const updateAgentReward = (agentIndex, rewardIndex, field, value) => {
    const updatedAgents = [...agents]
    const reward = updatedAgents[agentIndex].reward_function.reward_components[rewardIndex]
    if (field === 'type') {
      reward.type = value
      reward.options = {}
    } else if (field === 'weight') {
      reward.weight = parseFloat(value)
    } else {
      reward.options[field] = value
    }
    setAgents(updatedAgents)
  }

  const handleSave = async () => {
    // Validation
    if (!name.trim()) {
      setError('Network name is required')
      return
    }

    if (nodes.length === 0) {
      setError('At least one node is required')
      return
    }

    if (links.length === 0) {
      setError('At least one link is required')
      return
    }

    const hostnames = nodes.map(n => n.hostname)
    const duplicates = hostnames.filter((h, i) => hostnames.indexOf(h) !== i)
    if (duplicates.length > 0) {
      setError(`Duplicate hostnames found: ${duplicates.join(', ')}`)
      return
    }

    try {
      setSaving(true)
      setError('')

      const networkData = {
        name: name.trim(),
        description: description.trim(),
        tags: tags.split(',').map(t => t.trim()).filter(t => t),
        config: {
          game: {
            maxEpisodeLength: parseInt(maxEpisodeLength),
            ports: selectedPorts,
            protocols: selectedProtocols
          },
          nodes,
          links,
          agents
        }
      }

      if (isEditMode) {
        await networksAPI.update(id, networkData)
      } else {
        await networksAPI.create(networkData)
      }

      success('✓ Network saved successfully!')
      navigate('/dashboard')
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save network')
      showError('✕ Failed to save network', 3000)
      console.error('Save network error:', err)
    } finally {
      setSaving(false)
    }
  }

  const handleExportYAML = () => {
    // Validation
    if (!name.trim()) {
      setError('Network name is required')
      showError('✕ Network name is required', 3000)
      return
    }

    if (nodes.length === 0) {
      setError('At least one node is required')
      showError('✕ At least one node is required', 3000)
      return
    }

    if (links.length === 0) {
      setError('At least one link is required')
      showError('✕ At least one link is required', 3000)
      return
    }

    try {
      setExporting(true)
      setError('')

      const networkData = {
        name: name.trim(),
        description: description.trim(),
        tags: tags.split(',').map(t => t.trim()).filter(t => t),
        config: {
          game: {
            maxEpisodeLength: parseInt(maxEpisodeLength),
            ports: selectedPorts,
            protocols: selectedProtocols
          },
          nodes,
          links,
          agents
        }
      }

      const yamlContent = networkToYAML(networkData)
      const fileName = name.trim().toLowerCase().replace(/\s+/g, '-')
      downloadYAML(yamlContent, fileName)

      success(`📥 Network exported as ${fileName}.yaml`)
    } catch (err) {
      setError('Failed to export network')
      showError('✕ Failed to export network', 3000)
      console.error('Export network error:', err)
    } finally {
      setExporting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          <p className="mt-4 text-gray-400">Loading network...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Navigation */}
      <Navbar />

      {/* Page Header */}
      <div className="bg-gray-800 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-white">
                {isEditMode ? 'Edit Network' : 'Create Network'}
              </h1>
              {!isEditMode && (
                <button
                  onClick={() => setShowTemplates(!showTemplates)}
                  className="text-sm text-blue-400 hover:text-blue-300 mt-1"
                >
                  {showTemplates ? 'Hide' : 'Start from'} templates
                </button>
              )}
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => navigate('/dashboard')}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition"
              >
                Cancel
              </button>
              <button
                onClick={handleExportYAML}
                disabled={exporting}
                className="px-6 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-800 disabled:cursor-not-allowed text-white rounded-lg transition flex items-center gap-2"
                title="Export network configuration as YAML file"
              >
                {exporting ? (
                  <>
                    <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Exporting...
                  </>
                ) : (
                  <>📥 Export YAML</>
                )}
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 disabled:cursor-not-allowed text-white rounded-lg transition flex items-center gap-2"
              >
                {saving ? (
                  <>
                    <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Saving...
                  </>
                ) : (
                  '💾 Save Network'
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Templates */}
        {showTemplates && !isEditMode && (
          <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(NETWORK_TEMPLATES).map(([key, template]) => (
              <div
                key={key}
                onClick={() => loadTemplate(key)}
                className="bg-gray-800 border border-gray-700 rounded-lg p-4 cursor-pointer hover:border-blue-500 transition"
              >
                <h3 className="text-lg font-semibold text-white mb-2">{template.name}</h3>
                <p className="text-gray-400 text-sm mb-3">{template.description}</p>
                <div className="flex gap-4 text-xs text-gray-500">
                  <span>{template.config?.nodes?.length || 0} nodes</span>
                  <span>{template.config?.links?.length || 0} links</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500 rounded-lg">
            <p className="text-red-400">{error}</p>
          </div>
        )}

        {/* Tabs */}
        <div className="mb-6 border-b border-gray-700">
          <nav className="flex gap-4">
            {['basic', 'nodes', 'links', 'agents', 'game'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`pb-3 px-2 border-b-2 font-medium transition capitalize ${
                  activeTab === tab
                    ? 'border-blue-500 text-blue-400'
                    : 'border-transparent text-gray-400 hover:text-gray-300'
                }`}
              >
                {tab === 'basic' ? 'Basic Info' : tab === 'game' ? 'Game Settings' : tab}
                {tab === 'nodes' && ` (${nodes.length})`}
                {tab === 'links' && ` (${links.length})`}
                {tab === 'agents' && ` (${agents.length})`}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
          {/* Basic Info Tab */}
          {activeTab === 'basic' && (
            <div className="space-y-6">
              <h3 className="text-xl font-semibold text-white mb-4">Network Information</h3>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Network Name *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="My Network"
                  className="w-full px-4 py-3 bg-gray-900 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe your network..."
                  rows={4}
                  className="w-full px-4 py-3 bg-gray-900 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Tags (comma-separated)
                </label>
                <input
                  type="text"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  placeholder="enterprise, firewall, secure"
                  className="w-full px-4 py-3 bg-gray-900 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          )}

          {/* Nodes Tab */}
          {activeTab === 'nodes' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-semibold text-white">Network Nodes</h3>
                <button
                  onClick={addNode}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition flex items-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Add Node
                </button>
              </div>

              {nodes.length === 0 ? (
                <div className="text-center py-8 bg-gray-900 rounded-lg border border-gray-700">
                  <p className="text-gray-400">No nodes yet. Click "Add Node" to get started.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {nodes.map((node, index) => (
                    <div key={index} className="bg-gray-900 rounded-lg border border-gray-700 p-4">
                      <div className="flex justify-between items-start mb-4">
                        <h4 className="text-lg font-medium text-white">Node {index + 1}</h4>
                        <button
                          onClick={() => removeNode(index)}
                          className="text-red-400 hover:text-red-300"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm text-gray-400 mb-1">Hostname *</label>
                          <input
                            type="text"
                            value={node.hostname}
                            onChange={(e) => updateNode(index, 'hostname', e.target.value)}
                            className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded text-white text-sm"
                          />
                        </div>

                        <div>
                          <label className="block text-sm text-gray-400 mb-1">Type *</label>
                          <select
                            value={node.type}
                            onChange={(e) => updateNode(index, 'type', e.target.value)}
                            className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded text-white text-sm"
                          >
                            {NODE_TYPES.map(type => (
                              <option key={type.value} value={type.value}>
                                {type.icon} {type.label}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm text-gray-400 mb-1">IP Address</label>
                          <input
                            type="text"
                            value={node.ipAddress || ''}
                            onChange={(e) => updateNode(index, 'ipAddress', e.target.value)}
                            placeholder="192.168.1.10"
                            className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded text-white text-sm"
                          />
                        </div>

                        <div>
                          <label className="block text-sm text-gray-400 mb-1">Subnet Mask</label>
                          <select
                            value={node.subnetMask || '255.255.255.0'}
                            onChange={(e) => updateNode(index, 'subnetMask', e.target.value)}
                            className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded text-white text-sm"
                          >
                            {COMMON_SUBNETS.map(subnet => (
                              <option key={subnet.value} value={subnet.value}>
                                {subnet.label}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="col-span-2">
                          <label className="block text-sm text-gray-400 mb-1">Default Gateway</label>
                          <input
                            type="text"
                            value={node.defaultGateway || ''}
                            onChange={(e) => updateNode(index, 'defaultGateway', e.target.value)}
                            placeholder="192.168.1.1"
                            className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded text-white text-sm"
                          />
                        </div>
                      </div>

                      {/* Services Section */}
                      <div className="mt-4 border-t border-gray-700 pt-4">
                        <h4 className="font-semibold text-white mb-3">Services</h4>
                        {node.services?.map((service, serviceIdx) => (
                          <div key={serviceIdx} className="bg-gray-700/50 p-4 rounded mb-3">
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <label className="block text-sm text-gray-300 mb-1">Service Type</label>
                                <select
                                  value={service.type}
                                  onChange={(e) => updateService(index, serviceIdx, 'type', e.target.value)}
                                  className="w-full bg-gray-800 border border-gray-600 text-white rounded px-3 py-2 text-sm"
                                >
                                  <option value="">Select Service</option>
                                  {AVAILABLE_SERVICES.map(s => (
                                    <option key={s.value} value={s.value}>{s.label}</option>
                                  ))}
                                </select>
                              </div>
                              <div className="flex items-end">
                                <button
                                  onClick={() => removeServiceFromNode(index, serviceIdx)}
                                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded text-sm"
                                >
                                  Remove
                                </button>
                              </div>
                            </div>

                            {/* Service-specific options */}
                            {service.type === 'dns-server' && (
                              <div className="mt-3">
                                <label className="block text-sm text-gray-300 mb-1">Domain Mapping (JSON)</label>
                                <textarea
                                  placeholder='{"example.com": "192.168.1.100"}'
                                  value={JSON.stringify(service.options?.domain_mapping || {})}
                                  onChange={(e) => {
                                    try {
                                      const mapping = JSON.parse(e.target.value)
                                      updateService(index, serviceIdx, 'domain_mapping', mapping)
                                    } catch (err) {}
                                  }}
                                  className="w-full bg-gray-800 border border-gray-600 text-white rounded px-3 py-2 text-sm"
                                  rows="2"
                                />
                              </div>
                            )}

                            {service.type === 'database-service' && (
                              <div className="mt-3">
                                <label className="block text-sm text-gray-300 mb-1">Backup Server IP</label>
                                <input
                                  type="text"
                                  placeholder="192.168.1.16"
                                  value={service.options?.backup_server_ip || ''}
                                  onChange={(e) => updateService(index, serviceIdx, 'backup_server_ip', e.target.value)}
                                  className="w-full bg-gray-800 border border-gray-600 text-white rounded px-3 py-2 text-sm"
                                />
                              </div>
                            )}
                          </div>
                        ))}
                        <button
                          onClick={() => addServiceToNode(index)}
                          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm"
                        >
                          + Add Service
                        </button>
                      </div>

                      {/* Applications Section */}
                      <div className="mt-4 border-t border-gray-700 pt-4">
                        <h4 className="font-semibold text-white mb-3">Applications</h4>
                        {node.applications?.map((app, appIdx) => (
                          <div key={appIdx} className="bg-gray-700/50 p-4 rounded mb-3">
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <label className="block text-sm text-gray-300 mb-1">Application Type</label>
                                <select
                                  value={app.type}
                                  onChange={(e) => updateApplication(index, appIdx, 'type', e.target.value)}
                                  className="w-full bg-gray-800 border border-gray-600 text-white rounded px-3 py-2 text-sm"
                                >
                                  <option value="">Select Application</option>
                                  {AVAILABLE_APPLICATIONS.filter(a =>
                                    node.type === 'computer' || node.type === 'server'
                                  ).map(a => (
                                    <option key={a.value} value={a.value}>
                                      {a.label} {a.team === 'red' ? '🔴' : ''}
                                    </option>
                                  ))}
                                </select>
                              </div>
                              <div className="flex items-end">
                                <button
                                  onClick={() => removeApplicationFromNode(index, appIdx)}
                                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded text-sm"
                                >
                                  Remove
                                </button>
                              </div>
                            </div>

                            {/* Application-specific options */}
                            {app.type === 'web-browser' && (
                              <div className="mt-3">
                                <label className="block text-sm text-gray-300 mb-1">Target URL</label>
                                <input
                                  type="text"
                                  placeholder="http://example.com"
                                  value={app.options?.target_url || ''}
                                  onChange={(e) => updateApplication(index, appIdx, 'target_url', e.target.value)}
                                  className="w-full bg-gray-800 border border-gray-600 text-white rounded px-3 py-2 text-sm"
                                />
                              </div>
                            )}

                            {app.type === 'database-client' && (
                              <div className="mt-3">
                                <label className="block text-sm text-gray-300 mb-1">Database Server IP</label>
                                <input
                                  type="text"
                                  placeholder="192.168.1.14"
                                  value={app.options?.db_server_ip || ''}
                                  onChange={(e) => updateApplication(index, appIdx, 'db_server_ip', e.target.value)}
                                  className="w-full bg-gray-800 border border-gray-600 text-white rounded px-3 py-2 text-sm"
                                />
                              </div>
                            )}

                            {app.type === 'dos-bot' && (
                              <div className="grid grid-cols-2 gap-3 mt-3">
                                <div>
                                  <label className="block text-sm text-gray-300 mb-1">Target IP</label>
                                  <input
                                    type="text"
                                    placeholder="192.168.1.12"
                                    value={app.options?.target_ip_address || ''}
                                    onChange={(e) => updateApplication(index, appIdx, 'target_ip_address', e.target.value)}
                                    className="w-full bg-gray-800 border border-gray-600 text-white rounded px-3 py-2 text-sm"
                                  />
                                </div>
                                <div>
                                  <label className="block text-sm text-gray-300 mb-1">Target Port</label>
                                  <select
                                    value={app.options?.target_port || ''}
                                    onChange={(e) => updateApplication(index, appIdx, 'target_port', e.target.value)}
                                    className="w-full bg-gray-800 border border-gray-600 text-white rounded px-3 py-2 text-sm"
                                  >
                                    <option value="">Select Port</option>
                                    {PREDEFINED_PORTS.map(p => (
                                      <option key={p.value} value={p.value}>{p.label}</option>
                                    ))}
                                  </select>
                                </div>
                                <div>
                                  <label className="block text-sm text-gray-300 mb-1">Payload</label>
                                  <input
                                    type="text"
                                    placeholder="SPOOF DATA"
                                    value={app.options?.payload || ''}
                                    onChange={(e) => updateApplication(index, appIdx, 'payload', e.target.value)}
                                    className="w-full bg-gray-800 border border-gray-600 text-white rounded px-3 py-2 text-sm"
                                  />
                                </div>
                                <div>
                                  <label className="block text-sm text-gray-300 mb-1">DoS Intensity (0-1)</label>
                                  <input
                                    type="number"
                                    step="0.1"
                                    min="0"
                                    max="1"
                                    placeholder="1.0"
                                    value={app.options?.dos_intensity || ''}
                                    onChange={(e) => updateApplication(index, appIdx, 'dos_intensity', e.target.value)}
                                    className="w-full bg-gray-800 border border-gray-600 text-white rounded px-3 py-2 text-sm"
                                  />
                                </div>
                                <div>
                                  <label className="block text-sm text-gray-300 mb-1">Max Sessions</label>
                                  <input
                                    type="number"
                                    placeholder="1000"
                                    value={app.options?.max_sessions || ''}
                                    onChange={(e) => updateApplication(index, appIdx, 'max_sessions', e.target.value)}
                                    className="w-full bg-gray-800 border border-gray-600 text-white rounded px-3 py-2 text-sm"
                                  />
                                </div>
                              </div>
                            )}

                            {app.type === 'c2-beacon' && (
                              <div className="grid grid-cols-2 gap-3 mt-3">
                                <div>
                                  <label className="block text-sm text-gray-300 mb-1">C2 Server IP</label>
                                  <input
                                    type="text"
                                    placeholder="192.168.10.200"
                                    value={app.options?.c2_server_ip_address || ''}
                                    onChange={(e) => updateApplication(index, appIdx, 'c2_server_ip_address', e.target.value)}
                                    className="w-full bg-gray-800 border border-gray-600 text-white rounded px-3 py-2 text-sm"
                                  />
                                </div>
                                <div>
                                  <label className="block text-sm text-gray-300 mb-1">Keep Alive Frequency (sec)</label>
                                  <input
                                    type="number"
                                    placeholder="5"
                                    value={app.options?.keep_alive_frequency || ''}
                                    onChange={(e) => updateApplication(index, appIdx, 'keep_alive_frequency', e.target.value)}
                                    className="w-full bg-gray-800 border border-gray-600 text-white rounded px-3 py-2 text-sm"
                                  />
                                </div>
                                <div>
                                  <label className="block text-sm text-gray-300 mb-1">Masquerade Protocol</label>
                                  <select
                                    value={app.options?.masquerade_protocol || ''}
                                    onChange={(e) => updateApplication(index, appIdx, 'masquerade_protocol', e.target.value)}
                                    className="w-full bg-gray-800 border border-gray-600 text-white rounded px-3 py-2 text-sm"
                                  >
                                    {PREDEFINED_PROTOCOLS.map(p => (
                                      <option key={p.value} value={p.value}>{p.label}</option>
                                    ))}
                                  </select>
                                </div>
                                <div>
                                  <label className="block text-sm text-gray-300 mb-1">Masquerade Port</label>
                                  <select
                                    value={app.options?.masquerade_port || ''}
                                    onChange={(e) => updateApplication(index, appIdx, 'masquerade_port', e.target.value)}
                                    className="w-full bg-gray-800 border border-gray-600 text-white rounded px-3 py-2 text-sm"
                                  >
                                    {PREDEFINED_PORTS.map(p => (
                                      <option key={p.value} value={p.value}>{p.label}</option>
                                    ))}
                                  </select>
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                        <button
                          onClick={() => addApplicationToNode(index)}
                          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm"
                        >
                          + Add Application
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Links Tab */}
          {activeTab === 'links' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-semibold text-white">Network Links</h3>
                <button
                  onClick={addLink}
                  disabled={nodes.length < 2}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition flex items-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Add Link
                </button>
              </div>

              {links.length === 0 ? (
                <div className="text-center py-8 bg-gray-900 rounded-lg border border-gray-700">
                  <p className="text-gray-400">
                    {nodes.length < 2
                      ? 'Add at least 2 nodes before creating links'
                      : 'No links yet. Click "Add Link" to connect nodes.'}
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {links.map((link, index) => (
                    <div key={index} className="bg-gray-900 rounded-lg border border-gray-700 p-4">
                      <div className="flex justify-between items-start mb-4">
                        <h4 className="text-lg font-medium text-white">Link {index + 1}</h4>
                        <button
                          onClick={() => removeLink(index)}
                          className="text-red-400 hover:text-red-300"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm text-gray-400 mb-1">Endpoint A Hostname *</label>
                          <select
                            value={link.endpointAHostname}
                            onChange={(e) => updateLink(index, 'endpointAHostname', e.target.value)}
                            className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded text-white text-sm"
                          >
                            {nodes.map(node => (
                              <option key={node.hostname} value={node.hostname}>{node.hostname}</option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm text-gray-400 mb-1">Endpoint A Port *</label>
                          <input
                            type="number"
                            value={link.endpointAPort}
                            onChange={(e) => updateLink(index, 'endpointAPort', parseInt(e.target.value))}
                            className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded text-white text-sm"
                          />
                        </div>

                        <div>
                          <label className="block text-sm text-gray-400 mb-1">Endpoint B Hostname *</label>
                          <select
                            value={link.endpointBHostname}
                            onChange={(e) => updateLink(index, 'endpointBHostname', e.target.value)}
                            className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded text-white text-sm"
                          >
                            {nodes.map(node => (
                              <option key={node.hostname} value={node.hostname}>{node.hostname}</option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm text-gray-400 mb-1">Endpoint B Port *</label>
                          <input
                            type="number"
                            value={link.endpointBPort}
                            onChange={(e) => updateLink(index, 'endpointBPort', parseInt(e.target.value))}
                            className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded text-white text-sm"
                          />
                        </div>

                        <div className="col-span-2">
                          <label className="block text-sm text-gray-400 mb-1">Bandwidth</label>
                          <select
                            value={link.bandwidth}
                            onChange={(e) => updateLink(index, 'bandwidth', parseInt(e.target.value))}
                            className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded text-white text-sm"
                          >
                            {BANDWIDTH_OPTIONS.map(option => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Agents Tab */}
          {activeTab === 'agents' && (
            <div className="space-y-6">
              <div className="bg-yellow-500/10 border border-yellow-500 p-4 rounded-lg">
                <p className="text-yellow-400 text-sm">
                  ⚠️ Agents are required for ML training. Configure at least one RED (attacker) and one BLUE (defender) agent.
                </p>
              </div>

              {agents.length === 0 ? (
                <div className="text-center py-8 bg-gray-900 rounded-lg border border-gray-700">
                  <p className="text-gray-400">No agents yet. Click "Add Agent" to get started.</p>
                </div>
              ) : (
                agents.map((agent, agentIdx) => (
                  <div key={agentIdx} className="bg-gray-900 border-2 border-gray-700 rounded-lg p-6">
                    <div className="flex justify-between items-start mb-4">
                      <h4 className="text-lg font-medium text-white">Agent {agentIdx + 1}</h4>
                      <button
                        onClick={() => removeAgent(agentIdx)}
                        className="text-red-400 hover:text-red-300"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>

                    {/* Agent Basic Info */}
                    <div className="grid grid-cols-3 gap-4 mb-4">
                      <div>
                        <label className="block text-sm text-gray-400 mb-1">Agent Reference ID</label>
                        <input
                          type="text"
                          value={agent.ref}
                          onChange={(e) => updateAgent(agentIdx, 'ref', e.target.value)}
                          className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded text-white text-sm"
                          placeholder="e.g., attacker, defender"
                        />
                      </div>

                      <div>
                        <label className="block text-sm text-gray-400 mb-1">Team</label>
                        <select
                          value={agent.team}
                          onChange={(e) => updateAgent(agentIdx, 'team', e.target.value)}
                          className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded text-white text-sm"
                        >
                          {AGENT_TEAMS.map(team => (
                            <option key={team.value} value={team.value}>{team.label}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm text-gray-400 mb-1">Agent Type</label>
                        <select
                          value={agent.type}
                          onChange={(e) => updateAgent(agentIdx, 'type', e.target.value)}
                          className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded text-white text-sm"
                        >
                          {AGENT_TYPES.map(type => (
                            <option key={type.value} value={type.value}>{type.label}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="border-t border-gray-700 pt-4 mt-4">
                      <h4 className="font-semibold text-white mb-3">Actions</h4>

                      {Object.entries(agent.action_space?.action_map || {}).map(([actionId, actionDef]) => {
                        const availableActions =
                          agent.team === 'RED' ? RED_TEAM_ACTIONS :
                          agent.team === 'BLUE' ? BLUE_TEAM_ACTIONS :
                          GREEN_TEAM_ACTIONS

                        return (
                          <div key={actionId} className="bg-gray-700/50 p-4 rounded mb-3">
                            <div className="grid grid-cols-3 gap-4">
                              <div>
                                <label className="block text-sm text-gray-300 mb-1">Action ID</label>
                                <input
                                  type="text"
                                  value={actionId}
                                  disabled
                                  className="w-full bg-gray-600 border border-gray-600 text-gray-400 rounded px-3 py-2 text-sm"
                                />
                              </div>

                              <div>
                                <label className="block text-sm text-gray-300 mb-1">Action Type</label>
                                <select
                                  value={actionDef.action}
                                  onChange={(e) => updateAgentAction(agentIdx, actionId, 'action', e.target.value)}
                                  className="w-full bg-gray-800 border border-gray-600 text-white rounded px-3 py-2 text-sm"
                                >
                                  <option value="">Select Action</option>
                                  {availableActions.map(action => (
                                    <option key={action.value} value={action.value}>{action.label}</option>
                                  ))}
                                </select>
                              </div>

                              {agent.type === 'probabilistic-agent' && (
                                <div>
                                  <label className="block text-sm text-gray-300 mb-1">Probability (0-1)</label>
                                  <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    max="1"
                                    value={agent.agent_settings?.action_probabilities?.[actionId] || 0}
                                    onChange={(e) => updateAgentProbability(agentIdx, actionId, e.target.value)}
                                    className="w-full bg-gray-800 border border-gray-600 text-white rounded px-3 py-2 text-sm"
                                  />
                                </div>
                              )}
                            </div>

                            {/* Action-specific options - dynamically rendered based on ACTION_OPTIONS_MAP */}
                            {actionDef.action && actionDef.action !== 'do-nothing' && ACTION_OPTIONS_MAP[actionDef.action] && (
                              <div className="mt-3 p-3 bg-gray-800/50 rounded border border-gray-600">
                                <p className="text-xs text-gray-400 mb-2">{ACTION_OPTIONS_MAP[actionDef.action].description || 'Configure action options:'}</p>
                                <div className="grid grid-cols-2 gap-3">
                                  {/* Node Name */}
                                  {(ACTION_OPTIONS_MAP[actionDef.action].requiredOptions.includes('node_name') ||
                                    ACTION_OPTIONS_MAP[actionDef.action].requiredOptions.includes('source_node')) && (
                                    <div>
                                      <label className="block text-sm text-gray-300 mb-1">
                                        {ACTION_OPTIONS_MAP[actionDef.action].requiredOptions.includes('source_node') ? 'Source Node' : 'Node Name'} *
                                      </label>
                                      <select
                                        value={actionDef.options?.[ACTION_OPTIONS_MAP[actionDef.action].requiredOptions.includes('source_node') ? 'source_node' : 'node_name'] || ''}
                                        onChange={(e) => updateAgentAction(agentIdx, actionId, ACTION_OPTIONS_MAP[actionDef.action].requiredOptions.includes('source_node') ? 'source_node' : 'node_name', e.target.value)}
                                        className="w-full bg-gray-700 border border-gray-600 text-white rounded px-2 py-1 text-sm"
                                      >
                                        <option value="">Select Node</option>
                                        {nodes.map(node => (
                                          <option key={node.hostname} value={node.hostname}>{node.hostname}</option>
                                        ))}
                                      </select>
                                    </div>
                                  )}

                                  {/* Service Name - context-aware */}
                                  {ACTION_OPTIONS_MAP[actionDef.action].requiredOptions.includes('service_name') && (
                                    <div>
                                      <label className="block text-sm text-gray-300 mb-1">Service Name *</label>
                                      <select
                                        value={actionDef.options?.service_name || ''}
                                        onChange={(e) => updateAgentAction(agentIdx, actionId, 'service_name', e.target.value)}
                                        className="w-full bg-gray-700 border border-gray-600 text-white rounded px-2 py-1 text-sm"
                                      >
                                        <option value="">Select Service</option>
                                        {actionDef.options?.node_name &&
                                          nodes.find(n => n.hostname === actionDef.options.node_name)?.services?.map((service, idx) => (
                                            <option key={idx} value={service.type}>{service.type}</option>
                                          ))
                                        }
                                      </select>
                                    </div>
                                  )}

                                  {/* Application Name - context-aware */}
                                  {ACTION_OPTIONS_MAP[actionDef.action].requiredOptions.includes('application_name') && (
                                    <div>
                                      <label className="block text-sm text-gray-300 mb-1">Application Name *</label>
                                      <select
                                        value={actionDef.options?.application_name || ''}
                                        onChange={(e) => updateAgentAction(agentIdx, actionId, 'application_name', e.target.value)}
                                        className="w-full bg-gray-700 border border-gray-600 text-white rounded px-2 py-1 text-sm"
                                      >
                                        <option value="">Select Application</option>
                                        {actionDef.options?.node_name &&
                                          nodes.find(n => n.hostname === actionDef.options.node_name)?.applications?.map((app, idx) => (
                                            <option key={idx} value={app.type}>{app.type}</option>
                                          ))
                                        }
                                      </select>
                                    </div>
                                  )}

                                  {/* Folder Name */}
                                  {ACTION_OPTIONS_MAP[actionDef.action].requiredOptions.includes('folder_name') && (
                                    <div>
                                      <label className="block text-sm text-gray-300 mb-1">Folder Name *</label>
                                      <input
                                        type="text"
                                        placeholder="e.g., database"
                                        value={actionDef.options?.folder_name || ''}
                                        onChange={(e) => updateAgentAction(agentIdx, actionId, 'folder_name', e.target.value)}
                                        className="w-full bg-gray-700 border border-gray-600 text-white rounded px-2 py-1 text-sm"
                                      />
                                    </div>
                                  )}

                                  {/* File Name */}
                                  {ACTION_OPTIONS_MAP[actionDef.action].requiredOptions.includes('file_name') && (
                                    <div>
                                      <label className="block text-sm text-gray-300 mb-1">File Name *</label>
                                      <input
                                        type="text"
                                        placeholder="e.g., database.db"
                                        value={actionDef.options?.file_name || ''}
                                        onChange={(e) => updateAgentAction(agentIdx, actionId, 'file_name', e.target.value)}
                                        className="w-full bg-gray-700 border border-gray-600 text-white rounded px-2 py-1 text-sm"
                                      />
                                    </div>
                                  )}

                                  {/* Target Router */}
                                  {ACTION_OPTIONS_MAP[actionDef.action].requiredOptions.includes('target_router') && (
                                    <div>
                                      <label className="block text-sm text-gray-300 mb-1">Target Router *</label>
                                      <select
                                        value={actionDef.options?.target_router || ''}
                                        onChange={(e) => updateAgentAction(agentIdx, actionId, 'target_router', e.target.value)}
                                        className="w-full bg-gray-700 border border-gray-600 text-white rounded px-2 py-1 text-sm"
                                      >
                                        <option value="">Select Router</option>
                                        {nodes.filter(n => n.type === 'router').map(router => (
                                          <option key={router.hostname} value={router.hostname}>{router.hostname}</option>
                                        ))}
                                      </select>
                                    </div>
                                  )}

                                  {/* Target/Remote IP Address */}
                                  {(ACTION_OPTIONS_MAP[actionDef.action].requiredOptions.includes('target_ip_address') ||
                                    ACTION_OPTIONS_MAP[actionDef.action].requiredOptions.includes('remote_ip') ||
                                    ACTION_OPTIONS_MAP[actionDef.action].optionalOptions.includes('target_ip_address')) && (
                                    <div>
                                      <label className="block text-sm text-gray-300 mb-1">
                                        {ACTION_OPTIONS_MAP[actionDef.action].requiredOptions.includes('remote_ip') ? 'Remote IP' : 'Target IP Address'}
                                        {ACTION_OPTIONS_MAP[actionDef.action].requiredOptions.includes('target_ip_address') ||
                                         ACTION_OPTIONS_MAP[actionDef.action].requiredOptions.includes('remote_ip') ? ' *' : ''}
                                      </label>
                                      <input
                                        type="text"
                                        placeholder="192.168.1.10"
                                        value={actionDef.options?.target_ip_address || actionDef.options?.remote_ip || ''}
                                        onChange={(e) => updateAgentAction(agentIdx, actionId,
                                          ACTION_OPTIONS_MAP[actionDef.action].requiredOptions.includes('remote_ip') ? 'remote_ip' : 'target_ip_address',
                                          e.target.value)}
                                        className="w-full bg-gray-700 border border-gray-600 text-white rounded px-2 py-1 text-sm"
                                      />
                                    </div>
                                  )}

                                  {/* C2 Server IP */}
                                  {(ACTION_OPTIONS_MAP[actionDef.action].requiredOptions.includes('c2_server_ip_address') ||
                                    ACTION_OPTIONS_MAP[actionDef.action].optionalOptions.includes('c2_server_ip_address')) && (
                                    <div>
                                      <label className="block text-sm text-gray-300 mb-1">C2 Server IP *</label>
                                      <input
                                        type="text"
                                        placeholder="192.168.10.200"
                                        value={actionDef.options?.c2_server_ip_address || ''}
                                        onChange={(e) => updateAgentAction(agentIdx, actionId, 'c2_server_ip_address', e.target.value)}
                                        className="w-full bg-gray-700 border border-gray-600 text-white rounded px-2 py-1 text-sm"
                                      />
                                    </div>
                                  )}

                                  {/* Target Port */}
                                  {ACTION_OPTIONS_MAP[actionDef.action].optionalOptions.includes('target_port') && (
                                    <div>
                                      <label className="block text-sm text-gray-300 mb-1">Target Port</label>
                                      <select
                                        value={actionDef.options?.target_port || ''}
                                        onChange={(e) => updateAgentAction(agentIdx, actionId, 'target_port', e.target.value)}
                                        className="w-full bg-gray-700 border border-gray-600 text-white rounded px-2 py-1 text-sm"
                                      >
                                        <option value="">Select Port</option>
                                        {PREDEFINED_PORTS.map(p => (
                                          <option key={p.value} value={p.value}>{p.label}</option>
                                        ))}
                                      </select>
                                    </div>
                                  )}

                                  {/* Payload */}
                                  {ACTION_OPTIONS_MAP[actionDef.action].optionalOptions.includes('payload') && (
                                    <div>
                                      <label className="block text-sm text-gray-300 mb-1">Payload</label>
                                      <input
                                        type="text"
                                        placeholder="SPOOF DATA"
                                        value={actionDef.options?.payload || ''}
                                        onChange={(e) => updateAgentAction(agentIdx, actionId, 'payload', e.target.value)}
                                        className="w-full bg-gray-700 border border-gray-600 text-white rounded px-2 py-1 text-sm"
                                      />
                                    </div>
                                  )}

                                  {/* DoS Intensity */}
                                  {ACTION_OPTIONS_MAP[actionDef.action].optionalOptions.includes('dos_intensity') && (
                                    <div>
                                      <label className="block text-sm text-gray-300 mb-1">DoS Intensity (0-1)</label>
                                      <input
                                        type="number"
                                        step="0.1"
                                        min="0"
                                        max="1"
                                        placeholder="1.0"
                                        value={actionDef.options?.dos_intensity || ''}
                                        onChange={(e) => updateAgentAction(agentIdx, actionId, 'dos_intensity', e.target.value)}
                                        className="w-full bg-gray-700 border border-gray-600 text-white rounded px-2 py-1 text-sm"
                                      />
                                    </div>
                                  )}

                                  {/* Max Sessions */}
                                  {ACTION_OPTIONS_MAP[actionDef.action].optionalOptions.includes('max_sessions') && (
                                    <div>
                                      <label className="block text-sm text-gray-300 mb-1">Max Sessions</label>
                                      <input
                                        type="number"
                                        placeholder="500"
                                        value={actionDef.options?.max_sessions || ''}
                                        onChange={(e) => updateAgentAction(agentIdx, actionId, 'max_sessions', e.target.value)}
                                        className="w-full bg-gray-700 border border-gray-600 text-white rounded px-2 py-1 text-sm"
                                      />
                                    </div>
                                  )}

                                  {/* Keep Alive Frequency */}
                                  {ACTION_OPTIONS_MAP[actionDef.action].optionalOptions.includes('keep_alive_frequency') && (
                                    <div>
                                      <label className="block text-sm text-gray-300 mb-1">Keep Alive Frequency (sec)</label>
                                      <input
                                        type="number"
                                        placeholder="5"
                                        value={actionDef.options?.keep_alive_frequency || ''}
                                        onChange={(e) => updateAgentAction(agentIdx, actionId, 'keep_alive_frequency', e.target.value)}
                                        className="w-full bg-gray-700 border border-gray-600 text-white rounded px-2 py-1 text-sm"
                                      />
                                    </div>
                                  )}

                                  {/* Masquerade Protocol */}
                                  {ACTION_OPTIONS_MAP[actionDef.action].optionalOptions.includes('masquerade_protocol') && (
                                    <div>
                                      <label className="block text-sm text-gray-300 mb-1">Masquerade Protocol</label>
                                      <select
                                        value={actionDef.options?.masquerade_protocol || ''}
                                        onChange={(e) => updateAgentAction(agentIdx, actionId, 'masquerade_protocol', e.target.value)}
                                        className="w-full bg-gray-700 border border-gray-600 text-white rounded px-2 py-1 text-sm"
                                      >
                                        <option value="">Select Protocol</option>
                                        {PREDEFINED_PROTOCOLS.map(p => (
                                          <option key={p.value} value={p.value}>{p.label}</option>
                                        ))}
                                      </select>
                                    </div>
                                  )}

                                  {/* Masquerade Port */}
                                  {ACTION_OPTIONS_MAP[actionDef.action].optionalOptions.includes('masquerade_port') && (
                                    <div>
                                      <label className="block text-sm text-gray-300 mb-1">Masquerade Port</label>
                                      <select
                                        value={actionDef.options?.masquerade_port || ''}
                                        onChange={(e) => updateAgentAction(agentIdx, actionId, 'masquerade_port', e.target.value)}
                                        className="w-full bg-gray-700 border border-gray-600 text-white rounded px-2 py-1 text-sm"
                                      >
                                        <option value="">Select Port</option>
                                        {PREDEFINED_PORTS.map(p => (
                                          <option key={p.value} value={p.value}>{p.label}</option>
                                        ))}
                                      </select>
                                    </div>
                                  )}

                                  {/* Server IP Address */}
                                  {ACTION_OPTIONS_MAP[actionDef.action].optionalOptions.includes('server_ip_address') && (
                                    <div>
                                      <label className="block text-sm text-gray-300 mb-1">Server IP Address</label>
                                      <input
                                        type="text"
                                        placeholder="192.168.1.14"
                                        value={actionDef.options?.server_ip_address || ''}
                                        onChange={(e) => updateAgentAction(agentIdx, actionId, 'server_ip_address', e.target.value)}
                                        className="w-full bg-gray-700 border border-gray-600 text-white rounded px-2 py-1 text-sm"
                                      />
                                    </div>
                                  )}

                                  {/* Server Password */}
                                  {ACTION_OPTIONS_MAP[actionDef.action].optionalOptions.includes('server_password') && (
                                    <div>
                                      <label className="block text-sm text-gray-300 mb-1">Server Password</label>
                                      <input
                                        type="text"
                                        placeholder="password"
                                        value={actionDef.options?.server_password || ''}
                                        onChange={(e) => updateAgentAction(agentIdx, actionId, 'server_password', e.target.value)}
                                        className="w-full bg-gray-700 border border-gray-600 text-white rounded px-2 py-1 text-sm"
                                      />
                                    </div>
                                  )}

                                  {/* NIC Number */}
                                  {ACTION_OPTIONS_MAP[actionDef.action].requiredOptions.includes('nic_num') && (
                                    <div>
                                      <label className="block text-sm text-gray-300 mb-1">NIC Number *</label>
                                      <input
                                        type="number"
                                        min="1"
                                        placeholder="1"
                                        value={actionDef.options?.nic_num || ''}
                                        onChange={(e) => updateAgentAction(agentIdx, actionId, 'nic_num', e.target.value)}
                                        className="w-full bg-gray-700 border border-gray-600 text-white rounded px-2 py-1 text-sm"
                                      />
                                    </div>
                                  )}

                                  {/* ACL Position */}
                                  {ACTION_OPTIONS_MAP[actionDef.action].requiredOptions.includes('position') && (
                                    <div>
                                      <label className="block text-sm text-gray-300 mb-1">ACL Position *</label>
                                      <input
                                        type="number"
                                        min="0"
                                        placeholder="0"
                                        value={actionDef.options?.position || ''}
                                        onChange={(e) => updateAgentAction(agentIdx, actionId, 'position', e.target.value)}
                                        className="w-full bg-gray-700 border border-gray-600 text-white rounded px-2 py-1 text-sm"
                                      />
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}

                            <button
                              onClick={() => removeActionFromAgent(agentIdx, actionId)}
                              className="mt-3 px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-sm"
                            >
                              Remove Action
                            </button>
                          </div>
                        )
                      })}

                      <button
                        onClick={() => addActionToAgent(agentIdx)}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm"
                      >
                        + Add Action
                      </button>

                      {agent.type === 'probabilistic-agent' && (
                        <div className="mt-3 p-3 bg-yellow-500/10 border border-yellow-500 rounded">
                          <p className="text-sm text-yellow-400">
                            Total Probability: {
                              Object.values(agent.agent_settings?.action_probabilities || {})
                                .reduce((sum, val) => sum + parseFloat(val || 0), 0)
                                .toFixed(2)
                            }
                            {Math.abs(
                              Object.values(agent.agent_settings?.action_probabilities || {})
                                .reduce((sum, val) => sum + parseFloat(val || 0), 0) - 1.0
                            ) > 0.01 && (
                              <span className="ml-2">⚠️ Must sum to 1.0</span>
                            )}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Observation Space - Only for proxy-agent */}
                    {agent.type === 'proxy-agent' && (
                      <div className="border-t border-gray-700 pt-4 mt-4">
                        <h4 className="font-semibold text-white mb-3">Observation Space</h4>
                        <p className="text-xs text-gray-400 mb-3">Click to select observation spaces for this agent</p>

                        {/* Check if observation_space is a complex custom object (from template) */}
                        {typeof agent.observation_space === 'object' && agent.observation_space !== null && !Array.isArray(agent.observation_space) && agent.observation_space.type === 'custom' ? (
                          <div className="bg-blue-500/10 border border-blue-500 rounded p-4 mb-4">
                            <p className="text-xs text-blue-400 font-semibold">✓ Custom Observation Space Configured</p>
                            <p className="text-xs text-blue-300 mt-2">This template uses a detailed custom observation space with {agent.observation_space.options.components?.length || 0} components</p>
                            <details className="mt-2 text-xs text-blue-300 cursor-pointer">
                              <summary className="font-semibold">View Details</summary>
                              <pre className="mt-2 bg-gray-900 p-2 rounded overflow-auto max-h-48 text-xs">{JSON.stringify(agent.observation_space, null, 2)}</pre>
                            </details>
                          </div>
                        ) : (
                          <div className="flex flex-wrap gap-2 bg-gray-700/30 p-4 rounded border border-gray-700">
                            {OBSERVATION_SPACES.map(obs => {
                              // Ensure observation_space is always an array
                              const obsArray = Array.isArray(agent.observation_space) ? agent.observation_space : []
                              const isSelected = obsArray.includes(obs.value)

                              return (
                                <button
                                  key={obs.value}
                                  onClick={() => {
                                    let newObs = Array.isArray(agent.observation_space) ? [...agent.observation_space] : []
                                    if (isSelected) {
                                      newObs = newObs.filter(o => o !== obs.value)
                                    } else {
                                      newObs = [...newObs, obs.value]
                                    }
                                    updateAgentObservationSpace(agentIdx, newObs)
                                  }}
                                  className={`px-3 py-2 rounded-full text-sm font-medium transition ${
                                    isSelected
                                      ? 'bg-blue-600 text-white border border-blue-500'
                                      : 'bg-gray-700 text-gray-300 border border-gray-600 hover:bg-gray-600'
                                  }`}
                                >
                                  {obs.label}
                                </button>
                              )
                            })}
                          </div>
                        )}

                        {Array.isArray(agent.observation_space) && agent.observation_space.length === 0 && (
                          <div className="mt-2 p-2 bg-yellow-500/10 border border-yellow-500 rounded">
                            <p className="text-xs text-yellow-400">⚠️ No observation spaces selected</p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Rewards */}
                    <div className="border-t border-gray-700 pt-4 mt-4">
                      <h4 className="font-semibold text-white mb-3">Reward Function</h4>

                      {agent.reward_function?.reward_components?.map((reward, rewardIdx) => (
                        <div key={rewardIdx} className="bg-gray-700/50 p-4 rounded mb-3">
                          <div className="grid grid-cols-3 gap-4">
                            <div className="col-span-2">
                              <label className="block text-sm text-gray-300 mb-1">Reward Type</label>
                              <select
                                value={reward.type}
                                onChange={(e) => updateAgentReward(agentIdx, rewardIdx, 'type', e.target.value)}
                                className="w-full bg-gray-800 border border-gray-600 text-white rounded px-3 py-2 text-sm"
                              >
                                <option value="">Select Reward</option>
                                {REWARD_COMPONENTS.map(r => (
                                  <option key={r.value} value={r.value}>{r.label}</option>
                                ))}
                              </select>
                            </div>
                            <div>
                              <label className="block text-sm text-gray-300 mb-1">Weight</label>
                              <input
                                type="number"
                                step="0.1"
                                value={reward.weight || 1.0}
                                onChange={(e) => updateAgentReward(agentIdx, rewardIdx, 'weight', e.target.value)}
                                className="w-full bg-gray-800 border border-gray-600 text-white rounded px-3 py-2 text-sm"
                              />
                            </div>
                          </div>

                          {reward.type === 'database-file-integrity' && (
                            <div className="grid grid-cols-2 gap-3 mt-3">
                              <input
                                type="text"
                                placeholder="Node Hostname"
                                value={reward.options?.node_hostname || ''}
                                onChange={(e) => updateAgentReward(agentIdx, rewardIdx, 'node_hostname', e.target.value)}
                                className="bg-gray-800 border border-gray-600 text-white rounded px-3 py-2 text-sm"
                              />
                              <input
                                type="text"
                                placeholder="Folder Name"
                                value={reward.options?.folder_name || ''}
                                onChange={(e) => updateAgentReward(agentIdx, rewardIdx, 'folder_name', e.target.value)}
                                className="bg-gray-800 border border-gray-600 text-white rounded px-3 py-2 text-sm"
                              />
                              <input
                                type="text"
                                placeholder="File Name"
                                value={reward.options?.file_name || ''}
                                onChange={(e) => updateAgentReward(agentIdx, rewardIdx, 'file_name', e.target.value)}
                                className="bg-gray-800 border border-gray-600 text-white rounded px-3 py-2 text-sm"
                              />
                            </div>
                          )}

                          <button
                            onClick={() => removeRewardFromAgent(agentIdx, rewardIdx)}
                            className="mt-3 px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-sm"
                          >
                            Remove Reward
                          </button>
                        </div>
                      ))}

                      <button
                        onClick={() => addRewardToAgent(agentIdx)}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm"
                      >
                        + Add Reward Component
                      </button>
                    </div>
                  </div>
                ))
              )}

              <button
                onClick={addAgent}
                className="w-full px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add Agent
              </button>
            </div>
          )}

          {/* Game Settings Tab */}
          {activeTab === 'game' && (
            <div className="space-y-6">
              <h3 className="text-xl font-semibold text-white mb-4">Simulation Settings</h3>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Max Episode Length
                </label>
                <input
                  type="number"
                  value={maxEpisodeLength}
                  onChange={(e) => setMaxEpisodeLength(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-900 border border-gray-600 rounded-lg text-white"
                />
                <p className="mt-1 text-xs text-gray-500">Maximum number of steps per episode</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-3">
                  Ports & Services
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {PREDEFINED_PORTS.map(port => (
                    <label
                      key={port.value}
                      className={`flex items-center p-3 rounded-lg border cursor-pointer transition ${
                        selectedPorts.includes(port.value)
                          ? 'bg-blue-500/20 border-blue-500'
                          : 'bg-gray-900 border-gray-600 hover:border-gray-500'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={selectedPorts.includes(port.value)}
                        onChange={() => togglePort(port.value)}
                        className="mr-3"
                      />
                      <div>
                        <div className="text-white text-sm font-medium">{port.value}</div>
                        <div className="text-gray-400 text-xs">{port.label}</div>
                      </div>
                    </label>
                  ))}
                </div>
                <p className="mt-2 text-xs text-gray-500">
                  Selected: {selectedPorts.length} port{selectedPorts.length !== 1 ? 's' : ''}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-3">
                  Protocols
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {PREDEFINED_PROTOCOLS.map(protocol => (
                    <label
                      key={protocol.value}
                      className={`flex items-center p-3 rounded-lg border cursor-pointer transition ${
                        selectedProtocols.includes(protocol.value)
                          ? 'bg-green-500/20 border-green-500'
                          : 'bg-gray-900 border-gray-600 hover:border-gray-500'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={selectedProtocols.includes(protocol.value)}
                        onChange={() => toggleProtocol(protocol.value)}
                        className="mr-3"
                      />
                      <div>
                        <div className="text-white text-sm font-medium">{protocol.value}</div>
                        <div className="text-gray-400 text-xs">{protocol.description}</div>
                      </div>
                    </label>
                  ))}
                </div>
                <p className="mt-2 text-xs text-gray-500">
                  Selected: {selectedProtocols.length} protocol{selectedProtocols.length !== 1 ? 's' : ''}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Summary */}
        <div className="mt-6 bg-gray-800 rounded-lg border border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-white mb-3">Network Summary</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div className="bg-gray-900 rounded-lg p-4">
              <div className="text-3xl font-bold text-blue-400">{nodes.length}</div>
              <div className="text-sm text-gray-400 mt-1">Nodes</div>
            </div>
            <div className="bg-gray-900 rounded-lg p-4">
              <div className="text-3xl font-bold text-green-400">{links.length}</div>
              <div className="text-sm text-gray-400 mt-1">Links</div>
            </div>
            <div className="bg-gray-900 rounded-lg p-4">
              <div className="text-3xl font-bold text-purple-400">{selectedPorts.length}</div>
              <div className="text-sm text-gray-400 mt-1">Ports</div>
            </div>
            <div className="bg-gray-900 rounded-lg p-4">
              <div className="text-3xl font-bold text-orange-400">{maxEpisodeLength}</div>
              <div className="text-sm text-gray-400 mt-1">Max Episodes</div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

export default NetworkDesigner
