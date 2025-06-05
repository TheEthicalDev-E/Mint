const logger = require('../utils/logger');

/**
 * Global error handling middleware
 */
const errorHandler = (err, req, res, next) => {
  // Log the error
  logger.error('Error caught by global handler:', err);
  
  // Don't expose internal server errors to client
  const statusCode = err.statusCode || 500;
  const message = statusCode === 500 
    ? 'Internal server error' 
    : err.message || 'Something went wrong';
  
  // Send error response
  res.status(statusCode).json({
    success: false,
    message,
    // Only include error details in development
    ...(process.env.NODE_ENV === 'development' && { error: err.stack })
  });
};

module.exports = {
  errorHandler
};
