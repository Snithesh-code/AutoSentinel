import { spawn } from 'child_process'
import path from 'path'
import fs from 'fs/promises'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Store active training processes
const activeTrainings = new Map()

/**
 * Start PrimAITE training for a network
 */
export const startTraining = async (network, trainingConfig) => {
  const trainingId = `${network._id}_${Date.now()}`

  try {
    console.log(`\n🎯 [startTraining] Starting training ID: ${trainingId}`)
    console.log(`📦 [startTraining] Network: ${network._id}, YAML: ${network.yamlFile}`)

    // Ensure YAML file exists
    if (!network.yamlFile || !(await fileExists(network.yamlFile))) {
      throw new Error('Network YAML file not found: ' + network.yamlFile)
    }
    console.log(`✓ [startTraining] YAML file exists`)

    // Validate that network has agents
    if (!network.config.agents || network.config.agents.length === 0) {
      throw new Error('Network must have at least one agent configured for training')
    }
    console.log(`✓ [startTraining] Network has agents`)

    // Create training output directory
    const outputDir = path.join(process.cwd(), 'uploads', 'training', trainingId)
    await fs.mkdir(outputDir, { recursive: true })
    console.log(`✓ [startTraining] Output directory created: ${outputDir}`)

    // Build training command using our custom Ray RLlib training script
    // Use the autov1 Python virtual environment which has PrimAITE installed
    const pythonExe = 'C:\\Users\\snith\\OneDrive\\Desktop\\autov1\\backend\\python\\p312\\Scripts\\python.exe'
    const primaiteDir = 'C:\\Users\\snith\\OneDrive\\Desktop\\autov1\\backend\\python\\PrimAITE\\src'
    const autov2PythonDir = path.join(process.cwd(), '..', 'python')
    const trainScript = path.join(autov2PythonDir, 'train_network.py')

    console.log(`🐍 [startTraining] Python exe: ${pythonExe}`)
    console.log(`📄 [startTraining] Train script: ${trainScript}`)
    console.log(`📁 [startTraining] Working dir: ${autov2PythonDir}`)

    const args = [
      trainScript,
      '--config', network.yamlFile,
      '--output', outputDir,
      '--episodes', String(trainingConfig.episodes || 1000),
      '--save-frequency', String(trainingConfig.saveFrequency || 10),
      '--algorithm', trainingConfig.algorithm || 'PPO'
    ]

    if (trainingConfig.verbose) {
      args.push('--verbose')
    }

    console.log(`📋 [startTraining] Command args: ${args.join(' ')}`)

    // Spawn training process with autov1 Python environment
    console.log(`🚀 [startTraining] Spawning Python process...`)
    const trainingProcess = spawn(pythonExe, args, {
      cwd: autov2PythonDir,
      env: {
        ...process.env,
        PYTHONPATH: primaiteDir + path.delimiter + (process.env.PYTHONPATH || '')
      }
    })

    console.log(`✓ [startTraining] Process spawned, PID: ${trainingProcess.pid}`)

    // Store training info
    const trainingInfo = {
      id: trainingId,
      networkId: network._id.toString(),
      networkName: network.name,
      userId: network.user ? network.user.toString() : null, // Store user ID for permission checks
      status: 'running',
      startTime: new Date(),
      config: trainingConfig,
      outputDir,
      process: trainingProcess,
      logs: [],
      progress: {
        currentEpisode: 0,
        totalEpisodes: trainingConfig.episodes || 1000,
        currentIteration: 0,
        avgReward: null,
        meanEpisodeLength: 0,
        policyRewards: {},
        policyRewardHistory: {}, // Track reward history per policy
        rewardHistory: [],
        lastUpdate: new Date()
      }
    }

    activeTrainings.set(trainingId, trainingInfo)

    // Capture stdout
    trainingProcess.stdout.on('data', (data) => {
      const line = data.toString()

      // Filter out verbose logs
      const shouldLog = !line.includes('green_user_log') &&
                        !line.includes('WARNING framework.py') &&
                        !line.includes('Not importing TensorFlow')

      if (shouldLog) {
        console.log(`[Training ${trainingId}] STDOUT:`, line)
        trainingInfo.logs.push({
          type: 'stdout',
          message: line,
          timestamp: new Date()
        })
      }

      // Parse progress from output (always parse, even if not logged)
      parseProgress(line, trainingInfo)

      // Keep only last 1000 log lines
      if (trainingInfo.logs.length > 1000) {
        trainingInfo.logs = trainingInfo.logs.slice(-1000)
      }
    })

    // Capture stderr
    trainingProcess.stderr.on('data', (data) => {
      const line = data.toString()

      // Filter out verbose logs
      const shouldLog = !line.includes('green_user_log') &&
                        !line.includes('WARNING framework.py') &&
                        !line.includes('Not importing TensorFlow')

      if (shouldLog) {
        console.log(`[Training ${trainingId}] STDERR:`, line)
        trainingInfo.logs.push({
          type: 'stderr',
          message: line,
          timestamp: new Date()
        })
      }

      // Parse progress from stderr too
      parseProgress(line, trainingInfo)

      if (trainingInfo.logs.length > 1000) {
        trainingInfo.logs = trainingInfo.logs.slice(-1000)
      }
    })

    // Handle process completion
    trainingProcess.on('close', (code) => {
      console.log(`⏹️ [Training ${trainingId}] Process closed with code: ${code}`)
      trainingInfo.status = code === 0 ? 'completed' : 'failed'
      trainingInfo.endTime = new Date()
      trainingInfo.exitCode = code

      // Clean up process reference
      delete trainingInfo.process
    })

    trainingProcess.on('error', (err) => {
      console.error(`❌ [Training ${trainingId}] Process error:`, err)
      trainingInfo.status = 'error'
      trainingInfo.error = err.message
      trainingInfo.endTime = new Date()
    })

    trainingProcess.on('exit', (code, signal) => {
      console.log(`🛑 [Training ${trainingId}] Process exited with code: ${code}, signal: ${signal}`)
    })

    return {
      success: true,
      trainingId,
      message: 'Training started successfully'
    }

  } catch (error) {
    throw new Error(`Failed to start training: ${error.message}`)
  }
}

/**
 * Get training status
 */
export const getTrainingStatus = (trainingId) => {
  const training = activeTrainings.get(trainingId)

  if (!training) {
    return null
  }

  // Return info without process object
  const { process, ...trainingStatus } = training
  return trainingStatus
}

/**
 * Get all trainings for a network
 */
export const getNetworkTrainings = (networkId) => {
  const trainings = []

  for (const [id, training] of activeTrainings.entries()) {
    if (training.networkId === networkId) {
      const { process, ...trainingStatus } = training
      trainings.push(trainingStatus)
    }
  }

  return trainings.sort((a, b) => b.startTime - a.startTime)
}

/**
 * Get all active trainings
 */
export const getAllTrainings = () => {
  const trainings = []

  for (const [id, training] of activeTrainings.entries()) {
    const { process, ...trainingStatus } = training
    trainings.push(trainingStatus)
  }

  return trainings.sort((a, b) => b.startTime - a.startTime)
}

/**
 * Stop training
 */
export const stopTraining = (trainingId) => {
  const training = activeTrainings.get(trainingId)

  if (!training) {
    return { success: false, error: 'Training not found' }
  }

  if (training.status !== 'running') {
    return { success: false, error: 'Training is not running' }
  }

  if (training.process) {
    training.process.kill('SIGTERM')
    training.status = 'stopped'
    training.endTime = new Date()

    return { success: true, message: 'Training stopped' }
  }

  return { success: false, error: 'Training process not found' }
}

/**
 * Delete training - remove from active trainings map
 */
export const deleteTraining = (trainingId) => {
  const training = activeTrainings.get(trainingId)

  if (!training) {
    return { success: false, error: 'Training not found' }
  }

  // Stop the process if it's still running
  if (training.process && !training.process.killed) {
    training.process.kill('SIGTERM')
  }

  // Remove from the active trainings map
  const deleted = activeTrainings.delete(trainingId)

  if (deleted) {
    console.log(`✓ [deleteTraining] Training ${trainingId} removed from memory`)
    return { success: true, message: 'Training deleted successfully' }
  }

  return { success: false, error: 'Failed to delete training' }
}

/**
 * Get training logs
 */
export const getTrainingLogs = (trainingId, limit = 100) => {
  const training = activeTrainings.get(trainingId)

  if (!training) {
    return null
  }

  return training.logs.slice(-limit)
}

/**
 * Parse progress from PrimAITE output
 */
function parseProgress(line, trainingInfo) {
  // Parse structured METRIC lines: METRIC|episode=1|length=128|reward=0.500|attacker=-45.350|defender=-45.350
  if (line.startsWith('METRIC|')) {
    const parts = line.substring(7).split('|')
    const data = {}
    parts.forEach(part => {
      const [key, value] = part.split('=')
      if (key && value) {
        data[key] = value
      }
    })

    if (data.episode) {
      trainingInfo.progress.currentEpisode = parseInt(data.episode)
    }
    if (data.reward) {
      const reward = parseFloat(data.reward)
      trainingInfo.progress.avgReward = reward
      // Track reward history (keep last 100)
      trainingInfo.progress.rewardHistory.push({
        episode: trainingInfo.progress.currentEpisode,
        reward: reward
      })
      if (trainingInfo.progress.rewardHistory.length > 100) {
        trainingInfo.progress.rewardHistory.shift()
      }
    }
    if (data.length) {
      trainingInfo.progress.meanEpisodeLength = parseFloat(data.length)
    }

    // Extract per-policy rewards from METRIC line: attacker=X|defender=Y
    if (data.attacker || data.defender) {
      console.log(`[parseProgress] Found policy rewards - attacker: ${data.attacker}, defender: ${data.defender}`)

      if (data.attacker) {
        const attackerReward = parseFloat(data.attacker)
        if (!trainingInfo.progress.policyRewardHistory['attacker']) {
          trainingInfo.progress.policyRewardHistory['attacker'] = []
        }
        trainingInfo.progress.policyRewardHistory['attacker'].push({
          episode: trainingInfo.progress.currentEpisode,
          reward: attackerReward
        })
        trainingInfo.progress.policyRewards['attacker'] = attackerReward

        // Keep last 100 episodes
        if (trainingInfo.progress.policyRewardHistory['attacker'].length > 100) {
          trainingInfo.progress.policyRewardHistory['attacker'].shift()
        }
      }

      if (data.defender) {
        const defenderReward = parseFloat(data.defender)
        if (!trainingInfo.progress.policyRewardHistory['defender']) {
          trainingInfo.progress.policyRewardHistory['defender'] = []
        }
        trainingInfo.progress.policyRewardHistory['defender'].push({
          episode: trainingInfo.progress.currentEpisode,
          reward: defenderReward
        })
        trainingInfo.progress.policyRewards['defender'] = defenderReward

        // Keep last 100 episodes
        if (trainingInfo.progress.policyRewardHistory['defender'].length > 100) {
          trainingInfo.progress.policyRewardHistory['defender'].shift()
        }
      }
    } else if (line.includes('METRIC|')) {
      console.log(`[parseProgress] METRIC line but no attacker/defender: ${line}`)
      console.log(`[parseProgress] Parsed data:`, data)
    }

    trainingInfo.progress.lastUpdate = new Date()
  }

  // Parse structured ITERATION lines: ITERATION|iter=1|episodes=10/1000|time=5.23s|mean_len=128|RED_attacker=0.500|BLUE_defender=0.300
  if (line.startsWith('ITERATION|')) {
    const parts = line.substring(11).split('|')
    const data = {}
    parts.forEach(part => {
      const [key, value] = part.split('=')
      if (key && value) {
        data[key] = value
      }
    })

    if (data.iter) {
      trainingInfo.progress.currentIteration = parseInt(data.iter)
    }
    if (data.episodes) {
      const [current, total] = data.episodes.split('/')
      trainingInfo.progress.currentEpisode = parseInt(current)
      trainingInfo.progress.totalEpisodes = parseInt(total)
    }
    if (data.mean_len) {
      trainingInfo.progress.meanEpisodeLength = parseFloat(data.mean_len)
    }

    // Parse policy rewards: RED_attacker=0.500, BLUE_defender=0.300
    // Also support legacy format: policies=green=0.500,blue=0.300
    if (data.RED_attacker || data.BLUE_defender) {
      // New format with separate RED_attacker and BLUE_defender
      if (data.RED_attacker) {
        const rewardValue = parseFloat(data.RED_attacker)
        trainingInfo.progress.policyRewards['attacker'] = rewardValue

        // Track reward history per policy
        if (!trainingInfo.progress.policyRewardHistory['attacker']) {
          trainingInfo.progress.policyRewardHistory['attacker'] = []
        }
        trainingInfo.progress.policyRewardHistory['attacker'].push({
          iteration: trainingInfo.progress.currentIteration,
          reward: rewardValue
        })

        // Keep only last 100 entries per policy
        if (trainingInfo.progress.policyRewardHistory['attacker'].length > 100) {
          trainingInfo.progress.policyRewardHistory['attacker'].shift()
        }
      }

      if (data.BLUE_defender) {
        const rewardValue = parseFloat(data.BLUE_defender)
        trainingInfo.progress.policyRewards['defender'] = rewardValue

        // Track reward history per policy
        if (!trainingInfo.progress.policyRewardHistory['defender']) {
          trainingInfo.progress.policyRewardHistory['defender'] = []
        }
        trainingInfo.progress.policyRewardHistory['defender'].push({
          iteration: trainingInfo.progress.currentIteration,
          reward: rewardValue
        })

        // Keep only last 100 entries per policy
        if (trainingInfo.progress.policyRewardHistory['defender'].length > 100) {
          trainingInfo.progress.policyRewardHistory['defender'].shift()
        }
      }
    } else if (data.policies) {
      // Legacy format: Parse policy rewards: green=0.500,blue=0.300
      const policyPairs = data.policies.split(',')
      policyPairs.forEach(pair => {
        const [policy, reward] = pair.split('=')
        if (policy && reward) {
          const rewardValue = parseFloat(reward)
          trainingInfo.progress.policyRewards[policy] = rewardValue

          // Track reward history per policy
          if (!trainingInfo.progress.policyRewardHistory[policy]) {
            trainingInfo.progress.policyRewardHistory[policy] = []
          }
          trainingInfo.progress.policyRewardHistory[policy].push({
            iteration: trainingInfo.progress.currentIteration,
            reward: rewardValue
          })

          // Keep only last 100 entries per policy
          if (trainingInfo.progress.policyRewardHistory[policy].length > 100) {
            trainingInfo.progress.policyRewardHistory[policy].shift()
          }
        }
      })
    }
    trainingInfo.progress.lastUpdate = new Date()
  }
}

/**
 * Check if file exists
 */
async function fileExists(filePath) {
  try {
    await fs.access(filePath)
    return true
  } catch {
    return false
  }
}

/**
 * Clean up old trainings (keep last 100)
 */
export const cleanupOldTrainings = () => {
  const trainings = Array.from(activeTrainings.entries())
    .filter(([_, t]) => t.status !== 'running')
    .sort((a, b) => b[1].startTime - a[1].startTime)

  // Keep only last 100 completed/stopped trainings
  if (trainings.length > 100) {
    const toRemove = trainings.slice(100)
    toRemove.forEach(([id]) => activeTrainings.delete(id))
  }
}

// Cleanup every hour
setInterval(cleanupOldTrainings, 60 * 60 * 1000)
