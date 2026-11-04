const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET || 'devpulse_jwt_secret_dev_key_2026';

const isDbConnected = () => mongoose.connection.readyState === 1;

/**
 * Protect routes - ensures incoming request has a valid JWT Bearer token
 */
const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer ')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized: access token is required',
    });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);

    if (isDbConnected() && mongoose.isValidObjectId(decoded.id)) {
      const user = await User.findById(decoded.id).select('-password');
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Not authorized: user no longer exists',
        });
      }
      req.user = user;
      return next();
    }

    // In-memory / offline fallback
    const { findInMemoryUserById } = require('../controllers/authController');
    const existingUser = findInMemoryUserById ? findInMemoryUserById(decoded.id) : null;

    if (existingUser) {
      const { password, ...userWithoutPassword } = existingUser;
      req.user = userWithoutPassword;
    } else {
      req.user = {
        _id: decoded.id,
        name: decoded.name || 'Anonymous User',
        email: decoded.email,
        role: decoded.role || 'developer',
      };
    }

    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized: invalid or expired token',
    });
  }
};

/**
 * Optional authentication middleware: populates req.user if a valid token is present,
 * but allows unauthenticated requests to proceed.
 */
const optionalAuth = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer ')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return next();
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);

    if (isDbConnected() && mongoose.isValidObjectId(decoded.id)) {
      const user = await User.findById(decoded.id).select('-password');
      if (user) req.user = user;
      return next();
    }

    const { findInMemoryUserById } = require('../controllers/authController');
    const existingUser = findInMemoryUserById ? findInMemoryUserById(decoded.id) : null;

    if (existingUser) {
      const { password, ...userWithoutPassword } = existingUser;
      req.user = userWithoutPassword;
    } else {
      req.user = {
        _id: decoded.id,
        name: decoded.name || 'Anonymous User',
        email: decoded.email,
        role: decoded.role || 'developer',
      };
    }
  } catch (err) {
    // If token is invalid in optional mode, continue without req.user
  }

  next();
};

/**
 * Role-Based Access Control (RBAC) middleware
 * Restricts access to specified user roles (e.g. 'admin', 'lead')
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized: authentication required',
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Forbidden: role '${req.user.role}' is not authorized to access this resource`,
      });
    }

    next();
  };
};

module.exports = {
  protect,
  optionalAuth,
  authorize,
  JWT_SECRET,
};
