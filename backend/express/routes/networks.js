import express from 'express'
import { body, validationResult } from 'express-validator'
import Network from '../models/Network.js'
import User from '../models/User.js'
import { protect } from '../middleware/auth.js'
import { generateYAML, saveYAMLToFile, validateNetwork } from '../utils/yamlGenerator.js'
import {
  startTraining,
  getTrainingStatus,
  getNetworkTrainings,
  getAllTrainings,
  stopTraining,
  deleteTraining,
  getTrainingLogs
} from '../utils/primaiteTrainer.js'
import archiver from 'archiver'
import fs from 'fs'
import path from 'path'
import { v4 as uuidv4 } from 'uuid'

const router = express.Router()

// Quota limits by role
const QUOTA_LIMITS = {
  free: {
    networks: 5,
    trainings: 1,
    simulations: 100
  },
  premium: {
    networks: 10,
    trainings: 5,
    simulations: 500
  },
  admin: {
    networks: Infinity,
    trainings: Infinity,
    simulations: Infinity
  }
}

// All routes are protected
router.use(protect)

// @route   GET /api/networks
// @desc    Get all networks for logged in user
// @access  Private
router.get('/', async (req, res) => {
  try {
    const networks = await Network.find({ user: req.user.id })
      .sort({ createdAt: -1 })

    // Map networks to include only necessary config fields for list view
    const networksList = networks.map(network => ({
      _id: network._id,
      name: network.name,
      description: network.description,
      tags: network.tags,
      createdAt: network.createdAt,
      updatedAt: network.updatedAt,
      user: network.user,
      config: {
        nodes: network.config?.nodes || [],
        agents: network.config?.agents || []
      }
    }))

    res.json({
      success: true,
      count: networksList.length,
      networks: networksList
    })
  } catch (error) {
    console.error('Get networks error:', error)
    res.status(500).json({
      success: false,
      error: 'Server error fetching networks'
    })
  }
})

// @route   GET /api/networks/:id
// @desc    Get single network by ID
// @access  Private
router.get('/:id', async (req, res) => {
  try {
    const network = await Network.findById(req.params.id)

    if (!network) {
      return res.status(404).json({
        success: false,
        error: 'Network not found'
      })
    }

    // Check ownership
    if (network.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to access this network'
      })
    }

    res.json({
      success: true,
      network
    })
  } catch (error) {
    console.error('Get network error:', error)
    res.status(500).json({
      success: false,
      error: 'Server error fetching network'
    })
  }
})

// @route   POST /api/networks
// @desc    Create new network
// @access  Private
router.post('/', [
  body('name').trim().notEmpty().withMessage('Network name is required'),
  body('config').notEmpty().withMessage('Network configuration is required')
], async (req, res) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    })
  }

  try {
    const { name, description, config, tags } = req.body

    // Get user and check quota
    const user = await User.findById(req.user.id)
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      })
    }

    // Check network quota
    const networkQuota = QUOTA_LIMITS[user.role].networks
    const userNetworkCount = await Network.countDocuments({ user: req.user.id })

    if (userNetworkCount >= networkQuota) {
      return res.status(403).json({
        success: false,
        error: `Network limit exceeded. ${user.role} plan allows ${networkQuota} networks. Current: ${userNetworkCount}`,
        quota: {
          limit: networkQuota,
          current: userNetworkCount,
          role: user.role
        }
      })
    }

    // Validate network configuration
    const validation = validateNetwork(config)
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        error: 'Invalid network configuration',
        validationErrors: validation.errors
      })
    }

    // Create network
    const network = await Network.create({
      name,
      description,
      config,
      tags,
      user: req.user.id
    })

    // Update user network count
    user.networksCount = (user.networksCount || 0) + 1
    await user.save()

    // Generate YAML file
    try {
      const yamlContent = await generateYAML(network)
      const filename = `${network._id}.yaml`
      const filePath = await saveYAMLToFile(yamlContent, filename)

      network.yamlFile = filePath
      await network.save()
    } catch (yamlError) {
      console.error('YAML generation error:', yamlError)
      // Network is still created, just without YAML file
    }

    res.status(201).json({
      success: true,
      network
    })
  } catch (error) {
    console.error('Create network error:', error)
    res.status(500).json({
      success: false,
      error: 'Server error creating network'
    })
  }
})

// @route   PUT /api/networks/:id
// @desc    Update network
// @access  Private
router.put('/:id', [
  body('name').optional().trim().notEmpty().withMessage('Network name cannot be empty')
], async (req, res) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    })
  }

  try {
    let network = await Network.findById(req.params.id)

    if (!network) {
      return res.status(404).json({
        success: false,
        error: 'Network not found'
      })
    }

    // Check ownership
    if (network.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to update this network'
      })
    }

    const { name, description, config, tags } = req.body

    // If config is being updated, validate it
    if (config) {
      const validation = validateNetwork(config)
      if (!validation.isValid) {
        return res.status(400).json({
          success: false,
          error: 'Invalid network configuration',
          validationErrors: validation.errors
        })
      }
    }

    // Update fields
    if (name) network.name = name
    if (description !== undefined) network.description = description
    if (config) network.config = config
    if (tags) network.tags = tags

    await network.save()

    // Regenerate YAML if config changed
    if (config) {
      try {
        const yamlContent = await generateYAML(network)
        const filename = `${network._id}.yaml`
        const filePath = await saveYAMLToFile(yamlContent, filename)

        network.yamlFile = filePath
        await network.save()
      } catch (yamlError) {
        console.error('YAML regeneration error:', yamlError)
      }
    }

    res.json({
      success: true,
      network
    })
  } catch (error) {
    console.error('Update network error:', error)
    res.status(500).json({
      success: false,
      error: 'Server error updating network'
    })
  }
})

// @route   DELETE /api/networks/:id
// @desc    Delete network
// @access  Private
router.delete('/:id', async (req, res) => {
  try {
    const network = await Network.findById(req.params.id)

    if (!network) {
      return res.status(404).json({
        success: false,
        error: 'Network not found'
      })
    }

    // Check ownership
    if (network.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to delete this network'
      })
    }

    // Delete YAML file if exists
    if (network.yamlFile) {
      try {
        await fs.promises.unlink(network.yamlFile)
      } catch (err) {
        console.error('Error deleting YAML file:', err)
      }
    }

    await network.deleteOne()

    res.json({
      success: true,
      message: 'Network deleted successfully'
    })
  } catch (error) {
    console.error('Delete network error:', error)
    res.status(500).json({
      success: false,
      error: 'Server error deleting network'
    })
  }
})

// @route   GET /api/networks/:id/download
// @desc    Download network as zip (YAML + config)
// @access  Private
router.get('/:id/download', async (req, res) => {
  try {
    const network = await Network.findById(req.params.id)

    if (!network) {
      return res.status(404).json({
        success: false,
        error: 'Network not found'
      })
    }

    // Check ownership
    if (network.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to download this network'
      })
    }

    // Generate YAML if not exists
    let yamlContent
    if (network.yamlFile && fs.existsSync(network.yamlFile)) {
      yamlContent = await fs.promises.readFile(network.yamlFile, 'utf8')
    } else {
      yamlContent = await generateYAML(network)
    }

    // Create zip archive
    const archive = archiver('zip', {
      zlib: { level: 9 }
    })

    // Set response headers
    const zipFilename = `${network.name.replace(/\s+/g, '_')}_${network._id}.zip`
    res.attachment(zipFilename)

    // Pipe archive to response
    archive.pipe(res)

    // Add YAML file to archive
    archive.append(yamlContent, { name: `${network.name.replace(/\s+/g, '_')}.yaml` })

    // Add JSON config file
    const jsonConfig = JSON.stringify(network.config, null, 2)
    archive.append(jsonConfig, { name: 'config.json' })

    // Add README
    const readme = `# ${network.name}

${network.description || 'No description provided'}

## Contents

- **${network.name.replace(/\s+/g, '_')}.yaml**: PrimAITE-compatible YAML configuration
- **config.json**: JSON representation of the network configuration

## Network Summary

- **Nodes**: ${network.config.nodes?.length || 0}
- **Links**: ${network.config.links?.length || 0}
- **Created**: ${network.createdAt}
- **Last Updated**: ${network.updatedAt}

## Usage

To run this simulation with PrimAITE:

\`\`\`bash
primaite run ${network.name.replace(/\s+/g, '_')}.yaml
\`\`\`

---
Generated by AutoSentinel v2
`
    archive.append(readme, { name: 'README.md' })

    // Finalize archive
    await archive.finalize()

  } catch (error) {
    console.error('Download network error:', error)
    res.status(500).json({
      success: false,
      error: 'Server error downloading network'
    })
  }
})

// @route   POST /api/networks/:id/simulate
// @desc    Start simulation for network
// @access  Private
router.post('/:id/simulate', async (req, res) => {
  try {
    const network = await Network.findById(req.params.id)

    if (!network) {
      return res.status(404).json({
        success: false,
        error: 'Network not found'
      })
    }

    // Check ownership
    if (network.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to simulate this network'
      })
    }

    // TODO: Integrate with Python backend to load and run simulation
    // For now, return success message
    res.json({
      success: true,
      message: 'Simulation endpoint ready - Python integration pending',
      networkId: network._id
    })
  } catch (error) {
    console.error('Simulate network error:', error)
    res.status(500).json({
      success: false,
      error: 'Server error starting simulation'
    })
  }
})

// @route   POST /api/networks/:id/train
// @desc    Start training for network
// @access  Private
router.post('/:id/train', [
  body('episodes').optional().isInt({ min: 1 }).withMessage('Episodes must be a positive integer'),
  body('saveFrequency').optional().isInt({ min: 1 }).withMessage('Save frequency must be a positive integer'),
  body('algorithm').optional().isString().withMessage('Algorithm must be a string'),
  body('actions').optional().isArray().withMessage('Actions must be an array'),
  body('actionSpace').optional().isString().withMessage('Action space must be a string')
], async (req, res) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    })
  }

  try {
    const network = await Network.findById(req.params.id)

    if (!network) {
      return res.status(404).json({
        success: false,
        error: 'Network not found'
      })
    }

    // Check ownership
    if (network.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to train this network'
      })
    }

    // Validate network has agents
    if (!network.config.agents || network.config.agents.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Network must have at least one agent configured for training'
      })
    }

    const trainingConfig = {
      episodes: req.body.episodes || 1000,
      saveFrequency: req.body.saveFrequency || 100,
      algorithm: req.body.algorithm || 'PPO',
      verbose: req.body.verbose || false,
      actions: req.body.actions || [],
      actionSpace: req.body.actionSpace || 'all',
      agents: network.config.agents || [] // Include agent configurations with their observation spaces
    }

    const result = await startTraining(network, trainingConfig)

    res.json(result)
  } catch (error) {
    console.error('Start training error:', error)
    res.status(500).json({
      success: false,
      error: error.message || 'Server error starting training'
    })
  }
})

// @route   GET /api/networks/:id/trainings
// @desc    Get all trainings for a network
// @access  Private
router.get('/:id/trainings', async (req, res) => {
  try {
    const network = await Network.findById(req.params.id)

    if (!network) {
      return res.status(404).json({
        success: false,
        error: 'Network not found'
      })
    }

    // Check ownership
    if (network.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to access this network'
      })
    }

    const trainings = getNetworkTrainings(network._id.toString())

    res.json({
      success: true,
      trainings
    })
  } catch (error) {
    console.error('Get trainings error:', error)
    res.status(500).json({
      success: false,
      error: 'Server error fetching trainings'
    })
  }
})

// @route   GET /api/trainings
// @desc    Get all trainings for logged in user
// @access  Private
router.get('/trainings/all', async (req, res) => {
  try {
    // Get all user's networks
    const networks = await Network.find({ user: req.user.id }).select('_id')
    const networkIds = networks.map(n => n._id.toString())

    // Get all trainings
    const allTrainings = getAllTrainings()

    // Filter to only user's trainings (including YAML trainings which start with 'yaml_')
    const userTrainings = allTrainings.filter(t =>
      networkIds.includes(t.networkId) || (typeof t.networkId === 'string' && t.networkId.startsWith('yaml_'))
    )

    console.log(`🔍 [trainings/all] Database networks: ${networkIds.length}, All active trainings: ${allTrainings.length}, User trainings: ${userTrainings.length}`)

    res.json({
      success: true,
      trainings: userTrainings
    })
  } catch (error) {
    console.error('Get all trainings error:', error)
    res.status(500).json({
      success: false,
      error: 'Server error fetching trainings'
    })
  }
})

// @route   GET /api/trainings/:trainingId
// @desc    Get training status
// @access  Private
router.get('/trainings/:trainingId', async (req, res) => {
  try {
    const training = getTrainingStatus(req.params.trainingId)

    if (!training) {
      return res.status(404).json({
        success: false,
        error: 'Training not found'
      })
    }

    // Check ownership - either via stored userId (for YAML trainings) or via network (for DB trainings)
    if (training.userId) {
      // YAML training - check stored userId
      if (training.userId !== req.user.id) {
        return res.status(403).json({
          success: false,
          error: 'Not authorized to access this training'
        })
      }
    } else {
      // DB network training - check via network
      const network = await Network.findById(training.networkId)
      if (!network || network.user.toString() !== req.user.id) {
        return res.status(403).json({
          success: false,
          error: 'Not authorized to access this training'
        })
      }
    }

    res.json({
      success: true,
      training
    })
  } catch (error) {
    console.error('Get training status error:', error)
    res.status(500).json({
      success: false,
      error: 'Server error fetching training status'
    })
  }
})

// @route   POST /api/trainings/:trainingId/stop
// @desc    Stop training
// @access  Private
router.post('/trainings/:trainingId/stop', async (req, res) => {
  try {
    const training = getTrainingStatus(req.params.trainingId)

    if (!training) {
      return res.status(404).json({
        success: false,
        error: 'Training not found'
      })
    }

    // Check ownership - either via stored userId (for YAML trainings) or via network (for DB trainings)
    if (training.userId) {
      // YAML training - check stored userId
      if (training.userId !== req.user.id) {
        return res.status(403).json({
          success: false,
          error: 'Not authorized to stop this training'
        })
      }
    } else {
      // DB network training - check via network
      const network = await Network.findById(training.networkId)
      if (!network || network.user.toString() !== req.user.id) {
        return res.status(403).json({
          success: false,
          error: 'Not authorized to stop this training'
        })
      }
    }

    const result = stopTraining(req.params.trainingId)

    res.json(result)
  } catch (error) {
    console.error('Stop training error:', error)
    res.status(500).json({
      success: false,
      error: 'Server error stopping training'
    })
  }
})

// @route   GET /api/trainings/:trainingId/logs
// @desc    Get training logs
// @access  Private
router.get('/trainings/:trainingId/logs', async (req, res) => {
  try {
    const training = getTrainingStatus(req.params.trainingId)

    if (!training) {
      return res.status(404).json({
        success: false,
        error: 'Training not found'
      })
    }

    // Check ownership - either via stored userId (for YAML trainings) or via network (for DB trainings)
    if (training.userId) {
      // YAML training - check stored userId
      if (training.userId !== req.user.id) {
        return res.status(403).json({
          success: false,
          error: 'Not authorized to access this training'
        })
      }
    } else {
      // DB network training - check via network
      const network = await Network.findById(training.networkId)
      if (!network || network.user.toString() !== req.user.id) {
        return res.status(403).json({
          success: false,
          error: 'Not authorized to access this training'
        })
      }
    }

    const limit = parseInt(req.query.limit) || 100
    const logs = getTrainingLogs(req.params.trainingId, limit)

    res.json({
      success: true,
      logs: logs || []
    })
  } catch (error) {
    console.error('Get training logs error:', error)
    res.status(500).json({
      success: false,
      error: 'Server error fetching training logs'
    })
  }
})

// @route   GET /api/trainings/:trainingId/download
// @desc    Download trained model as zip file
// @access  Private
router.get('/trainings/:trainingId/download', async (req, res) => {
  try {
    const training = getTrainingStatus(req.params.trainingId)

    if (!training) {
      return res.status(404).json({
        success: false,
        error: 'Training not found'
      })
    }

    // Check ownership - either via stored userId (for YAML trainings) or via network (for DB trainings)
    let networkName = training.networkName
    if (training.userId) {
      // YAML training - check stored userId
      if (training.userId !== req.user.id) {
        return res.status(403).json({
          success: false,
          error: 'Not authorized to access this training'
        })
      }
    } else {
      // DB network training - check via network
      const network = await Network.findById(training.networkId)
      if (!network || network.user.toString() !== req.user.id) {
        return res.status(403).json({
          success: false,
          error: 'Not authorized to access this training'
        })
      }
      networkName = network.name
    }

    // Check if checkpoint directory exists
    const checkpointDir = path.join(training.outputDir, 'checkpoints')
    if (!fs.existsSync(checkpointDir)) {
      return res.status(404).json({
        success: false,
        error: 'No checkpoints found for this training'
      })
    }

    // Set response headers for zip download
    const filename = `${networkName}_${training.id}_model.zip`.replace(/[^a-z0-9_\-\.]/gi, '_')
    res.setHeader('Content-Type', 'application/zip')
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)

    // Create zip archive
    const archive = archiver('zip', { zlib: { level: 9 } })

    // Handle errors
    archive.on('error', (err) => {
      console.error('Archive error:', err)
      if (!res.headersSent) {
        res.status(500).json({ success: false, error: 'Failed to create archive' })
      }
    })

    // Pipe archive to response
    archive.pipe(res)

    // Add checkpoint directory to archive
    archive.directory(checkpointDir, 'checkpoints')

    // Add training metadata if it exists
    const metadataPath = path.join(training.outputDir, 'training_metadata.json')
    if (fs.existsSync(metadataPath)) {
      archive.file(metadataPath, { name: 'training_metadata.json' })
    }

    // Finalize the archive
    await archive.finalize()

  } catch (error) {
    console.error('Download training model error:', error)
    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        error: 'Server error downloading training model'
      })
    }
  }
})

// @route   DELETE /api/networks/trainings/:trainingId
// @desc    Delete a training session and its files
// @access  Private
router.delete('/trainings/:trainingId', async (req, res) => {
  try {
    const training = getTrainingStatus(req.params.trainingId)

    if (!training) {
      return res.status(404).json({
        success: false,
        error: 'Training not found'
      })
    }

    // Check ownership - either via stored userId (for YAML trainings) or via network (for DB trainings)
    if (training.userId) {
      // YAML training - check stored userId
      if (training.userId !== req.user.id) {
        return res.status(403).json({
          success: false,
          error: 'Not authorized to delete this training'
        })
      }
    } else {
      // DB network training - check via network
      const network = await Network.findById(training.networkId)
      if (!network || network.user.toString() !== req.user.id) {
        return res.status(403).json({
          success: false,
          error: 'Not authorized to delete this training'
        })
      }
    }

    // Delete training output directory
    if (fs.existsSync(training.outputDir)) {
      fs.rmSync(training.outputDir, { recursive: true, force: true })
      console.log(`✓ [DELETE /trainings] Deleted output directory: ${training.outputDir}`)
    }

    // Remove from trainings store (activeTrainings Map)
    const deleteResult = deleteTraining(req.params.trainingId)

    if (!deleteResult.success) {
      console.error(`❌ [DELETE /trainings] Failed to delete from memory: ${deleteResult.error}`)
      return res.status(500).json({
        success: false,
        error: 'Failed to delete training from memory'
      })
    }

    console.log(`✓ [DELETE /trainings] Successfully deleted training ${req.params.trainingId}`)

    res.json({
      success: true,
      message: 'Training session deleted successfully'
    })
  } catch (error) {
    console.error('Delete training error:', error)
    res.status(500).json({
      success: false,
      error: 'Server error deleting training session'
    })
  }
})

// @route   POST /api/training/yaml
// @desc    Start training from uploaded YAML file
// @access  Private
router.post('/training/yaml', [
  body('yamlContent').notEmpty().withMessage('YAML content is required'),
  body('episodes').optional().isInt({ min: 1 }).withMessage('Episodes must be a positive integer'),
  body('saveFrequency').optional().isInt({ min: 1 }).withMessage('Save frequency must be a positive integer'),
  body('algorithm').optional().isString().withMessage('Algorithm must be a string')
], async (req, res) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    })
  }

  try {
    console.log('🚀 [YAML Training] Request received')
    const { yamlContent, yamlFileName } = req.body
    console.log('📝 [YAML Training] YAML file name:', yamlFileName, 'Content length:', yamlContent?.length)

    const trainingConfig = {
      episodes: req.body.episodes || 1000,
      saveFrequency: req.body.saveFrequency || 100,
      algorithm: req.body.algorithm || 'PPO',
      verbose: req.body.verbose || false
    }
    console.log('⚙️ [YAML Training] Training config:', trainingConfig)

    // Validate YAML content
    if (!yamlContent.includes('metadata:') || !yamlContent.includes('simulation:')) {
      console.warn('⚠️ [YAML Training] Invalid YAML - missing required sections')
      return res.status(400).json({
        success: false,
        error: 'Invalid YAML format. Missing required sections: metadata, simulation'
      })
    }

    // Create uploads directory if it doesn't exist
    const uploadsDir = path.join(process.cwd(), 'uploads', 'yaml')
    console.log('📁 [YAML Training] Uploads directory:', uploadsDir)
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true })
      console.log('✓ [YAML Training] Created uploads directory')
    }

    // Save YAML file with unique name
    const timestamp = Date.now()
    const yamlFilePath = path.join(uploadsDir, `yaml_upload_${timestamp}_${yamlFileName || 'upload.yaml'}`)
    fs.writeFileSync(yamlFilePath, yamlContent)
    console.log('✓ [YAML Training] YAML file saved to:', yamlFilePath)

    // Create a temporary network object for training
    const tempNetwork = {
      _id: `yaml_${timestamp}`,
      name: `YAML Upload - ${new Date().toLocaleString()}`,
      yamlFile: yamlFilePath,
      user: req.user.id,
      config: {
        agents: [
          { id: 'agent_1', name: 'Agent 1', type: 'reinforcement_learning' }
        ]
      }
    }
    console.log('🔧 [YAML Training] Temp network object created:', tempNetwork._id)

    // Start training
    console.log('🎬 [YAML Training] Starting training...')
    const result = await startTraining(tempNetwork, trainingConfig)
    console.log('✅ [YAML Training] Training started! Result:', result)

    res.json({
      success: true,
      ...result
    })
  } catch (error) {
    console.error('❌ [YAML Training] Error:', error.message)
    console.error('❌ [YAML Training] Stack:', error.stack)
    res.status(500).json({
      success: false,
      error: error.message || 'Server error starting training'
    })
  }
})

export default router
