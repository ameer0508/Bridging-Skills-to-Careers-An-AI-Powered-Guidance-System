/**
 * JWT Authentication Middleware
 */
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { AppError } = require('./errorHandler');

const JWT_SECRET = process.env.JWT_SECRET || 'skillbridge_ai_secret_2025_change_in_production';
const JWT_EXPIRES = process.env.JWT_EXPIRES || '7d';

/**
 * Generate JWT token for a user
 */
const generateToken = (userId) => {
  return jwt.sign({ id: userId }, JWT_SECRET, { expiresIn: JWT_EXPIRES });
};

/**
 * Protect routes — verifies JWT and attaches user to req
 */
const protect = async (req, res, next) => {
  try {
    let token;
    if (req.headers.authorization?.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }
    if (!token) throw new AppError('Not authenticated. Please log in.', 401);

    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');
    if (!user) throw new AppError('User no longer exists.', 401);
    if (!user.isActive) throw new AppError('Account deactivated.', 401);

    req.user = user;
    next();
  } catch (err) {
    if (err.name === 'JsonWebTokenError') return next(new AppError('Invalid token.', 401));
    if (err.name === 'TokenExpiredError') return next(new AppError('Token expired. Please log in again.', 401));
    next(err);
  }
};

/**
 * Optional auth — attaches user if token present, doesn't block if not
 */
const optionalAuth = async (req, res, next) => {
  try {
    let token;
    if (req.headers.authorization?.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }
    if (token) {
      const decoded = jwt.verify(token, JWT_SECRET);
      req.user = await User.findById(decoded.id).select('-password');
    }
    next();
  } catch {
    next();
  }
};

module.exports = { generateToken, protect, optionalAuth };
