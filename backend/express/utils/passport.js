import passport from 'passport'
import { Strategy as GoogleStrategy } from 'passport-google-oauth20'
import User from '../models/User.js'

export const configurePassport = () => {
  // Serialize user for the session
  passport.serializeUser((user, done) => {
    done(null, user.id)
  })

  // Deserialize user from the session
  passport.deserializeUser(async (id, done) => {
    try {
      const user = await User.findById(id)
      done(null, user)
    } catch (error) {
      done(error, null)
    }
  })

  // Google OAuth Strategy
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:5000/api/auth/google/callback'
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          // Check if user already exists
          let user = await User.findOne({ googleId: profile.id })

          if (user) {
            // User exists, update last login
            user.lastLogin = Date.now()
            await user.save()
            return done(null, user)
          }

          // Check if email already exists (user might have signed up with email)
          const existingEmailUser = await User.findOne({ email: profile.emails[0].value })

          if (existingEmailUser) {
            // Link Google account to existing user
            existingEmailUser.googleId = profile.id
            existingEmailUser.authProvider = 'google'
            existingEmailUser.isVerified = true // Google emails are verified
            existingEmailUser.lastLogin = Date.now()
            await existingEmailUser.save()
            return done(null, existingEmailUser)
          }

          // Create new user
          user = await User.create({
            username: profile.displayName.replace(/\s+/g, '').toLowerCase() || profile.emails[0].value.split('@')[0],
            email: profile.emails[0].value,
            googleId: profile.id,
            authProvider: 'google',
            isVerified: true, // Google emails are pre-verified
            lastLogin: Date.now()
          })

          done(null, user)
        } catch (error) {
          console.error('Google OAuth error:', error)
          done(error, null)
        }
      }
    )
  )
}

export default passport
