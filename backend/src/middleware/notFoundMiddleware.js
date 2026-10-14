import AppError from "../utils/appError.js";

// Centerized Error for middleware.
export const notFoundHandler = (req, res, next) => {
  const error = new AppError(
    `Route not found: ${req.method} ${req.originalUrl}`,
    404,
  );
  next(error);
};
