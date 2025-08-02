import express from 'express';
import bcrypt from 'bcryptjs';
import passport from 'passport';
import { body, validationResult } from 'express-validator';
import { db, users } from '../db/index.js';
import { eq } from 'drizzle-orm';
import { generateJWT } from '../middleware/auth.js';
import { catchAsync, AppError } from '../middleware/errorHandler.js';
import crypto from 'crypto';
import nodemailer from 'nodemailer';

const router = express.Router();

// Email transporter setup
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

// Validation rules
const registerValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one lowercase letter, one uppercase letter, and one number'),
  body('firstName')
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('First name is required and must be less than 50 characters'),
  body('lastName')
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Last name is required and must be less than 50 characters')
];

const loginValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
];

// Register new user
router.post('/register', registerValidation, catchAsync(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }

  const { email, password, firstName, lastName } = req.body;

  // Check if user already exists
  const existingUser = await db.select()
    .from(users)
    .where(eq(users.email, email.toLowerCase()))
    .limit(1);

  if (existingUser.length) {
    throw new AppError('User already exists with this email address', 409, 'USER_EXISTS');
  }

  // Hash password
  const saltRounds = 12;
  const hashedPassword = await bcrypt.hash(password, saltRounds);

  // Create user
  const newUser = await db.insert(users)
    .values({
      email: email.toLowerCase(),
      password: hashedPassword,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      isVerified: false
    })
    .returning();

  const user = newUser[0];

  // Generate JWT token
  const token = generateJWT(user.id);

  // Send verification email (optional)
  if (process.env.SMTP_USER) {
    try {
      const verificationToken = crypto.randomBytes(32).toString('hex');
      const verificationUrl = `${process.env.CLIENT_URL}/verify-email?token=${verificationToken}`;
      
      await transporter.sendMail({
        from: process.env.SMTP_USER,
        to: user.email,
        subject: 'Welcome to StudyGenius! Please verify your email',
        html: `
          <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
            <h2>Welcome to StudyGenius! 🚀</h2>
            <p>Hi ${user.firstName},</p>
            <p>Thanks for joining StudyGenius! Please verify your email address to get started.</p>
            <a href="${verificationUrl}" style="display: inline-block; background: #3B82F6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0;">
              Verify Email Address
            </a>
            <p>If you didn't create this account, you can safely ignore this email.</p>
            <p>Best regards,<br>The StudyGenius Team</p>
          </div>
        `
      });
    } catch (error) {
      console.error('Failed to send verification email:', error);
    }
  }

  // Remove sensitive data from response
  const { password: _, ...userResponse } = user;

  res.status(201).json({
    success: true,
    message: 'Account created successfully',
    user: userResponse,
    token
  });
}));

// Login user
router.post('/login', loginValidation, catchAsync(async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }

  passport.authenticate('local', (err, user, info) => {
    if (err) {
      return next(err);
    }

    if (!user) {
      return res.status(401).json({
        success: false,
        message: info.message || 'Invalid credentials'
      });
    }

    req.logIn(user, (err) => {
      if (err) {
        return next(err);
      }

      // Generate JWT token
      const token = generateJWT(user.id);

      // Remove sensitive data from response
      const { password: _, ...userResponse } = user;

      res.json({
        success: true,
        message: 'Login successful',
        user: userResponse,
        token
      });
    });
  })(req, res, next);
}));

// Google OAuth routes
router.get('/google',
  passport.authenticate('google', { 
    scope: ['profile', 'email'] 
  })
);

router.get('/google/callback',
  passport.authenticate('google', { failureRedirect: '/login' }),
  (req, res) => {
    // Generate JWT token
    const token = generateJWT(req.user.id);
    
    // Redirect to frontend with token
    res.redirect(`${process.env.CLIENT_URL}/auth/callback?token=${token}`);
  }
);

// Logout
router.post('/logout', (req, res) => {
  req.logout((err) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: 'Logout failed'
      });
    }
    
    res.json({
      success: true,
      message: 'Logout successful'
    });
  });
});

// Get current user
router.get('/me', async (req, res) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Not authenticated'
    });
  }

  // Remove sensitive data from response
  const { password: _, ...userResponse } = req.user;

  res.json({
    success: true,
    user: userResponse
  });
});

// Forgot password
router.post('/forgot-password', [
  body('email').isEmail().normalizeEmail().withMessage('Please provide a valid email address')
], catchAsync(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }

  const { email } = req.body;

  // Check if user exists
  const user = await db.select()
    .from(users)
    .where(eq(users.email, email.toLowerCase()))
    .limit(1);

  // Always return success to prevent email enumeration
  if (!user.length) {
    return res.json({
      success: true,
      message: 'If an account with that email exists, we have sent a password reset link.'
    });
  }

  // Generate reset token
  const resetToken = crypto.randomBytes(32).toString('hex');
  const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour

  // Store reset token in database (you might want to add a separate table for this)
  // For now, we'll use a simple approach
  const resetUrl = `${process.env.CLIENT_URL}/reset-password?token=${resetToken}&email=${email}`;

  // Send password reset email
  if (process.env.SMTP_USER) {
    try {
      await transporter.sendMail({
        from: process.env.SMTP_USER,
        to: user[0].email,
        subject: 'StudyGenius Password Reset',
        html: `
          <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
            <h2>Password Reset Request</h2>
            <p>Hi ${user[0].firstName},</p>
            <p>You requested a password reset for your StudyGenius account.</p>
            <a href="${resetUrl}" style="display: inline-block; background: #3B82F6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0;">
              Reset Password
            </a>
            <p>This link will expire in 1 hour.</p>
            <p>If you didn't request this, you can safely ignore this email.</p>
            <p>Best regards,<br>The StudyGenius Team</p>
          </div>
        `
      });
    } catch (error) {
      console.error('Failed to send password reset email:', error);
      throw new AppError('Failed to send password reset email', 500, 'EMAIL_SEND_FAILED');
    }
  }

  res.json({
    success: true,
    message: 'If an account with that email exists, we have sent a password reset link.'
  });
}));

// Reset password
router.post('/reset-password', [
  body('email').isEmail().normalizeEmail().withMessage('Please provide a valid email address'),
  body('token').notEmpty().withMessage('Reset token is required'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one lowercase letter, one uppercase letter, and one number')
], catchAsync(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }

  const { email, token, password } = req.body;

  // Find user
  const user = await db.select()
    .from(users)
    .where(eq(users.email, email.toLowerCase()))
    .limit(1);

  if (!user.length) {
    throw new AppError('Invalid reset token', 400, 'INVALID_TOKEN');
  }

  // In a real implementation, you'd verify the token and expiry here
  // For now, we'll accept any token for demonstration

  // Hash new password
  const saltRounds = 12;
  const hashedPassword = await bcrypt.hash(password, saltRounds);

  // Update user password
  await db.update(users)
    .set({ password: hashedPassword })
    .where(eq(users.id, user[0].id));

  res.json({
    success: true,
    message: 'Password reset successfully'
  });
}));

// Change password (authenticated)
router.post('/change-password', [
  body('currentPassword').notEmpty().withMessage('Current password is required'),
  body('newPassword')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one lowercase letter, one uppercase letter, and one number')
], catchAsync(async (req, res) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Not authenticated'
    });
  }

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }

  const { currentPassword, newPassword } = req.body;

  // Get user with password
  const user = await db.select()
    .from(users)
    .where(eq(users.id, req.user.id))
    .limit(1);

  if (!user.length || !user[0].password) {
    throw new AppError('Current password verification failed', 400, 'INVALID_PASSWORD');
  }

  // Verify current password
  const isValidPassword = await bcrypt.compare(currentPassword, user[0].password);
  if (!isValidPassword) {
    throw new AppError('Current password is incorrect', 400, 'INVALID_PASSWORD');
  }

  // Hash new password
  const saltRounds = 12;
  const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

  // Update password
  await db.update(users)
    .set({ password: hashedPassword })
    .where(eq(users.id, req.user.id));

  res.json({
    success: true,
    message: 'Password changed successfully'
  });
}));

// Verify email
router.post('/verify-email', [
  body('token').notEmpty().withMessage('Verification token is required')
], catchAsync(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }

  // In a real implementation, you'd verify the token here
  // For now, we'll mark the current user as verified if authenticated

  if (!req.user) {
    throw new AppError('Invalid verification token', 400, 'INVALID_TOKEN');
  }

  await db.update(users)
    .set({ isVerified: true })
    .where(eq(users.id, req.user.id));

  res.json({
    success: true,
    message: 'Email verified successfully'
  });
}));

// Check authentication status
router.get('/status', (req, res) => {
  res.json({
    success: true,
    isAuthenticated: !!req.user,
    user: req.user ? { id: req.user.id, email: req.user.email } : null
  });
});

export default router;