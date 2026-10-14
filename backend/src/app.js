import express from "express";
import cors from "cors";
import authRoutes from "./routes/authRoutes.js";
import { notFoundHandler } from "./middleware/notFoundMiddleware.js";

const app = express();

app.use(cors());

// Parse JSON request body
app.use(express.json());

// Parse form data
app.use(express.urlencoded({ extended: true }));

// Routes must come after middleware
app.use("/api/auth", authRoutes);

// 404 middleware must come after
app.use(notFoundHandler);

export default app;