import express from "express";
import cors from "cors";
import authRoutes from "./routes/authRoutes.js";
import { notFoundHandler } from "./middleware/notFoundMiddleware.js";
import { rateLimiter } from "./middleware/rateLimiter.js";

const app = express();

app.use(cors());

// Parse JSON request body
app.use(express.json());

// Parse form data
app.use(express.urlencoded({ extended: true }));

// Apply to ALL incoming routes.
app.use(rateLimiter({
    limit: 5,
    windowMs: 60000
}));

// Routes must come after middleware
app.use("/api/auth", authRoutes);

// 404 middleware must come after
app.use(notFoundHandler);

export default app;