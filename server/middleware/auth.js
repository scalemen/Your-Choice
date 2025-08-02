import jwt from 'jsonwebtoken';
import { db, users } from '../db/index.js';
import { eq } from 'drizzle-orm';

export const authenticateUser = async (req, res, next) => {
  try {
    // Check for session-based authentication first
    if (req.user) {
      return next();
    }

    // Check for JWT token in Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    try {
      // Verify JWT token
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret');
      
      // Get user from database
      const user = await db.select()
        .from(users)
        .where(eq(users.id, decoded.userId))
        .limit(1);

      if (!user.length) {
        return res.status(401).json({ error: 'User not found' });
      }

      // Attach user to request
      req.user = user[0];
      next();
    } catch (jwtError) {
      if (jwtError.name === 'TokenExpiredError') {
        return res.status(401).json({ error: 'Token expired' });
      }
      return res.status(401).json({ error: 'Invalid token' });
    }
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const requirePremium = (req, res, next) => {
  if (!req.user.isPremium) {
    return res.status(403).json({ 
      error: 'Premium subscription required',
      code: 'PREMIUM_REQUIRED'
    });
  }
  next();
};

export const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user.role || !roles.includes(req.user.role)) {
      return res.status(403).json({ 
        error: 'Insufficient permissions',
        code: 'INSUFFICIENT_PERMISSIONS'
      });
    }
    next();
  };
};

export const generateJWT = (userId) => {
  return jwt.sign(
    { userId },
    process.env.JWT_SECRET || 'fallback-secret',
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

export const refreshTokenIfNeeded = async (req, res, next) => {
  if (!req.user) {
    return next();
  }

  try {
    // Update last active timestamp
    await db.update(users)
      .set({ lastActive: new Date() })
      .where(eq(users.id, req.user.id));

    next();
  } catch (error) {
    console.error('Token refresh error:', error);
    next(); // Continue even if refresh fails
  }
};