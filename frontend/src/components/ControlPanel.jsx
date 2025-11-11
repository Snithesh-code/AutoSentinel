const ControlPanel = ({ isRunning, onStart, onStop, onReset, onStep, delay, onDelayChange }) => {
  return (
    <div className="border rounded-2xl overflow-hidden" style={{backgroundColor: 'var(--bg-card)', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3)'}}>
      <div className="px-6 py-4 border-b" style={{backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)', borderColor: 'var(--border-color)'}}>
        <h2 className="text-lg font-bold">Simulation Controls</h2>
        <p className="text-xs mt-1" style={{color: 'var(--text-tertiary)'}}>Manage simulation execution</p>
      </div>

      <div className="p-6 space-y-5">
        {/* Delay Control */}
        <div className="rounded-xl p-4 border" style={{backgroundColor: 'rgba(0, 212, 255, 0.05)', borderColor: 'var(--border-color)'}}>
          <div className="flex items-center justify-between mb-3">
            <label className="text-sm font-semibold" style={{color: 'var(--text-primary)'}}>Action Delay</label>
            <span className="text-lg font-bold text-blue-400 px-3 py-1 rounded-lg" style={{backgroundColor: 'rgba(0, 212, 255, 0.1)'}}>{delay}ms</span>
          </div>
          <input
            type="range"
            min="0"
            max="2000"
            step="100"
            value={delay}
            onChange={(e) => onDelayChange(parseInt(e.target.value))}
            className="w-full h-2 rounded-lg appearance-none cursor-pointer accent-blue-500"
            style={{backgroundColor: 'var(--border-color)'}}
          />
          <div className="flex justify-between text-xs mt-2" style={{color: 'var(--text-tertiary)'}}>
            <span>Instant</span>
            <span>2 seconds</span>
          </div>
        </div>
        {/* Status Indicator */}
        <div className="rounded-xl p-5 text-center border" style={{backgroundColor: 'rgba(0, 212, 255, 0.05)', borderColor: 'var(--border-color)'}}>
          <div className="text-xs font-semibold mb-3 uppercase tracking-wide" style={{color: 'var(--text-tertiary)'}}>Status</div>
          <div className={`inline-flex items-center space-x-3 px-6 py-3 rounded-xl font-bold transition ${
            isRunning
              ? 'bg-gradient-to-r from-green-500 to-green-600 text-white shadow-lg shadow-green-500/50'
              : 'text-white'
          }`} style={!isRunning ? {backgroundColor: 'rgba(0, 0, 0, 0.2)'} : {}}>
            <div className={`w-3 h-3 rounded-full ${
              isRunning ? 'bg-white animate-pulse' : 'animate-pulse'
            }`} style={!isRunning ? {backgroundColor: 'var(--text-tertiary)'} : {}}></div>
            <span className="text-base">
              {isRunning ? 'RUNNING' : 'STOPPED'}
            </span>
          </div>
        </div>

        {/* Control Buttons */}
        <div className="grid grid-cols-2 gap-3 pt-2">
          <div>
            {!isRunning ? (
              <button
                onClick={onStart}
                className="w-full font-bold py-3 px-4 rounded-xl transition-all transform hover:scale-105 hover:shadow-lg shadow-md border-2"
                style={{
                  backgroundColor: '#22c55e',
                  borderColor: '#16a34a',
                  color: 'white',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#16a34a'
                  e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(34, 197, 94, 0.4), 0 4px 6px -2px rgba(0, 0, 0, 0.05)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#22c55e'
                  e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }}
              >
                Start
              </button>
            ) : (
              <button
                onClick={onStop}
                className="w-full font-bold py-3 px-4 rounded-xl transition-all transform hover:scale-105 hover:shadow-lg shadow-md border-2"
                style={{
                  backgroundColor: '#ef4444',
                  borderColor: '#dc2626',
                  color: 'white',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#dc2626'
                  e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(239, 68, 68, 0.4), 0 4px 6px -2px rgba(0, 0, 0, 0.05)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#ef4444'
                  e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }}
              >
                Stop
              </button>
            )}
          </div>

          <button
            onClick={onReset}
            className="w-full font-bold py-3 px-4 rounded-xl transition-all transform hover:scale-105 hover:shadow-lg shadow-md border-2"
            style={{
              backgroundColor: '#a855f7',
              borderColor: '#7e22ce',
              color: 'white',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#7e22ce'
              e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(168, 85, 247, 0.4), 0 4px 6px -2px rgba(0, 0, 0, 0.05)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#a855f7'
              e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
            }}
          >
            Reset
          </button>
        </div>

        <button
          onClick={onStep}
          disabled={isRunning}
          className="w-full font-bold py-3 px-4 rounded-xl transition-all transform hover:scale-105 hover:shadow-lg shadow-md border-2 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100"
          style={{
            backgroundColor: '#3b82f6',
            borderColor: '#1d4ed8',
            color: 'white',
          }}
          onMouseEnter={(e) => {
            if (!e.currentTarget.disabled) {
              e.currentTarget.style.backgroundColor = '#1d4ed8'
              e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(59, 130, 246, 0.4), 0 4px 6px -2px rgba(0, 0, 0, 0.05)'
            }
          }}
          onMouseLeave={(e) => {
            if (!e.currentTarget.disabled) {
              e.currentTarget.style.backgroundColor = '#3b82f6'
              e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
            }
          }}
        >
          Step Forward
        </button>

        {/* Info Box */}
        <div className="border rounded-xl p-4 mt-2" style={{backgroundColor: 'rgba(0, 212, 255, 0.05)', borderColor: 'var(--border-color)'}}>
          <p className="text-xs font-semibold mb-3" style={{color: 'var(--text-primary)'}}>Quick Info</p>
          <div className="text-xs space-y-2" style={{color: 'var(--text-secondary)'}}>
            <div className="flex items-start space-x-2">
              <span>•</span>
              <span><span className="text-green-400">Start</span>: Run with automatic stepping</span>
            </div>
            <div className="flex items-start space-x-2">
              <span>•</span>
              <span><span className="text-blue-400">Step</span>: Execute one step manually</span>
            </div>
            <div className="flex items-start space-x-2">
              <span>•</span>
              <span><span className="text-purple-400">Reset</span>: Clear all data</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ControlPanel
