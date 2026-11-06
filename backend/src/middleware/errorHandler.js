const errorHandler = (err, req, res, next) => {
  // If the response has already started, delegate to Express.
  if (res.headersSent) {
    return next(err);
  }

  let statusCode = err.statusCode || err.status || 500;
  let message = err.message || "Internal server error";
  let code = err.code || "INTERNAL_SERVER_ERROR";

  // Invalid MongoDB ObjectId.
  if (err.name === "CastError") {
    statusCode = 400;
    message = "Invalid resource identifier";
    code = "INVALID_ID";
  }

  // Duplicate MongoDB key (for example, duplicate email).
  if (err.code === 11000) {
    statusCode = 409;
    message = "A resource with this value already exists";
    code = "DUPLICATE_RESOURCE";
  }

  // Mongoose schema validation failure.
  if (err.name === "ValidationError") {
    statusCode = 400;
    message = "Validation failed";
    code = "VALIDATION_ERROR";
  }

  // Invalid JWT.
  if (err.name === "JsonWebTokenError") {
    statusCode = 401;
    message = "Invalid authentication token";
    code = "INVALID_TOKEN";
  }

  // Expired JWT.
  if (err.name === "TokenExpiredError") {
    statusCode = 401;
    message = "Authentication token has expired";
    code = "TOKEN_EXPIRED";
  }

  // Malformed JSON sent in the request body.
  if (err.type === "entity.parse.failed") {
    statusCode = 400;
    message = "Invalid JSON request body";
    code = "INVALID_JSON";
  }

  // Accept only valid HTTP error status codes.
  if (!Number.isInteger(statusCode) || statusCode < 400 || statusCode > 599) {
    statusCode = 500;
  }

  const isProduction = process.env.NODE_ENV === "production";
  const isServerError = statusCode >= 500;

  // Log diagnostic information on the server, not in the response.
  if (isServerError) {
    console.error("Unhandled API error:", {
      method: req.method,
      path: req.originalUrl,
      statusCode,
      error: err.message,
      stack: err.stack,
    });
  }

  // Unexpected errors must not expose internal details in production.
  if (isProduction && isServerError) {
    message = "Internal server error";
    code = "INTERNAL_SERVER_ERROR";
  }

  const response = {
    success: false,
    error: {
      message,
      code,
    },
  };

  // Stack traces are development-only.
  if (!isProduction) {
    response.error.stack = err.stack;
  }

  res.status(statusCode).json(response);
};

export default errorHandler;
