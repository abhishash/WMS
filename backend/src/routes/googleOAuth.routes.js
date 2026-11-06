import express from "express";
import {
  connectGoogle,
  disconnectGoogle,
  googleUserInfo,
  getGoogleConnectionStatus,
  googleCallback,
} from "../controllers/googleOAuth.controller.js";
import { getAccounts, getLocations } from "../controllers/google.controller.js";
import { protect } from "../middleware/auth.middleware.js";
import asyncHandler from "../middleware/asyncHandler.js";

const router = express.Router();

// Customer must be logged into Dhanda AI
router.get("/connect", protect, connectGoogle);

// Google redirects here. State authenticates the initiating user.
router.get("/callback", googleCallback);

// Check connection
router.get("/status", protect, getGoogleConnectionStatus);

// Disconnect account
router.delete("/disconnect", protect, disconnectGoogle);

// router.get("/accounts", protect, asyncHandler(getAccounts));

router.get("/googleProfile", protect, asyncHandler(googleUserInfo));

export default router;
