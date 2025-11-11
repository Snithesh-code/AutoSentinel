import nodemailer from 'nodemailer'
import crypto from 'crypto'

// Create transporter
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: process.env.EMAIL_PORT || 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  })
}

/**
 * Generate verification token
 */
export const generateVerificationToken = () => {
  return crypto.randomBytes(32).toString('hex')
}

/**
 * Send verification email
 */
export const sendVerificationEmail = async (user, token) => {
  try {
    const transporter = createTransporter()

    const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${token}`

    const mailOptions = {
      from: `"AutoSentinel v2" <${process.env.EMAIL_USER}>`,
      to: user.email,
      subject: 'Verify Your Email - AutoSentinel v2',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              background-color: #f4f4f4;
              margin: 0;
              padding: 0;
            }
            .container {
              max-width: 600px;
              margin: 20px auto;
              background: #ffffff;
              border-radius: 8px;
              overflow: hidden;
              box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            }
            .header {
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
              padding: 30px;
              text-align: center;
            }
            .header h1 {
              margin: 0;
              font-size: 24px;
            }
            .content {
              padding: 30px;
            }
            .button {
              display: inline-block;
              padding: 12px 30px;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
              text-decoration: none;
              border-radius: 5px;
              margin: 20px 0;
              font-weight: bold;
            }
            .footer {
              background: #f8f9fa;
              padding: 20px;
              text-align: center;
              font-size: 12px;
              color: #666;
            }
            .token-box {
              background: #f8f9fa;
              padding: 15px;
              border-left: 4px solid #667eea;
              margin: 20px 0;
              word-break: break-all;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Welcome to AutoSentinel v2!</h1>
            </div>
            <div class="content">
              <h2>Hello ${user.username}!</h2>
              <p>Thank you for signing up. Please verify your email address to activate your account.</p>

              <p>Click the button below to verify your email:</p>

              <div style="text-align: center;">
                <a href="${verificationUrl}" class="button">Verify Email Address</a>
              </div>

              <p>Or copy and paste this link into your browser:</p>
              <div class="token-box">
                ${verificationUrl}
              </div>

              <p><strong>This link will expire in 24 hours.</strong></p>

              <p>If you didn't create an account with AutoSentinel v2, please ignore this email.</p>
            </div>
            <div class="footer">
              <p>AutoSentinel v2 - Network Security Simulation Platform</p>
              <p>This is an automated email. Please do not reply.</p>
            </div>
          </div>
        </body>
        </html>
      `
    }

    await transporter.sendMail(mailOptions)
    console.log('✅ Verification email sent to:', user.email)
    return true
  } catch (error) {
    console.error('❌ Error sending verification email:', error)
    throw new Error('Failed to send verification email')
  }
}

/**
 * Send password reset email
 */
export const sendPasswordResetEmail = async (user, token) => {
  try {
    const transporter = createTransporter()

    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${token}`

    const mailOptions = {
      from: `"AutoSentinel v2" <${process.env.EMAIL_USER}>`,
      to: user.email,
      subject: 'Password Reset - AutoSentinel v2',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              background-color: #f4f4f4;
              margin: 0;
              padding: 0;
            }
            .container {
              max-width: 600px;
              margin: 20px auto;
              background: #ffffff;
              border-radius: 8px;
              overflow: hidden;
              box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            }
            .header {
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
              padding: 30px;
              text-align: center;
            }
            .header h1 {
              margin: 0;
              font-size: 24px;
            }
            .content {
              padding: 30px;
            }
            .button {
              display: inline-block;
              padding: 12px 30px;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
              text-decoration: none;
              border-radius: 5px;
              margin: 20px 0;
              font-weight: bold;
            }
            .footer {
              background: #f8f9fa;
              padding: 20px;
              text-align: center;
              font-size: 12px;
              color: #666;
            }
            .token-box {
              background: #f8f9fa;
              padding: 15px;
              border-left: 4px solid #667eea;
              margin: 20px 0;
              word-break: break-all;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Password Reset Request</h1>
            </div>
            <div class="content">
              <h2>Hello ${user.username}!</h2>
              <p>We received a request to reset your password.</p>

              <p>Click the button below to reset your password:</p>

              <div style="text-align: center;">
                <a href="${resetUrl}" class="button">Reset Password</a>
              </div>

              <p>Or copy and paste this link into your browser:</p>
              <div class="token-box">
                ${resetUrl}
              </div>

              <p><strong>This link will expire in 1 hour.</strong></p>

              <p>If you didn't request a password reset, please ignore this email.</p>
            </div>
            <div class="footer">
              <p>AutoSentinel v2 - Network Security Simulation Platform</p>
              <p>This is an automated email. Please do not reply.</p>
            </div>
          </div>
        </body>
        </html>
      `
    }

    await transporter.sendMail(mailOptions)
    console.log('✅ Password reset email sent to:', user.email)
    return true
  } catch (error) {
    console.error('❌ Error sending password reset email:', error)
    throw new Error('Failed to send password reset email')
  }
}
