/**
 * Centralized error handler middleware.
 */
const errorHandler = (err, req, res, next) => {
  console.error('Error occurred:', err.message || err);

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map(val => val.message);
    return res.status(400).json({
      success: false,
      message: 'Validation Error',
      errors: messages,
    });
  }

  // Mongoose bad ObjectId / CastError
  if (err.name === 'CastError') {
    return res.status(400).json({
      success: false,
      message: `Resource not found with id of ${err.value}`,
    });
  }

  // Fallback server error
  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || 'Server Internal Error',
  });
};

module.exports = errorHandler;
