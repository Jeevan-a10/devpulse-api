/**
 * Centralized error handler middleware.
 */
const errorHandler = (err, req, res, next) => {
  // Only log detailed trace if not in test environment or if unexpected 500
  if (process.env.NODE_ENV !== 'test') {
    console.error('Error occurred:', err.message || err);
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map(val => val.message);
    return res.status(400).json({
      success: false,
      message: 'Validation Error',
      errors: messages,
    });
  }

  // Mongoose duplicate key error (e.g. duplicate email)
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    return res.status(400).json({
      success: false,
      message: `A record with this ${field} already exists`,
    });
  }

  // Mongoose bad ObjectId / CastError
  if (err.name === 'CastError') {
    return res.status(400).json({
      success: false,
      message: `Resource not found with id of ${err.value}`,
    });
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      message: 'Not authorized: invalid token signature',
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      message: 'Not authorized: token has expired',
    });
  }

  // Fallback server error
  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || 'Server Internal Error',
  });
};

module.exports = errorHandler;
