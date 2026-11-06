import express from "express";

import {
  getGoogleAccounts,
  getGoogleLocations,
  selectGoogleLocation,
} from "../controllers/googleBusiness.controller.js";

import { protect } from "../middleware/auth.middleware.js";

const router = express.Router();

// Google Business accounts
router.get("/accounts", protect, getGoogleAccounts);

// Google Business locations
router.get("/accounts/:accountId/locations", protect, getGoogleLocations);

// Save selected business location
router.post("/locations/select", protect, selectGoogleLocation);

export default router;
