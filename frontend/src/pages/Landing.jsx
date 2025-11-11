import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import Navbar from '../components/Navbar'

const Landing = () => {
  const navigate = useNavigate()
  const { user } = useAuth()

  const features = [
    {
      icon: '🎮',
      title: 'Network Simulation',
      description: 'Design and simulate complex network topologies with customizable nodes, links, and configurations.'
    },
    {
      icon: '🤖',
      title: 'AI Agent Training',
      description: 'Train intelligent agents using PPO and DQN algorithms to learn attack and defense strategies in cybersecurity scenarios.'
    },
    {
      icon: '📊',
      title: 'Real-Time Monitoring',
      description: 'Monitor live simulations with real-time event logs, network visualizations, and performance metrics.'
    },
    {
      icon: '🤖',
      title: 'XAI Explanations',
      description: 'Understand agent actions with AI-powered explanations showing why each action was taken in the network.'
    },
    {
      icon: '📈',
      title: 'Training Analytics',
      description: 'Track training progress with detailed reward graphs, episode statistics, and model performance metrics.'
    },
    {
      icon: '⚙',
      title: 'YAML Configuration',
      description: 'Define complex network scenarios using YAML configuration files for reproducible experiments.'
    }
  ]

  const steps = [
    {
      number: '1',
      title: 'Design Network',
      description: 'Create your network topology with nodes, links, and agents using the visual network designer.'
    },
    {
      number: '2',
      title: 'Configure Agents',
      description: 'Set up attacker and defender agents with custom action spaces and observation spaces.'
    },
    {
      number: '3',
      title: 'Train Models',
      description: 'Train your agents using PPO or DQN algorithms with configurable episodes and parameters.'
    },
    {
      number: '4',
      title: 'Analyze Results',
      description: 'Visualize training progress, analyze reward histories, and understand agent decisions with XAI.'
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <Navbar />

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-8">
            <div>
              <h1 className="text-5xl lg:text-6xl font-bold text-white mb-4">
                AutoSentinel
              </h1>
              <p className="text-2xl text-blue-400 font-semibold">Autonomous Network Security Simulation</p>
            </div>

            <p className="text-lg text-slate-300 leading-relaxed">
              A cutting-edge platform for training AI agents to understand and respond to cybersecurity threats.
              Design realistic network scenarios, train intelligent defenders and attackers, and analyze their decisions with explainable AI.
            </p>

            <div className="flex gap-4">
              {user ? (
                <>
                  <button
                    onClick={() => navigate('/dashboard')}
                    className="px-8 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold rounded-xl transition transform hover:scale-105 shadow-lg"
                  >
                    Go to Dashboard
                  </button>
                  <button
                    onClick={() => navigate('/simulation')}
                    className="px-8 py-3 bg-slate-700 hover:bg-slate-600 text-white font-semibold rounded-xl transition"
                  >
                    View Simulation
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => navigate('/login')}
                    className="px-8 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold rounded-xl transition transform hover:scale-105 shadow-lg"
                  >
                    Get Started
                  </button>
                  <button
                    onClick={() => navigate('/signup')}
                    className="px-8 py-3 bg-slate-700 hover:bg-slate-600 text-white font-semibold rounded-xl transition"
                  >
                    Sign Up
                  </button>
                </>
              )}
            </div>

            <div className="flex gap-8 pt-4">
              <div>
                <p className="text-3xl font-bold text-blue-400">100+</p>
                <p className="text-slate-400">Network Configs</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-green-400">1000+</p>
                <p className="text-slate-400">Training Sessions</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-purple-400">AI-Powered</p>
                <p className="text-slate-400">Explanations</p>
              </div>
            </div>
          </div>

          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl opacity-20 blur-3xl"></div>
            <div className="relative bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-8 border border-slate-700 shadow-2xl">
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-4 bg-slate-700/50 rounded-lg">
                  <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse"></div>
                  <span className="text-sm text-slate-300">Simulation Running</span>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-slate-400">Episode: 245/1000</p>
                  <div className="w-full bg-slate-700 rounded-full h-2">
                    <div className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full w-1/3"></div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="p-3 bg-slate-700/50 rounded">
                    <p className="text-slate-400">Attacker Reward</p>
                    <p className="text-lg font-bold text-red-400">+2.45</p>
                  </div>
                  <div className="p-3 bg-slate-700/50 rounded">
                    <p className="text-slate-400">Defender Reward</p>
                    <p className="text-lg font-bold text-blue-400">+1.82</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* MARL Agent Showcase Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-white mb-4">🤖 Multi-Agent Reinforcement Learning in Action</h2>
          <p className="text-xl text-slate-400">Watch attackers and defenders compete in dynamic network environments</p>
        </div>

        {/* Network Battle Simulation - Single Card with Both Agents */}
        <div className="relative mb-12">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-600 via-blue-600 to-red-600 rounded-2xl opacity-5 blur-3xl"></div>
          <div className="relative bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-12 border border-slate-700 shadow-2xl">
            <h3 className="text-3xl font-bold text-white mb-2 text-center">🎯 Multi-Agent Network Battle</h3>
            <p className="text-slate-400 text-center mb-10">Watch attacker and defender agents learn simultaneously on the same network</p>

            {/* Single Shared Network */}
            <div className="flex items-center justify-center mb-10">
              <div className="w-full max-w-2xl bg-slate-700/20 rounded-lg p-6 border border-slate-600">
                <svg viewBox="0 0 400 300" className="w-full h-auto">
                  {/* Network Links/Edges */}
                  <line x1="200" y1="40" x2="80" y2="150" stroke="#64748b" strokeWidth="1.5" opacity="0.5" />
                  <line x1="200" y1="40" x2="320" y2="150" stroke="#64748b" strokeWidth="1.5" opacity="0.5" />
                  <line x1="80" y1="150" x2="80" y2="260" stroke="#64748b" strokeWidth="1.5" opacity="0.5" />
                  <line x1="80" y1="150" x2="200" y2="190" stroke="#64748b" strokeWidth="1.5" opacity="0.5" />
                  <line x1="200" y1="190" x2="320" y2="150" stroke="#64748b" strokeWidth="1.5" opacity="0.5" />
                  <line x1="200" y1="190" x2="200" y2="280" stroke="#64748b" strokeWidth="1.5" opacity="0.5" />
                  <line x1="320" y1="150" x2="320" y2="260" stroke="#64748b" strokeWidth="1.5" opacity="0.5" />
                  <line x1="80" y1="260" x2="320" y2="260" stroke="#64748b" strokeWidth="1.5" opacity="0.5" />

                  {/* Central Core Node */}
                  <circle cx="200" cy="40" r="14" fill="#3b82f6" opacity="0.2" />
                  <circle cx="200" cy="40" r="12" fill="none" stroke="#3b82f6" strokeWidth="2" />
                  <text x="200" y="45" textAnchor="middle" fontSize="10" fill="#60a5fa" fontWeight="bold">CORE</text>

                  {/* Peripheral Nodes */}
                  {[
                    { x: 80, y: 150, id: 'DB1', idx: 0 },
                    { x: 320, y: 150, id: 'WEB', idx: 1 },
                    { x: 80, y: 260, id: 'API', idx: 2 },
                    { x: 320, y: 260, id: 'AUTH', idx: 3 },
                    { x: 200, y: 190, id: 'LB', idx: 4 },
                    { x: 200, y: 280, id: 'CACHE', idx: 5 }
                  ].map((node) => (
                    <g key={node.idx}>
                      {/* Node background */}
                      <circle cx={node.x} cy={node.y} r="12" fill="#1e293b" />

                      {/* Attack indicator (red) */}
                      <circle
                        cx={node.x}
                        cy={node.y}
                        r="11"
                        fill="none"
                        stroke="#ef4444"
                        strokeWidth="1.5"
                        opacity="0.3"
                        style={{
                          animation: 'node-under-attack 2s ease-in-out infinite',
                          animationDelay: `${node.idx * 0.3}s`
                        }}
                      />

                      {/* Defense indicator (green) */}
                      <circle
                        cx={node.x}
                        cy={node.y}
                        r="11"
                        fill="none"
                        stroke="#22c55e"
                        strokeWidth="1.5"
                        opacity="0.3"
                        style={{
                          animation: 'node-defended 2s ease-in-out infinite',
                          animationDelay: `${node.idx * 0.3 + 0.5}s`
                        }}
                      />

                      {/* Node label */}
                      <text x={node.x} y={node.y + 4} textAnchor="middle" fontSize="9" fill="#cbd5e1" fontWeight="bold">{node.id}</text>
                    </g>
                  ))}

                  {/* Attacker Agent */}
                  <g className="animate-agent-attacker" style={{ transformOrigin: '200px 40px' }}>
                    <circle cx="280" cy="90" r="6" fill="#ff006e" />
                    <circle cx="280" cy="90" r="8" fill="none" stroke="#ff006e" strokeWidth="1" opacity="0.6" />
                    <text x="280" y="110" textAnchor="middle" fontSize="8" fill="#ff006e" fontWeight="bold">Attacker</text>
                  </g>

                  {/* Defender Agent */}
                  <g className="animate-agent-defender" style={{ transformOrigin: '200px 40px' }}>
                    <circle cx="120" cy="90" r="6" fill="#22c55e" />
                    <circle cx="120" cy="90" r="8" fill="none" stroke="#22c55e" strokeWidth="1" opacity="0.6" />
                    <text x="120" y="110" textAnchor="middle" fontSize="8" fill="#22c55e" fontWeight="bold">Defender</text>
                  </g>
                </svg>
              </div>
            </div>

            {/* Agent Stats Side by Side */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Attacker Stats */}
              <div className="space-y-4">
                <div className="border-b border-red-500/30 pb-4">
                  <h4 className="text-xl font-bold text-red-400 mb-2">🔴 Attacker Agent</h4>
                  <p className="text-slate-400 text-sm">Learning to breach network defenses</p>
                </div>

                <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3">
                  <p className="text-red-300 text-xs font-semibold mb-1">📍 Current Action</p>
                  <p className="text-red-200 text-xs">Exploiting WEB and DB1 nodes for maximum impact</p>
                </div>

                <div className="grid grid-cols-3 gap-2 text-sm">
                  <div className="bg-slate-700/50 rounded-lg p-3 text-center">
                    <p className="text-slate-400 text-xs mb-1">Reward</p>
                    <p className="text-red-400 font-bold text-lg">+24.5</p>
                  </div>
                  <div className="bg-slate-700/50 rounded-lg p-3 text-center">
                    <p className="text-slate-400 text-xs mb-1">Success</p>
                    <p className="text-red-400 font-bold text-lg">68%</p>
                  </div>
                  <div className="bg-slate-700/50 rounded-lg p-3 text-center">
                    <p className="text-slate-400 text-xs mb-1">Episodes</p>
                    <p className="text-red-400 font-bold text-lg">5.2K</p>
                  </div>
                </div>

                <div className="bg-slate-700/20 rounded-lg p-3">
                  <p className="text-slate-300 text-xs font-semibold mb-2">Learning Progress</p>
                  <div className="w-full bg-slate-700 rounded-full h-3 overflow-hidden">
                    <div className="bg-gradient-to-r from-red-600 to-red-500 h-3 rounded-full" style={{ width: '68%' }}></div>
                  </div>
                  <p className="text-red-300 text-xs mt-1 font-semibold">68% Converged</p>
                </div>
              </div>

              {/* Defender Stats */}
              <div className="space-y-4">
                <div className="border-b border-green-500/30 pb-4">
                  <h4 className="text-xl font-bold text-green-400 mb-2">🔵 Defender Agent</h4>
                  <p className="text-slate-400 text-sm">Learning to protect network infrastructure</p>
                </div>

                <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3">
                  <p className="text-green-300 text-xs font-semibold mb-1">📍 Current Action</p>
                  <p className="text-green-200 text-xs">Reinforcing defenses on WEB, DB1, and API nodes</p>
                </div>

                <div className="grid grid-cols-3 gap-2 text-sm">
                  <div className="bg-slate-700/50 rounded-lg p-3 text-center">
                    <p className="text-slate-400 text-xs mb-1">Reward</p>
                    <p className="text-green-400 font-bold text-lg">+28.3</p>
                  </div>
                  <div className="bg-slate-700/50 rounded-lg p-3 text-center">
                    <p className="text-slate-400 text-xs mb-1">Defense</p>
                    <p className="text-green-400 font-bold text-lg">72%</p>
                  </div>
                  <div className="bg-slate-700/50 rounded-lg p-3 text-center">
                    <p className="text-slate-400 text-xs mb-1">Episodes</p>
                    <p className="text-green-400 font-bold text-lg">5.2K</p>
                  </div>
                </div>

                <div className="bg-slate-700/20 rounded-lg p-3">
                  <p className="text-slate-300 text-xs font-semibold mb-2">Learning Progress</p>
                  <div className="w-full bg-slate-700 rounded-full h-3 overflow-hidden">
                    <div className="bg-gradient-to-r from-green-600 to-green-500 h-3 rounded-full" style={{ width: '72%' }}></div>
                  </div>
                  <p className="text-green-300 text-xs mt-1 font-semibold">72% Converged</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Model Evolution Graph */}
        <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl border border-slate-700 p-8 shadow-2xl mb-12">
          <h3 className="text-2xl font-bold text-white mb-6">📈 Model Performance Evolution Over Time</h3>

          <div className="space-y-8">
            {/* Reward Curve */}
            <div>
              <p className="text-slate-300 font-semibold mb-4">Agent Cumulative Reward Progress</p>
              <div className="bg-slate-700/30 rounded-lg p-6 border border-slate-600 relative h-48">
                {/* SVG Chart */}
                <svg viewBox="0 0 600 150" className="w-full h-full">
                  {/* Grid */}
                  {[0, 1, 2, 3, 4].map((i) => (
                    <line
                      key={`grid-h-${i}`}
                      x1="0"
                      y1={i * 37.5}
                      x2="600"
                      y2={i * 37.5}
                      stroke="#475569"
                      strokeWidth="1"
                      opacity="0.3"
                    />
                  ))}

                  {/* Attacker Reward Curve (Red) */}
                  <polyline
                    points="0,120 60,110 120,85 180,65 240,50 300,45 360,42 420,40 480,39 540,38 600,38"
                    fill="none"
                    stroke="#ef4444"
                    strokeWidth="3"
                    className="animate-network-flow"
                    opacity="0.8"
                  />

                  {/* Defender Reward Curve (Blue) */}
                  <polyline
                    points="0,120 60,108 120,90 180,70 240,55 300,48 360,44 420,42 480,41 540,40 600,40"
                    fill="none"
                    stroke="#3b82f6"
                    strokeWidth="3"
                    opacity="0.8"
                  />

                  {/* Data points for Attacker */}
                  {[0, 2, 4, 6, 8, 10].map((i) => (
                    <circle
                      key={`attacker-dot-${i}`}
                      cx={i * 60}
                      cy={120 - i * 13.6}
                      r="3"
                      fill="#ef4444"
                      opacity="0.6"
                    />
                  ))}

                  {/* Data points for Defender */}
                  {[0, 2, 4, 6, 8, 10].map((i) => (
                    <circle
                      key={`defender-dot-${i}`}
                      cx={i * 60}
                      cy={120 - i * 13.2}
                      r="3"
                      fill="#3b82f6"
                      opacity="0.6"
                    />
                  ))}
                </svg>
              </div>

              <div className="flex gap-6 mt-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <span className="text-sm text-slate-300">Attacker Reward Trend</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                  <span className="text-sm text-slate-300">Defender Reward Trend</span>
                </div>
              </div>
            </div>

            {/* Learning Progress */}
            <div>
              <p className="text-slate-300 font-semibold mb-4">Win Rate Convergence (Validation Set)</p>
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm text-red-400">Attacker Win Rate</span>
                    <span className="text-sm font-bold text-red-400">68%</span>
                  </div>
                  <div className="w-full bg-slate-700 rounded-full h-3 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-red-600 to-red-500 h-3 rounded-full"
                      style={{ width: '68%' }}
                    ></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm text-blue-400">Defender Win Rate</span>
                    <span className="text-sm font-bold text-blue-400">72%</span>
                  </div>
                  <div className="w-full bg-slate-700 rounded-full h-3 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-blue-600 to-blue-500 h-3 rounded-full"
                      style={{ width: '72%' }}
                    ></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm text-purple-400">Training Convergence</span>
                    <span className="text-sm font-bold text-purple-400">84%</span>
                  </div>
                  <div className="w-full bg-slate-700 rounded-full h-3 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-purple-600 to-purple-500 h-3 rounded-full"
                      style={{ width: '84%' }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* MARL How It Works Info */}
        <div className="bg-gradient-to-r from-purple-900/30 to-pink-900/30 rounded-2xl border border-purple-500/50 p-8">
          <h4 className="text-xl font-bold text-white mb-4">How MARL Training Works</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-3">
              <p className="text-purple-300 font-semibold">🎯 Competing Objectives</p>
              <p className="text-slate-400 text-sm">Attacker learns to breach network through exploitation while defender learns to prevent breaches through proactive defense strategies</p>
            </div>
            <div className="space-y-3">
              <p className="text-purple-300 font-semibold">🧠 Learning Mechanisms</p>
              <p className="text-slate-400 text-sm">Both agents learn optimal policies using PPO and DQN algorithms. They improve gradually as shown in the reward curves above</p>
            </div>
            <div className="space-y-3">
              <p className="text-purple-300 font-semibold">📊 Emergent Strategies</p>
              <p className="text-slate-400 text-sm">From competition, sophisticated attack vectors and defense mechanisms emerge automatically without explicit programming</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-white mb-4">Powerful Features</h2>
          <p className="text-xl text-slate-400">Everything you need to train and analyze AI agents for cybersecurity</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, idx) => (
            <div
              key={idx}
              className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-8 border border-slate-700 hover:border-blue-500 transition group hover:shadow-2xl"
            >
              <div className="text-4xl mb-4">{feature.icon}</div>
              <h3 className="text-xl font-bold text-white mb-3">{feature.title}</h3>
              <p className="text-slate-400">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How It Works Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-white mb-4">How It Works</h2>
          <p className="text-xl text-slate-400">A simple workflow to get you started</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, idx) => (
            <div key={idx} className="relative">
              {idx < steps.length - 1 && (
                <div className="hidden lg:block absolute top-20 left-1/2 w-full h-0.5 bg-gradient-to-r from-blue-500 to-slate-700"></div>
              )}
              <div className="relative bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-8 border border-slate-700 hover:border-blue-500 transition">
                <div className="absolute -top-6 -left-6 w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg">
                  {step.number}
                </div>
                <h3 className="text-xl font-bold text-white mb-3 mt-4">{step.title}</h3>
                <p className="text-slate-400">{step.description}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Use Cases Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-white mb-4">Use Cases</h2>
          <p className="text-xl text-slate-400">Explore what you can do with AutoSentinel</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-8 border border-slate-700">
            <h3 className="text-2xl font-bold text-white mb-4">🎓 Academic Research</h3>
            <p className="text-slate-400 mb-4">
              Conduct research on AI-based cybersecurity defense mechanisms and attack strategies in controlled network environments.
            </p>
            <ul className="space-y-2 text-slate-400 text-sm">
              <li>✓ Study agent decision-making</li>
              <li>✓ Compare RL algorithms</li>
              <li>✓ Analyze attack/defense dynamics</li>
            </ul>
          </div>

          <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-8 border border-slate-700">
            <h3 className="text-2xl font-bold text-white mb-4">🏢 Enterprise Security</h3>
            <p className="text-slate-400 mb-4">
              Train autonomous defense systems to respond to threats in real network configurations.
            </p>
            <ul className="space-y-2 text-slate-400 text-sm">
              <li>✓ Custom network simulations</li>
              <li>✓ Real-world threat scenarios</li>
              <li>✓ Decision explainability</li>
            </ul>
          </div>

          <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-8 border border-slate-700">
            <h3 className="text-2xl font-bold text-white mb-4">🎯 Penetration Testing</h3>
            <p className="text-slate-400 mb-4">
              Simulate advanced persistent threats and defensive responses for security assessments.
            </p>
            <ul className="space-y-2 text-slate-400 text-sm">
              <li>✓ Automated attack simulations</li>
              <li>✓ Defense strategy validation</li>
              <li>✓ Threat modeling</li>
            </ul>
          </div>

          <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-8 border border-slate-700">
            <h3 className="text-2xl font-bold text-white mb-4">🔬 AI Training</h3>
            <p className="text-slate-400 mb-4">
              Develop and benchmark machine learning models for autonomous cybersecurity applications.
            </p>
            <ul className="space-y-2 text-slate-400 text-sm">
              <li>✓ Large-scale training</li>
              <li>✓ Performance metrics</li>
              <li>✓ Model comparison</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Tech Stack Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-white mb-4">Technology Stack</h2>
          <p className="text-xl text-slate-400">Built with modern, reliable technologies</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-8 border border-slate-700">
            <h3 className="text-xl font-bold text-blue-400 mb-4">Frontend</h3>
            <ul className="space-y-2 text-slate-400 text-sm">
              <li>⚛️ React.js</li>
              <li>🎨 Tailwind CSS</li>
              <li>📡 WebSocket</li>
              <li>🗺️ D3.js Visualization</li>
            </ul>
          </div>

          <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-8 border border-slate-700">
            <h3 className="text-xl font-bold text-green-400 mb-4">Backend</h3>
            <ul className="space-y-2 text-slate-400 text-sm">
              <li>🐍 Python FastAPI</li>
              <li>📊 Ray RLlib</li>
              <li>🤖 PyTorch</li>
              <li>🗃️ MongoDB</li>
            </ul>
          </div>

          <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-8 border border-slate-700">
            <h3 className="text-xl font-bold text-purple-400 mb-4">AI/ML</h3>
            <ul className="space-y-2 text-slate-400 text-sm">
              <li>🤖 Google Gemini (XAI)</li>
              <li>📈 PPO Algorithm</li>
              <li>🎯 DQN Algorithm</li>
              <li>🔍 Model Explainability</li>
            </ul>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-3xl p-16 text-center">
          <h2 className="text-4xl font-bold text-white mb-6">Ready to Get Started?</h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Join the future of autonomous cybersecurity. Design networks, train AI agents, and understand their decisions.
          </p>
          {!user && (
            <div className="flex gap-4 justify-center">
              <button
                onClick={() => navigate('/signup')}
                className="px-8 py-3 bg-white text-blue-600 font-semibold rounded-xl hover:bg-blue-50 transition transform hover:scale-105"
              >
                Sign Up Now
              </button>
              <button
                onClick={() => navigate('/login')}
                className="px-8 py-3 bg-blue-700 hover:bg-blue-800 text-white font-semibold rounded-xl transition"
              >
                Login
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-700 py-12 mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-slate-400">
          <p>&copy; 2024 AutoSentinel. Autonomous Network Security Simulation Platform.</p>
          <p className="text-sm mt-2">Building the future of AI-driven cybersecurity.</p>
        </div>
      </footer>
    </div>
  )
}

export default Landing
