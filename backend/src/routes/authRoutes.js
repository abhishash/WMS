import express from "express";
import { forgotPassword, getProfile, loginUser, registerUser, resetPassword, createDummyUsers } from "../controllers/authController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/register", authMiddleware, registerUser);
router.post("/login", loginUser);
router.post("/forget-passowrd", forgotPassword);
router.post('/reset-password/:token', resetPassword);
router.get("/profile", authMiddleware, getProfile);
router.get("/create-dummy-user", createDummyUsers);

export default router;
