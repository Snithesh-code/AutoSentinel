import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { useState, useEffect } from 'react'

const StatsPanel = ({ agents }) => {
  const [rewardHistory, setRewardHistory] = useState([])

  useEffect(() => {
    // Add current rewards to history
    setRewardHistory(prev => {
      const newEntry = {
        step: prev.length,
        attacker: agents.attacker.reward,
        defender: agents.defender.reward,
      }
      return [...prev.slice(-50), newEntry]
    })
  }, [agents])

  return (
    <div className="border border-cyber-blue rounded-lg overflow-hidden" style={{backgroundColor: 'var(--bg-card)', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3)'}}>
      <div className="px-4 py-3 border-b border-cyber-blue" style={{backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)'}}>
        <h2 className="text-lg font-semibold text-cyber-blue">Agent Statistics</h2>
        <p className="text-xs mt-1" style={{color: 'var(--text-tertiary)'}}>Performance metrics and rewards</p>
      </div>

      <div className="p-4">
        {/* Current Stats */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          {/* Attacker Stats */}
          <div className="border border-red-500 rounded-lg p-4" style={{backgroundColor: 'rgba(239, 68, 68, 0.1)'}}>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-red-400">⚔️ Attacker</h3>
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
            </div>
            <div className="text-2xl font-bold text-red-600 mb-1">
              {agents.attacker.reward.toFixed(2)}
            </div>
            <div className="text-xs" style={{color: 'var(--text-tertiary)'}}>Total Reward</div>
            {agents.attacker.lastAction && (
              <div className="mt-3 pt-3" style={{borderTop: '1px solid rgba(239, 68, 68, 0.3)'}}>
                <div className="text-xs" style={{color: 'var(--text-tertiary)'}}>Last Action</div>
                <div className="text-xs font-mono text-red-500 mt-1">
                  {agents.attacker.lastAction}
                </div>
              </div>
            )}
          </div>

          {/* Defender Stats */}
          <div className="border border-blue-500 rounded-lg p-4" style={{backgroundColor: 'rgba(59, 130, 246, 0.1)'}}>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-blue-400">🛡️ Defender</h3>
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
            </div>
            <div className="text-2xl font-bold text-blue-600 mb-1">
              {agents.defender.reward.toFixed(2)}
            </div>
            <div className="text-xs" style={{color: 'var(--text-tertiary)'}}>Total Reward</div>
            {agents.defender.lastAction && (
              <div className="mt-3 pt-3" style={{borderTop: '1px solid rgba(59, 130, 246, 0.3)'}}>
                <div className="text-xs" style={{color: 'var(--text-tertiary)'}}>Last Action</div>
                <div className="text-xs font-mono text-blue-500 mt-1">
                  {agents.defender.lastAction}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Reward Chart */}
        <div className="rounded-lg p-4" style={{backgroundColor: 'var(--bg-secondary)'}}>
          <h3 className="text-sm font-semibold mb-4" style={{color: 'var(--text-primary)'}}>Reward Trend</h3>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={rewardHistory}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
              <XAxis
                dataKey="step"
                stroke="var(--text-tertiary)"
                style={{ fontSize: '12px' }}
              />
              <YAxis
                stroke="var(--text-tertiary)"
                style={{ fontSize: '12px' }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'var(--bg-card)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '8px',
                  color: 'var(--text-primary)'
                }}
              />
              <Legend
                wrapperStyle={{ fontSize: '12px', color: 'var(--text-secondary)' }}
              />
              <Line
                type="monotone"
                dataKey="attacker"
                stroke="#f87171"
                strokeWidth={2}
                dot={false}
                name="Attacker"
              />
              <Line
                type="monotone"
                dataKey="defender"
                stroke="#60a5fa"
                strokeWidth={2}
                dot={false}
                name="Defender"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}

export default StatsPanel
