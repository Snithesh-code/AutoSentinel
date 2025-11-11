/**
 * Convert network data to YAML format
 * @param {Object} networkData - Network configuration data
 * @returns {string} YAML formatted string
 */
export const networkToYAML = (networkData) => {
  let yaml = ''

  // Header
  yaml += '# AutoSentinel Network Configuration\n'
  yaml += `# Generated on ${new Date().toISOString()}\n\n`

  // Network Metadata
  yaml += 'network:\n'
  yaml += `  name: "${escapeYAMLString(networkData.name)}"\n`
  yaml += `  description: "${escapeYAMLString(networkData.description || 'No description')}"\n`

  if (networkData.tags && networkData.tags.length > 0) {
    yaml += '  tags:\n'
    networkData.tags.forEach(tag => {
      yaml += `    - "${escapeYAMLString(tag)}"\n`
    })
  }

  yaml += '\n'

  // Game Configuration
  if (networkData.config && networkData.config.game) {
    yaml += 'game:\n'
    yaml += `  maxEpisodeLength: ${networkData.config.game.maxEpisodeLength || 128}\n`

    if (networkData.config.game.ports && networkData.config.game.ports.length > 0) {
      yaml += '  ports:\n'
      networkData.config.game.ports.forEach(port => {
        yaml += `    - ${port}\n`
      })
    }

    if (networkData.config.game.protocols && networkData.config.game.protocols.length > 0) {
      yaml += '  protocols:\n'
      networkData.config.game.protocols.forEach(protocol => {
        yaml += `    - ${protocol}\n`
      })
    }
    yaml += '\n'
  }

  // Nodes
  if (networkData.config && networkData.config.nodes && networkData.config.nodes.length > 0) {
    yaml += 'nodes:\n'
    networkData.config.nodes.forEach(node => {
      yaml += `  - hostname: "${escapeYAMLString(node.hostname)}"\n`
      yaml += `    type: ${node.type || 'computer'}\n`
      yaml += `    ipAddress: "${node.ipAddress || 'DHCP'}"\n`
      yaml += `    subnetMask: "${node.subnetMask || '255.255.255.0'}"\n`

      if (node.defaultGateway) {
        yaml += `    defaultGateway: "${node.defaultGateway}"\n`
      }

      if (node.numPorts) {
        yaml += `    numPorts: ${node.numPorts}\n`
      }

      if (node.services && node.services.length > 0) {
        yaml += '    services:\n'
        node.services.forEach(service => {
          yaml += `      - ${service}\n`
        })
      }

      if (node.applications && node.applications.length > 0) {
        yaml += '    applications:\n'
        node.applications.forEach(app => {
          yaml += `      - ${app}\n`
        })
      }

      if (node.vulnerabilities && node.vulnerabilities.length > 0) {
        yaml += '    vulnerabilities:\n'
        node.vulnerabilities.forEach(vuln => {
          yaml += `      - ${vuln}\n`
        })
      }

      if (node.valueData) {
        yaml += `    valueData: ${node.valueData}\n`
      }

      yaml += '\n'
    })
  }

  // Links
  if (networkData.config && networkData.config.links && networkData.config.links.length > 0) {
    yaml += 'links:\n'
    networkData.config.links.forEach(link => {
      yaml += `  - source: "${escapeYAMLString(link.source)}"\n`
      yaml += `    target: "${escapeYAMLString(link.target)}"\n`

      if (link.bandwidth) {
        yaml += `    bandwidth: "${link.bandwidth}"\n`
      }

      if (link.latency) {
        yaml += `    latency: ${link.latency}\n`
      }

      if (link.connectionType) {
        yaml += `    connectionType: "${link.connectionType}"\n`
      }

      yaml += '\n'
    })
  }

  // Agents
  if (networkData.config && networkData.config.agents && networkData.config.agents.length > 0) {
    yaml += 'agents:\n'
    networkData.config.agents.forEach((agent, index) => {
      yaml += `  - name: "${escapeYAMLString(agent.name || `agent_${index}`)}"\n`
      yaml += `    type: ${agent.type || 'defender'}\n`
      yaml += `    team: "${agent.team || 'blue'}"\n`

      if (agent.algorithm) {
        yaml += `    algorithm: "${agent.algorithm}"\n`
      }

      if (agent.action_space && agent.action_space.length > 0) {
        yaml += '    action_space:\n'
        if (Array.isArray(agent.action_space)) {
          agent.action_space.forEach(action => {
            yaml += `      - ${action}\n`
          })
        }
      }

      if (agent.observation_space) {
        yaml += '    observation_space:\n'
        if (Array.isArray(agent.observation_space)) {
          agent.observation_space.forEach(obs => {
            yaml += `      - ${obs}\n`
          })
        } else if (typeof agent.observation_space === 'object') {
          yaml += formatYAMLObject(agent.observation_space, 6)
        }
      }

      if (agent.reward_components) {
        yaml += '    reward_components:\n'
        agent.reward_components.forEach(rc => {
          yaml += `      - ${rc}\n`
        })
      }

      yaml += '\n'
    })
  }

  return yaml
}

/**
 * Escape special characters in YAML strings
 * @param {string} str - String to escape
 * @returns {string} Escaped string
 */
const escapeYAMLString = (str) => {
  if (!str) return ''
  return String(str)
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r')
    .replace(/\t/g, '\\t')
}

/**
 * Format object as YAML with proper indentation
 * @param {Object} obj - Object to format
 * @param {number} indent - Indentation level
 * @returns {string} YAML formatted object
 */
const formatYAMLObject = (obj, indent = 0) => {
  let result = ''
  const spaces = ' '.repeat(indent)

  for (const [key, value] of Object.entries(obj)) {
    if (Array.isArray(value)) {
      result += `${spaces}${key}:\n`
      value.forEach(item => {
        if (typeof item === 'object') {
          result += `${spaces}  - \n${formatYAMLObject(item, indent + 4)}`
        } else {
          result += `${spaces}  - ${item}\n`
        }
      })
    } else if (typeof value === 'object' && value !== null) {
      result += `${spaces}${key}:\n${formatYAMLObject(value, indent + 2)}`
    } else if (typeof value === 'string') {
      result += `${spaces}${key}: "${escapeYAMLString(value)}"\n`
    } else {
      result += `${spaces}${key}: ${value}\n`
    }
  }

  return result
}

/**
 * Download YAML file
 * @param {string} yamlContent - YAML content
 * @param {string} fileName - File name (without extension)
 */
export const downloadYAML = (yamlContent, fileName) => {
  const element = document.createElement('a')
  const file = new Blob([yamlContent], { type: 'text/yaml' })

  element.href = URL.createObjectURL(file)
  element.download = `${fileName}.yaml`

  document.body.appendChild(element)
  element.click()
  document.body.removeChild(element)

  // Clean up the URL object
  URL.revokeObjectURL(element.href)
}
