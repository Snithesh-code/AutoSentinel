import { memo } from 'react'
import { Handle, Position } from 'reactflow'

const CustomNode = ({ data }) => {
  const getStatusColor = () => {
    switch (data.status) {
      case 'compromised':
        return 'border-cyber-red shadow-red-500/50'
      case 'offline':
        return 'border-gray-500 opacity-50'
      case 'active':
      default:
        return 'border-cyber-blue shadow-cyber-blue/50'
    }
  }

  const getTypeIcon = () => {
    switch (data.type) {
      case 'router':
        return '🔀'
      case 'switch':
        return '🔌'
      case 'server':
        return '🖥️'
      case 'computer':
        return '💻'
      default:
        return '📡'
    }
  }

  const getTeamBadge = () => {
    if (!data.team) return null

    const colors = {
      RED: 'bg-cyber-red',
      BLUE: 'bg-cyber-blue',
      GREEN: 'bg-cyber-green',
    }

    return (
      <div className={`absolute -top-2 -right-2 w-5 h-5 ${colors[data.team]} rounded-full text-xs flex items-center justify-center font-bold shadow-lg`}>
        {data.team[0]}
      </div>
    )
  }

  return (
    <div className={`relative border-2 ${getStatusColor()} rounded-lg p-3 min-w-[140px] shadow-lg transition-all hover:scale-105`} style={{backgroundColor: 'var(--bg-card)', color: 'var(--text-primary)'}}>
      <Handle type="target" position={Position.Top} className="w-3 h-3 bg-cyber-blue" />

      {getTeamBadge()}

      <div className="flex items-center space-x-2 mb-2">
        <span className="text-2xl">{getTypeIcon()}</span>
        <div className="flex-1">
          <div className="font-semibold text-sm" style={{color: 'var(--text-primary)'}}>{data.label}</div>
          <div className="text-xs" style={{color: 'var(--text-tertiary)'}}>{data.type}</div>
        </div>
      </div>

      {data.ip && (
        <div className="text-xs text-cyber-blue font-mono px-2 py-1 rounded" style={{backgroundColor: 'rgba(0, 212, 255, 0.1)'}}>
          {data.ip}
        </div>
      )}

      <div className={`mt-2 text-xs font-semibold text-center py-1 rounded ${
        data.status === 'compromised' ? 'bg-cyber-red text-white' :
        data.status === 'offline' ? 'text-gray-300' :
        'bg-cyber-green text-black'
      }`} style={data.status === 'offline' ? {backgroundColor: 'rgba(107, 114, 128, 0.3)'} : {}}>
        {data.status?.toUpperCase() || 'ACTIVE'}
      </div>

      <Handle type="source" position={Position.Bottom} className="w-3 h-3 bg-cyber-blue" />
    </div>
  )
}

export default memo(CustomNode)
