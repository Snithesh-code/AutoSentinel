import { useCallback, useMemo } from 'react'
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
} from 'reactflow'
import 'reactflow/dist/style.css'
import CustomNode from './CustomNode'

const nodeTypes = {
  custom: CustomNode,
}

const NetworkVisualization = ({ nodes, links, isRunning }) => {
  // Convert nodes to ReactFlow format
  const reactFlowNodes = useMemo(() => {
    return nodes.map((node, index) => ({
      id: node.id || node.hostname,
      type: 'custom',
      position: calculatePosition(node.type, index, nodes.length),
      data: {
        label: node.hostname,
        type: node.type,
        status: node.status,
        ip: node.ip_address,
        team: node.team,
      },
    }))
  }, [nodes])

  // Convert links to ReactFlow edges
  const reactFlowEdges = useMemo(() => {
    return links.map((link) => ({
      id: link.id || `${link.source}-${link.target}`,
      source: link.source,
      target: link.target,
      animated: link.status === 'suspicious' || isRunning,
      style: {
        stroke: getEdgeColor(link.status),
        strokeWidth: 2,
      },
    }))
  }, [links, isRunning])

  const [flowNodes, setFlowNodes, onNodesChange] = useNodesState(reactFlowNodes)
  const [flowEdges, setFlowEdges, onEdgesChange] = useEdgesState(reactFlowEdges)

  // Update nodes when data changes
  useMemo(() => {
    setFlowNodes(reactFlowNodes)
  }, [reactFlowNodes])

  useMemo(() => {
    setFlowEdges(reactFlowEdges)
  }, [reactFlowEdges])

  return (
    <div className="rounded-xl overflow-hidden shadow-xl border" style={{backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)'}}>
      {/* Panel Header */}
      <div className="px-6 py-4 border-b" style={{backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)'}}>
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold" style={{color: 'var(--text-primary)'}}>🌐 Network Topology</h2>
            <p className="text-xs mt-1" style={{color: 'var(--text-tertiary)'}}>Real-time network visualization during simulation</p>
          </div>
          <div className="hidden sm:block px-4 py-2 rounded-lg border" style={{backgroundColor: 'rgba(0, 212, 255, 0.1)', borderColor: 'var(--border-color)'}}>
            <p className="text-xs font-semibold" style={{color: 'var(--text-tertiary)'}}>Nodes</p>
            <p className="text-lg font-bold text-cyan-400">{nodes.length}</p>
          </div>
        </div>
      </div>

      {/* Visualization Area */}
      <div style={{ height: '600px', position: 'relative' }}>
        <ReactFlow
          nodes={flowNodes}
          edges={flowEdges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          nodeTypes={nodeTypes}
          fitView
          attributionPosition="bottom-left"
          style={{backgroundColor: 'var(--bg-primary)'}}
        >
          <Background color="var(--border-color)" gap={16} size={1} />
          <Controls
            style={{
              backgroundColor: 'var(--bg-secondary)',
              borderColor: 'var(--border-color)',
              borderWidth: '1px',
              borderRadius: '8px',
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
            }}
            className="network-controls"
          />
          <MiniMap
            nodeColor={getNodeColor}
            style={{
              backgroundColor: 'var(--bg-secondary)',
              borderColor: 'var(--border-color)',
              borderWidth: '2px',
              borderRadius: '8px',
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
            }}
            maskColor="rgba(0, 0, 0, 0.2)"
            className="network-minimap"
          />
        </ReactFlow>
      </div>

      {/* Legend */}
      <div className="px-6 py-4 border-t grid grid-cols-2 sm:grid-cols-4 gap-4" style={{backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)'}}>
        <div className="flex items-center gap-2">
          <div style={{width: '12px', height: '12px', backgroundColor: '#00d4ff', borderRadius: '2px'}}></div>
          <span className="text-xs" style={{color: 'var(--text-tertiary)'}}>Active</span>
        </div>
        <div className="flex items-center gap-2">
          <div style={{width: '12px', height: '12px', backgroundColor: '#ffd60a', borderRadius: '2px'}}></div>
          <span className="text-xs" style={{color: 'var(--text-tertiary)'}}>Suspicious</span>
        </div>
        <div className="flex items-center gap-2">
          <div style={{width: '12px', height: '12px', backgroundColor: '#ff006e', borderRadius: '2px'}}></div>
          <span className="text-xs" style={{color: 'var(--text-tertiary)'}}>Blocked</span>
        </div>
        <div className="flex items-center gap-2">
          <div style={{width: '12px', height: '12px', backgroundColor: '#64748b', borderRadius: '2px'}}></div>
          <span className="text-xs" style={{color: 'var(--text-tertiary)'}}>Offline</span>
        </div>
      </div>
    </div>
  )
}

// Helper function to calculate node positions based on network topology
function calculatePosition(nodeType, index, total) {
  const width = 800
  const height = 500

  switch (nodeType) {
    case 'router':
      return { x: width / 2, y: height / 2 }
    case 'switch':
      const switchY = index % 2 === 0 ? height / 3 : (2 * height) / 3
      return { x: width / 2, y: switchY }
    case 'server':
      const serverX = 150 + (index % 4) * 150
      return { x: serverX, y: 100 }
    case 'computer':
      const computerX = 150 + (index % 2) * 500
      return { x: computerX, y: 400 }
    default:
      const angle = (index / total) * 2 * Math.PI
      return {
        x: width / 2 + Math.cos(angle) * 200,
        y: height / 2 + Math.sin(angle) * 200,
      }
  }
}

function getEdgeColor(status) {
  switch (status) {
    case 'blocked':
      return '#ff006e'
    case 'suspicious':
      return '#ffd60a'
    case 'active':
    default:
      return '#00d4ff'
  }
}

function getNodeColor(node) {
  if (node.data?.status === 'compromised') return '#ff006e'
  if (node.data?.status === 'offline') return '#64748b'

  switch (node.data?.type) {
    case 'router':
      return '#7b2cbf'
    case 'switch':
      return '#00d4ff'
    case 'server':
      return '#00ff88'
    case 'computer':
      return '#ffd60a'
    default:
      return '#64748b'
  }
}

export default NetworkVisualization
