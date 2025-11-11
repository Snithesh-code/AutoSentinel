import yaml from 'js-yaml'
import fs from 'fs/promises'
import path from 'path'

/**
 * Generate PrimAITE-compatible YAML from network configuration
 *
 * PrimAITE YAML Structure:
 * - metadata (version: 3.0) - REQUIRED
 * - io_settings - OPTIONAL
 * - game (max_episode_length, ports, protocols) - REQUIRED
 * - agents - REQUIRED for training
 * - simulation (network) - REQUIRED
 */
export const generateYAML = async (network) => {
  const config = {
    // REQUIRED: metadata section with version
    metadata: {
      version: 3.0
    },

    // OPTIONAL: io_settings for logging
    io_settings: {
      save_agent_actions: false,
      save_step_metadata: false,
      save_pcap_logs: false,
      save_sys_logs: false,
      sys_log_level: 'WARNING'
    },

    // REQUIRED: game configuration
    game: {
      max_episode_length: network.config.game?.maxEpisodeLength || 128,
      ports: network.config.game?.ports || ['HTTP', 'DNS'],
      protocols: network.config.game?.protocols || ['tcp', 'udp', 'icmp'],
      ...(network.config.game?.seed !== undefined && { seed: network.config.game.seed }),
      ...(network.config.game?.thresholds && { thresholds: network.config.game.thresholds })
    },

    // REQUIRED: simulation with network topology
    simulation: {
      network: {
        ...(network.config.simulation?.network || {}),
        nodes: convertNodes(network.config.nodes || []),
        links: convertLinks(network.config.links || [])
      }
    }
  }

  // REQUIRED: agents for training
  if (network.config.agents && network.config.agents.length > 0) {
    config.agents = convertAgents(network.config.agents)
  } else {
    // If no agents provided, validation will fail later
    config.agents = []
  }

  // Generate YAML
  let yamlStr = yaml.dump(config, {
    indent: 2,
    lineWidth: -1,
    noRefs: true
  })

  // Post-process: Fix numeric keys (convert '1': to 1:)
  // This is necessary because js-yaml always quotes numeric keys
  yamlStr = yamlStr.replace(/'(\d+)':/g, '$1:')

  return yamlStr
}

/**
 * Convert frontend node format to PrimAITE format
 */
function convertNodes(nodes) {
  return nodes.map(node => {
    const primaiteNode = {
      hostname: node.hostname,
      type: node.type
    }

    // Add common fields
    if (node.ipAddress) primaiteNode.ip_address = node.ipAddress
    if (node.subnetMask) primaiteNode.subnet_mask = node.subnetMask
    if (node.defaultGateway) primaiteNode.default_gateway = node.defaultGateway
    if (node.dnsServer) primaiteNode.dns_server = node.dnsServer

    // Type-specific fields
    switch (node.type) {
      case 'router':
      case 'firewall':
        if (node.numPorts) primaiteNode.num_ports = node.numPorts
        // Convert ports object to proper format
        if (node.ports && typeof node.ports === 'object') {
          primaiteNode.ports = {}
          for (const [portNum, portConfig] of Object.entries(node.ports)) {
            primaiteNode.ports[portNum] = {
              ip_address: portConfig.ipAddress,
              subnet_mask: portConfig.subnetMask
            }
          }
        }
        if (node.acl) primaiteNode.acl = node.acl
        if (node.routes) primaiteNode.routes = node.routes || []
        break

      case 'switch':
        if (node.numPorts) primaiteNode.num_ports = node.numPorts
        break

      case 'computer':
      case 'server':
        if (node.services) primaiteNode.services = node.services
        if (node.applications) primaiteNode.applications = node.applications
        if (node.users) primaiteNode.users = node.users
        if (node.networkInterfaces) {
          primaiteNode.network_interfaces = {}
          for (const [nicNum, nicConfig] of Object.entries(node.networkInterfaces)) {
            primaiteNode.network_interfaces[nicNum] = {
              ip_address: nicConfig.ipAddress,
              subnet_mask: nicConfig.subnetMask
            }
          }
        }
        break
    }

    return primaiteNode
  })
}

/**
 * Convert frontend link format to PrimAITE format
 */
function convertLinks(links) {
  return links.map(link => ({
    endpoint_a_hostname: link.endpointAHostname,
    endpoint_a_port: link.endpointAPort,
    endpoint_b_hostname: link.endpointBHostname,
    endpoint_b_port: link.endpointBPort,
    bandwidth: link.bandwidth || 100
  }))
}

/**
 * Convert frontend agent format to PrimAITE format
 *
 * REQUIRED fields: ref, team, type, agent_settings
 * OPTIONAL fields: action_space, observation_space, reward_function
 */
function convertAgents(agents) {
  return agents.map(agent => {
    const primaiteAgent = {
      ref: agent.ref,
      team: agent.team,
      type: agent.type,
      // REQUIRED: agent_settings (must be present)
      agent_settings: agent.agent_settings || {}
    }

    // Add action_space if configured
    if (agent.action_space && agent.action_space.action_map) {
      const actionMap = {}
      // Ensure all actions have options field (required by PrimAITE)
      for (const [key, actionDef] of Object.entries(agent.action_space.action_map)) {
        actionMap[key] = {
          action: actionDef.action,
          options: actionDef.options || {}
        }
      }
      primaiteAgent.action_space = { action_map: actionMap }
    }

    // Add observation_space - ALWAYS use type: none for compatibility
    // Complex observation spaces (type: nodes, custom, etc.) require specific NMNE structure
    // that may not match all network configurations. Using type: none is safe and compatible.
    primaiteAgent.observation_space = {
      type: 'none',
      options: {}
    }

    // Add reward_function if configured
    if (agent.reward_function) {
      primaiteAgent.reward_function = agent.reward_function
    }

    return primaiteAgent
  })
}

/**
 * Save YAML to file
 */
export const saveYAMLToFile = async (yamlContent, filename) => {
  const uploadsDir = path.join(process.cwd(), 'uploads')
  const yamlDir = path.join(uploadsDir, 'yaml')

  // Ensure directory exists
  await fs.mkdir(yamlDir, { recursive: true })

  const filePath = path.join(yamlDir, filename)
  await fs.writeFile(filePath, yamlContent, 'utf8')

  return filePath
}

/**
 * Validate network configuration before generating YAML
 * Validates against actual PrimAITE-supported values
 */
export const validateNetwork = (config) => {
  const errors = []

  // PrimAITE-supported values (from YAML schema analysis)
  const VALID_NODE_TYPES = ['computer', 'server', 'router', 'switch', 'firewall', 'wireless-router', 'printer']
  const VALID_PROTOCOLS = ['tcp', 'udp', 'icmp', 'arp', 'all']
  const VALID_SERVICES = ['dns-server', 'dns-client', 'web-server', 'database-service', 'ftp-server', 'ftp-client', 'ntp-server', 'ntp-client', 'terminal', 'arp', 'icmp']
  const VALID_APPLICATIONS = ['web-browser', 'database-client', 'nmap', 'c2-server', 'c2-beacon', 'data-manipulation-bot', 'dos-bot', 'ransomware-script']
  const VALID_AGENT_TYPES = ['proxy-agent', 'probabilistic-agent', 'random-agent', 'periodic-agent', 'red-database-corrupting-agent']
  const VALID_TEAMS = ['RED', 'BLUE', 'GREEN']

  // Check minimum requirements
  if (!config.nodes || config.nodes.length === 0) {
    errors.push('Network must have at least one node')
  }

  if (!config.links || config.links.length === 0) {
    errors.push('Network must have at least one link')
  }

  // Validate node types
  if (config.nodes) {
    config.nodes.forEach((node, i) => {
      if (!VALID_NODE_TYPES.includes(node.type)) {
        errors.push(`Node ${i} (${node.hostname}): invalid type '${node.type}'. Must be one of: ${VALID_NODE_TYPES.join(', ')}`)
      }

      // Validate services
      if (node.services) {
        node.services.forEach((service, j) => {
          const serviceType = typeof service === 'string' ? service : service.type
          if (!VALID_SERVICES.includes(serviceType)) {
            errors.push(`Node ${i} (${node.hostname}), Service ${j}: invalid service '${serviceType}'. Must be one of: ${VALID_SERVICES.join(', ')}`)
          }
        })
      }

      // Validate applications
      if (node.applications) {
        node.applications.forEach((app, j) => {
          const appType = typeof app === 'string' ? app : app.type
          if (!VALID_APPLICATIONS.includes(appType)) {
            errors.push(`Node ${i} (${node.hostname}), Application ${j}: invalid application '${appType}'. Must be one of: ${VALID_APPLICATIONS.join(', ')}`)
          }
        })
      }
    })
  }

  // Validate node hostnames are unique
  if (config.nodes) {
    const hostnames = config.nodes.map(n => n.hostname)
    const duplicates = hostnames.filter((h, i) => hostnames.indexOf(h) !== i)
    if (duplicates.length > 0) {
      errors.push(`Duplicate hostnames found: ${duplicates.join(', ')}`)
    }
  }

  // Validate links reference existing nodes
  if (config.nodes && config.links) {
    const hostnames = config.nodes.map(n => n.hostname)
    config.links.forEach((link, i) => {
      if (!hostnames.includes(link.endpointAHostname)) {
        errors.push(`Link ${i}: endpoint A hostname '${link.endpointAHostname}' not found`)
      }
      if (!hostnames.includes(link.endpointBHostname)) {
        errors.push(`Link ${i}: endpoint B hostname '${link.endpointBHostname}' not found`)
      }
    })
  }

  // Validate game settings protocols
  if (config.game && config.game.protocols) {
    config.game.protocols.forEach((protocol, i) => {
      if (!VALID_PROTOCOLS.includes(protocol.toLowerCase())) {
        errors.push(`Game protocol ${i}: invalid protocol '${protocol}'. Must be one of: ${VALID_PROTOCOLS.join(', ')}`)
      }
    })
  }

  // Validate agents (REQUIRED for training)
  if (!config.agents || config.agents.length === 0) {
    errors.push('At least one agent is required for training')
  } else {
    config.agents.forEach((agent, i) => {
      // REQUIRED fields
      if (!agent.ref) {
        errors.push(`Agent ${i}: missing 'ref' field (REQUIRED)`)
      }
      if (!agent.team || !VALID_TEAMS.includes(agent.team)) {
        errors.push(`Agent ${i}: invalid team '${agent.team}'. Must be one of: ${VALID_TEAMS.join(', ')} (REQUIRED)`)
      }
      if (!agent.type || !VALID_AGENT_TYPES.includes(agent.type)) {
        errors.push(`Agent ${i}: invalid type '${agent.type}'. Must be one of: ${VALID_AGENT_TYPES.join(', ')} (REQUIRED)`)
      }
      if (agent.agent_settings === undefined) {
        errors.push(`Agent ${i}: missing 'agent_settings' field (REQUIRED)`)
      }
      // action_space is optional but if provided should have action_map
      if (agent.action_space && !agent.action_space.action_map) {
        errors.push(`Agent ${i}: action_space must contain action_map`)
      }
    })
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}
