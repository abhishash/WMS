import AppError from "../utils/appError.js";

// Centerized Error for middleware.
const notFound = (req, res, next) => {
  const error = new AppError(
    `Route not found: ${req.method} ${req.originalUrl}`,
    404,
    "ROUTE_NOT_FOUND",
  );
  next(error);
};

export default notFound
