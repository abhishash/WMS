import express from "express";
import cors from "cors";
import foodCategoryRoutes from "./routes/foodCategoryRoutes.js";
// import googleRoutes from "./routes/google.routes.js";
import auditRoutes from "./routes/audit.routes.js";
import authRoutes from "./routes/auth.routes.js";
import googleOAuthRoutes from "./routes/googleOAuth.routes.js";
import notFound from "./middleware/notFound.js";
import { rateLimiter } from "./middleware/rateLimiter.js";
import errorHandler from "./middleware/errorHandler.js";

const app = express();

// Standard Middleware
app.use(cors());
app.use(express.json()); // Parse JSON request body
app.use(express.urlencoded({ extended: true })); // Parse form data

// Apply to ALL incoming routes.
// app.use(rateLimiter({
//     limit: 5,
//     windowMs: 60000
// }));

// Routes must come after middleware
app.use("/api/auth", authRoutes);

// Route For Food Category
app.use("/api", foodCategoryRoutes);

// app.use("/api/v1/google", googleRoutes);
app.use("/api/v1/audit", auditRoutes);
import googleBusinessRoutes from "./routes/googleBusiness.routes.js";

app.use(
  "/api/v1/google",
  rateLimiter({
    windowMs: 15 * 60 * 1000,
    limit: 100,
  }),
  googleBusinessRoutes,
);

app.use(
  "/api/v1/google",
  rateLimiter({
    windowMs: 15 * 60 * 1000,
    limit: 100,
  }),
  googleOAuthRoutes,
);

// 404 middleware must come after
app.use(notFound);
app.use(errorHandler);

export default app;
