export const errorHandler = (error, req, res, next) => {
  console.error('Error occurred:', {
    message: error.message,
    stack: error.stack,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    timestamp: new Date().toISOString()
  });

  // Default error
  let statusCode = 500;
  let message = 'Internal Server Error';
  let code = 'INTERNAL_ERROR';

  // Handle different types of errors
  if (error.name === 'ValidationError') {
    statusCode = 400;
    message = 'Validation Error';
    code = 'VALIDATION_ERROR';
  } else if (error.name === 'CastError') {
    statusCode = 400;
    message = 'Invalid ID format';
    code = 'INVALID_ID';
  } else if (error.code === 11000) {
    statusCode = 409;
    message = 'Duplicate field value';
    code = 'DUPLICATE_VALUE';
  } else if (error.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token';
    code = 'INVALID_TOKEN';
  } else if (error.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token expired';
    code = 'TOKEN_EXPIRED';
  } else if (error.code === 'ENOENT') {
    statusCode = 404;
    message = 'File not found';
    code = 'FILE_NOT_FOUND';
  } else if (error.code === 'LIMIT_FILE_SIZE') {
    statusCode = 413;
    message = 'File too large';
    code = 'FILE_TOO_LARGE';
  } else if (error.code === 'LIMIT_UNEXPECTED_FILE') {
    statusCode = 400;
    message = 'Unexpected file field';
    code = 'UNEXPECTED_FILE';
  }

  // Custom application errors
  if (error.isOperational) {
    statusCode = error.statusCode || 400;
    message = error.message;
    code = error.code || 'APPLICATION_ERROR';
  }

  // Database errors
  if (error.code === '23505') { // PostgreSQL unique violation
    statusCode = 409;
    message = 'Resource already exists';
    code = 'DUPLICATE_RESOURCE';
  } else if (error.code === '23503') { // PostgreSQL foreign key violation
    statusCode = 400;
    message = 'Referenced resource not found';
    code = 'FOREIGN_KEY_VIOLATION';
  } else if (error.code === '23502') { // PostgreSQL not null violation
    statusCode = 400;
    message = 'Required field missing';
    code = 'MISSING_REQUIRED_FIELD';
  }

  // OpenAI API errors
  if (error.response && error.response.status) {
    if (error.response.status === 429) {
      statusCode = 429;
      message = 'AI service rate limit exceeded';
      code = 'AI_RATE_LIMIT';
    } else if (error.response.status === 401) {
      statusCode = 500;
      message = 'AI service authentication failed';
      code = 'AI_AUTH_ERROR';
    } else if (error.response.status >= 500) {
      statusCode = 503;
      message = 'AI service unavailable';
      code = 'AI_SERVICE_UNAVAILABLE';
    }
  }

  // Prepare error response
  const errorResponse = {
    success: false,
    error: {
      message,
      code,
      timestamp: new Date().toISOString()
    }
  };

  // Add additional error details in development
  if (process.env.NODE_ENV === 'development') {
    errorResponse.error.stack = error.stack;
    errorResponse.error.details = error.details || null;
  }

  // Add validation errors if available
  if (error.errors) {
    errorResponse.error.validationErrors = error.errors;
  }

  res.status(statusCode).json(errorResponse);
};

// Custom error class for application errors
export class AppError extends Error {
  constructor(message, statusCode, code = null) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

// Async error handler wrapper
export const catchAsync = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  // Don't exit the process in production
  if (process.env.NODE_ENV !== 'production') {
    process.exit(1);
  }
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  // Gracefully close the server
  process.exit(1);
});