const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);

  // TypeORM errors
  if (err.code === '23505') { // Unique constraint violation
    return res.status(409).json({
      error: 'Resource already exists',
      message: 'A resource with this information already exists',
      code: 'DUPLICATE_RESOURCE'
    });
  }

  if (err.code === '23503') { // Foreign key constraint violation
    return res.status(400).json({
      error: 'Invalid reference',
      message: 'Referenced resource does not exist',
      code: 'INVALID_REFERENCE'
    });
  }

  if (err.code === '23502') { // Not null constraint violation
    return res.status(400).json({
      error: 'Missing required field',
      message: 'A required field is missing',
      code: 'MISSING_REQUIRED_FIELD'
    });
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      error: 'Invalid token',
      code: 'INVALID_TOKEN'
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      error: 'Token expired',
      code: 'TOKEN_EXPIRED'
    });
  }

  // Validation errors
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      error: 'Validation failed',
      message: err.message,
      code: 'VALIDATION_ERROR'
    });
  }

  // Cast errors (invalid UUID, etc.)
  if (err.name === 'CastError') {
    return res.status(400).json({
      error: 'Invalid ID format',
      message: 'The provided ID is not valid',
      code: 'INVALID_ID_FORMAT'
    });
  }

  // Default error
  const statusCode = err.statusCode || 500;
  const message = process.env.NODE_ENV === 'production' 
    ? 'Internal server error' 
    : err.message;

  res.status(statusCode).json({
    error: 'Internal server error',
    message: message,
    code: 'INTERNAL_ERROR',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

const notFoundHandler = (req, res) => {
  res.status(404).json({
    error: 'Route not found',
    message: `Cannot ${req.method} ${req.path}`,
    code: 'ROUTE_NOT_FOUND'
  });
};

const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

module.exports = {
  errorHandler,
  notFoundHandler,
  asyncHandler
};
