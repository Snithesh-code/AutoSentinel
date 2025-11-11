import express from 'express'
import { body, validationResult } from 'express-validator'
import User from '../models/User.js'
import { generateToken, protect } from '../middleware/auth.js'
import { sendVerificationEmail, generateVerificationToken } from '../utils/email.js'
import passport from '../utils/passport.js'

const router = express.Router()
router.post('/signup', [
  body('username')
    .trim()
    .isLength({ min: 3, max: 30 })
    .withMessage('Username must be between 3 and 30 characters'),
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters')
], async (req, res) => {
  // Check for validation errors
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    })
  }

  const { username, email, password } = req.body

  try {
    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ email }, { username }]
    })

    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: existingUser.email === email
          ? 'Email already registered'
          : 'Username already taken'
      })
    }

    // Generate verification token
    const verificationToken = generateVerificationToken()
    const verificationTokenExpires = Date.now() + 24 * 60 * 60 * 1000 // 24 hours

    console.log('📧 SIGNUP: Generated verification token')
    console.log('   Token:', verificationToken.substring(0, 20) + '...')
    console.log('   Full token:', verificationToken)
    console.log('   Expires at:', new Date(verificationTokenExpires))

    // Create user (not verified yet)
    const user = await User.create({
      username,
      email,
      password,
      authProvider: 'local',
      isVerified: false,
      verificationToken,
      verificationTokenExpires
    })

    console.log('📧 SIGNUP: User created in DB')
    console.log('   Email:', user.email)
    console.log('   ID:', user._id)
    console.log('   User verificationToken:', user.verificationToken ? user.verificationToken.substring(0, 20) + '...' : 'NULL')
    console.log('   User full verificationToken:', user.verificationToken)
    console.log('   Stored token matches generated:', user.verificationToken === verificationToken)

    // Verify it's in DB by querying immediately
    const verifyInDB = await User.findById(user._id)
    console.log('   Immediately after create - Token in DB?:', verifyInDB.verificationToken ? verifyInDB.verificationToken.substring(0, 20) + '...' : 'NULL')

    // Send verification email (attempt - don't fail signup if email fails)
    let emailSent = false
    try {
      await sendVerificationEmail(user, verificationToken)
      emailSent = true
      console.log('✅ Verification email sent successfully to:', email)
    } catch (emailError) {
      console.error('❌ Failed to send verification email to:', email, emailError.message)
      // Email failed but user was created - they can use resend verification
    }

    res.status(201).json({
      success: true,
      message: emailSent
        ? 'Registration successful! Please check your email to verify your account.'
        : 'Registration successful! We had trouble sending the verification email. Please use "Resend Verification Email" from the login page.',
      emailSent,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        isVerified: user.isVerified,
        createdAt: user.createdAt
      }
    })
  } catch (error) {
    console.error('Signup error:', error)
    res.status(500).json({
      success: false,
      error: 'Server error during registration'
    })
  }
})

// @route   GET /api/auth/verify-email/:token
// @desc    Verify email address
// @access  Public
router.get('/verify-email/:token', async (req, res) => {
  try {
    // Decode token in case it's URL encoded
    let token = decodeURIComponent(req.params.token)

    console.log('\n🔐 VERIFY EMAIL REQUEST:')
    console.log('   Token received (first 20 chars):', token.substring(0, 20) + '...')
    console.log('   Token length:', token.length)
    console.log('   Current server time:', new Date(Date.now()))

    // Query for user with matching token and non-expired token
    const user = await User.findOne({
      verificationToken: token 
      // ,
      // verificationTokenExpires: { $gt: Date.now() }
    })

    console.log('   DB query result:', user ? `✅ User found: ${user.email}` : '❌ NO USER FOUND')

    if (!user) {
      console.log('   ERROR: Invalid or expired token')
      return res.status(400).json({
        success: false,
        error: 'Invalid or expired verification token'
      })
    }
    const authToken = generateToken(user._id)
    if(!user.isVerified){
      

    console.log('   Token in DB (first 20 chars):', user.verificationToken?.substring(0, 20) + '...')
    console.log('   Token expiry time:', new Date(user.verificationTokenExpires))

    // Token is valid - verify user
    console.log('   ✅ Token is valid! Verifying user...')
    user.isVerified = true
    // user.verificationToken = undefined
    // user.verificationTokenExpires = undefined
    await user.save()

    // Generate token for automatic login
    

    console.log('   ✅ User verified and logged in')
    }
    res.json({
      success: true,
      message: 'Email verified successfully!',
      token: authToken,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        isVerified: user.isVerified
      }
    })
  } catch (error) {
    console.error('❌ Verify email error:', error)
    res.status(500).json({
      success: false,
      error: 'Server error during verification'
    })
  }
})

// @route   POST /api/auth/resend-verification
// @desc    Resend verification email
// @access  Public
router.post('/resend-verification', [
  body('email').isEmail().withMessage('Please provide a valid email')
], async (req, res) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    })
  }

  try {
    const { email } = req.body

    const user = await User.findOne({ email }).select('+verificationToken +verificationTokenExpires')

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      })
    }

    if (user.isVerified) {
      return res.status(400).json({
        success: false,
        error: 'Email already verified'
      })
    }

    // Generate new verification token
    const verificationToken = generateVerificationToken()
    user.verificationToken = verificationToken
    user.verificationTokenExpires = Date.now() + 24 * 60 * 60 * 1000 // 24 hours
    await user.save()

    // Send verification email
    await sendVerificationEmail(user, verificationToken)

    res.json({
      success: true,
      message: 'Verification email sent!'
    })
  } catch (error) {
    console.error('Resend verification error:', error)
    res.status(500).json({
      success: false,
      error: 'Server error sending verification email'
    })
  }
})

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post('/login', [
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('password').exists().withMessage('Password is required')
], async (req, res) => {
  // Check for validation errors
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    })
  }

  const { email, password } = req.body

  try {
    // Find user and include password
    const user = await User.findOne({ email }).select('+password')

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      })
    }

    // Check if user signed up with Google
    if (user.authProvider === 'google') {
      return res.status(401).json({
        success: false,
        error: 'This account uses Google Sign-In. Please use "Continue with Google".'
      })
    }

    // Check if email is verified
    if (!user.isVerified) {
      return res.status(401).json({
        success: false,
        error: 'Please verify your email before logging in',
        requiresVerification: true
      })
    }

    // Check password
    const isMatch = await user.comparePassword(password)

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      })
    }

    // Update last login
    user.lastLogin = Date.now()
    await user.save()

    // Generate token
    const token = generateToken(user._id)

    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        isVerified: user.isVerified,
        lastLogin: user.lastLogin
      }
    })
  } catch (error) {
    console.error('Login error:', error)
    res.status(500).json({
      success: false,
      error: 'Server error during login'
    })
  }
})

// @route   GET /api/auth/google
// @desc    Initiate Google OAuth
// @access  Public
router.get('/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
)

// @route   GET /api/auth/google/callback
// @desc    Google OAuth callback
// @access  Public
router.get('/google/callback',
  passport.authenticate('google', { failureRedirect: '/login', session: false }),
  (req, res) => {
    // Generate JWT token
    const token = generateToken(req.user._id)

    // Redirect to frontend with token
    res.redirect(`${process.env.FRONTEND_URL}/auth/google/callback?token=${token}`)
  }
)

// @route   GET /api/auth/me
// @desc    Get current logged in user
// @access  Private
router.get('/me', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id)

    res.json({
      success: true,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        isVerified: user.isVerified,
        authProvider: user.authProvider,
        createdAt: user.createdAt,
        lastLogin: user.lastLogin
      }
    })
  } catch (error) {
    console.error('Get user error:', error)
    res.status(500).json({
      success: false,
      error: 'Server error'
    })
  }
})

// @route   POST /api/auth/verify-email-dev/:email
// @desc    Development endpoint to verify email without token (FOR TESTING ONLY)
// @access  Public
router.post('/verify-email-dev/:email', async (req, res) => {
  try {
    // Only allow in development mode
    if (process.env.NODE_ENV === 'production') {
      return res.status(403).json({
        success: false,
        error: 'This endpoint is only available in development mode'
      })
    }

    const { email } = req.params
    console.log('DEV: Attempting to verify email:', email)

    const user = await User.findOne({ email })

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      })
    }

    // Mark as verified
    user.isVerified = true
    user.verificationToken = undefined
    user.verificationTokenExpires = undefined
    await user.save()

    // Generate token for automatic login
    const authToken = generateToken(user._id)

    console.log('DEV: User verified:', email)

    res.json({
      success: true,
      message: 'Email verified successfully!',
      token: authToken,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        isVerified: user.isVerified
      }
    })
  } catch (error) {
    console.error('Dev verify email error:', error)
    res.status(500).json({
      success: false,
      error: 'Server error during verification'
    })
  }
})

// @route   GET /api/auth/debug-users
// @desc    Development endpoint to list unverified users and their tokens (FOR TESTING ONLY)
// @access  Public
router.get('/debug-users', async (req, res) => {
  try {
    // Only allow in development mode
    if (process.env.NODE_ENV === 'production') {
      return res.status(403).json({
        success: false,
        error: 'This endpoint is only available in development mode'
      })
    }

    const users = await User.find({ isVerified: false }).select('+verificationToken +verificationTokenExpires')

    console.log('\n📊 DEBUG USERS:')
    console.log('   Total unverified users:', users.length)

    const debugUsers = users.map(u => {
      console.log(`\n   User: ${u.email}`)
      console.log(`      Has token field?:`, u.hasOwnProperty('verificationToken'))
      console.log(`      Token value:`, u.verificationToken ? `${u.verificationToken.substring(0, 20)}...` : 'NULL')
      console.log(`      Token length:`, u.verificationToken?.length || 0)
      console.log(`      Expires:`, u.verificationTokenExpires)

      return {
        email: u.email,
        username: u.username,
        token: u.verificationToken?.substring(0, 20) + '...',
        fullToken: u.verificationToken,
        expires: u.verificationTokenExpires,
        isExpired: u.verificationTokenExpires < Date.now(),
        hasToken: !!u.verificationToken
      }
    })

    res.json({
      success: true,
      count: debugUsers.length,
      users: debugUsers
    })
  } catch (error) {
    console.error('Debug users error:', error)
    res.status(500).json({
      success: false,
      error: 'Server error'
    })
  }
})

export default router
